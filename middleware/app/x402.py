import hashlib

from .chain import ChainClient
from .config import Settings
from .models import PaymentTerms
from .tiles import price_for_tile


class PaymentVerificationError(Exception):
    pass


def compute_request_hash(resource: str, tile_id: str, wallet: str, payload: str) -> str:
    """Ties a payment to a specific resource, tile, payer, and payload.

    The wallet must be folded in: the deployed contract's settledRequests
    mapping is global, not scoped per-payer, so a hash that only depends on
    (resource, payload) collides across different payers whenever payload is
    identical — guaranteed for tile unlocks, which have no per-request text
    (payload is always ""), and possible for chat if two wallets ask the same
    question. Without this, the second payer's on-chain pay() call reverts
    with RequestAlreadySettled even though they're a different payer.
    """
    digest = hashlib.sha256(
        f"{resource}:{tile_id}:{wallet.lower()}:{payload}".encode()
    ).hexdigest()
    return "0x" + digest


def build_challenge(settings: Settings, tile_id: str, wallet: str, payload: str) -> PaymentTerms:
    request_hash = compute_request_hash(settings.resource_address, tile_id, wallet, payload)
    return PaymentTerms(
        amount=str(price_for_tile(tile_id)),
        recipient=settings.resource_address,
        chain_id=settings.chain_id,
        resource=settings.resource_address,
        request_hash=request_hash,
    )


def verify_payment(
    chain_client: ChainClient,
    settings: Settings,
    tx_hash: str,
    tile_id: str,
    wallet: str,
    payload: str,
) -> None:
    """Raises PaymentVerificationError unless tx_hash proves a fresh, sufficient
    payment by this wallet for exactly this tile/payload."""
    if not chain_client.mark_tx_used(tx_hash):
        raise PaymentVerificationError("transaction hash already used")

    event = chain_client.get_payment_settled_event(tx_hash)
    if event is None:
        raise PaymentVerificationError("no PaymentSettled event found for tx hash")

    if event.payer.lower() != wallet.lower():
        raise PaymentVerificationError("payer mismatch")

    expected_hash = compute_request_hash(settings.resource_address, tile_id, wallet, payload)
    if event.request_hash != expected_hash:
        raise PaymentVerificationError("request hash mismatch")

    price = price_for_tile(tile_id)
    if event.amount < price:
        raise PaymentVerificationError("underpayment")
