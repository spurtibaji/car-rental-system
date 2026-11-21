from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, Field
from app.schemas.car import CarResponse


class TripPlannerRequest(BaseModel):
    destination: str = Field(..., min_length=2)
    passengers: int = Field(2, ge=1, le=12)
    days: int = Field(2, ge=1, le=30)
    purpose: Optional[str] = "Weekend Getaway"
    budget: Decimal = Field(Decimal("10000.00"), ge=500)
    need_driver: bool = False


class TripRecommendationItem(BaseModel):
    car: CarResponse
    rental_cost: float
    driver_cost: float
    fuel_cost: float
    total_estimated_cost: float
    is_best_match: bool = False
    match_reasons: List[str] = []


class TripPlannerResponse(BaseModel):
    destination: str
    distance_round_trip_km: int
    terrain: str
    days: int
    passengers: int
    purpose: str
    budget: float
    recommendations: List[TripRecommendationItem]
