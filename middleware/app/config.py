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


@lru_cache
def get_settings() -> Settings:
    return Settings(
        arc_rpc_url=os.environ.get("ARC_RPC_URL", ""),
        contract_address=os.environ.get("CONTRACT_ADDRESS", ""),
        openai_api_key=os.environ.get("OPENAI_API_KEY", ""),
        resource_address=os.environ.get("RESOURCE_ADDRESS", ""),
        price_usdc=int(os.environ.get("PRICE_USDC", "10000")),
        chain_id=int(os.environ.get("ARC_CHAIN_ID", "0")),
    )
