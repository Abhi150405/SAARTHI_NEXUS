from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class DriveCriteria(BaseModel):
    ssc: float = Field(0.0, description="Minimum SSC percentage")
    hsc: float = Field(0.0, description="Minimum HSC percentage")
    cgpa: float = Field(0.0, description="Minimum CGPA")
    amcat: int = Field(0, description="Minimum AMCAT score")

class PlacementDriveBase(BaseModel):
    companyName: str
    role: str
    ctc: str
    requirements: str
    criteria: DriveCriteria

class PlacementDriveCreate(PlacementDriveBase):
    pass

class PlacementDriveUpdate(BaseModel):
    companyName: Optional[str] = None
    role: Optional[str] = None
    ctc: Optional[str] = None
    requirements: Optional[str] = None
    criteria: Optional[DriveCriteria] = None

class DriveRegistrationBase(BaseModel):
    driveId: str
    studentEmail: EmailStr
    name: str
    ssc: float
    hsc: float
    cgpa: float
    amcat: int
    collegeEmail: EmailStr
    personalEmail: EmailStr
    mobile: str

class DriveRegistrationCreate(DriveRegistrationBase):
    pass
