from unittest.mock import patch

from app.memory import GOAL_LOG_CAP, RECENT_TURNS_CAP, InMemoryMemoryStore, MemoryBlob, format_memory_context
from tests.test_llm import make_settings


def test_get_memory_returns_empty_blob_for_unknown_user():
    store = InMemoryMemoryStore(make_settings())
    blob = store.get_memory("did:privy:unknown")
    assert blob.recent_turns == []
    assert blob.summary == ""
    assert blob.goal_log == []


def test_recent_turns_persist_within_cap():
    store = InMemoryMemoryStore(make_settings())
    store.append_chat_turn("did:privy:u1", "user", "hello")
    store.append_chat_turn("did:privy:u1", "assistant", "hi there")

    blob = store.get_memory("did:privy:u1")
    assert [(t.role, t.content) for t in blob.recent_turns] == [
        ("user", "hello"),
        ("assistant", "hi there"),
    ]


def test_recent_turns_cap_triggers_compaction():
    store = InMemoryMemoryStore(make_settings())

    with patch("app.memory._compact", return_value="compacted summary") as mock_compact:
        for i in range(RECENT_TURNS_CAP + 1):
            store.append_chat_turn("did:privy:u1", "user", f"message {i}")

    mock_compact.assert_called_once()
    blob = store.get_memory("did:privy:u1")
    assert blob.summary == "compacted summary"
    assert len(blob.recent_turns) < RECENT_TURNS_CAP + 1


def test_goal_log_is_capped():
    store = InMemoryMemoryStore(make_settings())
    for i in range(GOAL_LOG_CAP + 5):
        store.append_goal("did:privy:u1", f"goal {i}", "done", tiles_used=["ocr"])

    blob = store.get_memory("did:privy:u1")
    assert len(blob.goal_log) == GOAL_LOG_CAP
    # Oldest entries are dropped, newest kept.
    assert blob.goal_log[-1].goal == f"goal {GOAL_LOG_CAP + 4}"


def test_append_goal_does_not_touch_recent_turns():
    store = InMemoryMemoryStore(make_settings())
    store.append_chat_turn("did:privy:u1", "user", "hello")
    store.append_goal("did:privy:u1", "validated an IBAN", "valid", tiles_used=["iban"])

    blob = store.get_memory("did:privy:u1")
    assert len(blob.recent_turns) == 1
    assert len(blob.goal_log) == 1


def test_memory_scoped_per_user():
    store = InMemoryMemoryStore(make_settings())
    store.append_chat_turn("did:privy:u1", "user", "my name is Ada")
    store.append_chat_turn("did:privy:u2", "user", "my name is Grace")

    assert store.get_memory("did:privy:u1").recent_turns[0].content == "my name is Ada"
    assert store.get_memory("did:privy:u2").recent_turns[0].content == "my name is Grace"


def test_format_memory_context_returns_none_for_empty_blob():
    assert format_memory_context(MemoryBlob()) is None


def test_format_memory_context_includes_summary_and_recent_turns():
    store = InMemoryMemoryStore(make_settings())
    store.append_chat_turn("did:privy:u1", "user", "my name is Ada")
    blob = store.get_memory("did:privy:u1")

    context = format_memory_context(blob)

    assert context is not None
    assert "my name is Ada" in context
