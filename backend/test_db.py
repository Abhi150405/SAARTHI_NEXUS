import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import os
from dotenv import load_dotenv

async def test_conn():
    load_dotenv('.env')
    uri = os.getenv("MONGO_URI")
    print(f"Testing connection to: {uri[:20]}...")
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    try:
        await client.admin.command('ping')
        print("Ping successful!")
    except Exception as e:
        print(f"Ping failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
