from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.offer import Offer
from app.repositories.base import BaseRepository


class OfferRepository(BaseRepository[Offer]):
    def __init__(self, db: Session):
        super().__init__(Offer, db)

    def get_by_code(self, code: str) -> Optional[Offer]:
        return (
            self.db.query(Offer)
            .filter(func.upper(Offer.code) == code.strip().upper())
            .first()
        )

    def list_active(self) -> List[Offer]:
        today = date.today()
        return (
            self.db.query(Offer)
            .filter(Offer.is_active == True, Offer.valid_till >= today)
            .order_by(Offer.discount.desc())
            .all()
        )

    def increment_uses(self, offer_id: str) -> None:
        self.db.query(Offer).filter(Offer.id == offer_id).update(
            {"current_uses": Offer.current_uses + 1}
        )
        self.db.commit()
