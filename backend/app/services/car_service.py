from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple
import uuid
from sqlalchemy.orm import Session
from app.models.car import Car, CarFeature
from app.repositories.car_repo import CarRepository
from app.schemas.car import (
    CarPrice,
    CarResponse,
    CarCreateRequest,
    CarUpdateRequest,
    AvailabilityCheckResponse,
)
from app.models.booking import Booking, BookingStatus
from app.core.exceptions import EntityNotFoundException, AppException


def car_to_schema(car: Car) -> CarResponse:
    """Helper to convert Car model into frontend-compatible CarResponse schema."""
    image_list = [car.image] if car.image else []
    feature_list = [f.feature for f in car.features] if car.features else []

    return CarResponse(
        id=car.id,
        name=car.name,
        brand=car.brand,
        model=car.model,
        year=car.year,
        category=car.category,
        price=CarPrice(
            hourly=float(car.hourly_price),
            daily=float(car.daily_price),
            weekly=float(car.weekly_price),
        ),
        seats=car.seats,
        fuel=car.fuel,
        transmission=car.transmission,
        mileage=float(car.mileage),
        image=car.image,
        images=image_list,
        available=car.available,
        rating=float(car.rating),
        review_count=car.review_count,
        features=feature_list,
        color=car.color,
        engine_cc=car.engine_cc,
        top_speed=car.top_speed,
        security_deposit=float(car.security_deposit),
        popular=car.popular,
    )


class CarService:
    def __init__(self, db: Session):
        self.db = db
        self.car_repo = CarRepository(db)

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
    ) -> Tuple[List[CarResponse], int]:
        cars, total = self.car_repo.list_cars(
            search=search,
            category=category,
            fuel=fuel,
            brands=brands,
            transmissions=transmissions,
            min_seats=min_seats,
            available_only=available_only,
            max_price=max_price,
            duration_type=duration_type,
            sort_by=sort_by,
            skip=skip,
            limit=limit,
        )
        return [car_to_schema(c) for c in cars], total

    def get_car_by_id(self, car_id: str) -> CarResponse:
        car = self.car_repo.get_with_details(car_id)
        if not car:
            raise EntityNotFoundException("Car", car_id)
        return car_to_schema(car)

    def get_related_cars(self, car_id: str, limit: int = 3) -> List[CarResponse]:
        car = self.car_repo.get_by_id(car_id)
        if not car:
            raise EntityNotFoundException("Car", car_id)
        related = self.car_repo.get_related_cars(car_id=car_id, category=car.category, limit=limit)
        return [car_to_schema(c) for c in related]

    def check_availability(
        self, car_id: str, pickup_date: date, return_date: date
    ) -> AvailabilityCheckResponse:
        if return_date < pickup_date:
            raise AppException("Return date cannot be before pickup date", status_code=400)

        car = self.car_repo.get_by_id(car_id)
        if not car:
            raise EntityNotFoundException("Car", car_id)

        is_avail, conflict_count = self.car_repo.check_availability(
            car_id=car_id, pickup_date=pickup_date, return_date=return_date
        )

        message = (
            "Car is available for selected dates"
            if is_avail
            else f"Car is unavailable for the selected dates ({conflict_count} conflicting booking(s))"
        )

        return AvailabilityCheckResponse(
            car_id=car_id,
            is_available=is_avail,
            pickup_date=pickup_date,
            return_date=return_date,
            conflicting_bookings_count=conflict_count,
            message=message,
        )

    def create_car(self, data: CarCreateRequest) -> CarResponse:
        car_id = data.id or f"{data.name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:4]}"
        existing = self.car_repo.get_by_id(car_id)
        if existing:
            car_id = f"{car_id}-{uuid.uuid4().hex[:4]}"

        car = Car(
            id=car_id,
            name=data.name,
            brand=data.brand,
            model=data.model or data.name,
            year=data.year,
            category=data.category,
            hourly_price=data.hourly_price,
            daily_price=data.daily_price,
            weekly_price=data.weekly_price,
            seats=data.seats,
            fuel=data.fuel,
            transmission=data.transmission,
            mileage=data.mileage,
            image=data.image,
            available=data.available,
            color=data.color,
            engine_cc=data.engine_cc,
            top_speed=data.top_speed,
            security_deposit=data.security_deposit,
            popular=data.popular,
        )
        self.db.add(car)
        self.db.flush()

        # Add features
        if data.features:
            for feat in data.features:
                self.db.add(CarFeature(car_id=car.id, feature=feat))

        self.db.commit()
        return self.get_car_by_id(car.id)

    def update_car(self, car_id: str, data: CarUpdateRequest) -> CarResponse:
        car = self.car_repo.get_by_id(car_id)
        if not car:
            raise EntityNotFoundException("Car", car_id)

        update_dict = data.model_dump(exclude_unset=True)
        update_dict.pop("images", None)
        features = update_dict.pop("features", None)

        for key, value in update_dict.items():
            setattr(car, key, value)

        if features is not None:
            self.db.query(CarFeature).filter(CarFeature.car_id == car.id).delete()
            for feat in features:
                self.db.add(CarFeature(car_id=car.id, feature=feat))

        self.db.commit()
        return self.get_car_by_id(car.id)

    def delete_car(self, car_id: str) -> None:
        car = self.car_repo.get_by_id(car_id)
        if not car:
            raise EntityNotFoundException("Car", car_id)

        # Check for active or upcoming bookings
        active_bookings = (
            self.db.query(Booking)
            .filter(
                Booking.car_id == car_id,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE]),
            )
            .count()
        )
        if active_bookings > 0:
            raise AppException(
                f"Cannot delete vehicle '{car.name}': It has {active_bookings} active or upcoming booking(s). Please complete or cancel them first, or set availability to 'Unavailable'.",
                status_code=400,
            )

        self.car_repo.delete(car)

    def toggle_availability(self, car_id: str, available: Optional[bool] = None) -> CarResponse:
        car = self.car_repo.get_by_id(car_id)
        if not car:
            raise EntityNotFoundException("Car", car_id)

        if available is not None:
            car.available = available
        else:
            car.available = not car.available

        self.db.commit()
        return self.get_car_by_id(car.id)
