from fastapi import APIRouter, HTTPException, Request, Depends
from app.db.mongodb import get_database
from bson.objectid import ObjectId
import datetime
from app.core.security import require_admin

router = APIRouter()

@router.post("/admin/broadcast", status_code=201)
async def broadcast_notification(request: Request, current_user: dict = Depends(require_admin)):
    data = await request.json()
    message = data.get('message')
    admin_name = data.get('adminName', 'TNP Admin')
    
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
        
    db = get_database()
    notification = {
        "message": message,
        "admin_name": admin_name,
        "created_at": datetime.datetime.utcnow(),
        "type": "broadcast"
    }
    await db['notifications'].insert_one(notification)
    return {"message": "Notification broadcasted successfully"}

@router.get("/notifications")
async def get_notifications(limit: int = 5):
    """Fetch public TNP broadcast and attendance announcements only."""
    db = get_database()
    notifications = await db['notifications'].find(
        {"type": {"$in": ["broadcast", "attendance"]}}
    ).sort('created_at', -1).limit(limit).to_list(None)
    for n in notifications:
        n['_id'] = str(n['_id'])
    return notifications

@router.get("/notifications/all")
async def get_all_notifications():
    """Fetch all official TNP broadcast announcements."""
    db = get_database()
    notifications = await db['notifications'].find(
        {"type": {"$in": ["broadcast", "attendance"]}}
    ).sort('created_at', -1).to_list(None)
    for n in notifications:
        n['_id'] = str(n['_id'])
    return notifications

@router.get("/notifications/user")
async def get_user_notifications(email: str, limit: int = 10):
    """
    Fetch isolated personal notifications for a specific student
    (e.g., Skill Gap Analysis completion alerts).
    """
    if not email:
        return []
    db = get_database()
    user_notifs = await db['user_notifications'].find(
        {"user_email": email.lower().strip()}
    ).sort('created_at', -1).limit(limit).to_list(None)
    for n in user_notifs:
        n['_id'] = str(n['_id'])
    return user_notifs

@router.patch("/notifications/user/{id}/read")
async def mark_user_notification_read(id: str):
    """Mark an isolated personal notification as read."""
    db = get_database()
    await db['user_notifications'].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"read": True}}
    )
    return {"status": "success"}

@router.put("/notifications/{id}")
async def update_notification(id: str, request: Request, current_user: dict = Depends(require_admin)):
    data = await request.json()
    message = data.get('message')
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    db = get_database()
    result = await db['notifications'].update_one({'_id': ObjectId(id)}, {'$set': {'message': message}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification updated successfully"}

@router.delete("/notifications/{id}")
async def delete_notification(id: str, current_user: dict = Depends(require_admin)):
    db = get_database()
    result = await db['notifications'].delete_one({'_id': ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted successfully"}
