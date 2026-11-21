from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class RoadsideCreateRequest(BaseModel):
    issue_type: str = Field(
        ...,
        pattern="^(breakdown|flat-tyre|accident|battery|fuel|locked|towing|other)$",
    )
    location: str = Field(..., min_length=3)
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    notes: Optional[str] = None
    booking_id: Optional[str] = None


class RoadsideUpdateRequest(BaseModel):
    status: Optional[str] = Field(
        None,
        pattern="^(requested|assigned|in_progress|resolved|cancelled)$",
    )
    notes: Optional[str] = None
    eta: Optional[str] = None


class RoadsideResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    reference_id: str
    issue_type: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None
    eta: str
    status: str
    booking_id: Optional[str] = None
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
