from unittest.mock import MagicMock, patch

from app.config import Settings
from app.llm import ask_llm


def make_settings() -> Settings:
    return Settings(
        arc_rpc_url="http://localhost:8545",
        contract_address="0x0000000000000000000000000000000000dEaD",
        openai_api_key="sk-test",
        resource_address="0x00000000000000000000000000000000001234",
        price_usdc=5_000,
        chain_id=999,
        free_input_char_cap=200,
        free_max_tokens=60,
        paid_session_ttl_seconds=3600,
    )


def make_mock_client(content: str) -> MagicMock:
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value.choices = [
        MagicMock(message=MagicMock(content=content))
    ]
    return mock_client


def test_llm_wrapper_returns_text_response():
    mock_client = make_mock_client("hello from the model")

    with patch("app.llm.get_openai_client", return_value=mock_client):
        result = ask_llm(make_settings(), "say hi", full=True)

    assert result == "hello from the model"
    mock_client.chat.completions.create.assert_called_once()


def test_free_tier_caps_response_length_and_adds_system_prompt():
    settings = make_settings()
    mock_client = make_mock_client("short answer")

    with patch("app.llm.get_openai_client", return_value=mock_client):
        ask_llm(settings, "say hi", full=False)

    _, kwargs = mock_client.chat.completions.create.call_args
    assert kwargs["max_tokens"] == settings.free_max_tokens
    assert kwargs["messages"][0]["role"] == "system"


def test_paid_tier_has_no_token_cap():
    mock_client = make_mock_client("a very long answer")

    with patch("app.llm.get_openai_client", return_value=mock_client):
        ask_llm(make_settings(), "say hi", full=True)

    _, kwargs = mock_client.chat.completions.create.call_args
    assert kwargs["max_tokens"] is None
    assert kwargs["messages"] == [{"role": "user", "content": "say hi"}]
