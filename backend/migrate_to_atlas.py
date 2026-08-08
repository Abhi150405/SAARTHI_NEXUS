"""
Migrate data from local MongoDB to MongoDB Atlas.
Run this once to copy all collections to the cloud.
"""
from pymongo import MongoClient
import sys

LOCAL_URI = "mongodb://localhost:27017/"
ATLAS_URI = "mongodb+srv://abhijitkhole15_db_user:Saarthi123@cluster1.mtywgb6.mongodb.net/saarthi_nexus?retryWrites=true&w=majority&appName=Cluster1"
DB_NAME = "saarthi_nexus"

COLLECTIONS = [
    "placement_records",
    "students",
    "admins",
    "notifications",
    "interview_experience",
    "company_feedback",
]

def migrate():
    print("Connecting to local MongoDB...")
    try:
        local_client = MongoClient(LOCAL_URI, serverSelectionTimeoutMS=5000)
        local_client.admin.command('ping')
    except Exception as e:
        print(f"ERROR: Cannot connect to local MongoDB: {e}")
        print("Make sure your local MongoDB is running.")
        sys.exit(1)

    print("Connecting to MongoDB Atlas...")
    try:
        atlas_client = MongoClient(ATLAS_URI, serverSelectionTimeoutMS=10000)
        atlas_client.admin.command('ping')
    except Exception as e:
        print(f"ERROR: Cannot connect to Atlas: {e}")
        sys.exit(1)

    local_db = local_client[DB_NAME]
    atlas_db = atlas_client[DB_NAME]

    total_migrated = 0

    for coll_name in COLLECTIONS:
        local_coll = local_db[coll_name]
        atlas_coll = atlas_db[coll_name]
        
        docs = list(local_coll.find())
        count = len(docs)
        
        if count == 0:
            print(f"  {coll_name}: 0 documents (skipped)")
            continue
        
        # Check if Atlas already has data
        existing = atlas_coll.count_documents({})
        if existing > 0:
            print(f"  {coll_name}: Atlas already has {existing} docs. Skipping to avoid duplicates.")
            continue
        
        # Insert all documents
        atlas_coll.insert_many(docs)
        total_migrated += count
        print(f"  {coll_name}: {count} documents migrated ✓")

    print(f"\nDone! {total_migrated} total documents migrated to Atlas.")
    
    local_client.close()
    atlas_client.close()

if __name__ == "__main__":
    migrate()
