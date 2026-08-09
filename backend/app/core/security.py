"""
app/core/security.py
--------------------
JWT helpers + FastAPI auth dependencies + shared slowapi rate limiter.

Import `get_current_user` / `require_admin` / `limiter` from here — never
define them inline in individual endpoint files.
"""

import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from slowapi import Limiter
from slowapi.util import get_remote_address

# ─────────────────────────────────────────────────────────────────────────────
# Configuration — must be set in the environment before import
# ─────────────────────────────────────────────────────────────────────────────

_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
if not _SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not set. "
        "Add it to your .env file before starting the server."
    )

_ALGORITHM = "HS256"
_ACCESS_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
_REFRESH_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# ─────────────────────────────────────────────────────────────────────────────
# Rate limiter (shared instance — registered on app.state.limiter in main.py)
# ─────────────────────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)

# ─────────────────────────────────────────────────────────────────────────────
# Token creation
# ─────────────────────────────────────────────────────────────────────────────


def create_access_token(email: str, role: str) -> str:
    """Create a short-lived access JWT."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=_ACCESS_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, _SECRET_KEY, algorithm=_ALGORITHM)


def create_refresh_token(email: str, role: str) -> str:
    """Create a long-lived refresh JWT."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "role": role,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=_REFRESH_EXPIRE_DAYS),
    }
    return jwt.encode(payload, _SECRET_KEY, algorithm=_ALGORITHM)


# ─────────────────────────────────────────────────────────────────────────────
# Token decoding
# ─────────────────────────────────────────────────────────────────────────────


def decode_token(token: str, expected_type: str = "access") -> dict:
    """
    Decode and validate a JWT.

    Raises HTTPException 401 on:
      - Expired signature
      - Invalid token (any other JWT error)
      - Wrong token type (prevents a refresh token being used as an access token)
    """
    try:
        payload = jwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Expected token type '{expected_type}', got '{payload.get('type')}'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI dependencies
# ─────────────────────────────────────────────────────────────────────────────

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict:
    """
    FastAPI dependency — extracts and validates the Bearer access token.

    Returns {"email": ..., "role": ...} for a valid token.
    Raises HTTPException 401 (with our own message, not FastAPI's default)
    when the token is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials, expected_type="access")
    return {"email": payload["sub"], "role": payload["role"]}


async def require_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    FastAPI dependency — like get_current_user but additionally enforces
    that the caller has the 'admin' role.  Returns the same user dict.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
