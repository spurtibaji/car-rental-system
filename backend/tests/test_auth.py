from fastapi.testclient import TestClient


def test_register_success(client: TestClient):
    payload = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "phone": "+91 9988776655",
        "password": "SecurePassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "tokens" in data["data"]
    assert "access_token" in data["data"]["tokens"]
    assert data["data"]["user"]["email"] == "jane.doe@example.com"


def test_register_duplicate_email(client: TestClient):
    payload = {
        "name": "Rahul Sharma",
        "email": "rahul.test@email.com",
        "password": "AnyPassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["message"]


def test_login_success(client: TestClient):
    payload = {
        "email": "rahul.test@email.com",
        "password": "CustomerPass123!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "tokens" in data["data"]
    assert data["data"]["tokens"]["access_token"]


def test_login_invalid_credentials(client: TestClient):
    payload = {
        "email": "rahul.test@email.com",
        "password": "WrongPassword!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["message"]


def test_get_me_authenticated(client: TestClient, customer_headers: dict):
    response = client.get("/api/v1/auth/me", headers=customer_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "rahul.test@email.com"
    assert data["data"]["wallet_balance"] == 5000.0


def test_get_me_unauthenticated(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_refresh_token_cycle(client: TestClient):
    # Login first
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "rahul.test@email.com", "password": "CustomerPass123!"},
    )
    refresh_token = login_resp.json()["data"]["tokens"]["refresh_token"]

    # Refresh
    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()["data"]
