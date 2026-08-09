"""
backend/app/api/endpoints/auth.py
----------------------------------
Authentication endpoints with JWT issuance, refresh cookie, and rate limiting.

Token flow:
  - access_token  → Bearer header, short-lived (30 min)
  - refresh_token → httpOnly cookie (path=/api/refresh), long-lived (7 days)

The slowapi `limiter` instance is imported from core.security so it can be
registered on app.state in main.py.
"""

import os
import secrets

import httpx
import pandas as pd
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from werkzeug.security import check_password_hash, generate_password_hash

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    limiter,
)
from app.db.mongodb import get_database
from app.schemas.auth import (
    ChangePassword,
    TokenResponse,
    UserLogin,
    UserOut,
    UserSignup,
)

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

_IS_PRODUCTION = os.getenv("ENV", "").lower() == "production"
_REFRESH_COOKIE_NAME = "refresh_token"
_REFRESH_COOKIE_PATH = "/api/refresh"


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Attach the refresh token as an httpOnly cookie to the response."""
    response.set_cookie(
        key=_REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_IS_PRODUCTION,
        samesite="strict",
        path=_REFRESH_COOKIE_PATH,
        max_age=7 * 24 * 60 * 60,  # 7 days in seconds
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Remove the refresh token cookie."""
    response.delete_cookie(
        key=_REFRESH_COOKIE_NAME,
        path=_REFRESH_COOKIE_PATH,
    )


def _build_token_response(user_doc: dict, role: str) -> dict:
    """Build the dict that becomes a TokenResponse."""
    email = user_doc["email"]
    return {
        "access_token": create_access_token(email, role),
        "token_type": "bearer",
        "user": {
            "email": email,
            "fullName": user_doc.get("full_name"),
            "role": role,
            "department": user_doc.get("department"),
            "idNumber": user_doc.get("id_number"),
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /signup   (rate-limited: 5/minute)
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=TokenResponse)
@limiter.limit("5/minute")
async def signup(request: Request, response: Response, user: UserSignup):
    db = get_database()
    students_coll = db["students"]
    admins_coll = db["admins"]

    if await students_coll.find_one({"email": user.email}) or await admins_coll.find_one(
        {"email": user.email}
    ):
        raise HTTPException(
            status_code=400, detail="An account with this email already exists."
        )

    if await students_coll.find_one({"id_number": user.idNumber}):
        raise HTTPException(status_code=400, detail="The ID Number is already registered.")

    hashed_password = generate_password_hash(user.password)
    user_record = {
        "full_name": user.fullName,
        "email": user.email,
        "id_number": user.idNumber,
        "department": user.department,
        "password": hashed_password,
        "role": "student",
        "created_at": pd.Timestamp.now().isoformat(),
    }

    await students_coll.insert_one(user_record)

    # Issue tokens
    payload = _build_token_response(user_record, "student")
    _set_refresh_cookie(response, create_refresh_token(user.email, "student"))
    return payload


# ─────────────────────────────────────────────────────────────────────────────
# POST /login   (rate-limited: 10/minute)
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, response: Response, credentials: UserLogin):
    db = get_database()
    collection = db["admins"] if credentials.role == "admin" else db["students"]

    user = await collection.find_one({"email": credentials.email})

    if not user or not check_password_hash(user["password"], credentials.password):
        raise HTTPException(
            status_code=401, detail=f"Invalid {credentials.role} credentials"
        )

    role = user.get("role", credentials.role)
    payload = _build_token_response(user, role)
    _set_refresh_cookie(response, create_refresh_token(credentials.email, role))
    return payload


