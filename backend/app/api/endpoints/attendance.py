from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Response
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import math
import csv
import io
from app.db.mongodb import get_database

router = APIRouter()

# PICT Coordinates (or college coordinates)
COLLEGE_LAT = 18.4575
COLLEGE_LON = 73.8508
RADIUS_METERS = 200.0

class AttendanceSessionCreate(BaseModel):
    company_id: str
    company_name: str
    start_time: str
    end_time: str
    admin_name: str
    eligible_emails: Optional[List[str]] = []  # populated from CSV

class MarkAttendanceRequest(BaseModel):
    session_id: str
    student_id: str
    student_email: str
    student_name: str
    latitude: float
    longitude: float

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # radius of Earth in meters
    phi_1 = math.radians(lat1)
    phi_2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi_1) * math.cos(phi_2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("/sessions")
async def create_attendance_session(session: AttendanceSessionCreate):
    db = get_database()
    
    new_session = {
        "company_id": session.company_id,
        "company_name": session.company_name,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "created_by": session.admin_name,
        "status": "active",
        "created_at": datetime.utcnow(),
        "eligible_emails": session.eligible_emails or []   # store allowed email list
    }
    
    result = await db.attendance_sessions.insert_one(new_session)
    session_id = str(result.inserted_id)

    eligible_count = len(session.eligible_emails) if session.eligible_emails else 0
    audience_note = f" ({eligible_count} eligible students from uploaded list)" if eligible_count else ""

    notification_msg = f"Attendance required for {session.company_name}{audience_note}. Please mark your attendance."
    await db.notifications.insert_one({
        "message": notification_msg,
        "type": "attendance",
        "session_id": session_id,
        "company_name": session.company_name,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "eligible_emails": session.eligible_emails or [],
        "timestamp": datetime.utcnow()
    })

    return {"message": "Session created and broadcasted", "session_id": session_id, "eligible_count": eligible_count}

@router.post("/sessions/upload-csv")
async def create_session_with_csv(
    company_id: str = Form(...),
    company_name: str = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    admin_name: str = Form(...),
    csv_file: UploadFile = File(...)
):
    """Create attendance session with a CSV file of eligible student emails."""
    db = get_database()
    
    # Parse CSV
    content = await csv_file.read()
    decoded = content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(decoded))
    
    eligible_emails = []
    eligible_names = []
    
    for row in reader:
        # Support columns: email, Email, EMAIL, student_email, etc.
        email = (
            row.get("email") or row.get("Email") or row.get("EMAIL") or
            row.get("student_email") or row.get("Student Email") or ""
        ).strip().lower()
        
        name = (
            row.get("name") or row.get("Name") or row.get("NAME") or
            row.get("student_name") or row.get("Student Name") or ""
        ).strip()
        
        if email:
            eligible_emails.append(email)
            eligible_names.append(name)
    
    if not eligible_emails:
        raise HTTPException(
            status_code=400, 
            detail="CSV must have an 'email' column with at least one valid email address."
        )
    
    new_session = {
        "company_id": company_id,
        "company_name": company_name,
        "start_time": start_time,
        "end_time": end_time,
        "created_by": admin_name,
        "status": "active",
        "created_at": datetime.utcnow(),
        "eligible_emails": eligible_emails,
        "eligible_names": eligible_names
    }
    
    result = await db.attendance_sessions.insert_one(new_session)
    session_id = str(result.inserted_id)

    notification_msg = f"Attendance required for {company_name} ({len(eligible_emails)} eligible students). Please mark your attendance."
    await db.notifications.insert_one({
        "message": notification_msg,
        "type": "attendance",
        "session_id": session_id,
        "company_name": company_name,
        "start_time": start_time,
        "end_time": end_time,
        "eligible_emails": eligible_emails,
        "timestamp": datetime.utcnow()
    })

    return {
        "message": "Session created and broadcasted",
        "session_id": session_id,
        "eligible_count": len(eligible_emails),
        "eligible_emails_preview": eligible_emails[:5]
    }


@router.get("/sessions")
async def get_active_sessions():
    db = get_database()
    sessions = await db.attendance_sessions.find({"status": "active"}).to_list(length=100)
    for s in sessions:
        s["_id"] = str(s["_id"])
    return sessions

