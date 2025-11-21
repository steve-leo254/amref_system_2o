"""
Database connection and session management.
ORM models are now in models.py for better organization.
"""

import os
from typing import Annotated
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Depends

load_dotenv()

import logging
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/patient_center")

try:
    engine = create_engine(
        DATABASE_URL, 
        pool_pre_ping=True, 
        pool_size=10, 
        max_overflow=20,
        echo=False
    )
except Exception as e:
    logger.warning(f"Database connection warning: {e}")
    engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)




def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]