import uuid
from datetime import date
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.booking import Booking, BookingStatus, PaymentStatus


@pytest.fixture
def create_booking_helper(db: Session):
    def _create(status=BookingStatus.COMPLETED, user_id="test-customer-1", car_id="test-creta-1"):
        b_id = f"test-bk-{uuid.uuid4().hex[:8]}"
        booking = Booking(
            id=b_id,
            user_id=user_id,
            car_id=car_id,
            pickup_location_name="Mumbai Airport, T2",
            drop_location_name="Mumbai Airport, T2",
            pickup_date=date(2026, 8, 10),
            return_date=date(2026, 8, 12),
            pickup_time="10:00",
            return_time="10:00",
            duration_value=2,
            with_driver=False,
            driver_fee=Decimal("0.00"),
            base_amount=Decimal("7000.00"),
            discount_amount=Decimal("0.00"),
            wallet_amount=Decimal("0.00"),
            security_deposit=Decimal("5000.00"),
            final_amount=Decimal("7000.00"),
            payment_method="upi",
            payment_status=PaymentStatus.COMPLETED,
            status=status,
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking
    return _create


def test_customer_can_rate_completed_booking(client: TestClient, customer_headers: dict, create_booking_helper):
    booking = create_booking_helper(status=BookingStatus.COMPLETED)
    payload = {
        "booking_id": booking.id,
        "rating": 5,
        "comment": "Exceptional rental experience! The Creta was super clean and drove like a dream.",
    }
    response = client.post("/api/v1/reviews", json=payload, headers=customer_headers)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["booking_id"] == booking.id
    assert data["rating"] == 5
    assert "Exceptional rental experience" in data["comment"]
    assert data["car_id"] == "test-creta-1"


def test_cannot_review_non_completed_booking(client: TestClient, customer_headers: dict, create_booking_helper):
    booking = create_booking_helper(status=BookingStatus.ACTIVE)
    payload = {
        "booking_id": booking.id,
        "rating": 4,
        "comment": "Trip is still ongoing.",
    }
    response = client.post("/api/v1/reviews", json=payload, headers=customer_headers)
    assert response.status_code == 400
    assert "Only completed bookings can be reviewed" in response.json()["message"]


def test_prevent_duplicate_review_for_same_booking(client: TestClient, customer_headers: dict, create_booking_helper):
    booking = create_booking_helper(status=BookingStatus.COMPLETED)
    payload = {
        "booking_id": booking.id,
        "rating": 5,
        "comment": "First review submission.",
    }
    res1 = client.post("/api/v1/reviews", json=payload, headers=customer_headers)
    assert res1.status_code == 201

    # Second submission for the same booking
    res2 = client.post("/api/v1/reviews", json=payload, headers=customer_headers)
    assert res2.status_code == 400
    assert "already been submitted" in res2.json()["message"]


def test_cannot_review_another_customers_booking(client: TestClient, unverified_headers: dict, create_booking_helper):
    booking = create_booking_helper(status=BookingStatus.COMPLETED, user_id="test-customer-1")
    payload = {
        "booking_id": booking.id,
        "rating": 4,
        "comment": "Trying to review someone else's trip.",
    }
    # test-customer-unverified trying to review test-customer-1's booking
    response = client.post("/api/v1/reviews", json=payload, headers=unverified_headers)
    assert response.status_code == 403
    assert "only review your own bookings" in response.json()["message"]


def test_rating_bounds_validation(client: TestClient, customer_headers: dict, create_booking_helper):
    booking = create_booking_helper(status=BookingStatus.COMPLETED)
    # Rating 6 is out of bounds
    payload_high = {
        "booking_id": booking.id,
        "rating": 6,
        "comment": "Great car!",
    }
    res_high = client.post("/api/v1/reviews", json=payload_high, headers=customer_headers)
    assert res_high.status_code in [400, 422]

    # Rating 0 is out of bounds
    payload_low = {
        "booking_id": booking.id,
        "rating": 0,
        "comment": "Bad car!",
    }
    res_low = client.post("/api/v1/reviews", json=payload_low, headers=customer_headers)
    assert res_low.status_code in [400, 422]


def test_get_customer_reviews_and_admin_directory(client: TestClient, customer_headers: dict, admin_headers: dict, create_booking_helper):
    booking = create_booking_helper(status=BookingStatus.COMPLETED)
    # Submit review
    payload = {
        "booking_id": booking.id,
        "rating": 5,
        "comment": "Smooth pickup, spotless interior, and great mileage!",
    }
    res = client.post("/api/v1/reviews", json=payload, headers=customer_headers)
    assert res.status_code == 201

    # Customer fetches their reviews
    my_revs = client.get("/api/v1/reviews/my", headers=customer_headers)
    assert my_revs.status_code == 200
    assert len(my_revs.json()["data"]) >= 1

    # Customer fetches booking review
    bk_rev = client.get(f"/api/v1/reviews/booking/{booking.id}", headers=customer_headers)
    assert bk_rev.status_code == 200
    assert bk_rev.json()["data"]["rating"] == 5

    # Admin Customer Directory includes average rating
    cust_res = client.get("/api/v1/admin/customers", headers=admin_headers)
    assert cust_res.status_code == 200
    customers = cust_res.json()["data"]
    target_cust = next((c for c in customers if c["id"] == "test-customer-1"), None)
    assert target_cust is not None
    assert target_cust["total_reviews"] >= 1
    assert target_cust["average_rating"] is not None

    # Admin views customer's detailed reviews
    detail_res = client.get(f"/api/v1/admin/customers/test-customer-1/reviews", headers=admin_headers)
    assert detail_res.status_code == 200
    summary = detail_res.json()["data"]
    assert summary["user_id"] == "test-customer-1"
    assert summary["average_rating"] is not None
    assert summary["total_reviews"] >= 1
    assert len(summary["reviews"]) >= 1
    found_review = next((r for r in summary["reviews"] if r["booking_id"] == booking.id), None)
    assert found_review is not None
    assert found_review["comment"] == "Smooth pickup, spotless interior, and great mileage!"
    assert found_review["car_name"] == "Hyundai Creta"
