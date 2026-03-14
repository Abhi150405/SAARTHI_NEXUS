import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    load_dotenv('.env')
    uri = os.getenv("MONGO_URI")
    db_name = "saarthi_nexus"
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    count = await db['placement_records'].count_documents({})
    print(f"PLACEMENT_RECORDS_COUNT: {count}")
    
    distinct_years = await db['placement_records'].distinct('academic_year')
    print(f"DISTINCT_YEARS: {distinct_years}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
