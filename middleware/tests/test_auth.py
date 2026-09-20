from app.auth import verify_privy_token
from app.config import Settings
from tests.conftest import generate_es256_keypair, make_privy_token
from tests.test_llm import make_settings


def _settings_with_key(public_pem: str, app_id: str = "app-123") -> Settings:
    return make_settings(privy_app_id=app_id, privy_verification_key=public_pem)


def test_valid_token_returns_sub(privy_keypair):
    private_pem, public_pem = privy_keypair
    token = make_privy_token(private_pem, sub="did:privy:abc123")

    result = verify_privy_token(f"Bearer {token}", _settings_with_key(public_pem))

    assert result == "did:privy:abc123"


def test_missing_header_returns_none(privy_keypair):
    _, public_pem = privy_keypair
    assert verify_privy_token(None, _settings_with_key(public_pem)) is None


def test_header_without_bearer_prefix_returns_none(privy_keypair):
    private_pem, public_pem = privy_keypair
    token = make_privy_token(private_pem)
    assert verify_privy_token(token, _settings_with_key(public_pem)) is None


def test_expired_token_returns_none(privy_keypair):
    private_pem, public_pem = privy_keypair
    token = make_privy_token(private_pem, exp_delta_seconds=-3600)

    assert verify_privy_token(f"Bearer {token}", _settings_with_key(public_pem)) is None


def test_wrong_audience_returns_none(privy_keypair):
    private_pem, public_pem = privy_keypair
    token = make_privy_token(private_pem, aud="some-other-app")

    assert verify_privy_token(f"Bearer {token}", _settings_with_key(public_pem)) is None


def test_wrong_issuer_returns_none(privy_keypair):
    private_pem, public_pem = privy_keypair
    token = make_privy_token(private_pem, iss="not-privy.io")

    assert verify_privy_token(f"Bearer {token}", _settings_with_key(public_pem)) is None


def test_signature_from_different_keypair_is_rejected(privy_keypair):
    # Sign with one keypair, verify against an unrelated one — tampering check.
    private_pem, _ = privy_keypair
    token = make_privy_token(private_pem)
    _, unrelated_public_pem = generate_es256_keypair()

    assert verify_privy_token(f"Bearer {token}", _settings_with_key(unrelated_public_pem)) is None


def test_unconfigured_verification_key_returns_none(privy_keypair):
    private_pem, _ = privy_keypair
    token = make_privy_token(private_pem)

    assert verify_privy_token(f"Bearer {token}", make_settings()) is None
