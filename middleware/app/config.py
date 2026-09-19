import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Loads middleware/.env into the process environment on import, so `uvicorn
# app.main:app` picks up .env without the caller having to `source .env` first —
# and, critically, so a plain `--reload` restart re-reads the file automatically.
# Path is resolved relative to this file (not CWD) so it works regardless of
# which directory uvicorn is launched from. override=True makes the file
# authoritative over any stale value left in the shell from a previous manual
# `export`/`source .env`.
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env", override=True)


@dataclass(frozen=True)
class Settings:
    arc_rpc_url: str
    contract_address: str
    openai_api_key: str
    llm_base_url: str  # empty = OpenAI's default; set to point at an OpenAI-compatible provider (e.g. Groq)
    llm_model: str
    resource_address: str
    price_usdc: int  # flat price in USDC base units (6 decimals)
    chain_id: int
    free_input_char_cap: int  # free-tier question length limit
    free_max_tokens: int  # free-tier response length limit
    paid_session_ttl_seconds: int  # how long a wallet stays "paid" after one payment
    cors_origins: list[str]


@lru_cache
def get_settings() -> Settings:
    return Settings(
        arc_rpc_url=os.environ.get("ARC_RPC_URL", ""),
        contract_address=os.environ.get("CONTRACT_ADDRESS", ""),
        openai_api_key=os.environ.get("OPENAI_API_KEY", ""),
        llm_base_url=os.environ.get("LLM_BASE_URL", ""),
        llm_model=os.environ.get("LLM_MODEL", "gpt-4o-mini"),
        resource_address=os.environ.get("RESOURCE_ADDRESS", ""),
        price_usdc=int(os.environ.get("PRICE_USDC", "10000")),
        chain_id=int(os.environ.get("ARC_CHAIN_ID", "0")),
        free_input_char_cap=int(os.environ.get("FREE_INPUT_CHAR_CAP", "200")),
        free_max_tokens=int(os.environ.get("FREE_MAX_TOKENS", "60")),
        paid_session_ttl_seconds=int(os.environ.get("PAID_SESSION_TTL_SECONDS", "3600")),
        cors_origins=[
            origin.strip()
            for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
            if origin.strip()
        ],
    )
