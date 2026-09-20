import time
from functools import lru_cache
from typing import Protocol


class TileUnlockStore(Protocol):
    def is_unlocked(self, wallet: str, tile_id: str) -> bool: ...
    def mark_unlocked(self, wallet: str, tile_id: str) -> None: ...


def _key(wallet: str, tile_id: str) -> str:
    return f"arc402:unlock:{tile_id}:{wallet.lower()}"


class InMemoryTileUnlockStore:
    """Dict-backed — used in tests and as a local-dev fallback with no Redis."""

    def __init__(self, ttl_seconds: int):
        self.ttl_seconds = ttl_seconds
        self._unlocked_until: dict[str, float] = {}

    def is_unlocked(self, wallet: str, tile_id: str) -> bool:
        expiry = self._unlocked_until.get(_key(wallet, tile_id))
        return expiry is not None and expiry > time.time()

    def mark_unlocked(self, wallet: str, tile_id: str) -> None:
        self._unlocked_until[_key(wallet, tile_id)] = time.time() + self.ttl_seconds


class RedisTileUnlockStore:
    """One verified payment unlocks a tile for every call that wallet makes
    until the TTL expires — not just the call that paid. Redis handles expiry
    natively via SETEX, and (unlike the in-memory store) survives a redeploy."""

    def __init__(self, redis_client, ttl_seconds: int):
        self._redis = redis_client
        self.ttl_seconds = ttl_seconds

    def is_unlocked(self, wallet: str, tile_id: str) -> bool:
        return self._redis.exists(_key(wallet, tile_id)) == 1

    def mark_unlocked(self, wallet: str, tile_id: str) -> None:
        self._redis.setex(_key(wallet, tile_id), self.ttl_seconds, "1")


@lru_cache
def get_tile_unlock_store() -> TileUnlockStore:
    import redis as redis_lib

    from .config import get_settings

    settings = get_settings()
    client = redis_lib.from_url(settings.redis_url, decode_responses=True)
    return RedisTileUnlockStore(client, settings.paid_session_ttl_seconds)
