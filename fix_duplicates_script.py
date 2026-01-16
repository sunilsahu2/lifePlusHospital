import urllib.parse
from pymongo import MongoClient
from datetime import datetime
import os

# MongoDB Connection Configuration
MONGODB_USERNAME = 'sunilsahu'
MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
MONGODB_DB_NAME = 'hospital_management'

def get_db():
    encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
    MONGODB_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'
    client = MongoClient(MONGODB_URI)
    return client[MONGODB_DB_NAME]

def fix_duplicates():
    db = get_db()
    
    # 1. Identify duplicates
    pipeline = [
        {"$group": {
            "_id": "$case_number",
            "count": {"$sum": 1},
            "ids": {"$push": "$_id"}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    duplicates = list(db.cases.aggregate(pipeline))
    print(f"Found {len(duplicates)} duplicate case number groups.")
    
    total_fixed = 0
    for group in duplicates:
        case_number = group['_id']
        ids = group['ids']
        print(f"Processing group {case_number} with {len(ids)} cases.")
        
        # Keep the first one, change the rest
        # (Though technically it doesn't matter which one we change)
        for i in range(1, len(ids)):
            case_id = ids[i]
            
            # Generate new case number using the same logic as in app.py
            year = datetime.now().year
            counter_id = f'case_number_{year}'
            
            # Atomic increment
            counter = db.counters.find_one_and_update(
                {'_id': counter_id},
                {'$inc': {'seq': 1}},
                upsert=True,
                return_document=True
            )
            # If it was just created (upserted), it might start at 1 or the incremented value.
            # In app.py I used 999 as initial, let's stick to that if it's new.
            # But here it's easier to just let it increment.
            
            new_case_number = f'CASE-{year}-{counter["seq"]:04d}'
            
            db.cases.update_one({'_id': case_id}, {'$set': {'case_number': new_case_number}})
            print(f"  Fixed case ID {case_id}: {case_number} -> {new_case_number}")
            total_fixed += 1
            
    print(f"\nTotal cases updated: {total_fixed}")

if __name__ == "__main__":
    # Check app.py for DB name first
    fix_duplicates()
