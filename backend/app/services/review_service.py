import uuid
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.review import Review
from app.models.booking import Booking, BookingStatus
from app.models.user import User
from app.models.car import Car
from app.repositories.review_repo import ReviewRepository
from app.repositories.booking_repo import BookingRepository
from app.repositories.car_repo import CarRepository
from app.repositories.user_repo import UserRepository
from app.repositories.audit_repo import AuditRepository
from app.schemas.review import ReviewCreateRequest, ReviewResponse, CustomerReviewsSummary
from app.core.exceptions import (
    BadRequestException,
    EntityNotFoundException,
    ForbiddenException,
)


class ReviewService:
    def __init__(self, db: Session):
        self.db = db
        self.review_repo = ReviewRepository(db)
        self.booking_repo = BookingRepository(db)
        self.car_repo = CarRepository(db)
        self.user_repo = UserRepository(db)
        self.audit_repo = AuditRepository(db)

    def _review_to_response(self, review: Review) -> ReviewResponse:
        car_name = review.car.name if review.car else None
        car_image = review.car.image if review.car else None
        user_name = review.user.name if review.user else None

        return ReviewResponse(
            id=review.id,
            car_id=review.car_id,
            car_name=car_name,
            car_image=car_image,
            user_id=review.user_id,
            user_name=user_name,
            booking_id=review.booking_id,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
        )

    def create_review(self, user_id: str, data: ReviewCreateRequest) -> ReviewResponse:
        # 1. Fetch booking
        booking = self.booking_repo.get_by_id(data.booking_id)
        if not booking:
            raise EntityNotFoundException("Booking", data.booking_id)

        # 2. Verify ownership
        if booking.user_id != user_id:
            raise ForbiddenException("You can only review your own bookings")

        # 3. Requirement 8: Allow only customers with completed bookings to submit reviews
        if booking.status != BookingStatus.COMPLETED:
            raise BadRequestException(
                f"Only completed bookings can be reviewed. Current booking status is '{booking.status}'."
            )

        # 4. Requirement 9: Prevent customers from submitting multiple reviews for the same booking
        existing_review = self.review_repo.get_by_booking_id(data.booking_id)
        if existing_review:
            raise BadRequestException("A review has already been submitted for this booking.")

        # 5. Requirement 2: 1-5 star rating
        if data.rating < 1 or data.rating > 5:
            raise BadRequestException("Rating must be an integer between 1 and 5 stars.")

        # 6. Requirement 3 & 4: Save rating and review in database
        cleaned_comment = data.comment.strip()
        if not cleaned_comment:
            raise BadRequestException("Please provide written feedback or comments for your review.")

        review = Review(
            id=str(uuid.uuid4()),
            car_id=booking.car_id,
            user_id=user_id,
            booking_id=booking.id,
            rating=data.rating,
            comment=cleaned_comment,
        )
        self.review_repo.create(review)

        # Recalculate car average rating and review_count
        car = self.car_repo.get_by_id(booking.car_id)
        if car:
            avg_rating, total_reviews = self.review_repo.get_car_rating_stats(car.id)
            car.rating = Decimal(str(avg_rating))
            car.review_count = total_reviews
            self.db.commit()

        # Audit log
        self.audit_repo.log(
            action="SUBMIT_BOOKING_REVIEW",
            resource_type="REVIEW",
            resource_id=review.id,
            user_id=user_id,
            details={
                "booking_id": booking.id,
                "car_id": booking.car_id,
                "rating": data.rating,
            },
        )

        return self._review_to_response(review)

    def get_customer_reviews(self, user_id: str) -> CustomerReviewsSummary:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise EntityNotFoundException("User", user_id)

        avg_rating, total_reviews, breakdown = self.review_repo.get_user_rating_stats(user_id)
        reviews = self.review_repo.list_by_user_id(user_id)

        review_responses = [self._review_to_response(r) for r in reviews]

        return CustomerReviewsSummary(
            user_id=user.id,
            user_name=user.name,
            email=user.email,
            phone=user.phone,
            average_rating=avg_rating,
            total_reviews=total_reviews,
            rating_breakdown=breakdown,
            reviews=review_responses,
        )

    def list_user_reviews(self, user_id: str) -> List[ReviewResponse]:
        reviews = self.review_repo.list_by_user_id(user_id)
        return [self._review_to_response(r) for r in reviews]

    def get_booking_review(self, booking_id: str, user_id: Optional[str] = None) -> Optional[ReviewResponse]:
        review = self.review_repo.get_by_booking_id(booking_id)
        if not review:
            return None
        if user_id and review.user_id != user_id:
            raise ForbiddenException("Access denied to review")
        return self._review_to_response(review)
