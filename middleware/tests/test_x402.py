from dataclasses import replace
from unittest.mock import MagicMock

import httpx
import pytest
from fastapi.testclient import TestClient
from openai import APIError

from app.chain import ChainClient, PaymentEvent
from app.config import Settings
from app.main import (
    app,
    get_chain_client_dep,
    get_memory_store_dep,
    get_settings_dep,
    get_tile_store_dep,
)
from app.memory import InMemoryMemoryStore
from app.tile_store import InMemoryTileUnlockStore
from app.tiles import price_for_tile
from app.x402 import compute_request_hash
from tests.conftest import make_privy_token


@pytest.fixture
def settings() -> Settings:
    return Settings(
        arc_rpc_url="http://localhost:8545",
        contract_address="0x0000000000000000000000000000000000dEaD",
        openai_api_key="sk-test",
        llm_base_url="",
        llm_model="gpt-4o-mini",
        resource_address="0x00000000000000000000000000000000001234",
        chain_id=999,
        free_max_tokens=60,
        paid_session_ttl_seconds=3600,
        cors_origins=["http://localhost:5173"],
        redis_url="redis://localhost:6379/0",
        privy_app_id="",
        privy_verification_key="",
    )


@pytest.fixture
def mock_chain_client() -> MagicMock:
    return MagicMock(spec=ChainClient)


@pytest.fixture
def store() -> InMemoryTileUnlockStore:
    return InMemoryTileUnlockStore(3600)


@pytest.fixture
def memory_store(settings) -> InMemoryMemoryStore:
    return InMemoryMemoryStore(settings)


@pytest.fixture
def client(settings, mock_chain_client, store, memory_store, monkeypatch):
    monkeypatch.setattr("app.main.ask_llm", lambda settings, prompt, full=True, memory_context=None: "42")
    app.dependency_overrides[get_settings_dep] = lambda: settings
    app.dependency_overrides[get_chain_client_dep] = lambda: mock_chain_client
    app.dependency_overrides[get_tile_store_dep] = lambda: store
    app.dependency_overrides[get_memory_store_dep] = lambda: memory_store
    yield TestClient(app)
    app.dependency_overrides.clear()


# --- /ask -------------------------------------------------------------------


def test_ask_serves_free_tier_without_wallet_regardless_of_prompt_length(client):
    response = client.get("/ask", params={"prompt": "x" * 500})
    assert response.status_code == 200
    assert response.json() == {"response": "42", "tier": "free"}


def test_ask_serves_paid_tier_once_wallet_is_unlocked(client, store):
    store.mark_unlocked("0xAbC", "chat")

    response = client.get("/ask", params={"prompt": "hello", "wallet": "0xabc"})
    assert response.status_code == 200
    assert response.json() == {"response": "42", "tier": "paid"}


# --- /ask + memory ------------------------------------------------------


def _settings_with_privy(settings: Settings, public_pem: str) -> Settings:
    return replace(settings, privy_app_id="app-123", privy_verification_key=public_pem)


