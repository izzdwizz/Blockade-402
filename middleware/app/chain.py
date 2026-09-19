from dataclasses import dataclass
from functools import lru_cache

from web3 import Web3

from .config import Settings, get_settings

PAYMENT_SETTLED_ABI = [
    {
        "anonymous": False,
        "type": "event",
        "name": "PaymentSettled",
        "inputs": [
            {"name": "payer", "type": "address", "indexed": True},
            {"name": "resource", "type": "address", "indexed": True},
            {"name": "requestHash", "type": "bytes32", "indexed": True},
            {"name": "amount", "type": "uint256", "indexed": False},
            {"name": "timestamp", "type": "uint256", "indexed": False},
        ],
    }
]


@dataclass
class PaymentEvent:
    payer: str
    resource: str
    request_hash: str
    amount: int
    timestamp: int


class ChainClient:
    """Reads PaymentSettled events straight off Arc's RPC for a given tx hash.

    Tracks which tx hashes have already been used to serve a request in-memory —
    the contract itself blocks double-paying a requestHash, but the middleware
    also needs to stop the same successful tx from being replayed to get served twice.
    """

    def __init__(self, w3: Web3, contract_address: str):
        self.w3 = w3
        checksum_address = Web3.to_checksum_address(contract_address)
        self.contract = w3.eth.contract(address=checksum_address, abi=PAYMENT_SETTLED_ABI)
        self._used_tx_hashes: set[str] = set()

    def get_payment_settled_event(self, tx_hash: str) -> PaymentEvent | None:
        receipt = self.w3.eth.get_transaction_receipt(tx_hash)
        events = self.contract.events.PaymentSettled().process_receipt(receipt)
        if not events:
            return None
        args = events[0]["args"]
        return PaymentEvent(
            payer=args["payer"],
            resource=args["resource"],
            request_hash="0x" + args["requestHash"].hex(),
            amount=int(args["amount"]),
            timestamp=int(args["timestamp"]),
        )

    def mark_tx_used(self, tx_hash: str) -> bool:
        """Returns True if this is the first time tx_hash has been seen."""
        if tx_hash in self._used_tx_hashes:
            return False
        self._used_tx_hashes.add(tx_hash)
        return True


@lru_cache
def get_chain_client(settings: Settings | None = None) -> ChainClient:
    settings = settings or get_settings()
    w3 = Web3(Web3.HTTPProvider(settings.arc_rpc_url))
    return ChainClient(w3, settings.contract_address)
