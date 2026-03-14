from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_paths = [
    os.path.join(os.getcwd(), '.env'),
    os.path.join(BASE_DIR, '.env'),
    os.path.join(os.path.dirname(BASE_DIR), '.env')
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
    PORT: int = int(os.environ.get("PORT", 5000))

settings = Settings()
