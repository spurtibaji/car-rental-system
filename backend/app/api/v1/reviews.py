from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.review_service import ReviewService
from app.schemas.review import ReviewCreateRequest, ReviewResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/reviews", tags=["Customer Reviews"])


@router.post("", response_model=ApiResponse[ReviewResponse], status_code=status.HTTP_201_CREATED)
def submit_review(
    data: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a 1-5 star rating and feedback review for a completed car booking.
    Prevents duplicate reviews and enforces completed booking requirement.
    """
    review_service = ReviewService(db)
    review = review_service.create_review(user_id=current_user.id, data=data)
    return ApiResponse(
        message="Thank you! Your rating and review have been submitted successfully.",
        data=review,
    )


@router.get("/my", response_model=ApiResponse[List[ReviewResponse]])
def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all reviews submitted by the currently logged-in customer."""
    review_service = ReviewService(db)
    reviews = review_service.list_user_reviews(user_id=current_user.id)
    return ApiResponse(
        message="Reviews retrieved successfully",
        data=reviews,
    )


@router.get("/booking/{booking_id}", response_model=ApiResponse[Optional[ReviewResponse]])
def get_booking_review(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the submitted review for a specific booking, if it exists."""
    review_service = ReviewService(db)
    review = review_service.get_booking_review(booking_id=booking_id, user_id=current_user.id)
    return ApiResponse(
        message="Booking review retrieved successfully" if review else "No review found for this booking",
        data=review,
    )
