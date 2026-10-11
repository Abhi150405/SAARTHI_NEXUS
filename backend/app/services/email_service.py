

"""
backend/app/services/email_service.py
--------------------------------------
Email dispatch service for SAARTHI NEXUS.
Supports standard SMTP (Gmail, Outlook, custom college mail servers)
with automatic fallback to console simulation in local dev mode when
SMTP credentials are not yet configured.
"""

import asyncio
import logging
import os
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from dotenv import load_dotenv

from app.core.config import settings

logger = logging.getLogger("email_service")


def _refresh_env_if_needed():
    """Ensure newly added SMTP environment variables are loaded in running process."""
    if not os.getenv("SMTP_HOST") or not os.getenv("SMTP_PASSWORD"):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        load_dotenv(os.path.join(base_dir, ".env"), override=True)
        load_dotenv(os.path.join(os.path.dirname(base_dir), ".env"), override=True)


def is_smtp_configured() -> bool:
    """Check if SMTP credentials are fully provided in settings or os.environ."""
    _refresh_env_if_needed()
    host = os.getenv("SMTP_HOST") or settings.SMTP_HOST
    user = os.getenv("SMTP_USER") or settings.SMTP_USER
    password = os.getenv("SMTP_PASSWORD") or settings.SMTP_PASSWORD
    return bool(host and user and password)



