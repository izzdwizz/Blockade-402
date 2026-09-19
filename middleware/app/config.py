import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    arc_rpc_url: str
    contract_address: str
    openai_api_key: str
    resource_address: str
    price_usdc: int  # flat price in USDC base units (6 decimals)
    chain_id: int
    free_input_char_cap: int  # free-tier question length limit
    free_max_tokens: int  # free-tier response length limit
    paid_session_ttl_seconds: int  # how long a wallet stays "paid" after one payment


@lru_cache
def get_settings() -> Settings:
    return Settings(
        arc_rpc_url=os.environ.get("ARC_RPC_URL", ""),
        contract_address=os.environ.get("CONTRACT_ADDRESS", ""),
        openai_api_key=os.environ.get("OPENAI_API_KEY", ""),
        resource_address=os.environ.get("RESOURCE_ADDRESS", ""),
        price_usdc=int(os.environ.get("PRICE_USDC", "10000")),
        chain_id=int(os.environ.get("ARC_CHAIN_ID", "0")),
        free_input_char_cap=int(os.environ.get("FREE_INPUT_CHAR_CAP", "200")),
        free_max_tokens=int(os.environ.get("FREE_MAX_TOKENS", "60")),
        paid_session_ttl_seconds=int(os.environ.get("PAID_SESSION_TTL_SECONDS", "3600")),
    )
