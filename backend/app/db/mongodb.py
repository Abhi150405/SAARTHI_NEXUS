from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.DATABASE_NAME]
    try:
        await db.client.admin.command('ping')
        logging.info("Connected to MongoDB")
    except Exception as e:
        logging.error(f"Could not connect to MongoDB: {e}")

async def close_mongo_connection():
    db.client.close()
    logging.info("Closed MongoDB connection")

def get_database():
    return db.db
