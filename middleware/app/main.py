from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .chain import ChainClient, get_chain_client
from .config import Settings, get_settings
from .llm import ask_llm
from .models import AskResponse
from .session import PaidSessionStore, get_session_store
from .x402 import PaymentVerificationError, build_challenge, verify_payment

app = FastAPI(title="Arc LLM Paywall")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*","http://localhost:5173", "http://localhost:5173/*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def get_settings_dep() -> Settings:
    return get_settings()


def get_chain_client_dep() -> ChainClient:
    return get_chain_client()


def get_session_store_dep() -> PaidSessionStore:
    return get_session_store()


@app.get("/ask")
def ask(
    prompt: str,
    wallet: str | None = None,
    tx_hash: str | None = None,
    settings: Settings = Depends(get_settings_dep),
    chain_client: ChainClient = Depends(get_chain_client_dep),
    sessions: PaidSessionStore = Depends(get_session_store_dep),
):
    is_paid = wallet is not None and sessions.is_paid(wallet)

    if tx_hash is not None and not is_paid:
        try:
            verify_payment(chain_client, settings, tx_hash, prompt)
        except PaymentVerificationError as exc:
            terms = build_challenge(settings, prompt)
            return JSONResponse(status_code=402, content={**terms.model_dump(), "error": str(exc)})
        if wallet is not None:
            sessions.mark_paid(wallet)
        is_paid = True

    if not is_paid and len(prompt) >= settings.free_input_char_cap:
        terms = build_challenge(settings, prompt)
        return JSONResponse(status_code=402, content=terms.model_dump())

    answer = ask_llm(settings, prompt, full=is_paid)
    return AskResponse(response=answer, tier="paid" if is_paid else "free")
