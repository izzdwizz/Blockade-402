import jwt

from .config import Settings


def verify_privy_token(authorization: str | None, settings: Settings) -> str | None:
    """Returns the verified Privy DID (the `sub` claim) or None.

    Never raises — a missing header, malformed header, expired/invalid
    signature, wrong issuer/audience, or an unconfigured verification key on
    this deployment all degrade to None. Auth failure here is not a 401 for
    the caller; it just means the request proceeds without memory, since
    memory is additive and never load-bearing for the core chat answer.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    if not settings.privy_verification_key or not settings.privy_app_id:
        return None

    token = authorization.removeprefix("Bearer ").strip()
    try:
        claims = jwt.decode(
            token,
            settings.privy_verification_key,
            algorithms=["ES256"],
            issuer="privy.io",
            audience=settings.privy_app_id,
        )
    except jwt.PyJWTError:
        return None

    sub = claims.get("sub")
    return sub if isinstance(sub, str) and sub else None
