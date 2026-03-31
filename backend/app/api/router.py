from fastapi import APIRouter
from app.api.endpoints import auth, profile, chatbot, ml, companies, stats, notifications, experiences, admin, resume, skill_analysis, drives

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(profile.router, tags=["profile"])
api_router.include_router(resume.router, tags=["resume"])
api_router.include_router(chatbot.router, tags=["chatbot"])
api_router.include_router(ml.router, tags=["ml"])
api_router.include_router(companies.router, tags=["companies"])
api_router.include_router(stats.router, tags=["stats"])
api_router.include_router(notifications.router, tags=["notifications"])
api_router.include_router(experiences.router, tags=["experiences"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(skill_analysis.router, prefix="/skill-analysis", tags=["skill-analysis"])
api_router.include_router(drives.router, prefix="/drives", tags=["drives"])
# Temporary placeholders for other routers
# api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
# ...
