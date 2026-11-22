import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Numeric,
    Integer,
    Date,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class BookingStatus:
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentStatus:
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    car_id = Column(String(50), ForeignKey("cars.id"), nullable=False, index=True)
    pickup_location_id = Column(String(36), ForeignKey("locations.id"), nullable=True)
    drop_location_id = Column(String(36), ForeignKey("locations.id"), nullable=True)
    pickup_location_name = Column(String(150), nullable=False)
    drop_location_name = Column(String(150), nullable=False)
    pickup_date = Column(Date, nullable=False, index=True)
    return_date = Column(Date, nullable=False, index=True)
    pickup_time = Column(String(10), default="10:00", nullable=False)
    return_time = Column(String(10), default="10:00", nullable=False)
    duration_type = Column(String(20), default="daily", nullable=False)
    duration_value = Column(Integer, nullable=False)
    with_driver = Column(Boolean, default=False, nullable=False)
    driver_fee = Column(Numeric(10, 2), default=0.0, nullable=False)
    base_amount = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0.0, nullable=False)
    wallet_amount = Column(Numeric(10, 2), default=0.0, nullable=False)
    security_deposit = Column(Numeric(10, 2), default=0.0, nullable=False)
    final_amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(30), default="upi", nullable=False)
    payment_status = Column(String(30), default=PaymentStatus.COMPLETED, nullable=False)
    status = Column(String(30), default=BookingStatus.CONFIRMED, nullable=False, index=True)
    coupon_code = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bookings")
    car = relationship("Car", back_populates="bookings")
    pickup_location = relationship("Location", foreign_keys=[pickup_location_id])
    drop_location = relationship("Location", foreign_keys=[drop_location_id])
    price_breakdown = relationship(
        "BookingPriceBreakdown",
        back_populates="booking",
        uselist=False,
        cascade="all, delete-orphan",
    )
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    roadside_requests = relationship("RoadsideRequest", back_populates="booking")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")


class BookingPriceBreakdown(Base):
    __tablename__ = "booking_price_breakdowns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String(50), ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    duration_units = Column(Integer, nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    driver_charge = Column(Numeric(10, 2), default=0.0, nullable=False)
    coupon_discount = Column(Numeric(10, 2), default=0.0, nullable=False)
    wallet_deduction = Column(Numeric(10, 2), default=0.0, nullable=False)
    deposit_charge = Column(Numeric(10, 2), default=0.0, nullable=False)
    total_payable = Column(Numeric(10, 2), nullable=False)
    details_json = Column(Text, nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="price_breakdown")
