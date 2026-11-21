from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.review import ReviewResponse


class BookingQuoteRequest(BaseModel):
    car_id: str
    pickup_date: date
    return_date: Optional[date] = None
    pickup_time: Optional[str] = "10:00"
    return_time: Optional[str] = "10:00"
    duration_type: Optional[str] = None
    duration_value: Optional[int] = Field(1, ge=1)
    with_driver: bool = False
    coupon_code: Optional[str] = None
    use_wallet: bool = False


class BookingQuoteResponse(BaseModel):
    car_id: str
    car_name: str
    unit_price: float
    duration_type: Optional[str] = None
    duration_value: int
    base_amount: float
    driver_fee: float
    subtotal: float
    coupon_discount: float
    coupon_code: Optional[str] = None
    wallet_discount: float
    security_deposit: float
    final_amount: float
    total_payable: float
    is_available: bool
    wallet_balance: float


class BookingCreateRequest(BaseModel):
    car_id: str
    pickup_location: str = Field(..., min_length=2)
    drop_location: Optional[str] = None
    pickup_date: date
    return_date: Optional[date] = None
    pickup_time: Optional[str] = "10:00"
    return_time: Optional[str] = "10:00"
    duration_type: Optional[str] = None
    duration_value: Optional[int] = Field(1, ge=1)
    with_driver: bool = False
    coupon_code: Optional[str] = None
    use_wallet: bool = False
    payment_method: str = Field("upi", pattern="^(upi|card|netbanking|cash|wallet)$")


class PriceBreakdownSchema(BaseModel):
    unit_price: float
    duration_units: int
    subtotal: float
    driver_charge: float
    coupon_discount: float
    wallet_deduction: float
    deposit_charge: float
    total_payable: float


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    carId: str = Field(validation_alias="car_id")
    carName: str
    carImage: str
    pickupLocation: str = Field(validation_alias="pickup_location_name")
    dropLocation: str = Field(validation_alias="drop_location_name")
    pickupDate: date = Field(validation_alias="pickup_date")
    returnDate: date = Field(validation_alias="return_date")
    pickupTime: str = Field(validation_alias="pickup_time")
    durationType: Optional[str] = None
    durationValue: int = Field(1, validation_alias="duration_value")
    amount: float = Field(validation_alias="final_amount")
    status: str
    withDriver: bool = Field(validation_alias="with_driver")
    couponApplied: Optional[str] = Field(None, validation_alias="coupon_code")
    discount: Optional[float] = Field(0.0, validation_alias="discount_amount")
    createdAt: date = Field(validation_alias="created_at")
    breakdown: Optional[PriceBreakdownSchema] = None
    user: Optional[dict] = None
    car: Optional[dict] = None
    total_price: Optional[float] = None
    total_amount: Optional[float] = None
    pickup_date: Optional[date] = None
    return_date: Optional[date] = None
    pickup_time: Optional[str] = None
    return_time: Optional[str] = None
    pickup_location: Optional[str] = None
    drop_location: Optional[str] = None
    duration_value: Optional[int] = None
    with_driver: Optional[bool] = None
    payment_method: Optional[str] = None
    review: Optional[ReviewResponse] = None




class TrackingStage(BaseModel):
    name: str
    completed: bool
    current: bool


class BookingTrackingResponse(BaseModel):
    booking_id: str
    status: str
    current_stage_index: int
    stages: List[TrackingStage]
