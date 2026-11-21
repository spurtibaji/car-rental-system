import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RoadsideIssueType:
    BREAKDOWN = "breakdown"
    FLAT_TYRE = "flat-tyre"
    ACCIDENT = "accident"
    BATTERY = "battery"
    FUEL = "fuel"
    LOCKED = "locked"
    TOWING = "towing"
    OTHER = "other"


class RoadsideStatus:
    REQUESTED = "requested"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"


ETA_MAPPING = {
    "breakdown": "20-30 min",
    "flat-tyre": "15-20 min",
    "accident": "10-15 min",
    "battery": "25-35 min",
    "fuel": "20-25 min",
    "locked": "30-40 min",
    "towing": "35-45 min",
    "other": "30-40 min",
}


class RoadsideRequest(Base):
    __tablename__ = "roadside_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_id = Column(String(30), unique=True, index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    booking_id = Column(String(50), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    issue_type = Column(String(50), nullable=False, index=True)
    location = Column(Text, nullable=False)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    notes = Column(Text, nullable=True)
    eta = Column(String(50), default="20-30 min", nullable=False)
    status = Column(String(30), default=RoadsideStatus.REQUESTED, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="roadside_requests")
    booking = relationship("Booking", back_populates="roadside_requests")
