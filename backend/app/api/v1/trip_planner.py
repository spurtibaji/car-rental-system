from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.trip_planner_service import TripPlannerService
from app.schemas.trip_planner import TripPlannerRequest, TripPlannerResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/trip-planner", tags=["Trip Planner"])


@router.post("/recommendations", response_model=ApiResponse[TripPlannerResponse])
def get_trip_recommendations(data: TripPlannerRequest, db: Session = Depends(get_db)):
    """Generate smart car recommendations, fuel estimations, and total journey budgets."""
    planner_service = TripPlannerService(db)
    result = planner_service.plan_trip(data)
    return ApiResponse(
        message="Trip recommendations generated successfully",
        data=result,
    )
