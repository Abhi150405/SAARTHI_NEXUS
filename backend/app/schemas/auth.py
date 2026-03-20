from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
import re

URL_REGEX = re.compile(r'^https?://.+', re.IGNORECASE)

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
    full_name: Optional[str] = None
    department: Optional[str] = None
    profile_picture: Optional[str] = None
    tenth_percentage: Optional[float] = Field(None, ge=0, le=100)
    twelfth_percentage: Optional[float] = Field(None, ge=0, le=100)
    college_cgpa: Optional[float] = Field(None, ge=0, le=10)
    amcat_score: Optional[int] = Field(None, ge=0)
    leetcode_url: Optional[str] = None
    codechef_url: Optional[str] = None
    codeforces_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None

    @validator('leetcode_url', 'codechef_url', 'codeforces_url', 'linkedin_url', 'resume_url', pre=True, always=True)
    def validate_url(cls, v):
        if v is None or v == '':
            return None
        if not URL_REGEX.match(v):
            raise ValueError('Must be a valid URL starting with http:// or https://')
        return v
