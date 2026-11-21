from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_optional_current_user, get_current_user
from app.models.user import User, UserRole
from app.services.roadside_service import RoadsideService
from app.schemas.roadside import (
    RoadsideCreateRequest,
    RoadsideUpdateRequest,
    RoadsideResponse,
)
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedMeta

router = APIRouter(prefix="/roadside", tags=["Roadside Assistance"])


@router.post("/requests", response_model=ApiResponse[RoadsideResponse], status_code=status.HTTP_201_CREATED)
def create_roadside_request(
    data: RoadsideCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Submit an urgent roadside emergency assistance request."""
    roadside_service = RoadsideService(db)
    user_id = current_user.id if current_user else None
    req = roadside_service.create_request(data=data, user_id=user_id)
    return ApiResponse(
        message="Emergency assistance requested. Help is on the way!",
        data=req,
    )


@router.get("/requests", response_model=PaginatedResponse[RoadsideResponse])
def list_roadside_requests(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """List roadside assistance requests for the current user or all requests if admin."""
    roadside_service = RoadsideService(db)
    skip = (page - 1) * page_size

    # Non-admins only see their own requests
    filter_user_id = None
    if current_user and current_user.role != UserRole.ADMIN:
        filter_user_id = current_user.id

    requests, total = roadside_service.list_requests(
        user_id=filter_user_id, status=status, skip=skip, limit=page_size
    )
    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedResponse(
        message="Roadside requests retrieved successfully",
        data=requests,
        meta=PaginatedMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.get("/requests/{request_id}", response_model=ApiResponse[RoadsideResponse])
def get_roadside_request(request_id: str, db: Session = Depends(get_db)):
    """Get assistance request details by ID or reference ID."""
    roadside_service = RoadsideService(db)
    req = roadside_service.get_request(request_id)
    return ApiResponse(
        message="Assistance request retrieved successfully",
        data=req,
    )


@router.patch("/requests/{request_id}", response_model=ApiResponse[RoadsideResponse])
def update_roadside_request(
    request_id: str,
    data: RoadsideUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update status, ETA, or notes for a roadside request."""
    roadside_service = RoadsideService(db)
    updated = roadside_service.update_request(request_id=request_id, data=data)
    return ApiResponse(
        message="Roadside request updated successfully",
        data=updated,
    )
