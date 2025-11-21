"""
Pydantic models and request/response schemas for Kiangombe Patient Center API.
Organized by feature/concern for better maintainability.
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from decimal import Decimal


# ============================================================================
# Enums
# ============================================================================

class Role(str, Enum):
    """User roles."""
    SUPER_ADMIN = "super_admin"
    CLINICIAN_ADMIN = "clinician_admin"
    PATIENT = "patient"


class AppointmentStatus(str, Enum):
    """Appointment statuses."""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    """Payment statuses."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ============================================================================
# Authentication
# ============================================================================

class CreateUserRequest(BaseModel):
    """User registration request."""
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72, description="Password must be 8-72 characters (bcrypt limit)")
    phone: Optional[str] = Field(None, max_length=20)
    gender: Optional[str] = Field(None, description="Gender: male, female, other, prefer_not_to_say")
    date_of_birth: Optional[str] = Field(None, description="Date of birth in ISO format (YYYY-MM-DD)")


class LoginUserRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str = Field(..., max_length=72)


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Optional[dict] = None


class TokenVerifyRequest(BaseModel):
    """Token verification request."""
    token: str


class TokenVerificationResponse(BaseModel):
    """Token verification response."""
    valid: bool
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    """Password reset request."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Password reset with token."""
    new_password: str = Field(..., min_length=8, max_length=72)


# ============================================================================
# User & Profile
# ============================================================================

class UserProfileResponse(BaseModel):
    """User profile response."""
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_verified: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Appointments
# ============================================================================

class AppointmentCreateRequest(BaseModel):
    """Create appointment request."""
    patient_id: int
    clinician_id: int
    visit_type: Optional[str] = None
    scheduled_at: datetime
    triage_notes: Optional[str] = None
    specialization: Optional[str] = None
    cost: Decimal = Decimal("0.0")


class AppointmentRescheduleRequest(BaseModel):
    """Reschedule appointment request."""
    scheduled_at: Optional[datetime] = None


class AppointmentCancelRequest(BaseModel):
    """Cancel appointment request."""
    cancellation_reason: Optional[str] = None


# ============================================================================
# Doctors
# ============================================================================

class DoctorCreateRequest(BaseModel):
    """Create doctor profile request."""
    user_id: int
    specialization: str = Field(..., max_length=120)
    bio: Optional[str] = None
    license_number: Optional[str] = None
    consultation_fee: Optional[Decimal] = None
    is_available: bool = True


class DoctorUpdateRequest(BaseModel):
    """Update doctor profile request."""
    specialization: Optional[str] = None
    bio: Optional[str] = None
    license_number: Optional[str] = None
    consultation_fee: Optional[Decimal] = None
    is_available: Optional[bool] = None
    rating: Optional[Decimal] = None


# ============================================================================
# Payments
# ============================================================================

class PaymentRequest(BaseModel):
    """Payment request."""
    appointment_id: int
    amount: Decimal = Field(..., gt=0)
    payment_method: str = Field(..., description="card, mpesa, bank_transfer")
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    card_cvv: Optional[str] = None
    phone_number: Optional[str] = None


class PaymentResponse(BaseModel):
    """Payment response."""
    transaction_id: str
    status: str
    amount: Decimal
    message: str


# ============================================================================
# Addresses
# ============================================================================

class AddressCreateRequest(BaseModel):
    """Create address request."""
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    phone_number: str = Field(..., max_length=20)
    address: str = Field(..., max_length=100)
    additional_info: Optional[str] = Field(None, max_length=255)
    region: Optional[str] = Field(None, max_length=100)
    city: str = Field(..., max_length=100)
    is_default: bool = False


class AddressResponse(AddressCreateRequest):
    """Address response."""
    id: int
    user_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Generic Responses
# ============================================================================

class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    status_code: int
    detail: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    items: List[Dict[str, Any]]
    total: int
    page: int
    limit: int
    pages: int