@router.get("/sessions/{session_id}/records")
async def get_session_records(session_id: str):
    db = get_database()
    records = await db.attendance_records.find({"session_id": session_id}).to_list(length=1000)
    for r in records:
        r["_id"] = str(r["_id"])
    return records

@router.get("/sessions/{session_id}/download-csv")
async def download_attendance_csv(session_id: str):
    """Download attendance records for a session as CSV file."""
    db = get_database()

    # Fetch session details
    try:
        session = await db.attendance_sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch attendance records
    records = await db.attendance_records.find({"session_id": session_id}).to_list(length=1000)

    # Create CSV in memory
    output = io.StringIO()
    fieldnames = ['Student Name', 'Student Email', 'Student ID', 'Status', 'Timestamp', 'Distance (m)', 'Latitude', 'Longitude']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for r in records:
        writer.writerow({
            'Student Name': r.get('student_name', ''),
            'Student Email': r.get('student_email', ''),
            'Student ID': r.get('student_id', ''),
            'Status': r.get('status', ''),
            'Timestamp': r.get('timestamp', '').isoformat() if isinstance(r.get('timestamp'), datetime) else str(r.get('timestamp', '')),
            'Distance (m)': round(r.get('distance', 0), 2) if r.get('distance') else '',
            'Latitude': r.get('latitude', ''),
            'Longitude': r.get('longitude', '')
        })

    output.seek(0)
    csv_content = output.getvalue()

    # Sanitize company name for filename
    company_name = session.get('company_name', 'attendance').replace('/', '-').replace('\\', '-')
    filename = f"attendance_{company_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/mark")
async def mark_attendance(req: MarkAttendanceRequest):
    db = get_database()
    
    # 1. Fetch the session
    session = await db.attendance_sessions.find_one({"_id": ObjectId(req.session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")
        
    if session.get("status") != "active":
        return {"status": "Rejected - Session Inactive", "success": False}

    # 2. Check Time Slot
    current_time = datetime.utcnow()
    try:
        # Assuming javascript toISOString format which ends in Z or has an offset
        start_string = session["start_time"]
        end_string = session["end_time"]
        
        # Clean up 'Z' to UTC offset and parse
        start_t = datetime.fromisoformat(start_string.replace('Z', '+00:00')).replace(tzinfo=None)
        end_t = datetime.fromisoformat(end_string.replace('Z', '+00:00')).replace(tzinfo=None)
        
        if current_time < start_t:
            return {"status": "Rejected - Session Not Started", "success": False}
        if current_time > end_t:
            return {"status": "Rejected - Time Expired", "success": False}
    except Exception as e:
        print(f"Time parsing error: {e}")
    
    # 2b. Check eligible list (if CSV was uploaded)
    eligible_emails = session.get("eligible_emails", [])
    if eligible_emails:
        student_email_lower = req.student_email.strip().lower()
        if student_email_lower not in [e.lower() for e in eligible_emails]:
            return {"status": "Rejected - Not in Eligible List", "success": False}
    
    # 3. Check Geo-fence
    distance = haversine(req.latitude, req.longitude, COLLEGE_LAT, COLLEGE_LON)
    if distance > RADIUS_METERS:
        await db.attendance_records.insert_one({
            "student_id": req.student_id,
            "student_email": req.student_email,
            "student_name": req.student_name,
            "session_id": req.session_id,
            "timestamp": datetime.utcnow(),
            "latitude": req.latitude,
            "longitude": req.longitude,
            "distance": distance,
            "status": "Rejected - Outside Campus"
        })
        return {"status": "Rejected - Outside Campus", "success": False}
        
    # Check if already marked valid
    existing = await db.attendance_records.find_one({
        "student_id": req.student_id, 
        "session_id": req.session_id,
        "status": "Marked - Valid"
    })
    
    if existing:
        return {"status": "Marked - Valid", "success": True, "message": "Already marked"}
        
    # Valid
    await db.attendance_records.insert_one({
        "student_id": req.student_id,
        "student_email": req.student_email,
        "student_name": req.student_name,
        "session_id": req.session_id,
        "timestamp": datetime.utcnow(),
        "latitude": req.latitude,
        "longitude": req.longitude,
        "distance": distance,
        "status": "Marked - Valid"
    })
    return {"status": "Marked - Valid", "success": True}
