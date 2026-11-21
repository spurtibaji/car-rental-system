from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict, Field


class ReviewCreateRequest(BaseModel):
    booking_id: str = Field(..., description="ID of the completed booking being reviewed")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    comment: str = Field(..., min_length=2, max_length=2000, description="Customer feedback / review text")


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    car_id: str
    car_name: Optional[str] = None
    car_image: Optional[str] = None
    user_id: str
    user_name: Optional[str] = None
    booking_id: Optional[str] = None
    rating: int
    comment: str
    created_at: datetime


class CustomerReviewsSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    user_id: str
    user_name: str
    email: str
    phone: Optional[str] = None
    average_rating: Optional[float] = None
    total_reviews: int = 0
    rating_breakdown: Optional[Dict[str, int]] = None
    reviews: List[ReviewResponse] = []
