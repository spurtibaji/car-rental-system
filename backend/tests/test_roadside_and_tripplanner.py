from fastapi.testclient import TestClient


def test_roadside_assistance_create(client: TestClient):
    payload = {
        "issue_type": "flat-tyre",
        "location": "Near Expressway, 43 km from Pune, Maharashtra — 18.5204° N, 73.8567° E",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "notes": "Rear right tyre is completely flat",
    }
    response = client.post("/api/v1/roadside/requests", json=payload)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["reference_id"].startswith("RA-")
    assert data["eta"] == "15-20 min"
    assert data["status"] == "requested"


def test_roadside_request_status_update(client: TestClient, customer_headers: dict):
    # Create
    create_resp = client.post(
        "/api/v1/roadside/requests",
        json={"issue_type": "battery", "location": "Bandra, Mumbai"},
    )
    req_id = create_resp.json()["data"]["id"]

    # Update
    patch_resp = client.patch(
        f"/api/v1/roadside/requests/{req_id}",
        json={"status": "assigned", "eta": "15 min"},
        headers=customer_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["status"] == "assigned"
    assert patch_resp.json()["data"]["eta"] == "15 min"


def test_trip_planner_recommendations(client: TestClient):
    payload = {
        "destination": "Lonavala",
        "passengers": 4,
        "days": 2,
        "purpose": "Weekend Getaway",
        "budget": 10000.0,
        "need_driver": False,
    }
    response = client.post("/api/v1/trip-planner/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["destination"] == "Lonavala"
    assert data["distance_round_trip_km"] == 130
    assert data["terrain"] == "Hills"
    assert len(data["recommendations"]) >= 1

    rec = data["recommendations"][0]
    assert "rental_cost" in rec
    assert "fuel_cost" in rec
    assert "total_estimated_cost" in rec
    assert rec["total_estimated_cost"] == rec["rental_cost"] + rec["driver_cost"] + rec["fuel_cost"]
    assert len(rec["match_reasons"]) >= 1
