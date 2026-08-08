import asyncio, os, csv, sys
from dotenv import load_dotenv

# Load env from multiple possible locations
for p in ['.env', 'backend/.env', 'backend\\.env']:
    if os.path.exists(p):
        load_dotenv(p)
        break

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')

import certifi
from motor.motor_asyncio import AsyncIOMotorClient

async def fetch_students():
    client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client['saarthi_nexus']
    students = await db['students'].find(
        {},
        {'_id': 0, 'fullName': 1, 'email': 1, 'department': 1, 'rollNumber': 1, 'cgpa': 1}
    ).to_list(length=500)
    client.close()
    return students

students = asyncio.run(fetch_students())
print(f'Total students in DB: {len(students)}')

# Write CSV
with open('sample_attendance_students.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['name', 'email', 'branch', 'roll_no'])
    for s in students:
        writer.writerow([
            s.get('fullName', ''),
            s.get('email', ''),
            s.get('department', ''),
            s.get('rollNumber', '')
        ])

print('CSV updated: sample_attendance_students.csv')
print('')
print('--- Student List (preview) ---')
for s in students[:15]:
    name = s.get('fullName', '?')
    email = s.get('email', '?')
    dept = s.get('department', '?')
    roll = s.get('rollNumber', '?')
    print(f'  {name} | {email} | {dept} | {roll}')
