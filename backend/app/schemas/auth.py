from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class UserSignup(BaseModel):
    fullName: str
    email: EmailStr
    idNumber: str
    department: str
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: str = "student"

class ChangePassword(BaseModel):
    email: EmailStr
    currentPassword: str
    newPassword: str = Field(..., min_length=6)
    role: str = "student"

class ProfileUpdate(BaseModel):
    email: str
    tenth_percentage: Optional[float] = Field(None, ge=0, le=100)
    twelfth_percentage: Optional[float] = Field(None, ge=0, le=100)
    college_cgpa: Optional[float] = Field(None, ge=0, le=10)
    amcat_score: Optional[int] = Field(None, ge=0)
