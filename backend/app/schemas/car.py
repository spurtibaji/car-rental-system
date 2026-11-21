import re
from datetime import date, time
from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, field_validator


class CarPrice(BaseModel):
    hourly: float
    daily: float
    weekly: float


class CarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    brand: str
    model: str
    year: int
    category: str
    price: CarPrice
    seats: int
    fuel: str
    transmission: str
    mileage: float
    image: str
    images: List[str] = []
    available: bool
    rating: float
    reviews: int = Field(validation_alias="review_count")
    features: List[str] = []
    color: str
    engineCC: int = Field(validation_alias="engine_cc")
    topSpeed: int = Field(validation_alias="top_speed")
    deposit: float = Field(validation_alias="security_deposit")
    popular: bool


class CarCreateRequest(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=2, max_length=100)
    brand: str = Field(..., min_length=2, max_length=50)
    model: Optional[str] = None
    year: int = Field(..., ge=2000, le=2030)
    category: str = Field(..., validation_alias=AliasChoices("category", "type"))
    hourly_price: Decimal = Field(..., gt=0, validation_alias=AliasChoices("hourly_price", "price_hourly"))
    daily_price: Decimal = Field(..., gt=0, validation_alias=AliasChoices("daily_price", "price_daily"))
    weekly_price: Decimal = Field(..., gt=0, validation_alias=AliasChoices("weekly_price", "price_weekly"))
    seats: int = Field(..., ge=2, le=12)
    fuel: str = Field(..., pattern="^(Petrol|Diesel|Electric|Hybrid)$")
    transmission: str = Field(..., pattern="^(Manual|Automatic)$")
    mileage: Decimal = Field(..., ge=0)
    image: str
    images: Optional[List[str]] = []
    available: bool = True
    color: str = "White"
    engine_cc: int = 0
    top_speed: int = 0
    security_deposit: Decimal = Field(default=Decimal("5000.00"), ge=0)
    popular: bool = False
    features: Optional[List[str]] = []

    @field_validator("category", mode="before")
    @classmethod
    def normalize_category(cls, v):
        if not v:
            return "SUV"
        mapping = {
            "suv": "SUV",
            "sedan": "Sedan",
            "hatchback": "Hatchback",
            "luxury": "Luxury",
            "electric": "Electric",
            "sport": "Luxury",
            "7-seater": "7-Seater",
            "7 seater": "7-Seater",
        }
        val = str(v).strip().lower()
        if val in mapping:
            return mapping[val]
        return str(v).strip().title()

    @field_validator("mileage", mode="before")
    @classmethod
    def normalize_mileage(cls, v):
        if isinstance(v, (int, float, Decimal)):
            return v
        if isinstance(v, str):
            m = re.search(r"[-+]?\d*\.?\d+", v)
            if m:
                return Decimal(m.group(0))
        return Decimal("15.0")


class CarUpdateRequest(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    category: Optional[str] = Field(None, validation_alias=AliasChoices("category", "type"))
    hourly_price: Optional[Decimal] = Field(None, validation_alias=AliasChoices("hourly_price", "price_hourly"))
    daily_price: Optional[Decimal] = Field(None, validation_alias=AliasChoices("daily_price", "price_daily"))
    weekly_price: Optional[Decimal] = Field(None, validation_alias=AliasChoices("weekly_price", "price_weekly"))
    seats: Optional[int] = None
    fuel: Optional[str] = None
    transmission: Optional[str] = None
    mileage: Optional[Decimal] = None
    image: Optional[str] = None
    images: Optional[List[str]] = None
    available: Optional[bool] = None
    color: Optional[str] = None
    engine_cc: Optional[int] = None
    top_speed: Optional[int] = None
    security_deposit: Optional[Decimal] = None
    popular: Optional[bool] = None
    features: Optional[List[str]] = None

    @field_validator("category", mode="before")
    @classmethod
    def normalize_category(cls, v):
        if v is None:
            return None
        mapping = {
            "suv": "SUV",
            "sedan": "Sedan",
            "hatchback": "Hatchback",
            "luxury": "Luxury",
            "electric": "Electric",
            "sport": "Luxury",
            "7-seater": "7-Seater",
            "7 seater": "7-Seater",
        }
        val = str(v).strip().lower()
        if val in mapping:
            return mapping[val]
        return str(v).strip().title()

    @field_validator("mileage", mode="before")
    @classmethod
    def normalize_mileage(cls, v):
        if v is None:
            return None
        if isinstance(v, (int, float, Decimal)):
            return v
        if isinstance(v, str):
            m = re.search(r"[-+]?\d*\.?\d+", v)
            if m:
                return Decimal(m.group(0))
        return Decimal("15.0")


class AvailabilityCheckResponse(BaseModel):
    car_id: str
    is_available: bool
    pickup_date: date
    return_date: date
    conflicting_bookings_count: int
    message: str
