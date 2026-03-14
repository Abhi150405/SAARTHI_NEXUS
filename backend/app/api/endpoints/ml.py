from fastapi import APIRouter, HTTPException, Request
from app.services.ml_service import ml_service

router = APIRouter()

@router.post("/predict_placement")
async def predict_placement(request: Request):
    data = await request.json()
    result = ml_service.predict(data)
    if result is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    return result
