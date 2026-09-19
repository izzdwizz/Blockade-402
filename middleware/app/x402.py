import hashlib

from .chain import ChainClient
from .config import Settings
from .models import PaymentTerms


class PaymentVerificationError(Exception):
    pass


def compute_request_hash(resource: str, prompt: str) -> str:
    digest = hashlib.sha256(f"{resource}:{prompt}".encode()).hexdigest()
    return "0x" + digest


def build_challenge(settings: Settings, prompt: str) -> PaymentTerms:
    request_hash = compute_request_hash(settings.resource_address, prompt)
    return PaymentTerms(
        amount=str(settings.price_usdc),
        recipient=settings.resource_address,
        chain_id=settings.chain_id,
        resource=settings.resource_address,
        request_hash=request_hash,
    )


def verify_payment(chain_client: ChainClient, settings: Settings, tx_hash: str, prompt: str) -> None:
    """Raises PaymentVerificationError unless tx_hash proves a fresh, sufficient
    payment for exactly this prompt."""
    if not chain_client.mark_tx_used(tx_hash):
        raise PaymentVerificationError("transaction hash already used")

    event = chain_client.get_payment_settled_event(tx_hash)
    if event is None:
        raise PaymentVerificationError("no PaymentSettled event found for tx hash")

    expected_hash = compute_request_hash(settings.resource_address, prompt)
    if event.request_hash != expected_hash:
        raise PaymentVerificationError("request hash mismatch")

    if event.amount < settings.price_usdc:
        raise PaymentVerificationError("underpayment")
