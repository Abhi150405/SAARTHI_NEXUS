import os
import requests
import re
from pymongo import MongoClient
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
import certifi

def parse_status(content):
    if not content:
        return 'Selected'
        
    content_upper = content.upper()
    # Focus on the last few paragraphs (last 1000-1500 characters)
    last_portion = content[-1500:].upper()
    
    # 1. Look for explicit verdict sections, prioritized by LAST occurrence
    verdict_patterns = [
        r'(?:\*\*|\#)?\s*(?:Final\s+)?(?:Verdict|Result|Outcome)\s*(?:\*\*|:)?\s*([^\n]*)'
    ]
    
    for pattern in verdict_patterns:
        matches = list(re.finditer(pattern, content, re.IGNORECASE))
        if matches:
            last_match = matches[-1]
            stat_val = last_match.group(1).upper()
            if 'SELECT' in stat_val: return 'Selected'
            if 'REJECT' in stat_val or 'NOT' in stat_val or 'FAILED' in stat_val or 'UNFORTUNATE' in stat_val: return 'Rejected'
            if 'OFFER' in stat_val: return 'Selected'

    # 2. Search for common phrases specifically in the LAST portion
    rejection_phrases = [
        "WAS NOT SELECTED", "REJECTED", "COULDN'T MAKE IT", "COULD NOT MAKE IT", 
        "FAILED", "NOT IN THE FINAL LIST", "BETTER LUCK NEXT TIME", "UNFORTUNATELY", 
        "WAS NOT ON THE LIST", "UNSUCCESSFUL", "DID NOT GET THE OFFER"
    ]
    selection_phrases = [
        "I WAS SELECTED", "GOT THE OFFER", "RECEIVED THE OFFER", 
        "MY NAME WAS ON THE LIST", "FINALLY SELECTED", "WAS SELECTED", "OFFER LETTER"
    ]
    
    for phrase in rejection_phrases:
        if phrase in last_portion:
            return 'Rejected'
            
    for phrase in selection_phrases:
        if phrase in last_portion:
            return 'Selected'
            
    # 3. Check for marker emojis in the last portion
    if "✅" in last_portion or "🎉" in last_portion or "🎊" in last_portion: return 'Selected'
    if "❌" in last_portion or "😞" in last_portion: return 'Rejected'
    
    # 4. Fallback search on full text (if still not found in last portion)
    for phrase in rejection_phrases:
        if phrase in content_upper:
            return 'Rejected'

    return 'Selected' # Default fallback

def main():
    load_dotenv()
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
    db = client['saarthi_nexus']
    collection = db['interview_experience']
    
    count_inserted = 0
    count_updated = 0
    page_num = 0
    items_per_page = 100
    
    while True:
        url = f"https://www.pict.live/api/feed?page={page_num}&itemsPerPage={items_per_page}"
        print(f"Fetching from {url}...")
        
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Failed to fetch data: {response.status_code}")
            break
            
        data = response.json()
        print(f"Fetched {len(data)} items on page {page_num}.")
        
        if len(data) == 0:
            break
            
        for item in data:
            student_name = item.get("name", "Unknown")
            company_name = item.get("company", "Unknown")
            role = item.get("role", "SDE")
            batch = str(item.get("batch", "2025"))
            branch = item.get("branch", "CS")
            experience = item.get("exp_text", "")
            status = parse_status(experience)
            
            # Clean up the experience text if it starts with a title like '# Interview Experience...'
            parts = experience.split('---', 1)
            if len(parts) == 2 and '# Interview' in parts[0]:
                experience = parts[1].strip()
            else:
                experience = experience.strip()
                
            date_str = item.get("date")
            try:
                # e.g., "Fri Mar 27 2026 18:54:10 GMT+0000 (Coordinated Universal Time)"
                pd_date = pd.to_datetime(date_str)
                iso_date = pd_date.isoformat()
                formatted_date = pd_date.strftime("%d %b %Y")
            except:
                iso_date = pd.Timestamp.now().isoformat()
                formatted_date = datetime.now().strftime("%d %b %Y")

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
                "created_at": iso_date,
                "formatted_date": formatted_date,
                "date": iso_date,
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
                
        if len(data) < items_per_page:
            break
            
        page_num += 1
                
    print(f"Successfully inserted {count_inserted} and updated {count_updated} experiences into MongoDB overall.")

if __name__ == '__main__':
    main()
