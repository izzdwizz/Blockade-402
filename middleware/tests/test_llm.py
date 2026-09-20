from unittest.mock import MagicMock, patch

from app.config import Settings
from app.llm import ask_llm


def make_settings(**overrides) -> Settings:
    defaults = dict(
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
    )
    defaults.update(overrides)
    return Settings(**defaults)


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


def test_uses_configured_model_and_base_url():
    settings = make_settings(
        llm_base_url="https://api.groq.com/openai/v1", llm_model="openai/gpt-oss-20b"
    )
    mock_client = make_mock_client("hi")

    with patch("app.llm.get_openai_client", return_value=mock_client) as mock_get_client:
        ask_llm(settings, "say hi", full=True)

    mock_get_client.assert_called_once_with("sk-test", "https://api.groq.com/openai/v1")
    _, kwargs = mock_client.chat.completions.create.call_args
    assert kwargs["model"] == "openai/gpt-oss-20b"


def test_gpt_oss_models_get_low_reasoning_effort():
    settings = make_settings(
        llm_base_url="https://api.groq.com/openai/v1",
        llm_model="openai/gpt-oss-20b",
        free_max_tokens=150,
    )
    mock_client = make_mock_client("hi")

    with patch("app.llm.get_openai_client", return_value=mock_client):
        ask_llm(settings, "say hi", full=False)

    _, kwargs = mock_client.chat.completions.create.call_args
    assert kwargs["reasoning_effort"] == "low"


def test_non_gpt_oss_models_get_no_reasoning_effort_param():
    mock_client = make_mock_client("hi")

    with patch("app.llm.get_openai_client", return_value=mock_client):
        ask_llm(make_settings(), "say hi", full=False)

    _, kwargs = mock_client.chat.completions.create.call_args
    assert "reasoning_effort" not in kwargs


def test_paid_tier_has_no_token_cap():
    mock_client = make_mock_client("a very long answer")

    with patch("app.llm.get_openai_client", return_value=mock_client):
        ask_llm(make_settings(), "say hi", full=True)

    _, kwargs = mock_client.chat.completions.create.call_args
    assert kwargs["max_tokens"] is None
    assert kwargs["messages"] == [{"role": "user", "content": "say hi"}]
