import time
from functools import lru_cache


class PaidSessionStore:
    """Tracks which wallet addresses have an active paid session.

    One verified payment unlocks the paid tier for every call that wallet
    makes until the TTL expires — not just the call that paid — so the
    middleware doesn't need a separate auth system for something this small.
    """

    def __init__(self, ttl_seconds: int):
        self.ttl_seconds = ttl_seconds
        self._paid_until: dict[str, float] = {}

    def is_paid(self, wallet: str) -> bool:
        expiry = self._paid_until.get(wallet.lower())
        return expiry is not None and expiry > time.time()

    def mark_paid(self, wallet: str) -> None:
        self._paid_until[wallet.lower()] = time.time() + self.ttl_seconds


@lru_cache
def get_session_store() -> PaidSessionStore:
    from .config import get_settings

    return PaidSessionStore(get_settings().paid_session_ttl_seconds)
