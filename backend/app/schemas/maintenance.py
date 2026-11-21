from datetime import date
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class MaintenanceRecordCreate(BaseModel):
    car_id: str
    type: str = Field(..., pattern="^(scheduled|repair|damage)$")
    description: str = Field(..., min_length=3)
    cost: Decimal = Field(..., ge=0)
    date: date
    status: str = Field("pending", pattern="^(pending|in-progress|completed)$")


class MaintenanceRecordUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern="^(scheduled|repair|damage)$")
    description: Optional[str] = None
    cost: Optional[Decimal] = None
    date: Optional[date] = None
    status: Optional[str] = Field(None, pattern="^(pending|in-progress|completed)$")


class MaintenanceRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    carId: str = Field(validation_alias="car_id")
    carName: str = Field(validation_alias="car_name")
    type: str
    description: str
    cost: float
    date: date
    status: str
