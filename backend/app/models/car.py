import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Car(Base):
    __tablename__ = "cars"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False, index=True)
    brand = Column(String(50), nullable=False, index=True)
    model = Column(String(50), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    category = Column(String(50), nullable=False, index=True)  # Hatchback, Sedan, SUV, Luxury, Electric, 7-Seater
    hourly_price = Column(Numeric(10, 2), nullable=False)
    daily_price = Column(Numeric(10, 2), nullable=False, index=True)
    weekly_price = Column(Numeric(10, 2), nullable=False)
    seats = Column(Integer, nullable=False, index=True)
    fuel = Column(String(20), nullable=False, index=True)  # Petrol, Diesel, Electric, Hybrid
    transmission = Column(String(20), nullable=False, index=True)  # Manual, Automatic
    mileage = Column(Numeric(6, 2), nullable=False, default=0.0)
    image = Column(String(500), nullable=False)
    available = Column(Boolean, default=True, nullable=False, index=True)
    rating = Column(Numeric(3, 2), default=0.0, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)
    color = Column(String(50), nullable=False)
    engine_cc = Column(Integer, default=0, nullable=False)
    top_speed = Column(Integer, default=0, nullable=False)
    security_deposit = Column(Numeric(10, 2), nullable=False, default=5000.0)
    popular = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    features = relationship("CarFeature", back_populates="car", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="car", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="car", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="car", cascade="all, delete-orphan")


class CarFeature(Base):
    __tablename__ = "car_features"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    car_id = Column(String(50), ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    feature = Column(String(100), nullable=False)

    # Relationships
    car = relationship("Car", back_populates="features")
