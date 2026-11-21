from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.services.booking_service import BookingService
from app.schemas.booking import (
    BookingQuoteRequest,
    BookingQuoteResponse,
    BookingCreateRequest,
    BookingResponse,
    BookingTrackingResponse,
)
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/quote", response_model=ApiResponse[BookingQuoteResponse])
def get_booking_quote(
    data: BookingQuoteRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Calculate verified booking price quote, discounts, driver fees, and deposit."""
    booking_service = BookingService(db)
    user_id = current_user.id if current_user else None
    quote = booking_service.calculate_quote(data=data, user_id=user_id)
    return ApiResponse(
        message="Booking quote calculated successfully",
        data=quote,
    )


@router.post("", response_model=ApiResponse[BookingResponse], status_code=status.HTTP_201_CREATED)
def create_booking(
    data: BookingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a verified car booking. Prevents double-booking with DB row locking."""
    booking_service = BookingService(db)
    booking = booking_service.create_booking(user=current_user, data=data)
    return ApiResponse(
        message="Booking confirmed successfully",
        data=booking,
    )


@router.get("", response_model=ApiResponse[List[BookingResponse]])
def list_user_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List bookings for the authenticated user."""
    booking_service = BookingService(db)
    bookings = booking_service.list_user_bookings(user_id=current_user.id)
    return ApiResponse(
        message="User bookings retrieved successfully",
        data=bookings,
    )


@router.get("/{booking_id}", response_model=ApiResponse[BookingResponse])
def get_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get booking details and price breakdown."""
    booking_service = BookingService(db)
    booking = booking_service.get_booking_by_id(booking_id)
    return ApiResponse(
        message="Booking details retrieved successfully",
        data=booking,
    )


@router.post("/{booking_id}/cancel", response_model=ApiResponse[BookingResponse])
def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel an eligible booking and process automatic wallet & deposit refunds."""
    booking_service = BookingService(db)
    cancelled = booking_service.cancel_booking(booking_id=booking_id, user_id=current_user.id)
    return ApiResponse(
        message="Booking cancelled successfully and refunds processed",
        data=cancelled,
    )


@router.get("/{booking_id}/tracking", response_model=ApiResponse[BookingTrackingResponse])
def get_booking_tracking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get live tracking stage for a booking."""
    booking_service = BookingService(db)
    tracking = booking_service.get_tracking(booking_id=booking_id)
    return ApiResponse(
        message="Tracking info retrieved successfully",
        data=tracking,
    )


@router.delete("/{booking_id}", response_model=ApiResponse[dict])
def delete_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a booking for the current user."""
    booking_service = BookingService(db)
    booking_service.delete_booking(booking_id=booking_id, user_id=current_user.id)
    return ApiResponse(
        message="Booking removed successfully",
        data={"id": booking_id},
    )
