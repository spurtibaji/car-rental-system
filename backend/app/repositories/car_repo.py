from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, asc
from app.models.car import Car, CarFeature
from app.models.booking import Booking, BookingStatus
from app.repositories.base import BaseRepository


class CarRepository(BaseRepository[Car]):
    def __init__(self, db: Session):
        super().__init__(Car, db)

    def get_with_details(self, car_id: str) -> Optional[Car]:
        return (
            self.db.query(Car)
            .options(joinedload(Car.features))
            .filter(Car.id == car_id)
            .first()
        )

    def get_for_update(self, car_id: str) -> Optional[Car]:
        """Lock car row for update to prevent concurrent booking conflicts."""
        return (
            self.db.query(Car)
            .filter(Car.id == car_id)
            .with_for_update()
            .first()
        )

    def list_cars(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
        fuel: Optional[List[str]] = None,
        brands: Optional[List[str]] = None,
        transmissions: Optional[List[str]] = None,
        min_seats: Optional[int] = None,
        available_only: Optional[bool] = None,
        max_price: Optional[float] = None,
        duration_type: str = "daily",
        sort_by: str = "popular",
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Car], int]:
        query = self.db.query(Car).options(joinedload(Car.features))

        # Search
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Car.name.ilike(s),
                    Car.brand.ilike(s),
                    Car.model.ilike(s),
                    Car.category.ilike(s),
                )
            )

        # Category
        if category and category.lower() != "all":
            query = query.filter(Car.category == category)

        # Fuel
        if fuel:
            query = query.filter(Car.fuel.in_(fuel))

        # Brand
        if brands:
            query = query.filter(Car.brand.in_(brands))

        # Transmission
        if transmissions:
            query = query.filter(Car.transmission.in_(transmissions))

        # Minimum seats
        if min_seats and min_seats > 0:
            query = query.filter(Car.seats >= min_seats)

        # Availability
        if available_only is not None and available_only:
            query = query.filter(Car.available == True)

        # Max price by duration type
        if max_price and max_price > 0:
            if duration_type == "hourly":
                query = query.filter(Car.hourly_price <= max_price)
            elif duration_type == "weekly":
                query = query.filter(Car.weekly_price <= max_price)
            else:
                query = query.filter(Car.daily_price <= max_price)

        total = query.distinct().count()

        # Sorting
        price_col = (
            Car.hourly_price
            if duration_type == "hourly"
            else (Car.weekly_price if duration_type == "weekly" else Car.daily_price)
        )

        if sort_by == "price-asc":
            query = query.order_by(asc(price_col))
        elif sort_by == "price-desc":
            query = query.order_by(desc(price_col))
        elif sort_by == "rating":
            query = query.order_by(desc(Car.rating), desc(Car.review_count))
        elif sort_by == "popular":
            query = query.order_by(desc(Car.popular), desc(Car.rating))
        else:
            query = query.order_by(desc(Car.created_at))

        cars = query.distinct().offset(skip).limit(limit).all()
        return cars, total

    def get_related_cars(self, car_id: str, category: str, limit: int = 3) -> List[Car]:
        return (
            self.db.query(Car)
            .options(joinedload(Car.features))
            .filter(Car.category == category, Car.id != car_id, Car.available == True)
            .order_by(desc(Car.rating))
            .limit(limit)
            .all()
        )

    def check_availability(
        self, car_id: str, pickup_date: date, return_date: date
    ) -> Tuple[bool, int]:
        """
        Check if car is available for the given date range.
        Two intervals [P1, R1] and [P2, R2] overlap if P1 <= R2 and R1 >= P2.
        """
        car = self.get_by_id(car_id)
        if not car or not car.available:
            return False, 0

        conflicting_bookings = (
            self.db.query(Booking)
            .filter(
                Booking.car_id == car_id,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE]),
                Booking.pickup_date <= return_date,
                Booking.return_date >= pickup_date,
            )
            .count()
        )

        return (conflicting_bookings == 0), conflicting_bookings
