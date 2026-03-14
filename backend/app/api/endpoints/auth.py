from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import UserSignup, UserLogin, ChangePassword
from app.db.mongodb import get_database
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd

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
