from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.car import Car
from app.services.offer_service import OfferService, offer_to_schema
from app.schemas.offer import (
    OfferResponse,
    CouponValidateRequest,
    CouponValidateResponse,
)
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/offers", tags=["Offers"])


@router.get("", response_model=ApiResponse[List[OfferResponse]])
def list_offers(db: Session = Depends(get_db)):
    """List active promotional offers and coupon discounts."""
    offer_service = OfferService(db)
    offers = offer_service.list_offers()
    return ApiResponse(
        message="Active offers retrieved successfully",
        data=offers,
    )


@router.post("/validate", response_model=ApiResponse[CouponValidateResponse])
def validate_coupon(data: CouponValidateRequest, db: Session = Depends(get_db)):
    """Validate a coupon code and return recalculated discount amount."""
    offer_service = OfferService(db)
    car = db.query(Car).filter(Car.id == data.car_id).first() if data.car_id else None

    is_valid, discount_amount, message, offer = offer_service.validate_coupon(
        code=data.code,
        amount=data.amount,
        car=car,
    )

    final_amount = float(max(0, data.amount - discount_amount))
    resp = CouponValidateResponse(
        valid=is_valid,
        discount_amount=float(discount_amount),
        final_amount=final_amount,
        message=message,
        offer=offer_to_schema(offer) if offer else None,
    )
    return ApiResponse(
        message=message,
        data=resp,
    )
