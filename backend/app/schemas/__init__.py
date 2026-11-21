from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedMeta, ErrorResponse
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserResponse, UserUpdateRequest, KYCDocumentResponse, KYCSubmitRequest
from app.schemas.car import (
    CarPrice,
    CarResponse,
    CarCreateRequest,
    CarUpdateRequest,
    AvailabilityCheckResponse,
)
from app.schemas.location import LocationResponse
from app.schemas.offer import OfferResponse, CouponValidateRequest, CouponValidateResponse
from app.schemas.booking import (
    BookingQuoteRequest,
    BookingQuoteResponse,
    BookingCreateRequest,
    BookingResponse,
    PriceBreakdownSchema,
    BookingTrackingResponse,
    TrackingStage,
)
from app.schemas.wallet import (
    WalletTopUpRequest,
    WalletTransactionResponse,
    WalletResponse,
)
from app.schemas.roadside import (
    RoadsideCreateRequest,
    RoadsideUpdateRequest,
    RoadsideResponse,
)
from app.schemas.trip_planner import (
    TripPlannerRequest,
    TripRecommendationItem,
    TripPlannerResponse,
)
from app.schemas.maintenance import (
    MaintenanceRecordCreate,
    MaintenanceRecordUpdate,
    MaintenanceRecordResponse,
)
from app.schemas.admin import (
    AdminStats,
    MonthlyRevenueItem,
    AdminDashboardResponse,
    CustomerResponse,
    CustomerStatusUpdate,
    KYCReviewRequest,
    BookingStatusUpdate,
    CarAvailabilityToggle,
    RevenueBreakdownResponse,
    AdminBookingResponse,
    AdminBookingUser,
    AdminBookingCar,
)
from app.schemas.review import (
    ReviewCreateRequest,
    ReviewResponse,
    CustomerReviewsSummary,
)

__all__ = [
    "ApiResponse",
    "PaginatedResponse",
    "PaginatedMeta",
    "ErrorResponse",
    "RegisterRequest",
    "LoginRequest",
    "RefreshRequest",
    "TokenResponse",
    "UserResponse",
    "UserUpdateRequest",
    "KYCDocumentResponse",
    "KYCSubmitRequest",
    "CarPrice",
    "CarResponse",
    "CarCreateRequest",
    "CarUpdateRequest",
    "AvailabilityCheckResponse",
    "LocationResponse",
    "OfferResponse",
    "CouponValidateRequest",
    "CouponValidateResponse",
    "BookingQuoteRequest",
    "BookingQuoteResponse",
    "BookingCreateRequest",
    "BookingResponse",
    "PriceBreakdownSchema",
    "BookingTrackingResponse",
    "TrackingStage",
    "WalletTopUpRequest",
    "WalletTransactionResponse",
    "WalletResponse",
    "RoadsideCreateRequest",
    "RoadsideUpdateRequest",
    "RoadsideResponse",
    "TripPlannerRequest",
    "TripRecommendationItem",
    "TripPlannerResponse",
    "MaintenanceRecordCreate",
    "MaintenanceRecordUpdate",
    "MaintenanceRecordResponse",
    "AdminStats",
    "MonthlyRevenueItem",
    "AdminDashboardResponse",
    "CustomerResponse",
    "CustomerStatusUpdate",
    "KYCReviewRequest",
    "BookingStatusUpdate",
    "CarAvailabilityToggle",
    "RevenueBreakdownResponse",
    "AdminBookingResponse",
    "AdminBookingUser",
    "AdminBookingCar",
    "ReviewCreateRequest",
    "ReviewResponse",
    "CustomerReviewsSummary",
]
