import os
import urllib.parse
from pymongo import MongoClient
from datetime import datetime

# MongoDB Connection Configuration (Synced with app.py)
MONGODB_USERNAME = 'sunilsahu'
MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
MONGODB_DB_NAME = 'hospital_management'

encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
MONGODB_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]

def bulk_close_cases():
    print(f"Connecting to {MONGODB_DB_NAME}...")
    now = datetime.now()
    
    # Mark all cases as closed and add billed_at timestamp
    result = db.cases.update_many(
        {'status': {'$ne': 'closed'}},
        {
            '$set': {
                'status': 'closed',
                'billed_at': now,
                'updated_at': now
            }
        }
    )
    
    print(f"Successfully matched {result.matched_count} cases and updated {result.modified_count} cases to 'closed' status.")

if __name__ == "__main__":
    bulk_close_cases()
