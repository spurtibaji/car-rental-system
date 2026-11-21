from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.offer import Offer
from app.models.car import Car
from app.repositories.offer_repo import OfferRepository
from app.schemas.offer import OfferResponse, CouponValidateResponse
from app.core.exceptions import InvalidCouponException


def offer_to_schema(o: Offer) -> OfferResponse:
    return OfferResponse(
        id=o.id,
        code=o.code,
        title=o.title,
        description=o.description,
        discount=float(o.discount),
        type=o.type,
        minAmount=float(o.min_amount),
        validTill=o.valid_till,
        category=o.category,
        color=o.color,
    )


class OfferService:
    def __init__(self, db: Session):
        self.db = db
        self.offer_repo = OfferRepository(db)

    def list_offers(self) -> List[OfferResponse]:
        offers = self.offer_repo.list_active()
        return [offer_to_schema(o) for o in offers]

    def validate_coupon(
        self,
        code: str,
        amount: Decimal,
        car: Optional[Car] = None,
    ) -> Tuple[bool, Decimal, str, Optional[Offer]]:
        """
        Validate a coupon code against an amount and optional car.
        Returns: (is_valid, discount_amount, message, offer_model)
        """
        if not code:
            return False, Decimal("0.00"), "No coupon code provided", None

        offer = self.offer_repo.get_by_code(code)
        if not offer or not offer.is_active:
            return False, Decimal("0.00"), "Invalid or expired coupon code", None

        today = date.today()
        if offer.valid_till < today:
            return False, Decimal("0.00"), f"Coupon code {offer.code} has expired", None

        if offer.current_uses >= offer.max_uses:
            return False, Decimal("0.00"), "Coupon usage limit has been reached", None

        if amount < offer.min_amount:
            return (
                False,
                Decimal("0.00"),
                f"Minimum booking amount ₹{float(offer.min_amount):,.0f} required for this coupon",
                None,
            )

        if offer.category and car:
            if car.category.lower() != offer.category.lower():
                return (
                    False,
                    Decimal("0.00"),
                    f"This coupon is only valid for {offer.category} category cars",
                    None,
                )

        # Calculate discount
        if offer.type == "percent":
            discount = round(amount * (offer.discount / Decimal("100.0")), 2)
        else:
            discount = min(offer.discount, amount)

        return True, discount, f"Coupon {offer.code} applied successfully", offer
