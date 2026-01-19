import os
import urllib.parse
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime

# MongoDB Connection Configuration
MONGODB_URI = os.getenv('MONGODB_URI')

if not MONGODB_URI:
    MONGODB_USERNAME = 'sunilsahu'
    MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
    MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
    MONGODB_DB_NAME = 'hospital_management'
    encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
    MONGODB_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'
else:
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'hospital_management')

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]

def cleanup_jan2026_payments():
    print("Starting cleanup of 2026 payments (excluding specific cases)...")
    
    # 1. Find Ids for the excluded cases
    excluded_case_numbers = ["CASE-2026-0063", "CASE-2026-0060"]
    excluded_case_ids = []
    
    cases = list(db.cases.find({'case_number': {'$in': excluded_case_numbers}}))
    for case in cases:
        excluded_case_ids.append(case['_id'])
        print(f"Preserving payments for case: {case['case_number']} (ID: {case['_id']})")
        
    # 2. Define deletion criteria
    start_date = datetime(2026, 1, 1)
    
    query = {
        'payment_date': {'$gte': start_date},
        'case_id': {'$nin': excluded_case_ids}
    }
    
    # Check count first
    count_to_delete = db.payments.count_documents(query)
    print(f"Found {count_to_delete} payments to delete.")
    
    if count_to_delete > 0:
        # Execute Delete
        result = db.payments.delete_many(query)
        print(f"Deleted {result.deleted_count} payment records.")
    else:
        print("No payments matched the criteria for deletion.")

    print("Cleanup complete.")

if __name__ == "__main__":
    cleanup_jan2026_payments()
