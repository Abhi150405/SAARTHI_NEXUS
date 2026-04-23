from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import UserSignup, UserLogin, ChangePassword
from app.db.mongodb import get_database
from app.core.config import settings
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd
import secrets
import httpx

router = APIRouter()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserSignup):
    db = get_database()
    students_coll = db['students']
    admins_coll = db['admins']
    
    # Check if email exists
    if await students_coll.find_one({'email': user.email}) or await admins_coll.find_one({'email': user.email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    if await students_coll.find_one({'id_number': user.idNumber}):
        raise HTTPException(status_code=400, detail="The ID Number is already registered.")
    
    hashed_password = generate_password_hash(user.password)
    user_record = {
        "full_name": user.fullName,
        "email": user.email,
        "id_number": user.idNumber,
        "department": user.department,
        "password": hashed_password,
        "role": "student",
        "created_at": pd.Timestamp.now().isoformat()
    }
    
    await students_coll.insert_one(user_record)
    return {"message": "Success"}

@router.post("/login")
async def login(credentials: UserLogin):
    db = get_database()
    collection = db['admins'] if credentials.role == 'admin' else db['students']
    
    user = await collection.find_one({'email': credentials.email})
    
    if not user or not check_password_hash(user['password'], credentials.password):
        raise HTTPException(status_code=401, detail=f"Invalid {credentials.role} credentials")
        
    return {
        "message": "Login successful",
        "user": {
            "email": user['email'],
            "fullName": user.get('full_name'),
            "role": user.get('role', credentials.role),
            "department": user.get('department'),
            "idNumber": user.get('id_number')
        }
    }

@router.post("/google-auth")
async def google_auth(payload: dict):
    """
    Verify a Google access-token sent from the frontend (implicit flow).
    If the user already exists  → log them in.
    If the user does NOT exist  → auto-create a student account.
    """
    access_token = payload.get("credential")
    email        = payload.get("email")
    name         = payload.get("name", "")
    picture      = payload.get("picture", "")

    if not access_token or not email:
        raise HTTPException(status_code=400, detail="Missing Google credential or email")

    try:
        # Verify the access token with Google
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")
            
            google_info = resp.json()
            # Ensure the email matches
            if google_info.get("email") != email:
                raise HTTPException(status_code=401, detail="Email mismatch")
            
            # Use verified info from Google
            email   = google_info["email"]
            name    = google_info.get("name", name)
            picture = google_info.get("picture", picture)
    except httpx.HTTPError:
        raise HTTPException(status_code=401, detail="Could not verify Google token")

    db = get_database()
    students_coll = db["students"]
    admins_coll   = db["admins"]

    # 1. Check if already an admin
    admin_user = await admins_coll.find_one({"email": email})
    if admin_user:
        return {
            "message": "Login successful",
            "user": {
                "email":      admin_user["email"],
                "fullName":   admin_user.get("full_name", name),
                "role":       "admin",
                "department": admin_user.get("department"),
                "idNumber":   admin_user.get("id_number"),
            },
        }

    # 2. Check if already a student
    student_user = await students_coll.find_one({"email": email})
    if student_user:
        # Update profile picture if blank
        if picture and not student_user.get("profile_picture"):
            await students_coll.update_one({"email": email}, {"$set": {"profile_picture": picture}})
        return {
            "message": "Login successful",
            "user": {
                "email":      student_user["email"],
                "fullName":   student_user.get("full_name", name),
                "role":       "student",
                "department": student_user.get("department", "CE"),
                "idNumber":   student_user.get("id_number", ""),
            },
        }

    # 3. Auto-create a new student account (Google users)
    new_user = {
        "full_name":       name,
        "email":           email,
        "id_number":       f"G-{secrets.token_hex(4).upper()}",
        "department":      "CE",
        "password":        generate_password_hash(secrets.token_urlsafe(24)),
        "role":            "student",
        "profile_picture": picture,
        "auth_provider":   "google",
        "created_at":      pd.Timestamp.now().isoformat(),
    }
    await students_coll.insert_one(new_user)

    return {
        "message": "Account created and login successful",
        "user": {
            "email":      new_user["email"],
            "fullName":   new_user["full_name"],
            "role":       "student",
            "department": new_user["department"],
            "idNumber":   new_user["id_number"],
        },
    }

@router.post("/change-password")
async def change_password(data: ChangePassword):
    db = get_database()
    collection = db['admins'] if data.role == 'admin' else db['students']
    
    user = await collection.find_one({'email': data.email})
    if not user or not check_password_hash(user['password'], data.currentPassword):
        raise HTTPException(status_code=401, detail="Incorrect current password")
    
    hashed_password = generate_password_hash(data.newPassword)
    await collection.update_one({'email': data.email}, {'$set': {'password': hashed_password}})
    return {"message": "Password changed successfully"}
