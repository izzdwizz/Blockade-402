from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.chain import ChainClient, PaymentEvent
from app.config import Settings
from app.main import app, get_chain_client_dep, get_settings_dep


def make_settings() -> Settings:
    return Settings(
        arc_rpc_url="http://localhost:8545",
        contract_address="0x0000000000000000000000000000000000dEaD",
        openai_api_key="sk-test",
        resource_address="0x00000000000000000000000000000000001234",
        price_usdc=10_000,
        chain_id=999,
    )


def test_llm_wrapper_returns_text_response():
    from app.llm import ask_llm

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value.choices = [
        MagicMock(message=MagicMock(content="hello from the model"))
    ]

    with patch("app.llm.get_openai_client", return_value=mock_client):
        result = ask_llm(make_settings(), "say hi")

    assert result == "hello from the model"
    mock_client.chat.completions.create.assert_called_once()


def test_llm_only_called_after_verification():
    settings = make_settings()
    mock_chain_client = MagicMock(spec=ChainClient)
    app.dependency_overrides[get_settings_dep] = lambda: settings
    app.dependency_overrides[get_chain_client_dep] = lambda: mock_chain_client
    client = TestClient(app)

    try:
        with patch("app.main.ask_llm") as mock_ask_llm:
            # Unpaid request: no tx_hash at all.
            client.get("/ask", params={"prompt": "hello"})
            mock_ask_llm.assert_not_called()

            # Payment that fails verification (event missing).
            mock_chain_client.mark_tx_used.return_value = True
            mock_chain_client.get_payment_settled_event.return_value = None
            client.get("/ask", params={"prompt": "hello", "tx_hash": "0xabc"})
            mock_ask_llm.assert_not_called()

            # Payment that verifies successfully.
            from app.x402 import compute_request_hash

            mock_chain_client.mark_tx_used.return_value = True
            mock_chain_client.get_payment_settled_event.return_value = PaymentEvent(
                payer="0xPayer",
                resource=settings.resource_address,
                request_hash=compute_request_hash(settings.resource_address, "hello"),
                amount=settings.price_usdc,
                timestamp=1234567890,
            )
            mock_ask_llm.return_value = "42"
            client.get("/ask", params={"prompt": "hello", "tx_hash": "0xdef"})
            mock_ask_llm.assert_called_once()
    finally:
        app.dependency_overrides.clear()
