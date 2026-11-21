from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.car_service import CarService
from app.schemas.car import (
    CarResponse,
    AvailabilityCheckResponse,
)
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedMeta

router = APIRouter(prefix="/cars", tags=["Cars"])


@router.get("", response_model=PaginatedResponse[CarResponse])
def list_cars(
    search: Optional[str] = Query(None, description="Search by name, brand, model, category"),
    category: Optional[str] = Query(None, description="Filter by category (e.g. SUV, Sedan)"),
    fuel: Optional[List[str]] = Query(None, description="Filter by fuel types"),
    brand: Optional[List[str]] = Query(None, description="Filter by brands"),
    transmission: Optional[List[str]] = Query(None, description="Filter by transmission (Manual/Automatic)"),
    min_seats: Optional[int] = Query(None, ge=1, description="Minimum number of seats"),
    available_only: Optional[bool] = Query(None, description="Only show available cars"),
    max_price: Optional[float] = Query(None, ge=0, description="Max price for chosen duration"),
    duration_type: str = Query("daily", pattern="^(hourly|daily|weekly)$"),
    sort_by: str = Query("popular", pattern="^(popular|price-asc|price-desc|rating)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Search and filter fleet cars with hourly, daily, and weekly pricing."""
    car_service = CarService(db)
    skip = (page - 1) * page_size
    cars, total = car_service.list_cars(
        search=search,
        category=category,
        fuel=fuel,
        brands=brand,
        transmissions=transmission,
        min_seats=min_seats,
        available_only=available_only,
        max_price=max_price,
        duration_type=duration_type,
        sort_by=sort_by,
        skip=skip,
        limit=page_size,
    )
    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedResponse(
        message="Cars retrieved successfully",
        data=cars,
        meta=PaginatedMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.get("/{car_id}", response_model=ApiResponse[CarResponse])
def get_car(car_id: str, db: Session = Depends(get_db)):
    """Get complete car details including features, multiple images, and specs."""
    car_service = CarService(db)
    car = car_service.get_car_by_id(car_id)
    return ApiResponse(
        message="Car details retrieved successfully",
        data=car,
    )


@router.get("/{car_id}/availability", response_model=ApiResponse[AvailabilityCheckResponse])
def check_car_availability(
    car_id: str,
    pickup_date: date = Query(..., description="Pickup date (YYYY-MM-DD)"),
    return_date: date = Query(..., description="Return date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """Check whether a car is available for a requested date interval."""
    car_service = CarService(db)
    availability = car_service.check_availability(
        car_id=car_id, pickup_date=pickup_date, return_date=return_date
    )
    return ApiResponse(
        message=availability.message,
        data=availability,
    )


@router.get("/{car_id}/related", response_model=ApiResponse[List[CarResponse]])
def get_related_cars(car_id: str, limit: int = Query(3, ge=1, le=10), db: Session = Depends(get_db)):
    """Get similar cars in the same category."""
    car_service = CarService(db)
    related = car_service.get_related_cars(car_id=car_id, limit=limit)
    return ApiResponse(
        message="Related cars retrieved successfully",
        data=related,
    )
