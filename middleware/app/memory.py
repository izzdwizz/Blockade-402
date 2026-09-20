import json
import time
from dataclasses import asdict, dataclass, field
from functools import lru_cache
from typing import Protocol

from .config import Settings
from .llm import get_openai_client

RECENT_TURNS_CAP = 10  # raw messages kept verbatim (5 user/assistant pairs)
GOAL_LOG_CAP = 20  # bounded list for the future agent tile


@dataclass
class ChatTurn:
    role: str  # "user" | "assistant"
    content: str


@dataclass
class GoalEntry:
    goal: str
    result: str
    tiles_used: list[str] = field(default_factory=list)
    completed_at: float = field(default_factory=time.time)


@dataclass
class MemoryBlob:
    recent_turns: list[ChatTurn] = field(default_factory=list)
    summary: str = ""
    # Separate from recent_turns/summary so a future agent tile can log
    # completed actions here without touching chat's own turn history —
    # same outer blob/key, independent inner lists.
    goal_log: list[GoalEntry] = field(default_factory=list)
    updated_at: float = field(default_factory=time.time)


def _blob_from_dict(data: dict) -> MemoryBlob:
    return MemoryBlob(
        recent_turns=[ChatTurn(**t) for t in data.get("recent_turns", [])],
        summary=data.get("summary", ""),
        goal_log=[GoalEntry(**g) for g in data.get("goal_log", [])],
        updated_at=data.get("updated_at", time.time()),
    )


def _compact(settings: Settings, existing_summary: str, turns_to_fold: list[ChatTurn]) -> str:
    """Folds retired turns into the rolling summary via one extra LLM call.
    Not ask_llm itself — that function's free/brief/full branching is
    answer-shaped, this is summarization-shaped."""
    formatted = "\n".join(f"{t.role}: {t.content}" for t in turns_to_fold)
    prompt = (
        "You maintain a compact rolling summary of a user's conversation history. "
        "Given the existing summary and a batch of older raw turns being retired "
        "from the transcript, produce an updated summary that preserves useful "
        "facts, preferences, and context in under 200 words. Do not include a "
        "preamble — respond with only the summary text.\n\n"
        f"Existing summary: {existing_summary or '(none yet)'}\n"
        f"Turns to fold in:\n{formatted}"
    )
    client = get_openai_client(settings.openai_api_key, settings.llm_base_url)
    completion = client.chat.completions.create(
        model=settings.llm_model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
    )
    return completion.choices[0].message.content.strip()


def _compact_if_needed(settings: Settings, blob: MemoryBlob) -> None:
    if len(blob.recent_turns) <= RECENT_TURNS_CAP:
        return
    midpoint = len(blob.recent_turns) // 2
    older, newer = blob.recent_turns[:midpoint], blob.recent_turns[midpoint:]
    blob.summary = _compact(settings, blob.summary, older)
    blob.recent_turns = newer


class MemoryStore(Protocol):
    def get_memory(self, user_id: str) -> MemoryBlob: ...
    def append_chat_turn(self, user_id: str, role: str, content: str) -> None: ...
    def append_goal(self, user_id: str, goal: str, result: str, tiles_used: list[str]) -> None: ...


class InMemoryMemoryStore:
    """Dict-backed — used in tests and as a local-dev fallback with no Redis."""

    def __init__(self, settings: Settings):
        self._settings = settings
        self._blobs: dict[str, MemoryBlob] = {}

    def get_memory(self, user_id: str) -> MemoryBlob:
        return self._blobs.get(user_id, MemoryBlob())

    def append_chat_turn(self, user_id: str, role: str, content: str) -> None:
        blob = self._blobs.setdefault(user_id, MemoryBlob())
        blob.recent_turns.append(ChatTurn(role=role, content=content))
        _compact_if_needed(self._settings, blob)
        blob.updated_at = time.time()

    def append_goal(self, user_id: str, goal: str, result: str, tiles_used: list[str]) -> None:
        blob = self._blobs.setdefault(user_id, MemoryBlob())
        blob.goal_log.append(GoalEntry(goal=goal, result=result, tiles_used=tiles_used))
        blob.goal_log = blob.goal_log[-GOAL_LOG_CAP:]
        blob.updated_at = time.time()


class RedisMemoryStore:
    """One persistent key per user — no TTL, matching "persistent memory"
    literally. Per-user blobs stay small regardless of account age because
    list sizes are capped, not because of expiry."""

    def __init__(self, redis_client, settings: Settings):
        self._redis = redis_client
        self._settings = settings

    def get_memory(self, user_id: str) -> MemoryBlob:
        raw = self._redis.get(_key(user_id))
        if raw is None:
            return MemoryBlob()
        return _blob_from_dict(json.loads(raw))

    def append_chat_turn(self, user_id: str, role: str, content: str) -> None:
        blob = self.get_memory(user_id)
        blob.recent_turns.append(ChatTurn(role=role, content=content))
        _compact_if_needed(self._settings, blob)
        blob.updated_at = time.time()
        self._save(user_id, blob)

    def append_goal(self, user_id: str, goal: str, result: str, tiles_used: list[str]) -> None:
        blob = self.get_memory(user_id)
        blob.goal_log.append(GoalEntry(goal=goal, result=result, tiles_used=tiles_used))
        blob.goal_log = blob.goal_log[-GOAL_LOG_CAP:]
        blob.updated_at = time.time()
        self._save(user_id, blob)

    def _save(self, user_id: str, blob: MemoryBlob) -> None:
        self._redis.set(_key(user_id), json.dumps(asdict(blob)))


def _key(user_id: str) -> str:
    return f"arc402:memory:{user_id}"


def format_memory_context(blob: MemoryBlob) -> str | None:
    if not blob.summary and not blob.recent_turns and not blob.goal_log:
        return None

    parts = ["You have memory of this user's past interactions with this app."]
    if blob.summary:
        parts.append(f"Summary of earlier context: {blob.summary}")
    if blob.recent_turns:
        recent = "\n".join(f"{t.role}: {t.content}" for t in blob.recent_turns)
        parts.append(f"Recent turns:\n{recent}")
    if blob.goal_log:
        goals = "\n".join(f"- {g.goal} -> {g.result}" for g in blob.goal_log[-5:])
        parts.append(f"Recently completed actions in other tools:\n{goals}")
    return "\n\n".join(parts)


@lru_cache
def get_memory_store() -> MemoryStore:
    import redis as redis_lib

    from .config import get_settings

    settings = get_settings()
    client = redis_lib.from_url(settings.redis_url, decode_responses=True)
    return RedisMemoryStore(client, settings)
