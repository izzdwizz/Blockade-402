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
    chain_id: int
    free_max_tokens: int  # free/brief-tier response length limit
    paid_session_ttl_seconds: int  # how long a wallet stays unlocked for a tile after paying
    cors_origins: list[str]
    redis_url: str  # Render injects this automatically when a Key Value service is linked
    privy_app_id: str
    privy_verification_key: str  # PEM public key (ES256) from Privy Dashboard > Configuration > App settings


@lru_cache
def get_settings() -> Settings:
    return Settings(
        arc_rpc_url=os.environ.get("ARC_RPC_URL", ""),
        contract_address=os.environ.get("CONTRACT_ADDRESS", ""),
        openai_api_key=os.environ.get("OPENAI_API_KEY", ""),
        llm_base_url=os.environ.get("LLM_BASE_URL", ""),
        llm_model=os.environ.get("LLM_MODEL", "gpt-4o-mini"),
        resource_address=os.environ.get("RESOURCE_ADDRESS", ""),
        chain_id=int(os.environ.get("ARC_CHAIN_ID", "0")),
        free_max_tokens=int(os.environ.get("FREE_MAX_TOKENS", "60")),
        paid_session_ttl_seconds=int(os.environ.get("PAID_SESSION_TTL_SECONDS", "3600")),
        cors_origins=[
            origin.strip()
            for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
            if origin.strip()
        ],
        redis_url=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
        privy_app_id=os.environ.get("PRIVY_APP_ID", ""),
        # Stored in .env as one line with literal \n escapes (not real
        # newlines — those get mangled by some dashboard env-var UIs); turn
        # them into real newlines here before handing the PEM to PyJWT.
        privy_verification_key=os.environ.get("PRIVY_VERIFICATION_KEY", "").replace("\\n", "\n"),
    )
