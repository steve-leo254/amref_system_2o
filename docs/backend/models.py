"""
SQLAlchemy ORM models for Kiangombe Patient Center API.
Clean, centralized models following professional patterns.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Numeric,
    ForeignKey,
    Enum,
    Boolean,
    Text,
    func,
    
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.mysql import JSON
import enum
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Setup Base (define here to avoid circular imports)
Base = declarative_base()


# ============================================================================
# Enums
# ============================================================================

class Role(enum.Enum):
    """User role enumeration."""
    SUPER_ADMIN = "super_admin"
    CLINICIAN_ADMIN = "clinician_admin"
    PATIENT = "patient"


class AppointmentStatus(enum.Enum):
    """Appointment status enumeration."""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PrescriptionStatus(enum.Enum):
    """Prescription status enumeration."""
    PENDING = "pending"
    APPROVED = "approved"
    FULFILLED = "fulfilled"


class PaymentStatus(enum.Enum):
    """Payment status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ============================================================================
# ORM Models
# ============================================================================

class User(Base):
    """User model representing patients, clinicians, and admins in Kiangombe."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True, index=True)
    gender = Column(String(20), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    address = Column(String(255), nullable=True)
    profile_picture = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    role = Column(Enum(Role), nullable=False, default=Role.PATIENT)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    appointments = relationship(
        "Appointment",
        back_populates="patient",
        foreign_keys="Appointment.patient_id",
    )
    consults = relationship(
        "Appointment",
        back_populates="clinician",
        foreign_keys="Appointment.clinician_id",
    )
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    payments = relationship("Payment", back_populates="user")
    medical_history = relationship("MedicalHistory", back_populates="patient")
    addresses = relationship("Address", back_populates="user")


class Doctor(Base):
    """Doctor model representing clinicians with specializations."""
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    specialization = Column(String(120), nullable=False, index=True)
    bio = Column(Text, nullable=True)
    rating = Column(Numeric(precision=3, scale=2), default=0.0)
    license_number = Column(String(50), unique=True, nullable=True)
    is_available = Column(Boolean, default=True, index=True)
    consultation_fee = Column(Numeric(precision=10, scale=2), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="doctor_profile")

 

class Appointment(Base):
    """Appointment model representing patient-clinician appointments."""
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    clinician_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    visit_type = Column(String(80), nullable=True)
    specialization = Column(String(80), nullable=True, index=True)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, index=True)
    triage_notes = Column(Text, nullable=True)
    cost = Column(Numeric(precision=10, scale=2), default=0.0)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="appointments")
    clinician = relationship("User", foreign_keys=[clinician_id], back_populates="consults")
    prescription = relationship("Prescription", back_populates="appointment", uselist=False)
    payment = relationship("Payment", back_populates="appointment", uselist=False)


class Prescription(Base):
    """Prescription model representing medications prescribed for appointments."""
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(
        Integer,
        ForeignKey("appointments.id"),
        unique=True,
        nullable=False,
        index=True
    )
    issued_by_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    pharmacy_name = Column(String(120), nullable=True)
    medications_json = Column(JSON, nullable=True)
    status = Column(Enum(PrescriptionStatus), default=PrescriptionStatus.PENDING, index=True)
    qr_code_path = Column(String(255), nullable=True)
    issued_date = Column(DateTime, default=func.now())
    expiry_date = Column(DateTime, nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    appointment = relationship("Appointment", back_populates="prescription")


class Payment(Base):
    """Payment model representing transactions for appointments."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Numeric(precision=12, scale=2), nullable=False)
    payment_method = Column(String(50), nullable=False)  # "card", "mpesa", "bank_transfer"
    transaction_id = Column(String(100), unique=True, nullable=True, index=True)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, index=True)
    reference_number = Column(String(100), nullable=True)
    payment_details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    appointment = relationship("Appointment", back_populates="payment")
    user = relationship("User", back_populates="payments")


class Address(Base):
    """Address model for patient delivery and contact addresses."""
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    address = Column(String(255), nullable=False)
    additional_info = Column(String(255), nullable=True)
    region = Column(String(100), nullable=True)
    city = Column(String(100), nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="addresses")


class MedicalHistory(Base):
    """Medical history model for tracking patient health records."""
    __tablename__ = "medical_history"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    diagnosis = Column(Text, nullable=True)
    symptoms = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    attachments_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    patient = relationship("User", back_populates="medical_history")

