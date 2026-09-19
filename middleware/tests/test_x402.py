from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.chain import ChainClient, PaymentEvent
from app.config import Settings
from app.main import app, get_chain_client_dep, get_settings_dep


@pytest.fixture
def settings() -> Settings:
    return Settings(
        arc_rpc_url="http://localhost:8545",
        contract_address="0x0000000000000000000000000000000000dEaD",
        openai_api_key="sk-test",
        resource_address="0x00000000000000000000000000000000001234",
        price_usdc=10_000,
        chain_id=999,
    )


@pytest.fixture
def mock_chain_client() -> MagicMock:
    return MagicMock(spec=ChainClient)


@pytest.fixture
def client(settings, mock_chain_client):
    app.dependency_overrides[get_settings_dep] = lambda: settings
    app.dependency_overrides[get_chain_client_dep] = lambda: mock_chain_client
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_unpaid_request_returns_402_with_terms(client):
    response = client.get("/ask", params={"prompt": "hello"})
    assert response.status_code == 402
    body = response.json()
    assert "amount" in body
    assert "request_hash" in body


def test_402_terms_include_correct_amount_and_hash(client, settings):
    from app.x402 import compute_request_hash

    response = client.get("/ask", params={"prompt": "hello"})
    body = response.json()
    assert body["amount"] == str(settings.price_usdc)
    assert body["recipient"] == settings.resource_address
    assert body["chain_id"] == settings.chain_id
    assert body["request_hash"] == compute_request_hash(settings.resource_address, "hello")


def test_valid_payment_serves_resource(client, settings, mock_chain_client, monkeypatch):
    from app.x402 import compute_request_hash

    mock_chain_client.mark_tx_used.return_value = True
    mock_chain_client.get_payment_settled_event.return_value = PaymentEvent(
        payer="0xPayer",
        resource=settings.resource_address,
        request_hash=compute_request_hash(settings.resource_address, "hello"),
        amount=settings.price_usdc,
        timestamp=1234567890,
    )
    monkeypatch.setattr("app.main.ask_llm", lambda settings, prompt: "42")

    response = client.get("/ask", params={"prompt": "hello", "tx_hash": "0xabc"})
    assert response.status_code == 200
    assert response.json() == {"response": "42"}


def test_replayed_tx_hash_rejected(client, mock_chain_client):
    mock_chain_client.mark_tx_used.return_value = False

    response = client.get("/ask", params={"prompt": "hello", "tx_hash": "0xabc"})
    assert response.status_code == 402
    mock_chain_client.get_payment_settled_event.assert_not_called()


def test_wrong_amount_rejected(client, settings, mock_chain_client):
    from app.x402 import compute_request_hash

    mock_chain_client.mark_tx_used.return_value = True
    mock_chain_client.get_payment_settled_event.return_value = PaymentEvent(
        payer="0xPayer",
        resource=settings.resource_address,
        request_hash=compute_request_hash(settings.resource_address, "hello"),
        amount=settings.price_usdc - 1,
        timestamp=1234567890,
    )

    response = client.get("/ask", params={"prompt": "hello", "tx_hash": "0xabc"})
    assert response.status_code == 402
