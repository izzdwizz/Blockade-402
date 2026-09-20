import time

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


def generate_es256_keypair() -> tuple[str, str]:
    """Returns (private_pem, public_pem) for a real ES256 keypair — used to
    sign tokens the way Privy would, and verify them the way the app does,
    without mocking PyJWT itself."""
    private_key = ec.generate_private_key(ec.SECP256R1())
    private_pem = private_key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()
    public_pem = private_key.public_key().public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    return private_pem, public_pem


@pytest.fixture
def privy_keypair() -> tuple[str, str]:
    """Fresh ES256 keypair per test."""
    return generate_es256_keypair()


def make_privy_token(
    private_pem: str,
    *,
    sub: str = "did:privy:test-user",
    aud: str = "app-123",
    iss: str = "privy.io",
    exp_delta_seconds: float = 3600,
) -> str:
    now = time.time()
    return jwt.encode(
        {"sub": sub, "iss": iss, "aud": aud, "iat": now, "exp": now + exp_delta_seconds},
        private_pem,
        algorithm="ES256",
    )
