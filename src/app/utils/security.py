import secrets
from argon2 import PasswordHasher
from werkzeug.security import generate_password_hash, check_password_hash

# Use argon2 for password hashing (recommended)
ph = PasswordHasher()

def hash_password(password: str) -> str:
    """Hash a password using argon2."""
    return ph.hash(password)

def verify_password(password_hash: str, password: str) -> bool:
    """Verify a password against its hash."""
    try:
        ph.verify(password_hash, password)
        return True
    except Exception:
        # Fallback to werkzeug for legacy passwords
        try:
            return check_password_hash(password_hash, password)
        except Exception:
            return False

def generate_token(length: int = 32) -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(length)

def generate_order_token() -> str:
    """Generate a secure token for order access."""
    return secrets.token_urlsafe(32)

