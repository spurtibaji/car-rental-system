from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, RefreshToken, UserRole
from app.models.booking import Booking, BookingStatus
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(func.lower(User.email) == func.lower(email.strip())).first()

    def list_customers(self, skip: int = 0, limit: int = 50) -> List[Tuple[User, int, float, Optional[float], int]]:
        """
        List all customers with total bookings, total spent, average rating, and review count.
        Returns list of (User, total_bookings, total_spent, average_rating, total_reviews)
        """
        # Query users with customer role
        users = (
            self.db.query(User)
            .filter(User.role == UserRole.CUSTOMER)
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        results = []
        for user in users:
            # Calculate total bookings and total spent from non-cancelled bookings
            valid_bookings = [b for b in user.bookings if b.status != BookingStatus.CANCELLED]
            total_bookings = len(user.bookings)
            total_spent = sum(float(b.final_amount) for b in valid_bookings)

            user_reviews = user.reviews or []
            total_reviews = len(user_reviews)
            avg_rating = round(sum(r.rating for r in user_reviews) / total_reviews, 1) if total_reviews > 0 else None

            results.append((user, total_bookings, total_spent, avg_rating, total_reviews))

        return results

    def count_customers(self) -> int:
        return self.db.query(User).filter(User.role == UserRole.CUSTOMER).count()

    def count_pending_kyc(self) -> int:
        return self.db.query(User).filter(User.kyc_status == "pending").count()

    def create_refresh_token(self, refresh_token_obj: RefreshToken) -> RefreshToken:
        self.db.add(refresh_token_obj)
        self.db.commit()
        self.db.refresh(refresh_token_obj)
        return refresh_token_obj

    def get_refresh_token(self, token: str) -> Optional[RefreshToken]:
        return (
            self.db.query(RefreshToken)
            .filter(RefreshToken.token == token, RefreshToken.revoked == False)
            .first()
        )

    def revoke_user_tokens(self, user_id: str) -> None:
        self.db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"revoked": True})
        self.db.commit()
