from fastapi.testclient import TestClient


def test_list_cars(client: TestClient):
    response = client.get("/api/v1/cars")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 2
    assert "meta" in data


def test_search_cars(client: TestClient):
    response = client.get("/api/v1/cars?search=Creta")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["name"] == "Hyundai Creta"


def test_filter_cars_by_category(client: TestClient):
    response = client.get("/api/v1/cars?category=SUV")
    assert response.status_code == 200
    data = response.json()["data"]
    assert all(c["category"] == "SUV" for c in data)


def test_filter_cars_by_fuel(client: TestClient):
    response = client.get("/api/v1/cars?fuel=Diesel")
    assert response.status_code == 200
    data = response.json()["data"]
    assert all(c["fuel"] == "Diesel" for c in data)


def test_sort_cars_by_price_asc(client: TestClient):
    response = client.get("/api/v1/cars?sort_by=price-asc&duration_type=daily")
    assert response.status_code == 200
    data = response.json()["data"]
    prices = [c["price"]["daily"] for c in data]
    assert prices == sorted(prices)


def test_get_car_detail(client: TestClient):
    response = client.get("/api/v1/cars/test-creta-1")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["id"] == "test-creta-1"
    assert data["name"] == "Hyundai Creta"
    assert "price" in data
    assert data["price"]["daily"] == 3500.0
    assert "Panoramic Sunroof" in data["features"]
    assert len(data["images"]) >= 1


def test_get_car_not_found(client: TestClient):
    response = client.get("/api/v1/cars/non-existent-id")
    assert response.status_code == 404


def test_check_car_availability_valid(client: TestClient):
    response = client.get(
        "/api/v1/cars/test-creta-1/availability?pickup_date=2028-10-01&return_date=2028-10-05"
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["is_available"] is True


def test_check_car_availability_invalid_dates(client: TestClient):
    response = client.get(
        "/api/v1/cars/test-creta-1/availability?pickup_date=2028-10-05&return_date=2028-10-01"
    )
    assert response.status_code == 400
    assert "cannot be before" in response.json()["message"]


def test_get_related_cars(client: TestClient):
    response = client.get("/api/v1/cars/test-creta-1/related")
    assert response.status_code == 200
    data = response.json()["data"]
    assert isinstance(data, list)
