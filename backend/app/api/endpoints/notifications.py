from fastapi import APIRouter, HTTPException, Request
from app.db.mongodb import get_database
from bson.objectid import ObjectId
import datetime

router = APIRouter()

@router.post("/admin/broadcast", status_code=201)
async def broadcast_notification(request: Request):
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
    db = get_database()
    notifications = await db['notifications'].find({}).sort('created_at', -1).limit(limit).to_list(None)
    for n in notifications:
        n['_id'] = str(n['_id'])
    return notifications

@router.get("/notifications/all")
async def get_all_notifications():
    db = get_database()
    notifications = await db['notifications'].find({}).sort('created_at', -1).to_list(None)
    for n in notifications:
        n['_id'] = str(n['_id'])
    return notifications

@router.put("/notifications/{id}")
async def update_notification(id: str, request: Request):
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
async def delete_notification(id: str):
    db = get_database()
    result = await db['notifications'].delete_one({'_id': ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted successfully"}
