from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.chain import ChainClient, PaymentEvent
from app.config import Settings
from app.main import app, get_chain_client_dep, get_session_store_dep, get_settings_dep
from app.session import PaidSessionStore


@pytest.fixture
def settings() -> Settings:
    return Settings(
        arc_rpc_url="http://localhost:8545",
        contract_address="0x0000000000000000000000000000000000dEaD",
        openai_api_key="sk-test",
        resource_address="0x00000000000000000000000000000000001234",
        price_usdc=5_000,
        chain_id=999,
        free_input_char_cap=20,
        free_max_tokens=60,
        paid_session_ttl_seconds=3600,
    )


@pytest.fixture
def mock_chain_client() -> MagicMock:
    return MagicMock(spec=ChainClient)


@pytest.fixture
def client(settings, mock_chain_client, monkeypatch):
    monkeypatch.setattr("app.main.ask_llm", lambda settings, prompt, full=True: "42")
    session_store = PaidSessionStore(3600)
    app.dependency_overrides[get_settings_dep] = lambda: settings
    app.dependency_overrides[get_chain_client_dep] = lambda: mock_chain_client
    app.dependency_overrides[get_session_store_dep] = lambda: session_store
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_free_request_within_cap_is_served_without_payment(client):
    response = client.get("/ask", params={"prompt": "short question"})
    assert response.status_code == 200
    body = response.json()
    assert body == {"response": "42", "tier": "free"}


def test_free_request_over_cap_returns_402_with_terms(client, settings):
    long_prompt = "x" * (settings.free_input_char_cap + 1)
    response = client.get("/ask", params={"prompt": long_prompt})
    assert response.status_code == 402
    body = response.json()
    assert "amount" in body
    assert "request_hash" in body


def test_valid_payment_unlocks_paid_tier_for_subsequent_calls(client, settings, mock_chain_client):
    from app.x402 import compute_request_hash

    long_prompt = "x" * (settings.free_input_char_cap + 1)
    mock_chain_client.mark_tx_used.return_value = True
    mock_chain_client.get_payment_settled_event.return_value = PaymentEvent(
        payer="0xPayer",
        resource=settings.resource_address,
        request_hash=compute_request_hash(settings.resource_address, long_prompt),
        amount=settings.price_usdc,
        timestamp=1234567890,
    )

    paid_response = client.get(
        "/ask", params={"prompt": long_prompt, "wallet": "0xAbC", "tx_hash": "0xabc"}
    )
    assert paid_response.status_code == 200
    assert paid_response.json() == {"response": "42", "tier": "paid"}

    # Same wallet, a later call, no tx_hash needed — still paid tier, no cap.
    followup = client.get(
        "/ask", params={"prompt": long_prompt, "wallet": "0xabc"}  # case-insensitive match
    )
    assert followup.status_code == 200
    assert followup.json()["tier"] == "paid"


def test_replayed_tx_hash_rejected(client, mock_chain_client):
    mock_chain_client.mark_tx_used.return_value = False

    response = client.get(
        "/ask", params={"prompt": "x" * 300, "wallet": "0xAbC", "tx_hash": "0xabc"}
    )
    assert response.status_code == 402
    mock_chain_client.get_payment_settled_event.assert_not_called()


def test_wrong_amount_rejected(client, settings, mock_chain_client):
    from app.x402 import compute_request_hash

    long_prompt = "x" * (settings.free_input_char_cap + 1)
    mock_chain_client.mark_tx_used.return_value = True
    mock_chain_client.get_payment_settled_event.return_value = PaymentEvent(
        payer="0xPayer",
        resource=settings.resource_address,
        request_hash=compute_request_hash(settings.resource_address, long_prompt),
        amount=settings.price_usdc - 1,
        timestamp=1234567890,
    )

    response = client.get(
        "/ask", params={"prompt": long_prompt, "wallet": "0xAbC", "tx_hash": "0xabc"}
    )
    assert response.status_code == 402
