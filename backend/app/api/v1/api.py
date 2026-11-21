from fastapi import APIRouter
from app.api.v1 import (
    auth,
    cars,
    locations,
    offers,
    bookings,
    profile,
    wallet,
    trip_planner,
    roadside,
    admin,
    reviews,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(cars.router)
api_router.include_router(locations.router)
api_router.include_router(offers.router)
api_router.include_router(bookings.router)
api_router.include_router(profile.router)
api_router.include_router(wallet.router)
api_router.include_router(trip_planner.router)
api_router.include_router(roadside.router)
api_router.include_router(admin.router)
api_router.include_router(reviews.router)
