
import asyncio
from app.db.mongodb import get_database, connect_to_mongo

feedback_data = {
  "company_name": "MIPS Technologies",
  "students_appeared": {
    "aptitude_test": 25,
    "technical_test": 25,
    "technical_interview": 16,
    "hr_interview": None
  },
  "overall_observation": {
    "aptitude": None,
    "soft_skills": 3,
    "communication_skills": 3,
    "basic_concepts": 2,
    "programming": 2,
    "problem_solving": 4,
    "awareness_about_technological_trends": 4
  },
  "training_suggestions": "Training in programming and exposure to computer architecture needs to be improved.",
  "industry_institute_remarks": "Conduct seminars regarding embedded systems to create awareness of the required skill set.",
  "admin_name": "TNP Admin",
  "date": "2026-02-12"
}

async def seed():
    await connect_to_mongo()
    db = get_database()
    # check if exists
    existing = await db['company_feedback'].find_one({
        "company_name": feedback_data['company_name'],
        "date": feedback_data['date']
    })
    if not existing:
        await db['company_feedback'].insert_one(feedback_data)
        print(f"Feedback for {feedback_data['company_name']} added successfully.")
    else:
        print(f"Feedback for {feedback_data['company_name']} already exists.")

if __name__ == "__main__":
    asyncio.run(seed())
