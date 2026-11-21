from fastapi.testclient import TestClient


def test_get_wallet(client: TestClient, customer_headers: dict):
    response = client.get("/api/v1/wallet", headers=customer_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "balance" in data
    assert isinstance(data["transactions"], list)


def test_top_up_wallet(client: TestClient, customer_headers: dict):
    # Initial balance
    init_resp = client.get("/api/v1/wallet", headers=customer_headers)
    init_bal = init_resp.json()["data"]["balance"]

    # Top up 1000
    topup_payload = {"amount": 1000.0, "payment_method": "upi"}
    response = client.post("/api/v1/wallet/top-up", json=topup_payload, headers=customer_headers)
    assert response.status_code == 200
    new_bal = response.json()["data"]["balance"]
    assert new_bal == init_bal + 1000.0

    # Verify transaction ledger
    txns_resp = client.get("/api/v1/wallet/transactions", headers=customer_headers)
    assert txns_resp.status_code == 200
    txns = txns_resp.json()["data"]
    assert len(txns) >= 1
    assert txns[0]["type"] == "credit"
    assert txns[0]["amount"] == 1000.0
    assert "Added via UPI" in txns[0]["label"]


def test_top_up_invalid_amount(client: TestClient, customer_headers: dict):
    response = client.post(
        "/api/v1/wallet/top-up",
        json={"amount": -50.0, "payment_method": "upi"},
        headers=customer_headers,
    )
    assert response.status_code == 422
