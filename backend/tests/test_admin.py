from fastapi.testclient import TestClient


def test_admin_authorization_enforced(client: TestClient, customer_headers: dict):
    # Customer user should receive 403 Forbidden
    response = client.get("/api/v1/admin/dashboard", headers=customer_headers)
    assert response.status_code == 403
    assert "Administrator privileges required" in response.json()["message"]


def test_admin_unauthenticated(client: TestClient):
    response = client.get("/api/v1/admin/dashboard")
    assert response.status_code == 401


def test_admin_dashboard_stats(client: TestClient, admin_headers: dict):
    response = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "stats" in data
    assert data["stats"]["totalCars"] >= 3
    assert data["stats"]["revenueGrowth"] == 18.5
    assert len(data["monthly_revenue"]) == 12


def test_admin_create_car(client: TestClient, admin_headers: dict):
    payload = {
        "id": "test-thar-1",
        "name": "Mahindra Thar",
        "brand": "Mahindra",
        "model": "Thar LX",
        "year": 2024,
        "category": "SUV",
        "hourly_price": 600.0,
        "daily_price": 4000.0,
        "weekly_price": 24000.0,
        "seats": 4,
        "fuel": "Diesel",
        "transmission": "Manual",
        "mileage": 14.0,
        "image": "https://example.com/thar.jpg",
        "available": True,
        "color": "Rocky Beige",
        "security_deposit": 15000.0,
        "popular": True,
        "features": ["4x4", "Hard Top"],
    }
    response = client.post("/api/v1/admin/cars", json=payload, headers=admin_headers)
    assert response.status_code == 201
    assert response.json()["data"]["name"] == "Mahindra Thar"


def test_admin_toggle_car_availability(client: TestClient, admin_headers: dict):
    response = client.patch(
        "/api/v1/admin/cars/test-creta-1/availability",
        json={"available": False},
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["available"] is False

    # Toggle back
    response2 = client.patch(
        "/api/v1/admin/cars/test-creta-1/availability",
        json={"available": True},
        headers=admin_headers,
    )
    assert response2.status_code == 200
    assert response2.json()["data"]["available"] is True


def test_admin_customer_management(client: TestClient, admin_headers: dict):
    # List customers
    resp = client.get("/api/v1/admin/customers", headers=admin_headers)
    assert resp.status_code == 200
    customers = resp.json()["data"]
    assert len(customers) >= 2

    # Update customer status
    target_id = customers[0]["id"]
    patch_resp = client.patch(
        f"/api/v1/admin/customers/{target_id}/status",
        json={"status": "suspended"},
        headers=admin_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["status"] == "suspended"

    # Re-activate
    patch_resp2 = client.patch(
        f"/api/v1/admin/customers/{target_id}/status",
        json={"status": "active"},
        headers=admin_headers,
    )
    assert patch_resp2.status_code == 200
    assert patch_resp2.json()["data"]["status"] == "active"


def test_admin_kyc_review(client: TestClient, admin_headers: dict):
    resp = client.patch(
        "/api/v1/admin/kyc/test-customer-2",
        json={"status": "verified"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["kyc_status"] == "verified"


def test_admin_maintenance_crud(client: TestClient, admin_headers: dict):
    # Create record
    payload = {
        "car_id": "test-creta-1",
        "type": "scheduled",
        "description": "Brake pad replacement",
        "cost": 4500.0,
        "date": "2028-09-01",
        "status": "pending",
    }
    create_resp = client.post("/api/v1/admin/maintenance", json=payload, headers=admin_headers)
    assert create_resp.status_code == 201
    rec_id = create_resp.json()["data"]["id"]

    # Update record
    patch_resp = client.patch(
        f"/api/v1/admin/maintenance/{rec_id}",
        json={"status": "completed", "cost": 4200.0},
        headers=admin_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["status"] == "completed"

    # Delete record
    del_resp = client.delete(f"/api/v1/admin/maintenance/{rec_id}", headers=admin_headers)
    assert del_resp.status_code == 200


def test_admin_revenue_report(client: TestClient, admin_headers: dict):
    resp = client.get("/api/v1/admin/revenue", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "total_revenue" in data
    assert "revenue_by_category" in data
    assert "SUV" in data["revenue_by_category"]


def test_admin_delete_car_success(client: TestClient, admin_headers: dict):
    # First create a temporary car
    payload = {
        "id": "car-to-delete-1",
        "name": "Car To Delete",
        "brand": "Demo",
        "model": "DeleteMe",
        "year": 2024,
        "category": "Sedan",
        "hourly_price": 200.0,
        "daily_price": 2000.0,
        "weekly_price": 12000.0,
        "seats": 5,
        "fuel": "Petrol",
        "transmission": "Manual",
        "mileage": 18.0,
        "image": "https://example.com/test.jpg",
        "available": True,
        "color": "Silver",
        "security_deposit": 5000.0,
        "popular": False,
    }
    create_resp = client.post("/api/v1/admin/cars", json=payload, headers=admin_headers)
    assert create_resp.status_code == 201

    # Now delete the car
    del_resp = client.delete("/api/v1/admin/cars/car-to-delete-1", headers=admin_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True


def test_admin_delete_car_with_active_booking_rejected(client: TestClient, admin_headers: dict, customer_headers: dict):
    # Book test-swift-1 first so it has an active booking
    payload = {
        "car_id": "test-swift-1",
        "pickup_location": "Mumbai Airport, T2",
        "drop_location": "Bandra, Mumbai",
        "pickup_date": "2028-11-20",
        "duration_type": "daily",
        "duration_value": 2,
        "with_driver": False,
        "payment_method": "upi",
    }
    create_bk = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert create_bk.status_code == 201

    # Now attempt to delete test-swift-1 as admin
    del_resp = client.delete("/api/v1/admin/cars/test-swift-1", headers=admin_headers)
    assert del_resp.status_code == 400
    assert "active or upcoming booking" in del_resp.json()["message"]


def test_admin_list_bookings_includes_customer_and_car_and_amount(
    client: TestClient, admin_headers: dict, customer_headers: dict
):
    # Ensure there is at least one booking created
    payload = {
        "car_id": "test-creta-1",
        "pickup_location": "Airport Terminal 2",
        "drop_location": "Hub Central",
        "pickup_date": "2028-12-01",
        "duration_type": "daily",
        "duration_value": 3,
        "with_driver": True,
        "payment_method": "upi",
    }
    create_res = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert create_res.status_code == 201

    # Fetch admin bookings
    resp = client.get("/api/v1/admin/bookings", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) > 0

    first = data[0]
    # Check customer details
    assert "user" in first and first["user"] is not None
    assert "name" in first["user"] and len(first["user"]["name"]) > 0
    assert "email" in first["user"]

    # Check vehicle details
    assert "car" in first and first["car"] is not None
    assert "name" in first["car"] and len(first["car"]["name"]) > 0
    assert "license_plate" in first["car"]

    # Check total amount details
    assert "total_amount" in first
    assert first["total_amount"] > 0
    assert first["total_price"] > 0
    assert first["amount"] > 0


