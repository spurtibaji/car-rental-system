import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class UserRole:
    CUSTOMER = "customer"
    ADMIN = "admin"


class KYCStatus:
    NOT_UPLOADED = "not_uploaded"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class UserStatus:
    ACTIVE = "active"
    SUSPENDED = "suspended"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.CUSTOMER, nullable=False, index=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(String(255), nullable=True)
    licence_number = Column(String(50), nullable=True)
    kyc_status = Column(String(20), default=KYCStatus.NOT_UPLOADED, nullable=False, index=True)
    status = Column(String(20), default=UserStatus.ACTIVE, nullable=False)
    profile_complete = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    wallet = relationship("WalletAccount", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    kyc_documents = relationship("KYCDocument", back_populates="user", cascade="all, delete-orphan")
    roadside_requests = relationship("RoadsideRequest", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
