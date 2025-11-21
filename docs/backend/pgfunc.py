"""
Database helper functions for querying User, Appointment, and Prescription models.
Models and database configuration are in models.py and database.py.
"""

from typing import Optional
from sqlalchemy.orm import Session

from models import User, Appointment, Prescription, Doctor, Role, AppointmentStatus


# Convenience DB helper functions used by other modules
def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Return a User by id or None."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Return a User by email or None."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, full_name: str, email: str, password_hash: str, role: Role = Role.PATIENT) -> User:
    """Create and return a new User."""
    user = User(full_name=full_name, email=email, password_hash=password_hash, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_appointments_for_user(db: Session, current_user: User, status_filter: Optional[AppointmentStatus] = None):
    """Return appointments filtered by user role and optional status."""
    query = db.query(Appointment)
    if current_user.role == Role.PATIENT:
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == Role.CLINICIAN_ADMIN:
        query = query.filter(Appointment.clinician_id == current_user.id)
    # SUPER_ADMIN sees all appointments
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    return query.order_by(Appointment.scheduled_at.desc()).all()


def dashboard_snapshot(db: Session) -> dict:
    """Return a simple dashboard summary counts."""
    total_users = db.query(User).count()
    total_appointments = db.query(Appointment).count()
    total_prescriptions = db.query(Prescription).count()
    upcoming = db.query(Appointment).filter(Appointment.status == AppointmentStatus.SCHEDULED).count()
    return {
        "users": total_users,
        "appointments": total_appointments,
        "prescriptions": total_prescriptions,
        "upcoming": upcoming,
    }


# Doctor helper functions
def get_all_doctors(db: Session, is_available: bool = True):
    """Return all doctors, optionally filtered by availability."""
    query = db.query(Doctor)
    if is_available:
        query = query.filter(Doctor.is_available == True)
    return query.all()


def get_doctor_by_id(db: Session, doctor_id: int) -> Optional[Doctor]:
    """Return a Doctor by id or None."""
    return db.query(Doctor).filter(Doctor.id == doctor_id).first()


def get_doctors_by_specialization(db: Session, specialization: str, is_available: bool = True):
    """Return doctors filtered by specialization and availability."""
    query = db.query(Doctor).filter(Doctor.specialization == specialization)
    if is_available:
        query = query.filter(Doctor.is_available == True)
    return query.all()


def get_doctor_by_user_id(db: Session, user_id: int) -> Optional[Doctor]:
    """Return a Doctor profile for a given user_id or None."""
    return db.query(Doctor).filter(Doctor.user_id == user_id).first()


def create_doctor(db: Session, user_id: int, specialization: str, bio: str = None, rating: float = 0.0) -> Doctor:
    """Create and return a new Doctor profile."""
    doctor = Doctor(user_id=user_id, specialization=specialization, bio=bio, rating=rating)
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor