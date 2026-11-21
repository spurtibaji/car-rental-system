from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.roadside import RoadsideRequest
from app.repositories.base import BaseRepository


class RoadsideRepository(BaseRepository[RoadsideRequest]):
    def __init__(self, db: Session):
        super().__init__(RoadsideRequest, db)

    def get_by_reference_id(self, ref_id: str) -> Optional[RoadsideRequest]:
        return (
            self.db.query(RoadsideRequest)
            .filter(RoadsideRequest.reference_id == ref_id)
            .first()
        )

    def list_requests(
        self,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[RoadsideRequest], int]:
        query = self.db.query(RoadsideRequest)
        if user_id:
            query = query.filter(RoadsideRequest.user_id == user_id)
        if status:
            query = query.filter(RoadsideRequest.status == status)

        total = query.count()
        requests = query.order_by(desc(RoadsideRequest.created_at)).offset(skip).limit(limit).all()
        return requests, total
