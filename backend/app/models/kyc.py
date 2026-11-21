import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class KYCDocumentType:
    DRIVING_LICENSE = "driving_license"
    AADHAAR = "aadhaar"
    LICENCE_FRONT = "licence_front"
    LICENCE_BACK = "licence_back"
    AADHAAR_FRONT = "aadhaar_front"
    AADHAAR_BACK = "aadhaar_back"
    SELFIE = "selfie"
    PASSPORT = "passport"


class KYCDocumentStatus:
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class KYCDocument(Base):
    __tablename__ = "kyc_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    status = Column(String(20), default=KYCDocumentStatus.PENDING, nullable=False, index=True)
    rejection_reason = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="kyc_documents")
