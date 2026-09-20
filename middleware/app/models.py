from pydantic import BaseModel


class PaymentTerms(BaseModel):
    amount: str
    recipient: str
    chain_id: int
    resource: str
    request_hash: str


class AskResponse(BaseModel):
    response: str
    tier: str  # "free" | "paid"


class UnlockResponse(BaseModel):
    unlocked: bool
