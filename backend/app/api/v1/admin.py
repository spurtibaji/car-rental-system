from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_admin
from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.models.kyc import KYCDocument
from app.services.admin_service import AdminService
from app.services.car_service import CarService
from app.services.booking_service import BookingService
from app.schemas.admin import (
    AdminDashboardResponse,
    CustomerResponse,
    CustomerStatusUpdate,
    KYCReviewRequest,
    BookingStatusUpdate,
    CarAvailabilityToggle,
    RevenueBreakdownResponse,
    AdminBookingResponse,
)
from app.schemas.review import CustomerReviewsSummary
from app.schemas.car import (
    CarResponse,
    CarCreateRequest,
    CarUpdateRequest,
)
from app.schemas.booking import BookingResponse
from app.schemas.maintenance import (
    MaintenanceRecordCreate,
    MaintenanceRecordUpdate,
    MaintenanceRecordResponse,
)
from app.schemas.user import KYCDocumentResponse, UserResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedMeta

router = APIRouter(prefix="/admin", tags=["Admin Panel"], dependencies=[Depends(get_current_admin)])


@router.get("/dashboard", response_model=ApiResponse[AdminDashboardResponse])
def get_admin_dashboard(db: Session = Depends(get_db)):
    """Fetch complete admin dashboard statistics, metrics, and monthly revenue data."""
    admin_service = AdminService(db)
    dashboard = admin_service.get_dashboard()
    return ApiResponse(
        message="Admin dashboard retrieved successfully",
        data=dashboard,
    )


# Cars Management
@router.get("/cars", response_model=ApiResponse[List[CarResponse]])
def get_admin_cars(db: Session = Depends(get_db)):
    """List all cars in the fleet for admin inventory management."""
    car_service = CarService(db)
    cars, _ = car_service.list_cars(limit=100)
    return ApiResponse(
        message="Fleet cars retrieved successfully",
        data=cars,
    )


@router.post("/cars", response_model=ApiResponse[CarResponse], status_code=status.HTTP_201_CREATED)
def create_car(data: CarCreateRequest, db: Session = Depends(get_db)):
    """Add a new car to the fleet."""
    car_service = CarService(db)
    new_car = car_service.create_car(data)
    return ApiResponse(
        message="Car added to fleet successfully",
        data=new_car,
    )


@router.patch("/cars/{car_id}", response_model=ApiResponse[CarResponse])
def update_car(car_id: str, data: CarUpdateRequest, db: Session = Depends(get_db)):
    """Update car details, pricing, features, or images."""
    car_service = CarService(db)
    updated = car_service.update_car(car_id=car_id, data=data)
    return ApiResponse(
        message="Car updated successfully",
        data=updated,
    )


@router.delete("/cars/{car_id}", response_model=ApiResponse[dict])
def delete_car(car_id: str, db: Session = Depends(get_db)):
    """Remove a car from the fleet."""
    car_service = CarService(db)
    car_service.delete_car(car_id)
    return ApiResponse(
        message="Car removed from fleet successfully",
        data={},
    )


@router.patch("/cars/{car_id}/availability", response_model=ApiResponse[CarResponse])
def toggle_car_availability(
    car_id: str,
    data: Optional[CarAvailabilityToggle] = None,
    db: Session = Depends(get_db),
):
    """Toggle car availability (available / booked)."""
    car_service = CarService(db)
    avail_val = data.available if data else None
    toggled = car_service.toggle_availability(car_id, available=avail_val)
    return ApiResponse(
        message=f"Car availability updated to {toggled.available}",
        data=toggled,
    )


