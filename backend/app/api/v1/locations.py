from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.location import Location
from app.schemas.location import LocationResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=ApiResponse[List[str]])
def list_locations(db: Session = Depends(get_db)):
    """List all available pickup and drop locations."""
    locations = (
        db.query(Location)
        .filter(Location.is_active == True)
        .order_by(Location.city, Location.name)
        .all()
    )
    location_names = [loc.name for loc in locations]
    return ApiResponse(
        message="Locations retrieved successfully",
        data=location_names,
    )
