from datetime import timedelta, datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status
from database import db_dependency
from models import User, Role
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic_models import (
    CreateUserRequest,
    Token,
    TokenVerifyRequest,
    LoginUserRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenVerificationResponse
)
from passlib.context import CryptContext
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-default-secure-key")
ALGORITHM = "HS256"
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/login")

conf = ConnectionConfig(
    MAIL_USERNAME="steveleo254@gmail.com",
    MAIL_PASSWORD="dhqf lxgw zlaw bwdj",
    MAIL_FROM="steveleo254@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

@router.post("/register/customer", status_code=status.HTTP_201_CREATED)
async def register_customer(db: db_dependency, create_user_request: CreateUserRequest):
    logger.info(f"Customer registration payload: {create_user_request}")
    existing_user = db.query(User).filter(
        User.email == create_user_request.email
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Convert date_of_birth string to datetime if provided
    date_of_birth = None
    if create_user_request.date_of_birth:
        try:
            date_of_birth = datetime.fromisoformat(create_user_request.date_of_birth)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    create_user_model = User(
        full_name=create_user_request.full_name,
        email=create_user_request.email,
        password_hash=bcrypt_context.hash(create_user_request.password),
        phone=create_user_request.phone,
        gender=create_user_request.gender,
        date_of_birth=date_of_birth,
        role=Role.PATIENT
    )
    db.add(create_user_model)
    db.commit()
    db.refresh(create_user_model)
    logger.info(f"Customer {create_user_request.full_name} registered successfully")
    return {"message": "Customer created successfully"}

@router.post("/register/admin", status_code=status.HTTP_201_CREATED)
async def register_admin(db: db_dependency, create_user_request: CreateUserRequest):
    logger.info(f"Admin registration payload: {create_user_request}")
    existing_user = db.query(User).filter(
        User.email == create_user_request.email
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Convert date_of_birth string to datetime if provided
    date_of_birth = None
    if create_user_request.date_of_birth:
        try:
            date_of_birth = datetime.fromisoformat(create_user_request.date_of_birth)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    create_user_model = User(
        full_name=create_user_request.full_name,
        email=create_user_request.email,
        password_hash=bcrypt_context.hash(create_user_request.password),
        phone=create_user_request.phone,
        gender=create_user_request.gender,
        date_of_birth=date_of_birth,
        role=Role.CLINICIAN_ADMIN
    )
    db.add(create_user_model)
    db.commit()
    db.refresh(create_user_model)
    logger.info(f"Admin {create_user_request.full_name} registered successfully")
    return {"message": "Admin created successfully"}


def authenticate_user(email: str, password: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User does not exist")
    if not bcrypt_context.verify(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid password")
    return user

def create_access_token(full_name: str, user_id: int, role: str, expires_delta: timedelta):
    encode = {"sub": full_name, "id": user_id, "role": role}
    expires = datetime.utcnow() + expires_delta
    encode.update({"exp": expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login", response_model=Token)
async def login(form_data: LoginUserRequest, db: db_dependency):
    logger.info(f"Login attempt for email: {form_data.email}")
    user = authenticate_user(form_data.email, form_data.password, db)
    token = create_access_token(user.full_name, user.id, user.role.value, timedelta(hours=1))
    logger.info(f"User {user.full_name} logged in successfully")
    return {"access_token": token, "token_type": "bearer"}

async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    """Get current user from token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        role: str = payload.get("role")
        if username is None or user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Could not validate user")
        return {"username": username, "id": user_id, "role": role}
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.DecodeError:
        logger.warning("Invalid token")
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_active_user(token: Annotated[str, Depends(oauth2_bearer)]):
    """Get current active user from token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        role: str = payload.get("role")
        if username is None or user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Could not validate user")
        return {"username": username, "id": user_id, "role": role}
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.DecodeError:
        logger.warning("Invalid token")
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/verify-token", response_model=TokenVerificationResponse, status_code=status.HTTP_200_OK)
async def verify_token(request_body: TokenVerifyRequest):
    try:
        payload = jwt.decode(request_body.token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        exp_timestamp = float(payload["exp"])
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        if exp_datetime < datetime.utcnow():
            logger.warning("Token expired during verification")
            raise HTTPException(status_code=401, detail="Token expired")
        logger.info(f"Token verified for user: {username}")
        return {"username": username, "tokenverification": "success"}
    except jwt.DecodeError:
        logger.warning("Invalid token during verification")
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(forgot_password_request: ForgotPasswordRequest, db: db_dependency):
    email = forgot_password_request.email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logger.warning(f"Password reset requested for non-existent email: {email}")
        raise HTTPException(status_code=404, detail="User does not exist")
    
    token_expires = timedelta(hours=1)
    reset_token = create_access_token(user.full_name, user.id, user.role.value, token_expires)
    
    message = MessageSchema(
        subject="Password Reset Request",
        recipients=[email],
        body=f"Please use the following link to reset your password: "
             f"http://localhost:3000/reset-password?token={reset_token}",
        subtype="html",
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    logger.info(f"Password reset email sent to: {email}")
    return {"message": "Password reset email sent"}
    

@router.post("/reset-password/{token}", status_code=status.HTTP_200_OK)
async def reset_password(token: str, reset_password_request: ResetPasswordRequest, db: db_dependency):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if user_id is None:
            logger.warning("Invalid reset token")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"Password reset attempted for non-existent user ID: {user_id}")
            raise HTTPException(status_code=404, detail="User does not exist")
        
        user.password_hash = bcrypt_context.hash(reset_password_request.new_password)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Password reset successfully for user: {user.full_name}")
        return {"message": "Password has been reset successfully"}
    except jwt.ExpiredSignatureError:
        logger.warning("Expired reset token")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.DecodeError:
        logger.warning("Invalid reset token")
        raise HTTPException(status_code=401, detail="Invalid token")