# Bookings Management
@router.get("/bookings", response_model=PaginatedResponse[AdminBookingResponse])
def list_admin_bookings(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    limit: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """List and manage all customer bookings."""
    booking_service = BookingService(db)
    actual_size = limit if (limit is not None and 1 <= limit <= 100) else page_size
    skip = (page - 1) * actual_size
    bookings, total = booking_service.list_admin_bookings(status=status, skip=skip, limit=actual_size)
    total_pages = max(1, (total + actual_size - 1) // actual_size)
    return PaginatedResponse(
        message="Bookings retrieved successfully",
        data=bookings,
        meta=PaginatedMeta(
            total=total,
            page=page,
            page_size=actual_size,
            total_pages=total_pages,
        ),
    )


@router.patch("/bookings/{booking_id}/status", response_model=ApiResponse[AdminBookingResponse])
def update_booking_status(
    booking_id: str,
    data: BookingStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update status for a booking."""
    admin_service = AdminService(db)
    booking_service = BookingService(db)
    admin_service.update_booking_status(booking_id, data.status, admin_id=admin_user.id)
    updated = booking_service.get_admin_booking_by_id(booking_id)
    return ApiResponse(
        message=f"Booking status updated to {data.status}",
        data=updated,
    )


@router.delete("/bookings/{booking_id}", response_model=ApiResponse[dict])
def delete_admin_booking(
    booking_id: str,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Remove a booking from database as admin."""
    booking_service = BookingService(db)
    booking_service.delete_booking(booking_id=booking_id)
    return ApiResponse(
        message="Booking removed successfully",
        data={"id": booking_id},
    )


# Customer Management
@router.get("/customers", response_model=PaginatedResponse[CustomerResponse])
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    limit: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """List registered customers with total spent, booking counts, and KYC status."""
    admin_service = AdminService(db)
    actual_size = limit if (limit is not None and 1 <= limit <= 100) else page_size
    skip = (page - 1) * actual_size
    customers, total = admin_service.list_customers(skip=skip, limit=actual_size)
    total_pages = max(1, (total + actual_size - 1) // actual_size)
    return PaginatedResponse(
        message="Customers retrieved successfully",
        data=customers,
        meta=PaginatedMeta(
            total=total,
            page=page,
            page_size=actual_size,
            total_pages=total_pages,
        ),
    )


@router.patch("/customers/{user_id}/status", response_model=ApiResponse[dict])
def update_customer_status(
    user_id: str,
    data: CustomerStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update customer account status (active / suspended)."""
    admin_service = AdminService(db)
    user = admin_service.update_customer_status(user_id, data.status, admin_id=admin_user.id)
    return ApiResponse(
        message=f"Customer status updated to {user.status}",
        data={"user_id": user.id, "status": user.status},
    )


@router.get("/customers/{user_id}/reviews", response_model=ApiResponse[CustomerReviewsSummary])
def get_customer_reviews(
    user_id: str,
    db: Session = Depends(get_db),
):
    """Fetch customer's detailed ratings, individual review feedback, and overall rating stats."""
    admin_service = AdminService(db)
    summary = admin_service.get_customer_reviews(user_id=user_id)
    return ApiResponse(
        message="Customer reviews retrieved successfully",
        data=summary,
    )


# KYC Management
@router.get("/kyc", response_model=ApiResponse[List[dict]])
def list_pending_kyc(db: Session = Depends(get_db)):
    """List all customers with pending or reviewed KYC documents."""
    pending_users = db.query(User).filter(User.kyc_status.in_(["pending", "verified", "rejected"])).all()
    results = []
    for u in pending_users:
        docs = db.query(KYCDocument).filter(KYCDocument.user_id == u.id).all()
        results.append({
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "licence_number": u.licence_number,
            "kyc_status": u.kyc_status,
            "documents_count": len(docs),
            "documents": [
                {
                    "id": d.id,
                    "type": d.document_type,
                    "file_name": d.file_name,
                    "mime_type": d.mime_type,
                    "file_size": d.file_size,
                    "file_url": f"{settings.API_V1_STR}/admin/kyc/documents/{d.id}/view",
                    "status": d.status,
                    "uploaded_at": str(d.uploaded_at),
                }
                for d in docs
            ],
        })
    return ApiResponse(
        message="KYC applications retrieved successfully",
        data=results,
    )


@router.get("/kyc/documents/{document_id}/view")
def view_admin_kyc_document(
    document_id: str,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Serve any uploaded KYC document to an authenticated admin (inline preview)."""
    doc = db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
    if not doc:
        raise NotFoundException("Document not found")

    file_path = Path(doc.file_path)
    if not file_path.is_file():
        raise NotFoundException("Document file not found on server")

    return FileResponse(
        path=str(file_path),
        media_type=doc.mime_type or "application/octet-stream",
        filename=doc.file_name,
        content_disposition_type="inline",
    )


@router.patch("/kyc/{user_id}", response_model=ApiResponse[dict])
@router.patch("/kyc/{user_id}/review", response_model=ApiResponse[dict], include_in_schema=False)
def review_kyc(
    user_id: str,
    data: KYCReviewRequest,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Approve or reject customer KYC verification."""
    admin_service = AdminService(db)
    user = admin_service.review_kyc(
        user_id=user_id,
        status=data.status,
        rejection_reason=data.rejection_reason,
        admin_id=admin_user.id,
    )
    return ApiResponse(
        message=f"Customer KYC marked as {user.kyc_status}",
        data={"user_id": user.id, "kyc_status": user.kyc_status},
    )


# Maintenance Records CRUD
@router.get("/maintenance", response_model=PaginatedResponse[MaintenanceRecordResponse])
def list_maintenance_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List fleet maintenance and service records."""
    admin_service = AdminService(db)
    skip = (page - 1) * page_size
    records, total = admin_service.list_maintenance(skip=skip, limit=page_size)
    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedResponse(
        message="Maintenance records retrieved successfully",
        data=records,
        meta=PaginatedMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.post("/maintenance", response_model=ApiResponse[MaintenanceRecordResponse], status_code=status.HTTP_201_CREATED)
def create_maintenance_record(
    data: MaintenanceRecordCreate,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Record a new maintenance, repair, or damage log for a vehicle."""
    admin_service = AdminService(db)
    record = admin_service.create_maintenance(data=data, admin_id=admin_user.id)
    return ApiResponse(
        message="Maintenance record logged successfully",
        data=record,
    )


@router.patch("/maintenance/{record_id}", response_model=ApiResponse[MaintenanceRecordResponse])
def update_maintenance_record(
    record_id: str,
    data: MaintenanceRecordUpdate,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update an existing maintenance record status or cost."""
    admin_service = AdminService(db)
    updated = admin_service.update_maintenance(
        record_id=record_id, data=data, admin_id=admin_user.id
    )
    return ApiResponse(
        message="Maintenance record updated successfully",
        data=updated,
    )


@router.delete("/maintenance/{record_id}", response_model=ApiResponse[dict])
def delete_maintenance_record(
    record_id: str,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a maintenance record."""
    admin_service = AdminService(db)
    admin_service.delete_maintenance(record_id=record_id, admin_id=admin_user.id)
    return ApiResponse(
        message="Maintenance record deleted successfully",
        data={},
    )


@router.get("/revenue", response_model=ApiResponse[RevenueBreakdownResponse])
@router.get("/reports/revenue", response_model=ApiResponse[RevenueBreakdownResponse], include_in_schema=False)
def get_revenue_report(db: Session = Depends(get_db)):
    """Get complete financial revenue analytics, maintenance costs, and net income."""
    admin_service = AdminService(db)
    revenue_data = admin_service.get_revenue_summary()
    return ApiResponse(
        message="Revenue report retrieved successfully",
        data=revenue_data,
    )
