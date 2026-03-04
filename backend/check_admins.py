from pymongo import MongoClient

client = MongoClient('mongodb+srv://abhijitkhole15_db_user:Saarthi123@cluster1.mtywgb6.mongodb.net/saarthi_nexus?retryWrites=true&w=majority&appName=Cluster1')
db = client['saarthi_nexus']
admins = list(db['admins'].find({}, {'password': 0}))

if admins:
    for a in admins:
        print(f"Email: {a.get('email')}")
        print(f"Name: {a.get('full_name')}")
        print(f"Role: {a.get('role')}")
        print("---")
else:
    print("No admin accounts found!")

print(f"\nTotal admins: {len(admins)}")
client.close()
