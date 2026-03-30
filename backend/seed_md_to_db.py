import os
import re
from pymongo import MongoClient
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

# Connect to MongoDB
load_dotenv()
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
import certifi
client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
db = client['saarthi_nexus']
collection = db['interview_experience']

# We won't clear existing records to preserve manual test entries.
# collection.delete_many({})

base_dir = r"c:\Users\ABHIJIT\Desktop\SAARTHI_NEXUS\student_experiences"
count_inserted = 0
count_updated = 0

for root_dir, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.md'):
            file_path = os.path.join(root_dir, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            folder_name = os.path.basename(os.path.dirname(file_path))
            student_name = folder_name
            company_name = file.split('_')[0] if '_' in file else 'Unknown Company'
            role = 'SDE'
            branch = 'CS'
            batch = '2025'
            status = 'Selected'
            
            name_m = re.search(r'#(.*(?:Interview Experience|Interview):?\s*(.*))', content, re.IGNORECASE)
            if name_m and len(name_m.group(2).strip()) > 0: 
                student_name = name_m.group(2).strip()
            
            comp_m = re.search(r'\*\*Company:\*\*\s*(.*)', content, re.IGNORECASE)
            if comp_m: company_name = comp_m.group(1).strip()
                
            role_m = re.search(r'\*\*Role:\*\*\s*(.*)', content, re.IGNORECASE)
            if role_m: role = role_m.group(1).strip()
                
            branch_m = re.search(r'\*\*Branch:\*\*\s*(.*)', content, re.IGNORECASE)
            if branch_m: branch = branch_m.group(1).strip()
                
            batch_m = re.search(r'\*\*Batch.*?:\*\*\s*(.*)', content, re.IGNORECASE)
            if not batch_m:
                batch_m = re.search(r'Batch/Year of Graduation.*?:\s*(.*)', content, re.IGNORECASE)
            if batch_m: batch = batch_m.group(1).strip()
                
            status_m = re.search(r'(?:\*\*|\#)?\s*Verdict\s*(?:\*\*|:)?\s*(.*)', content, re.IGNORECASE)
            if status_m:
                stat_val = status_m.group(1).upper()
                if 'SELECT' in stat_val: status = 'Selected'
                elif 'REJECT' in stat_val or 'NOT' in stat_val or 'REVOKE' in stat_val: status = 'Rejected'
                else: status = 'Selected'

            parts = content.split('---', 1)
            if len(parts) == 2:
                experience = parts[1].strip()
            else:
                experience = content.strip()

            record = {
                "student_name": student_name,
                "company_name": company_name,
                "role": role,
                "year": batch,
                "branch": branch,
                "graduation_year": batch,
                "rounds": "",
                "experience": experience,
                "suggestions": "",
                "status": status,
                "created_at": pd.Timestamp.now().isoformat(),
                "formatted_date": datetime.now().strftime("%d %b %Y"),
                "date": pd.Timestamp.now().isoformat(),
                "reads": 0
            }
            result = collection.update_one(
                {"student_name": student_name, "company_name": company_name},
                {"$set": record},
                upsert=True
            )
            if result.upserted_id:
                count_inserted += 1
            else:
                count_updated += 1

print(f"Successfully inserted {count_inserted} and updated {count_updated} experiences into MongoDB.")