def test_ask_with_valid_token_and_paid_wallet_engages_memory(
    client, store, memory_store, settings, privy_keypair
):
    private_pem, public_pem = privy_keypair
    app.dependency_overrides[get_settings_dep] = lambda: _settings_with_privy(settings, public_pem)
    store.mark_unlocked("0xAbC", "chat")
    token = make_privy_token(private_pem, sub="did:privy:u1", aud="app-123")

    response = client.get(
        "/ask",
        params={"prompt": "hello", "wallet": "0xabc"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    blob = memory_store.get_memory("did:privy:u1")
    assert [(t.role, t.content) for t in blob.recent_turns] == [
        ("user", "hello"),
        ("assistant", "42"),
    ]


def test_ask_with_valid_token_but_unpaid_wallet_skips_memory(
    client, memory_store, settings, privy_keypair
):
    private_pem, public_pem = privy_keypair
    app.dependency_overrides[get_settings_dep] = lambda: _settings_with_privy(settings, public_pem)
    token = make_privy_token(private_pem, sub="did:privy:u1", aud="app-123")

    response = client.get(
        "/ask",
        params={"prompt": "hello"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert memory_store.get_memory("did:privy:u1").recent_turns == []


def test_ask_with_paid_wallet_but_no_token_skips_memory(client, store, memory_store, settings):
    store.mark_unlocked("0xAbC", "chat")

    response = client.get("/ask", params={"prompt": "hello", "wallet": "0xabc"})

    assert response.status_code == 200
    assert response.json()["tier"] == "paid"
    # Nothing to assert a specific user's memory against — no verified
    # identity means no memory was ever consulted for this call at all.


def test_ask_with_invalid_token_and_paid_wallet_degrades_gracefully(
    client, store, memory_store, settings, privy_keypair
):
    _, public_pem = privy_keypair
    app.dependency_overrides[get_settings_dep] = lambda: _settings_with_privy(settings, public_pem)
    store.mark_unlocked("0xAbC", "chat")

    response = client.get(
        "/ask",
        params={"prompt": "hello", "wallet": "0xabc"},
        headers={"Authorization": "Bearer not-a-real-token"},
    )

    assert response.status_code == 200
    assert response.json() == {"response": "42", "tier": "paid"}


def test_memory_write_failure_does_not_fail_the_response(
    client, store, settings, privy_keypair, monkeypatch
):
    private_pem, public_pem = privy_keypair
    app.dependency_overrides[get_settings_dep] = lambda: _settings_with_privy(settings, public_pem)
    store.mark_unlocked("0xAbC", "chat")
    token = make_privy_token(private_pem, sub="did:privy:u1", aud="app-123")

    broken_store = MagicMock()
    broken_store.get_memory.return_value = MagicMock(recent_turns=[], summary="", goal_log=[])
    broken_store.append_chat_turn.side_effect = RuntimeError("redis is down")
    app.dependency_overrides[get_memory_store_dep] = lambda: broken_store

    response = client.get(
        "/ask",
        params={"prompt": "hello", "wallet": "0xabc"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json() == {"response": "42", "tier": "paid"}


def test_llm_provider_error_returns_502_with_cors_headers(client, monkeypatch):
    def raise_api_error(settings, prompt, full=True, memory_context=None):
        request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        raise APIError("invalid api key", request=request, body=None)

    monkeypatch.setattr("app.main.ask_llm", raise_api_error)

    response = client.get(
        "/ask",
        params={"prompt": "short question"},
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 502
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


# --- /unlock/{tile_id} -------------------------------------------------------


def test_unlock_route_unknown_tile_returns_404(client):
    response = client.get("/unlock/not-a-real-tile", params={"wallet": "0xAbC"})
    assert response.status_code == 404


def test_unlock_route_returns_402_when_not_paid(client):
    response = client.get("/unlock/ocr", params={"wallet": "0xAbC"})
    assert response.status_code == 402
    body = response.json()
    assert body["amount"] == str(price_for_tile("ocr"))
    assert "request_hash" in body


def test_unlock_route_unlocks_on_valid_payment(client, mock_chain_client, settings):
    wallet = "0xAbC"
    request_hash = compute_request_hash(settings.resource_address, "ocr", wallet, "")
    mock_chain_client.mark_tx_used.return_value = True
    mock_chain_client.get_payment_settled_event.return_value = PaymentEvent(
        payer=wallet,
        resource=settings.resource_address,
        request_hash=request_hash,
        amount=price_for_tile("ocr"),
        timestamp=1234567890,
    )

    response = client.get("/unlock/ocr", params={"wallet": wallet, "tx_hash": "0xtx"})
    assert response.status_code == 200
    assert response.json() == {"unlocked": True}


def test_unlock_route_short_circuits_when_already_unlocked(client, store, mock_chain_client):
    store.mark_unlocked("0xAbC", "ocr")

    response = client.get("/unlock/ocr", params={"wallet": "0xabc"})
    assert response.status_code == 200
    assert response.json() == {"unlocked": True}
    mock_chain_client.get_payment_settled_event.assert_not_called()


def test_unlock_route_payer_mismatch_rejected(client, mock_chain_client, settings):
    wallet = "0xAbC"
    # Event's payer is a different wallet than the one claiming the unlock.
    request_hash = compute_request_hash(settings.resource_address, "ocr", wallet, "")
    mock_chain_client.mark_tx_used.return_value = True
    mock_chain_client.get_payment_settled_event.return_value = PaymentEvent(
        payer="0xSomeoneElse",
        resource=settings.resource_address,
        request_hash=request_hash,
        amount=price_for_tile("ocr"),
        timestamp=1234567890,
    )

    response = client.get("/unlock/ocr", params={"wallet": wallet, "tx_hash": "0xtx"})
    assert response.status_code == 402


def test_unlock_route_replayed_tx_hash_rejected(client, mock_chain_client):
    mock_chain_client.mark_tx_used.return_value = False

    response = client.get("/unlock/ocr", params={"wallet": "0xAbC", "tx_hash": "0xtx"})
    assert response.status_code == 402
    mock_chain_client.get_payment_settled_event.assert_not_called()


def test_unlock_route_underpayment_rejected(client, mock_chain_client, settings):
    wallet = "0xAbC"
    request_hash = compute_request_hash(settings.resource_address, "ocr", wallet, "")
    mock_chain_client.mark_tx_used.return_value = True
    mock_chain_client.get_payment_settled_event.return_value = PaymentEvent(
        payer=wallet,
        resource=settings.resource_address,
        request_hash=request_hash,
        amount=price_for_tile("ocr") - 1,
        timestamp=1234567890,
    )

    response = client.get("/unlock/ocr", params={"wallet": wallet, "tx_hash": "0xtx"})
    assert response.status_code == 402


# --- compute_request_hash regression: the payer-binding fix -----------------


def test_two_wallets_unlocking_same_tile_get_different_hashes():
    resource = "0x00000000000000000000000000000000001234"
    hash_a = compute_request_hash(resource, "ocr", "0xAAA", "")
    hash_b = compute_request_hash(resource, "ocr", "0xBBB", "")
    assert hash_a != hash_b