def _build_html_email(otp: str, purpose: str) -> str:
    """Generate modern, responsive HTML email matching SAARTHI NEXUS design."""
    is_signup = purpose == "signup"
    title = "Verify Your College Email" if is_signup else "Reset Your Account Password"
    subtitle = (
        "Thank you for joining SAARTHI NEXUS. Please use the verification code below to complete your registration."
        if is_signup
        else "We received a request to reset your password. Use the verification code below to proceed."
    )
    action_label = "Complete Registration" if is_signup else "Reset Password"

    # Split OTP characters for individual styling if desired, or single spaced badge
    spaced_otp = " ".join(otp)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #050505;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E5E5E5;
    }}
    .wrapper {{
      max-width: 580px;
      margin: 30px auto;
      background-color: #0E0E0E;
      border: 1px solid #222222;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
    }}
    .header {{
      padding: 32px 32px 24px 32px;
      border-bottom: 1px solid #1C1C1C;
      background: linear-gradient(180deg, #161616 0%, #0E0E0E 100%);
      text-align: center;
    }}
    .logo-badge {{
      display: inline-block;
      padding: 6px 14px;
      background: rgba(249, 115, 22, 0.12);
      border: 1px solid rgba(249, 115, 22, 0.3);
      border-radius: 20px;
      color: #F97316;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }}
    .app-title {{
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.5px;
    }}
    .content {{
      padding: 36px 32px;
    }}
    .heading {{
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.3px;
    }}
    .paragraph {{
      margin: 0 0 24px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #9CA3AF;
    }}
    .otp-card {{
      background: #151515;
      border: 1px solid #282828;
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }}
    .otp-label {{
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #71717A;
      margin-bottom: 12px;
      font-weight: 600;
    }}
    .otp-code {{
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #F97316;
      display: inline-block;
      padding: 4px 12px;
    }}
    .otp-expiry {{
      margin-top: 12px;
      font-size: 12px;
      color: #A1A1AA;
    }}
    .warning-box {{
      background: rgba(239, 68, 68, 0.08);
      border-left: 3px solid #EF4444;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 24px 0 10px 0;
      font-size: 12px;
      line-height: 1.5;
      color: #F87171;
    }}
    .footer {{
      padding: 24px 32px;
      background: #080808;
      border-top: 1px solid #1A1A1A;
      text-align: center;
      font-size: 11px;
      color: #52525B;
      line-height: 1.6;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge">Placement Intelligence</div>
      <h1 class="app-title">SAARTHI NEXUS</h1>
    </div>
    <div class="content">
      <h2 class="heading">{title}</h2>
      <p class="paragraph">{subtitle}</p>

      <div class="otp-card">
        <div class="otp-label">One-Time Verification Code</div>
        <div class="otp-code">{otp}</div>
        <div class="otp-expiry">⏱ Valid for <strong>10 minutes</strong> only</div>
      </div>

      <div class="warning-box">
        <strong>Security Notice:</strong> Never share this OTP with anyone, including college administrators or placement coordinators. SAARTHI NEXUS will never ask for your code.
      </div>

      <p class="paragraph" style="margin-top: 24px; font-size: 12px; color: #71717A;">
        If you didn't initiate this request, you can safely ignore this email. Your account remains completely secure.
      </p>
    </div>
    <div class="footer">
      SAARTHI NEXUS &bull; Next-Gen Training & Placement Cell Platform<br>
      Pune Institute of Computer Technology (PICT) &bull; Automated System
    </div>
  </div>
</body>
</html>"""
    return html


def _send_email_sync(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
    """Synchronous SMTP email delivery."""
    _refresh_env_if_needed()
    smtp_host = os.getenv("SMTP_HOST") or settings.SMTP_HOST
    smtp_port = int(os.getenv("SMTP_PORT") or settings.SMTP_PORT)
    smtp_user = os.getenv("SMTP_USER") or settings.SMTP_USER
    smtp_password = os.getenv("SMTP_PASSWORD") or settings.SMTP_PASSWORD
    from_email = os.getenv("SMTP_FROM_EMAIL") or settings.SMTP_FROM_EMAIL or smtp_user
    from_name = os.getenv("SMTP_FROM_NAME") or settings.SMTP_FROM_NAME or "SAARTHI NEXUS"
    use_ssl = os.getenv("SMTP_SSL", "false").lower() in ("true", "1", "yes") if "SMTP_SSL" in os.environ else settings.SMTP_SSL
    use_tls = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes") if "SMTP_TLS" in os.environ else settings.SMTP_TLS

    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email

    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    if use_ssl:
        server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
    else:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)

    try:
        if not use_ssl and use_tls:
            server.starttls()
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
        server.sendmail(from_email, [to_email], msg.as_string())
        return True
    finally:
        try:
            server.quit()
        except Exception:
            pass


async def send_otp_email(to_email: str, otp: str, purpose: str) -> tuple[bool, str]:
    """
    Send OTP via SMTP email if configured, or simulate delivery in dev mode.
    Returns: (is_sent_or_simulated: bool, delivery_mode: "smtp" | "simulated")
    """
    is_signup = purpose == "signup"
    subject = (
        f"[{otp}] SAARTHI NEXUS - Verify your email"
        if is_signup
        else f"[{otp}] SAARTHI NEXUS - Reset your password"
    )

    text_content = (
        f"Your SAARTHI NEXUS verification code is: {otp}\n\n"
        f"This code will expire in 10 minutes.\n"
        f"Never share this OTP with anyone.\n"
    )

    html_content = _build_html_email(otp, purpose)

    if not is_smtp_configured():
        # Fallback to local dev logging
        print("\n" + "=" * 60)
        print("[SAARTHI NEXUS DEV OTP SIMULATION]")
        print(f"Destination Email: {to_email}")
        print(f"Purpose:           {purpose.upper()}")
        print(f"6-Digit OTP:       >>> {otp} <<<")
        print("Valid for:         10 minutes")
        print("=" * 60 + "\n")
        logger.info(f"Simulated OTP for {to_email}: {otp}")
        return True, "simulated"

    try:
        # Offload blocking SMTP call to worker thread
        await asyncio.to_thread(_send_email_sync, to_email, subject, html_content, text_content)
        logger.info(f"Successfully sent OTP email to {to_email} via SMTP")
        return True, "smtp"
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {e}. Falling back to simulation.")
        # Even if SMTP fails (e.g. invalid credentials or network block), output dev OTP in logs so testing continues
        print("\n" + "!" * 60)
        print(f"[SMTP ERROR: {e}] - Falling back to local console OTP:")
        print(f"6-Digit OTP for {to_email}: >>> {otp} <<<")
        print("!" * 60 + "\n")
        return True, "simulated_fallback"
