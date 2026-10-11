"""
backend/app/services/otp_service.py
------------------------------------
Business logic for generating, persisting, rate-limiting, and verifying
one-time passwords (OTP) for student registration and password reset.
"""

from datetime import datetime, timedelta, timezone
import logging
import secrets
from fastapi import HTTPException, status
from werkzeug.security import check_password_hash, generate_password_hash

from app.core.security import create_otp_verification_token, decode_token
from app.db.mongodb import get_database
from app.services.email_service import is_smtp_configured, send_otp_email

logger = logging.getLogger("otp_service")

OTP_COOLDOWN_SECONDS = 60
OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


async def generate_and_send_otp(email: str, purpose: str, role: str = "student") -> dict:
    """
    Generate and send a 6-digit OTP for either 'signup' or 'reset_password'.
    Enforces cooldown and user existence constraints.
    """
    email_clean = email.lower().strip()
    db = get_database()
    students_coll = db["students"]
    admins_coll = db["admins"]
    otp_coll = db["otp_verifications"]

    now = datetime.now(timezone.utc)

    # 1. Purpose-specific validation
    if purpose == "signup":
        # Check if already registered
        if await students_coll.find_one({"email": email_clean}) or await admins_coll.find_one(
            {"email": email_clean}
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )
    elif purpose == "reset_password":
        coll = admins_coll if role == "admin" else students_coll
        user = await coll.find_one({"email": email_clean})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No {role} account found associated with {email_clean}.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OTP purpose: '{purpose}'.",
        )

    # 2. Check 60-second cooldown
    recent_otp = await otp_coll.find_one(
        {"email": email_clean, "purpose": purpose},
        sort=[("created_at", -1)],
    )

    if recent_otp and "created_at" in recent_otp:
        created_at = recent_otp["created_at"]
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        elapsed = (now - created_at).total_seconds()
        if elapsed < OTP_COOLDOWN_SECONDS:
            remaining = int(OTP_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting a new code.",
            )

    # 3. Generate secure 6-digit OTP
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # 4. Invalidate older unverified OTPs for this email and purpose
    await otp_coll.delete_many({"email": email_clean, "purpose": purpose, "verified": False})

    # 5. Store new hashed OTP record
    otp_doc = {
        "email": email_clean,
        "purpose": purpose,
        "role": role,
        "otp_hash": generate_password_hash(otp_code),
        "created_at": now,
        "expires_at": expires_at,
        "attempts": 0,
        "max_attempts": OTP_MAX_ATTEMPTS,
        "verified": False,
    }
    await otp_coll.insert_one(otp_doc)

    # 6. Deliver OTP via email
    _, mode = await send_otp_email(email_clean, otp_code, purpose)

    response_data = {
        "message": f"A 6-digit verification code has been sent to {email_clean}.",
        "cooldown_seconds": OTP_COOLDOWN_SECONDS,
        "delivery_mode": mode,
    }

    # If in local simulation / no SMTP configured, return dev_otp to avoid blocking dev testing
    if mode in ("simulated", "simulated_fallback") or not is_smtp_configured():
        response_data["dev_otp"] = otp_code

    return response_data


async def verify_otp_code(email: str, otp: str, purpose: str) -> str:
    """
    Verifies the provided 6-digit OTP for the given email and purpose.
    Returns a signed verification token on success.
    """
    email_clean = email.lower().strip()
    otp_clean = otp.strip()
    db = get_database()
    otp_coll = db["otp_verifications"]

    now = datetime.now(timezone.utc)

    # Find latest active unverified OTP
    record = await otp_coll.find_one(
        {"email": email_clean, "purpose": purpose, "verified": False},
        sort=[("created_at", -1)],
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found. Please request a new code.",
        )

    expires_at = record["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    # Check expiration
    if now > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code has expired. Please request a new one.",
        )

    # Check max attempts
    attempts = record.get("attempts", 0)
    max_attempts = record.get("max_attempts", OTP_MAX_ATTEMPTS)

    if attempts >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. Please request a new verification code.",
        )

    # Check OTP hash match
    if not check_password_hash(record["otp_hash"], otp_clean):
        new_attempts = attempts + 1
        await otp_coll.update_one(
            {"_id": record["_id"]},
            {"$set": {"attempts": new_attempts}},
        )
        remaining = max_attempts - new_attempts
        if remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many incorrect attempts. Please request a new code.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining.",
        )

    # Mark as verified
    await otp_coll.update_one(
        {"_id": record["_id"]},
        {"$set": {"verified": True, "verified_at": now}},
    )

    # Issue cryptographic verification token
    verification_token = create_otp_verification_token(email_clean, purpose)
    return verification_token


def validate_verification_token(token: str, expected_email: str, expected_purpose: str) -> bool:
    """
    Validates a cryptographic verification token.
    Raises HTTPException if invalid or expired.
    """
    payload = decode_token(token, expected_type="otp_verified")
    token_email = payload.get("sub", "").lower().strip()
    token_purpose = payload.get("purpose", "")

    if token_email != expected_email.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token does not match the provided email address.",
        )

    if token_purpose != expected_purpose:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification token purpose. Expected '{expected_purpose}'.",
        )

    return True
