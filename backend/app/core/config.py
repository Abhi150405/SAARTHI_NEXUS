from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# BASE_DIR = backend/app  →  parent = backend/  →  grandparent = project root (SAARTHI_NEXUS/)
BACKEND_DIR = os.path.dirname(BASE_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
env_paths = [
    os.path.join(os.getcwd(), '.env'),          # backend/.env  (if run from backend/)
    os.path.join(PROJECT_ROOT, '.env'),          # SAARTHI_NEXUS/.env  ← actual location
    os.path.join(BACKEND_DIR, '.env'),           # backend/.env
    os.path.join(BASE_DIR, '.env'),              # backend/app/.env
]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path, override=True)
        break

class Settings(BaseSettings):
    PROJECT_NAME: str = "SAARTHI NEXUS API"
    MONGODB_URL: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DATABASE_NAME: str = "saarthi_nexus"
    GEMINI_API_KEY: str = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY") or ""
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID") or ""
    PORT: int = int(os.environ.get("PORT", 8000))
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://saarthi-nexus.vercel.app", # Potential common deployment
        "https://saarthi-nexus.onrender.com"
    ]

    def __init__(self, **values):
        super().__init__(**values)
        origins = os.getenv("CORS_ORIGINS")
        if origins:
            self.CORS_ORIGINS = [o.strip() for o in origins.split(",")]

settings = Settings()
