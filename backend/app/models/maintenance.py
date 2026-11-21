import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MaintenanceType:
    SCHEDULED = "scheduled"
    REPAIR = "repair"
    DAMAGE = "damage"


class MaintenanceStatus:
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    car_id = Column(String(50), ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    car_name = Column(String(100), nullable=False)
    type = Column(String(30), nullable=False)  # 'scheduled', 'repair', 'damage'
    description = Column(Text, nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(30), default=MaintenanceStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    car = relationship("Car", back_populates="maintenance_records")
