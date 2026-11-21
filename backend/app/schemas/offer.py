from datetime import date
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class OfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    code: str
    title: str
    description: str
    discount: float
    type: str
    minAmount: float = Field(validation_alias="min_amount")
    validTill: date = Field(validation_alias="valid_till")
    category: Optional[str] = None
    color: str


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    car_id: Optional[str] = None
    amount: Decimal = Field(..., ge=0)


class CouponValidateResponse(BaseModel):
    valid: bool
    discount_amount: float
    final_amount: float
    message: str
    offer: Optional[OfferResponse] = None
