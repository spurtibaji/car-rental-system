import random
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.roadside import RoadsideRequest, RoadsideStatus, ETA_MAPPING
from app.repositories.roadside_repo import RoadsideRepository
from app.schemas.roadside import RoadsideCreateRequest, RoadsideUpdateRequest, RoadsideResponse
from app.core.exceptions import EntityNotFoundException


def roadside_to_schema(r: RoadsideRequest) -> RoadsideResponse:
    return RoadsideResponse(
        id=r.id,
        reference_id=r.reference_id,
        issue_type=r.issue_type,
        location=r.location,
        latitude=float(r.latitude) if r.latitude else None,
        longitude=float(r.longitude) if r.longitude else None,
        notes=r.notes,
        eta=r.eta,
        status=r.status,
        booking_id=r.booking_id,
        user_id=r.user_id,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


class RoadsideService:
    def __init__(self, db: Session):
        self.db = db
        self.roadside_repo = RoadsideRepository(db)

    def create_request(
        self, data: RoadsideCreateRequest, user_id: Optional[str] = None
    ) -> RoadsideResponse:
        ref_id = f"RA-{random.randint(100000, 999999)}"
        eta = ETA_MAPPING.get(data.issue_type, "25-35 min")

        req = RoadsideRequest(
            reference_id=ref_id,
            user_id=user_id,
            booking_id=data.booking_id,
            issue_type=data.issue_type,
            location=data.location,
            latitude=data.latitude,
            longitude=data.longitude,
            notes=data.notes,
            eta=eta,
            status=RoadsideStatus.REQUESTED,
        )
        self.roadside_repo.create(req)
        return roadside_to_schema(req)

    def get_request(self, request_id: str) -> RoadsideResponse:
        req = self.roadside_repo.get_by_id(request_id)
        if not req:
            req = self.roadside_repo.get_by_reference_id(request_id)
        if not req:
            raise EntityNotFoundException("RoadsideRequest", request_id)
        return roadside_to_schema(req)

    def list_requests(
        self,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[RoadsideResponse], int]:
        requests, total = self.roadside_repo.list_requests(
            user_id=user_id, status=status, skip=skip, limit=limit
        )
        return [roadside_to_schema(r) for r in requests], total

    def update_request(self, request_id: str, data: RoadsideUpdateRequest) -> RoadsideResponse:
        req = self.roadside_repo.get_by_id(request_id)
        if not req:
            req = self.roadside_repo.get_by_reference_id(request_id)
        if not req:
            raise EntityNotFoundException("RoadsideRequest", request_id)

        if data.status:
            req.status = data.status
        if data.notes:
            req.notes = data.notes
        if data.eta:
            req.eta = data.eta

        self.db.commit()
        return roadside_to_schema(req)
