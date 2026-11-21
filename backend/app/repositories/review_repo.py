from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.review import Review
from app.repositories.base import BaseRepository


class ReviewRepository(BaseRepository[Review]):
    def __init__(self, db: Session):
        super().__init__(Review, db)

    def get_by_booking_id(self, booking_id: str) -> Optional[Review]:
        return self.db.query(Review).filter(Review.booking_id == booking_id).first()

    def list_by_user_id(self, user_id: str) -> List[Review]:
        return (
            self.db.query(Review)
            .filter(Review.user_id == user_id)
            .order_by(Review.created_at.desc())
            .all()
        )

    def list_by_car_id(self, car_id: str) -> List[Review]:
        return (
            self.db.query(Review)
            .filter(Review.car_id == car_id)
            .order_by(Review.created_at.desc())
            .all()
        )

    def get_user_rating_stats(self, user_id: str) -> Tuple[Optional[float], int, Dict[str, int]]:
        reviews = self.list_by_user_id(user_id)
        total = len(reviews)
        if total == 0:
            return None, 0, {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}

        avg = round(sum(r.rating for r in reviews) / total, 1)
        breakdown = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        for r in reviews:
            star_key = str(min(5, max(1, r.rating)))
            breakdown[star_key] = breakdown.get(star_key, 0) + 1

        return avg, total, breakdown

    def get_car_rating_stats(self, car_id: str) -> Tuple[float, int]:
        reviews = self.list_by_car_id(car_id)
        total = len(reviews)
        if total == 0:
            return 0.0, 0
        avg = round(sum(r.rating for r in reviews) / total, 1)
        return avg, total
