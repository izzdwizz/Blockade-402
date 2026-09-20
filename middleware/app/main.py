from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import APIError

from .chain import ChainClient, get_chain_client
from .config import Settings, get_settings
from .llm import ask_llm
from .models import AskResponse, UnlockResponse
from .tile_store import TileUnlockStore, get_tile_unlock_store
from .tiles import TILES
from .x402 import PaymentVerificationError, build_challenge, verify_payment

app = FastAPI(title="Arc-402")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def get_settings_dep() -> Settings:
    return get_settings()


def get_chain_client_dep() -> ChainClient:
    return get_chain_client()


def get_tile_store_dep() -> TileUnlockStore:
    return get_tile_unlock_store()


@app.get("/unlock/{tile_id}")
def unlock(
    tile_id: str,
    wallet: str,
    tx_hash: str | None = None,
    settings: Settings = Depends(get_settings_dep),
    chain_client: ChainClient = Depends(get_chain_client_dep),
    store: TileUnlockStore = Depends(get_tile_store_dep),
):
    if tile_id not in TILES:
        return JSONResponse(status_code=404, content={"error": "unknown tile"})

    if store.is_unlocked(wallet, tile_id):
        return UnlockResponse(unlocked=True)

    if tx_hash is None:
        terms = build_challenge(settings, tile_id, wallet, "")
        return JSONResponse(status_code=402, content=terms.model_dump())

    try:
        verify_payment(chain_client, settings, tx_hash, tile_id, wallet, "")
    except PaymentVerificationError as exc:
        terms = build_challenge(settings, tile_id, wallet, "")
        return JSONResponse(status_code=402, content={**terms.model_dump(), "error": str(exc)})

    store.mark_unlocked(wallet, tile_id)
    return UnlockResponse(unlocked=True)


@app.get("/ask")
def ask(
    prompt: str,
    wallet: str | None = None,
    settings: Settings = Depends(get_settings_dep),
    store: TileUnlockStore = Depends(get_tile_store_dep),
):
    # Chat unlocks go through /unlock/chat like every other tile — /ask never
    # verifies a payment itself, it only checks whether this wallet is already
    # unlocked. The frontend's own daily counter decides what to show the
    # user before ever calling this; the server's is_paid check is what
    # actually decides full vs brief.
    is_paid = wallet is not None and store.is_unlocked(wallet, "chat")

    try:
        answer = ask_llm(settings, prompt, full=is_paid)
    except APIError as exc:
        # Caught here (rather than left to propagate) so CORSMiddleware still gets
        # a chance to attach headers — Starlette drops them on unhandled exceptions.
        return JSONResponse(status_code=502, content={"error": f"LLM provider error: {exc}"})

    return AskResponse(response=answer, tier="paid" if is_paid else "free")
