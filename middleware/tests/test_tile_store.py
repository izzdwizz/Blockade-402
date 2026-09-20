import time

from app.tile_store import InMemoryTileUnlockStore


def test_unlock_persists_within_ttl():
    store = InMemoryTileUnlockStore(3600)
    store.mark_unlocked("0xAbC", "ocr")
    assert store.is_unlocked("0xabc", "ocr") is True


def test_unlock_expires_after_ttl(monkeypatch):
    store = InMemoryTileUnlockStore(60)
    current_time = 1_000_000.0
    monkeypatch.setattr(time, "time", lambda: current_time)

    store.mark_unlocked("0xAbC", "ocr")
    assert store.is_unlocked("0xAbC", "ocr") is True

    current_time += 61
    assert store.is_unlocked("0xAbC", "ocr") is False


def test_wallet_lookup_is_case_insensitive():
    store = InMemoryTileUnlockStore(3600)
    store.mark_unlocked("0xABCDEF", "ocr")
    assert store.is_unlocked("0xabcdef", "ocr") is True


def test_unlock_scoped_per_tile():
    store = InMemoryTileUnlockStore(3600)
    store.mark_unlocked("0xAbC", "ocr")
    assert store.is_unlocked("0xAbC", "ocr") is True
    assert store.is_unlocked("0xAbC", "qr") is False


def test_unlock_scoped_per_wallet():
    store = InMemoryTileUnlockStore(3600)
    store.mark_unlocked("0xAAA", "ocr")
    assert store.is_unlocked("0xAAA", "ocr") is True
    assert store.is_unlocked("0xBBB", "ocr") is False
