import os
import json
import glob
from pymongo import MongoClient

def seed_data():
    try:
        # Connect to local MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client['saarthi_nexus']
        collection = db['placement_records']
        
        # Clear existing collection
        collection.delete_many({})
        print("Cleared 'placement_records' collection.")
        
        # Files are in the parent directory (root)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.dirname(current_dir)
        json_pattern = os.path.join(base_dir, 'placement_data_*_formatted.json')
        
        json_files = glob.glob(json_pattern)
        
        if not json_files:
            print(f"No JSON files found matching {json_pattern}")
            return

        total_records = 0
        for file_path in json_files:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            if isinstance(data, list) and len(data) > 0:
                # Add unique ID if not present or just let MongoDB handle it
                collection.insert_many(data)
                print(f"Inserted {len(data)} records from {os.path.basename(file_path)}")
                total_records += len(data)
        
        print(f"SUCCESS: Seeded {total_records} total records into MongoDB.")
        
    except Exception as e:
        print(f"Error seeding data: {e}")

if __name__ == "__main__":
    seed_data()
