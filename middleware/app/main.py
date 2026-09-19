from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse

from .chain import ChainClient, get_chain_client
from .config import Settings, get_settings
from .llm import ask_llm
from .models import AskResponse
from .x402 import PaymentVerificationError, build_challenge, verify_payment

app = FastAPI(title="Arc LLM Paywall")


def get_settings_dep() -> Settings:
    return get_settings()


def get_chain_client_dep() -> ChainClient:
    return get_chain_client()


@app.get("/ask")
def ask(
    prompt: str,
    tx_hash: str | None = None,
    settings: Settings = Depends(get_settings_dep),
    chain_client: ChainClient = Depends(get_chain_client_dep),
):
    terms = build_challenge(settings, prompt)

    if tx_hash is None:
        return JSONResponse(status_code=402, content=terms.model_dump())

    try:
        verify_payment(chain_client, settings, tx_hash, prompt)
    except PaymentVerificationError as exc:
        return JSONResponse(status_code=402, content={**terms.model_dump(), "error": str(exc)})

    answer = ask_llm(settings, prompt)
    return AskResponse(response=answer)
