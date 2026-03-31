from fastapi import APIRouter, HTTPException, Response
from typing import List
from app.db.mongodb import get_database
from app.schemas.drive import PlacementDriveCreate, PlacementDriveUpdate, DriveRegistrationCreate
from bson.objectid import ObjectId
from datetime import datetime
import csv
import io

router = APIRouter()

@router.post("/")
async def create_drive(drive: PlacementDriveCreate):
    db = get_database()
    drive_dict = drive.dict()
    drive_dict['createdAt'] = datetime.utcnow()
    result = await db['placement_drives'].insert_one(drive_dict)
    return {"message": "Drive created successfully", "id": str(result.inserted_id)}

@router.get("/")
async def list_drives():
    db = get_database()
    drives = await db['placement_drives'].find().to_list(1000)
    for d in drives:
        d['_id'] = str(d['_id'])
    return drives

@router.put("/{drive_id}")
async def update_drive(drive_id: str, drive_update: PlacementDriveUpdate):
    db = get_database()
    update_data = {k: v for k, v in drive_update.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db['placement_drives'].update_one(
        {"_id": ObjectId(drive_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Drive not found")
    return {"message": "Drive updated successfully"}

@router.delete("/{drive_id}")
async def delete_drive(drive_id: str):
    db = get_database()
    result = await db['placement_drives'].delete_one({"_id": ObjectId(drive_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Drive not found")
    # also delete registrations
    await db['drive_registrations'].delete_many({"driveId": drive_id})
    return {"message": "Drive deleted successfully"}

@router.post("/{drive_id}/register")
async def register_student(drive_id: str, reg: DriveRegistrationCreate):
    db = get_database()
    # Check if drive exists
    drive = await db['placement_drives'].find_one({"_id": ObjectId(drive_id)})
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    # Check branch eligibility
    student = await db['students'].find_one({"email": reg.studentEmail})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    raw_dept = (student.get('department') or '').upper()
    mapped_branch = 'E&CE' if ('ELECTRONICS' in raw_dept and 'COMPUTER' in raw_dept) else raw_dept
    
    allowed_branches = drive.get('allowedBranches', [])
    if allowed_branches and mapped_branch not in allowed_branches:
        raise HTTPException(status_code=403, detail="You are not eligible (branch not allowed)")
    
    # Check duplicate
    existing = await db['drive_registrations'].find_one({
        "driveId": drive_id,
        "studentEmail": reg.studentEmail
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this drive")
        
    reg_dict = reg.dict()
    reg_dict['createdAt'] = datetime.utcnow()
    await db['drive_registrations'].insert_one(reg_dict)
    return {"message": "Registered successfully"}

@router.get("/{drive_id}/registrations")
async def list_registrations(drive_id: str):
    db = get_database()
    regs = await db['drive_registrations'].find({"driveId": drive_id}).to_list(1000)
    for r in regs:
        r['_id'] = str(r['_id'])
    return regs

@router.get("/{drive_id}/export")
async def export_registrations(drive_id: str):
    db = get_database()
    regs = await db['drive_registrations'].find({"driveId": drive_id}).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "SSC", "HSC", "CGPA", "AMCAT", "College Email", "Personal Email", "Mobile"])
    
    for r in regs:
        writer.writerow([
            r.get("name", ""),
            r.get("ssc", ""),
            r.get("hsc", ""),
            r.get("cgpa", ""),
            r.get("amcat", ""),
            r.get("collegeEmail", ""),
            r.get("personalEmail", ""),
            r.get("mobile", "")
        ])

    return Response(content=output.getvalue(), media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=drive_{drive_id}_registrations.csv"
    })
