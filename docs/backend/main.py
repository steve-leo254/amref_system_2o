"""
Kiangombe Patient Center - FastAPI Application
Healthcare management system with appointments, prescriptions, and payments.
"""

import logging
from datetime import datetime, timedelta
from typing import Annotated, List, Optional


from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

import models
from database import engine, get_db
from models import User, Appointment, Prescription, Doctor, Role, AppointmentStatus, PrescriptionStatus, Payment, Address, MedicalHistory
from auth_router import router as auth_router, get_current_user, get_current_active_user
from pgfunc import (
    dashboard_snapshot,
    get_appointments_for_user,
    get_all_doctors,
    get_doctor_by_id,
    get_doctors_by_specialization,
)
from pydantic_models import (
    AppointmentCreateRequest,
    AppointmentRescheduleRequest,
    DoctorCreateRequest,
    PaymentRequest,
    PaymentResponse,
    UserProfileResponse,
    CreateUserRequest,
    MessageResponse,
)

# Load environment
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Type dependency
user_dependency = Annotated[dict, Depends(get_current_active_user)]


# FastAPI App Setup
app = FastAPI(
    title="Kiangombe Patient Center API",
    description="Healthcare management system with appointments, prescriptions, and payments",
    version="1.0.0"
)

# Create tables on startup (skip if database connection fails)
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("✓ Database tables created successfully")
except Exception as e:
    logger.warning(f"⚠ Could not create database tables: {e}")
    logger.warning("Make sure MySQL is running and credentials in .env are correct")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)




def require_admin(*allowed_roles):
    """Dependency to check if user has required admin roles."""
    async def check_admin(user: user_dependency):
        user_role_str = user.get("role")
        try:
            user_role = Role(user_role_str)
        except ValueError:
            raise HTTPException(status_code=403, detail="Invalid role")
        
        if allowed_roles and user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Admin access required")
        return user
    return check_admin


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health", response_model=MessageResponse)
def health_check():
    """Health check endpoint."""
    return {"message": "Kiangombe Patient Center API is running", "detail": "ok"}


# User routes
@app.get("/users", response_model=List[UserProfileResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[Role] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user)
) -> List[User]:
    """List all users (authenticated only)."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(limit).all()


# Appointment routes
@app.post(
    "/appointments",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin(Role.SUPER_ADMIN, Role.CLINICIAN_ADMIN))],
)
def create_appointment(payload: AppointmentCreateRequest, db: Session = Depends(get_db)) -> Appointment:
    """Create new appointment (admin/clinician only)."""
    patient = db.query(User).filter(
        User.id == payload.patient_id,
        User.role == Role.PATIENT
    ).first()
    clinician = db.query(User).filter(User.id == payload.clinician_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient does not exist."
        )
    if not clinician:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clinician does not exist."
        )

    appt = Appointment(
        patient_id=payload.patient_id,
        clinician_id=payload.clinician_id,
        visit_type=payload.visit_type,
        scheduled_at=payload.scheduled_at,
        triage_notes=payload.triage_notes,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


@app.get("/appointments", response_model=List[UserProfileResponse])
def list_appointments(
    status_filter: Optional[AppointmentStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Appointment]:
    """List appointments (filtered by user role)."""
    return get_appointments_for_user(db, current_user, status_filter)


@app.get("/appointments/{appointment_id}", response_model=UserProfileResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Appointment:
    """Get single appointment by ID."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Check permissions
    if current_user.role == Role.PATIENT and appt.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this appointment"
        )
    elif current_user.role == Role.CLINICIAN_ADMIN and appt.clinician_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this appointment"
        )
    
    return appt


