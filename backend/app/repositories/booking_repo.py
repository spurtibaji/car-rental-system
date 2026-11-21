from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from app.models.booking import Booking, BookingPriceBreakdown, BookingStatus
from app.repositories.base import BaseRepository


class BookingRepository(BaseRepository[Booking]):
    def __init__(self, db: Session):
        super().__init__(Booking, db)

    def get_with_details(self, booking_id: str) -> Optional[Booking]:
        return (
            self.db.query(Booking)
            .options(
                joinedload(Booking.car),
                joinedload(Booking.price_breakdown),
                joinedload(Booking.user),
            )
            .filter(Booking.id == booking_id)
            .first()
        )

    def list_by_user(self, user_id: str, skip: int = 0, limit: int = 50) -> List[Booking]:
        return (
            self.db.query(Booking)
            .options(joinedload(Booking.car), joinedload(Booking.price_breakdown))
            .filter(Booking.user_id == user_id)
            .order_by(desc(Booking.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def list_all(
        self,
        status: Optional[str] = None,
        car_id: Optional[str] = None,
        user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Booking], int]:
        query = self.db.query(Booking).options(
            joinedload(Booking.car),
            joinedload(Booking.price_breakdown),
            joinedload(Booking.user),
        )

        if status:
            query = query.filter(Booking.status == status)
        if car_id:
            query = query.filter(Booking.car_id == car_id)
        if user_id:
            query = query.filter(Booking.user_id == user_id)

        total = query.count()
        bookings = query.order_by(desc(Booking.created_at)).offset(skip).limit(limit).all()
        return bookings, total

    def find_conflicts(
        self,
        car_id: str,
        pickup_date: date,
        return_date: date,
        for_update: bool = False,
    ) -> List[Booking]:
        """Find any overlapping bookings in confirmed or active state."""
        query = self.db.query(Booking).filter(
            Booking.car_id == car_id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE]),
            Booking.pickup_date <= return_date,
            Booking.return_date >= pickup_date,
        )
        if for_update:
            query = query.with_for_update()
        return query.all()

    def get_revenue_stats(self) -> Tuple[float, float, int]:
        """
        Calculate:
        1. total_revenue: sum of completed/confirmed/active bookings
        2. active_bookings: count of confirmed or active bookings
        """
        valid_statuses = [BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.COMPLETED]

        total_rev = (
            self.db.query(func.coalesce(func.sum(Booking.final_amount), 0))
            .filter(Booking.status.in_(valid_statuses))
            .scalar()
        )

        active_count = (
            self.db.query(func.count(Booking.id))
            .filter(Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE]))
            .scalar()
        )

        return float(total_rev), active_count
