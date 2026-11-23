from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.car import Car
from app.repositories.car_repo import CarRepository
from app.services.car_service import car_to_schema
from app.schemas.trip_planner import (
    TripPlannerRequest,
    TripRecommendationItem,
    TripPlannerResponse,
)

DESTINATIONS: Dict[str, Dict[str, any]] = {
    "Lonavala": {"distance": 65, "terrain": "Hills"},
    "Mahabaleshwar": {"distance": 120, "terrain": "Hills"},
    "Alibaug": {"distance": 95, "terrain": "Coastal"},
    "Nashik": {"distance": 160, "terrain": "City"},
    "Aurangabad": {"distance": 230, "terrain": "Heritage"},
    "Kolhapur": {"distance": 380, "terrain": "City"},
    "Goa": {"distance": 580, "terrain": "Coastal"},
    "Shirdi": {"distance": 185, "terrain": "Pilgrimage"},
}

FUEL_PRICE_PER_LITRE = 105.0
EV_COST_PER_KWH = 8.0
EV_KM_PER_KWH = 6.0


class TripPlannerService:
    def __init__(self, db: Session):
        self.db = db
        self.car_repo = CarRepository(db)

    def plan_trip(self, data: TripPlannerRequest) -> TripPlannerResponse:
        dest_info = DESTINATIONS.get(data.destination.strip())
        if dest_info:
            distance = dest_info["distance"]
            terrain = dest_info["terrain"]
        else:
            distance = 150
            terrain = "Mixed"

        round_trip_km = distance * 2

        # Fetch available cars
        cars = self.db.query(Car).filter(Car.available == True).all()

        # Passenger filter
        if data.passengers > 5:
            cars = [c for c in cars if c.seats >= 7]
        elif data.passengers > 4:
            cars = [c for c in cars if c.seats >= 5]

        # Budget filter
        budget_float = float(data.budget)
        budget_filtered = [
            c for c in cars if (float(c.daily_price) * data.days) <= budget_float
        ]
        if budget_filtered:
            cars = budget_filtered

        # Scoring logic based on purpose and terrain
        def score_car(car: Car) -> Tuple[int, List[str]]:
            score = int(float(car.rating) * 10)
            reasons = []

            # Terrain matching
            if terrain == "Hills":
                if car.category in ["SUV", "7-Seater"]:
                    score += 25
                    reasons.append("High ground clearance ideal for hills")
                if car.transmission == "Automatic":
                    score += 10
                    reasons.append("Automatic transmission for effortless hill climbs")
            elif terrain == "Coastal":
                if car.category in ["Hatchback", "Sedan"]:
                    score += 15
                    reasons.append("Nimble handling for scenic coastal roads")
                elif car.fuel == "Electric":
                    score += 15
                    reasons.append("Quiet eco-friendly drive for coastal getaways")

            # Purpose matching
            purpose = data.purpose or "General"
            if purpose == "Family Trip":
                if car.seats >= 7:
                    score += 20
                    reasons.append("Spacious 7-seater for maximum family comfort")
                elif car.seats >= 5:
                    score += 10
                    reasons.append("Comfortable seating with ample luggage capacity")
            elif purpose == "Business":
                if car.category in ["Luxury", "Sedan"]:
                    score += 25
                    reasons.append("Executive styling and premium cabin experience")
            elif purpose == "Adventure":
                if car.category in ["SUV", "7-Seater"]:
                    score += 25
                    reasons.append("Rugged build engineered for adventure trails")
            elif purpose == "Weekend Getaway":
                if car.popular:
                    score += 15
                    reasons.append("Highly popular choice for quick weekend escapes")

            if not reasons:
                reasons.append("Reliable and comfortable ride")

            return score, reasons

        scored_cars = []
        for c in cars:
            score, reasons = score_car(c)
            scored_cars.append((score, c, reasons))

        # Sort by score descending
        scored_cars.sort(key=lambda x: x[0], reverse=True)

        recommendations: List[TripRecommendationItem] = []
        for idx, (_, car, reasons) in enumerate(scored_cars[:4]):
            rental_cost = float(car.daily_price) * data.days
            driver_cost = (800.0 * data.days) if data.need_driver else 0.0

            # Fuel calculation
            if car.fuel == "Electric":
                fuel_cost = round((round_trip_km / EV_KM_PER_KWH) * EV_COST_PER_KWH)
            else:
                mileage = float(car.mileage) if car.mileage > 0 else 15.0
                fuel_cost = round((round_trip_km / mileage) * FUEL_PRICE_PER_LITRE)

            total_cost = rental_cost + driver_cost + fuel_cost

            recommendations.append(
                TripRecommendationItem(
                    car=car_to_schema(car),
                    rental_cost=rental_cost,
                    driver_cost=driver_cost,
                    fuel_cost=fuel_cost,
                    total_estimated_cost=total_cost,
                    is_best_match=(idx == 0),
                    match_reasons=reasons,
                )
            )

        return TripPlannerResponse(
            destination=data.destination,
            distance_round_trip_km=round_trip_km,
            terrain=terrain,
            days=data.days,
            passengers=data.passengers,
            purpose=data.purpose or "Weekend Getaway",
            budget=budget_float,
            recommendations=recommendations,
        )
