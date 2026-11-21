from fastapi.testclient import TestClient


def test_quote_calculation_daily_without_driver(client: TestClient):
    payload = {
        "car_id": "test-creta-1",
        "pickup_date": "2028-11-01",
        "duration_type": "daily",
        "duration_value": 2,
        "with_driver": False,
    }
    response = client.post("/api/v1/bookings/quote", json=payload)
    assert response.status_code == 200
    data = response.json()["data"]
    # 3500 * 2 = 7000
    assert data["base_amount"] == 7000.0
    assert data["driver_fee"] == 0.0
    assert data["security_deposit"] == 10000.0
    assert data["total_payable"] == 17000.0


def test_quote_calculation_with_driver_and_coupon(client: TestClient):
    payload = {
        "car_id": "test-creta-1",
        "pickup_date": "2028-11-01",
        "duration_type": "daily",
        "duration_value": 2,
        "with_driver": True,
        "coupon_code": "WEEKEND50",
    }
    response = client.post("/api/v1/bookings/quote", json=payload)
    assert response.status_code == 200
    data = response.json()["data"]
    # Base: 7000, Driver: 1600 (800 * 2), Subtotal: 8600, Flat coupon: 500
    assert data["base_amount"] == 7000.0
    assert data["driver_fee"] == 1600.0
    assert data["subtotal"] == 8600.0
    assert data["coupon_discount"] == 500.0
    assert data["final_amount"] == 8100.0


def test_coupon_validation_category_mismatch(client: TestClient):
    # LUXURY15 is only for Luxury, Creta is SUV
    payload = {
        "code": "LUXURY15",
        "car_id": "test-creta-1",
        "amount": 6000.0,
    }
    response = client.post("/api/v1/offers/validate", json=payload)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["valid"] is False
    assert "only valid for Luxury" in data["message"]


def test_coupon_validation_minimum_amount(client: TestClient):
    # FIRSTRIDE requires min 1000
    payload = {
        "code": "FIRSTRIDE",
        "car_id": "test-creta-1",
        "amount": 500.0,
    }
    response = client.post("/api/v1/offers/validate", json=payload)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["valid"] is False
    assert "Minimum booking amount" in data["message"]


def test_booking_rejected_for_unverified_user(client: TestClient, unverified_headers: dict):
    payload = {
        "car_id": "test-swift-1",
        "pickup_location": "Mumbai Airport, T2",
        "pickup_date": "2028-11-10",
        "duration_type": "daily",
        "duration_value": 1,
    }
    response = client.post("/api/v1/bookings", json=payload, headers=unverified_headers)
    assert response.status_code == 403
    assert "KYC verification is required" in response.json()["message"]


def test_booking_creation_success(client: TestClient, customer_headers: dict):
    payload = {
        "car_id": "test-swift-1",
        "pickup_location": "Mumbai Airport, T2",
        "drop_location": "Bandra, Mumbai",
        "pickup_date": "2028-11-15",
        "duration_type": "daily",
        "duration_value": 2,
        "with_driver": False,
        "payment_method": "upi",
    }
    response = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert response.status_code == 201
    data = response.json()["data"]
    # 1800 * 2 = 3600 + 5000 deposit = 8600
    assert data["amount"] == 8600.0
    assert data["status"] == "confirmed"
    assert data["pickupLocation"] == "Mumbai Airport, T2"
    assert data["dropLocation"] == "Bandra, Mumbai"


def test_booking_double_booking_conflict(client: TestClient, customer_headers: dict):
    # Book test-swift-1 for 2028-12-01 to 2028-12-05
    payload = {
        "car_id": "test-swift-1",
        "pickup_location": "Mumbai Airport, T2",
        "pickup_date": "2028-12-01",
        "return_date": "2028-12-05",
        "duration_type": "daily",
        "duration_value": 4,
    }
    resp1 = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert resp1.status_code == 201

    # Attempt to book same car overlapping (2028-12-03 to 2028-12-07)
    conflict_payload = {
        "car_id": "test-swift-1",
        "pickup_location": "Pune, Hinjewadi",
        "pickup_date": "2028-12-03",
        "return_date": "2028-12-07",
        "duration_type": "daily",
        "duration_value": 4,
    }
    resp2 = client.post("/api/v1/bookings", json=conflict_payload, headers=customer_headers)
    assert resp2.status_code == 409
    assert "already booked" in resp2.json()["message"]


def test_booking_with_wallet_deduction_and_cancellation_refund(client: TestClient, customer_headers: dict):
    # Check initial wallet balance
    me_resp = client.get("/api/v1/auth/me", headers=customer_headers)
    initial_wallet = me_resp.json()["data"]["wallet_balance"]

    # Book with wallet
    payload = {
        "car_id": "test-creta-1",
        "pickup_location": "Mumbai Airport, T2",
        "pickup_date": "2028-12-10",
        "duration_type": "daily",
        "duration_value": 1,
        "use_wallet": True,
    }
    book_resp = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert book_resp.status_code == 201
    booking = book_resp.json()["data"]

    # Check that wallet was deducted
    me_after = client.get("/api/v1/auth/me", headers=customer_headers)
    assert me_after.json()["data"]["wallet_balance"] < initial_wallet

    # Cancel booking
    cancel_resp = client.post(f"/api/v1/bookings/{booking['id']}/cancel", headers=customer_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["data"]["status"] == "cancelled"

    # Check tracking
    track_resp = client.get(f"/api/v1/bookings/{booking['id']}/tracking", headers=customer_headers)
    assert track_resp.status_code == 200
    assert track_resp.json()["data"]["status"] == "cancelled"


def test_booking_paid_entirely_with_wallet(client: TestClient, customer_headers: dict):
    topup_resp = client.post(
        "/api/v1/wallet/top-up",
        json={"amount": 100000, "payment_method": "upi"},
        headers=customer_headers,
    )
    assert topup_resp.status_code == 200

    payload = {
        "car_id": "test-creta-1",
        "pickup_location": "Mumbai Airport, T2",
        "pickup_date": "2028-12-20",
        "duration_type": "daily",
        "duration_value": 1,
        "use_wallet": True,
        "payment_method": "wallet",
    }
    response = client.post("/api/v1/bookings", json=payload, headers=customer_headers)

    assert response.status_code == 201
    booking = response.json()["data"]
    assert booking["payment_method"] == "wallet"

    me_resp = client.get("/api/v1/auth/me", headers=customer_headers)
    assert me_resp.json()["data"]["wallet_balance"] < topup_resp.json()["data"]["balance"]