@app.patch("/appointments/{appointment_id}", response_model=UserProfileResponse)
def update_appointment(
    appointment_id: int,
    payload: AppointmentRescheduleRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin(Role.SUPER_ADMIN, Role.CLINICIAN_ADMIN)),
) -> Appointment:
    """Update appointment (admin/clinician only)."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appt, field, value)
    
    db.commit()
    db.refresh(appt)
    return appt


# Prescription routes
@app.post(
    "/prescriptions",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin(Role.SUPER_ADMIN, Role.CLINICIAN_ADMIN))],
)
def create_prescription(payload: CreateUserRequest, db: Session = Depends(get_db)) -> Prescription:
    """Create prescription for appointment (admin/clinician only)."""
    appointment = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment not found."
        )
    if appointment.prescription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prescription already exists for this appointment."
        )

    prescription = Prescription(
        appointment_id=payload.appointment_id,
        pharmacy_name=payload.pharmacy_name,
        medications_json=payload.medications_json,
        status=payload.status,
        qr_code_path=payload.qr_code_path,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


@app.get("/prescriptions", response_model=List[UserProfileResponse])
def list_prescriptions(
    status_filter: Optional[PrescriptionStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Prescription]:
    """List prescriptions (filtered by user role)."""
    query = db.query(Prescription).join(Appointment)
    
    if current_user.role == Role.PATIENT:
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == Role.CLINICIAN_ADMIN:
        query = query.filter(Appointment.clinician_id == current_user.id)
    
    if status_filter:
        query = query.filter(Prescription.status == status_filter)
    
    return query.order_by(Prescription.created_at.desc()).all()


@app.patch("/prescriptions/{prescription_id}", response_model=UserProfileResponse)
def update_prescription(
    prescription_id: int,
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin(Role.SUPER_ADMIN, Role.CLINICIAN_ADMIN)),
) -> Prescription:
    """Update prescription (admin/clinician only)."""
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prescription, field, value)
    
    db.commit()
    db.refresh(prescription)
    return prescription


# Doctor routes
@app.get("/doctors", response_model=List[UserProfileResponse])
def list_doctors(
    specialization: Optional[str] = None,
    is_available: Optional[bool] = True,
    db: Session = Depends(get_db),
) -> List[Doctor]:
    """List all doctors, optionally filtered by specialization and availability."""
    if specialization:
        doctors = get_doctors_by_specialization(db, specialization, is_available)
    else:
        doctors = get_all_doctors(db, is_available)
    return doctors


@app.get("/doctors/{doctor_id}", response_model=UserProfileResponse)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
) -> Doctor:
    """Get a specific doctor by ID."""
    doctor = get_doctor_by_id(db, doctor_id)
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    return doctor


@app.post(
    "/doctors",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin(Role.SUPER_ADMIN))],
)
def create_doctor_endpoint(payload: DoctorCreateRequest, db: Session = Depends(get_db)) -> Doctor:
    """Create a new doctor profile (admin only)."""
    # Verify user exists
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found."
        )
    
    # Check if doctor profile already exists for this user
    existing = db.query(Doctor).filter(Doctor.user_id == payload.user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor profile already exists for this user."
        )
    
    doctor = Doctor(
        user_id=payload.user_id,
        specialization=payload.specialization,
        bio=payload.bio,
        is_available=payload.is_available,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


# Payment routes
@app.post("/payments", response_model=PaymentResponse)
def process_payment(
    payload: PaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentResponse:
    """Process payment for an appointment (STUB - integrate with payment gateway)."""
    # Verify appointment exists and belongs to current user
    appointment = db.query(Appointment).filter(
        Appointment.id == payload.appointment_id,
        Appointment.patient_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found or unauthorized."
        )
    
    # TODO: Integrate with Stripe, M-Pesa, or other payment provider
    # For now, return a stub response
    import uuid
    transaction_id = str(uuid.uuid4())
    
    return PaymentResponse(
        transaction_id=transaction_id,
        status="pending",
        amount=payload.amount,
        message="Payment processing initiated. Please check email for confirmation."
    )


@app.get("/payments/history")
def get_payment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get user's payment history (STUB)."""
    # TODO: Implement once Payment model is created
    return {
        "user_id": current_user.id,
        "payments": [],
        "message": "Payment history feature coming soon"
    }


# Appointment reschedule/cancel routes
@app.patch("/appointments/{appointment_id}/reschedule", response_model=UserProfileResponse)
def reschedule_appointment(
    appointment_id: int,
    new_scheduled_at: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Appointment:
    """Reschedule an appointment (patient or clinician only)."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Check permissions
    if current_user.role == Role.PATIENT and appt.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reschedule this appointment"
        )
    elif current_user.role == Role.CLINICIAN_ADMIN and appt.clinician_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reschedule this appointment"
        )
    
    appt.scheduled_at = new_scheduled_at
    db.commit()
    db.refresh(appt)
    return appt


@app.patch("/appointments/{appointment_id}/cancel", response_model=UserProfileResponse)
def cancel_appointment(
    appointment_id: int,
    cancellation_reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Appointment:
    """Cancel an appointment (patient or clinician)."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Check permissions
    if current_user.role == Role.PATIENT and appt.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this appointment"
        )
    elif current_user.role == Role.CLINICIAN_ADMIN and appt.clinician_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this appointment"
        )
    
    appt.status = AppointmentStatus.CANCELLED
    appt.cancellation_reason = cancellation_reason
    db.commit()
    db.refresh(appt)
    return appt


# Dashboard route
@app.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
) -> dict:
    """Get dashboard summary statistics."""
    return dashboard_snapshot(db)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)