# ─────────────────────────────────────────────────────────────────────────────
# POST /refresh   — rotate refresh token
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=_REFRESH_COOKIE_NAME),
):
    """
    Reads the httpOnly refresh cookie, verifies it, re-checks the user still
    exists in the DB, then issues a new access token AND rotates the refresh
    cookie (mitigates replay of a stolen refresh token).
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token found",
        )

    payload = decode_token(refresh_token, expected_type="refresh")
    email = payload["sub"]
    role = payload["role"]

    db = get_database()
    collection = db["admins"] if role == "admin" else db["students"]
    user = await collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )

    token_payload = _build_token_response(user, role)
    # Rotate — issue a brand-new refresh token
    _set_refresh_cookie(response, create_refresh_token(email, role))
    return token_payload


# ─────────────────────────────────────────────────────────────────────────────
# POST /logout
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/logout")
async def logout(response: Response):
    """Clear the refresh token cookie. The client is responsible for
    discarding the access token from localStorage."""
    _clear_refresh_cookie(response)
    return {"message": "Logged out successfully"}


# ─────────────────────────────────────────────────────────────────────────────
# GET /me   — validate / rehydrate session
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    """
    Returns the current authenticated user's basic profile.
    The frontend can call this on app load to rehydrate a session
    instead of trusting localStorage blindly.
    """
    db = get_database()
    email = current_user["email"]
    role = current_user["role"]
    collection = db["admins"] if role == "admin" else db["students"]
    user = await collection.find_one({"email": email}, {"password": 0, "_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "email": user["email"],
        "fullName": user.get("full_name"),
        "role": role,
        "department": user.get("department"),
        "idNumber": user.get("id_number"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /google-auth
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/google-auth", response_model=TokenResponse)
async def google_auth(payload: dict, response: Response):
    """
    Verify a Google access-token sent from the frontend (implicit flow).
    If the user already exists  → log them in.
    If the user does NOT exist  → auto-create a student account.
    """
    access_token = payload.get("credential")
    email = payload.get("email")
    name = payload.get("name", "")
    picture = payload.get("picture", "")

    if not access_token or not email:
        raise HTTPException(status_code=400, detail="Missing Google credential or email")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")

            google_info = resp.json()
            if google_info.get("email") != email:
                raise HTTPException(status_code=401, detail="Email mismatch")

            email = google_info["email"]
            name = google_info.get("name", name)
            picture = google_info.get("picture", picture)
    except httpx.HTTPError:
        raise HTTPException(status_code=401, detail="Could not verify Google token")

    db = get_database()
    students_coll = db["students"]
    admins_coll = db["admins"]

    # 1. Existing admin
    admin_user = await admins_coll.find_one({"email": email})
    if admin_user:
        token_payload = _build_token_response(admin_user, "admin")
        _set_refresh_cookie(response, create_refresh_token(email, "admin"))
        return token_payload

    # 2. Existing student
    student_user = await students_coll.find_one({"email": email})
    if student_user:
        if picture and not student_user.get("profile_picture"):
            await students_coll.update_one(
                {"email": email}, {"$set": {"profile_picture": picture}}
            )
        token_payload = _build_token_response(student_user, "student")
        _set_refresh_cookie(response, create_refresh_token(email, "student"))
        return token_payload

    # 3. Auto-create new student
    new_user = {
        "full_name": name,
        "email": email,
        "id_number": f"G-{secrets.token_hex(4).upper()}",
        "department": "CE",
        "password": generate_password_hash(secrets.token_urlsafe(24)),
        "role": "student",
        "profile_picture": picture,
        "auth_provider": "google",
        "created_at": pd.Timestamp.now().isoformat(),
    }
    await students_coll.insert_one(new_user)

    token_payload = _build_token_response(new_user, "student")
    _set_refresh_cookie(response, create_refresh_token(email, "student"))
    return token_payload


# ─────────────────────────────────────────────────────────────────────────────
# POST /change-password
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/change-password")
async def change_password(
    data: ChangePassword,
    current_user: dict = Depends(get_current_user),
):
    """
    Change password for the authenticated user.
    A logged-in user may only change their OWN password — enforced by
    comparing data.email with current_user["email"].
    """
    if current_user["email"] != data.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You may only change your own password",
        )

    db = get_database()
    collection = db["admins"] if data.role == "admin" else db["students"]

    user = await collection.find_one({"email": data.email})
    if not user or not check_password_hash(user["password"], data.currentPassword):
        raise HTTPException(status_code=401, detail="Incorrect current password")

    hashed_password = generate_password_hash(data.newPassword)
    await collection.update_one(
        {"email": data.email}, {"$set": {"password": hashed_password}}
    )
    return {"message": "Password changed successfully"}
