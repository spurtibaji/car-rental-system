from datetime import date
from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict, Field


class AdminStats(BaseModel):
    totalRevenue: float
    monthlyRevenue: float
    activeBookings: int
    totalCars: int
    availableCars: int
    totalCustomers: int
    pendingKYC: int
    revenueGrowth: float


class MonthlyRevenueItem(BaseModel):
    month: str
    month_name: str
    amount: float
    percentage: int


class AdminDashboardResponse(BaseModel):
    stats: AdminStats
    monthly_revenue: List[MonthlyRevenueItem]
    recent_bookings_count: int


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    email: str
    phone: Optional[str] = None
    joinDate: date = Field(validation_alias="created_at")
    totalBookings: int = 0
    totalSpent: float = 0.0
    kycStatus: str = Field(validation_alias="kyc_status")
    kyc_status: Optional[str] = None
    status: str
    average_rating: Optional[float] = None
    averageRating: Optional[float] = Field(None, validation_alias="average_rating")
    total_reviews: int = 0
    totalReviews: int = Field(0, validation_alias="total_reviews")


class AdminBookingUser(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    email: str
    phone: Optional[str] = None


class AdminBookingCar(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    image: Optional[str] = None
    license_plate: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    category: Optional[str] = None


class AdminBookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    booking_id: Optional[str] = None
    user_id: Optional[str] = None
    car_id: Optional[str] = None
    status: str
    pickup_date: date
    return_date: Optional[date] = None
    pickup_time: Optional[str] = "10:00"
    return_time: Optional[str] = "10:00"
    pickup_location: str
    drop_location: Optional[str] = None
    duration_type: Optional[str] = None
    duration_value: int = 1
    total_price: float
    total_amount: float
    amount: float
    with_driver: bool = False
    payment_method: Optional[str] = "upi"
    payment_status: Optional[str] = "completed"
    coupon_code: Optional[str] = None
    discount_amount: float = 0.0
    created_at: Optional[date] = None
    user: Optional[AdminBookingUser] = None
    car: Optional[AdminBookingCar] = None

    # camelCase convenience fields
    carId: Optional[str] = None
    carName: Optional[str] = None
    carImage: Optional[str] = None
    pickupLocation: Optional[str] = None
    dropLocation: Optional[str] = None
    pickupDate: Optional[date] = None
    returnDate: Optional[date] = None
    pickupTime: Optional[str] = None
    returnTime: Optional[str] = None
    durationValue: Optional[int] = None
    withDriver: Optional[bool] = None
    createdAt: Optional[date] = None


class CustomerStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|suspended)$")


class KYCReviewRequest(BaseModel):
    status: str = Field(..., pattern="^(verified|rejected)$")
    rejection_reason: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(confirmed|active|completed|cancelled)$")


class CarAvailabilityToggle(BaseModel):
    available: bool


class RevenueBreakdownResponse(BaseModel):
    total_revenue: float
    monthly_revenue: float
    maintenance_cost: float
    net_revenue: float
    revenue_by_category: Dict[str, float]
    monthly_trend: List[MonthlyRevenueItem]

