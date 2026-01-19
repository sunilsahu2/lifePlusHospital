import os
import urllib.parse
from pymongo import MongoClient
from bson import ObjectId

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

def cleanup_orphan_payments():
    print("Starting cleanup of orphan payments...")
    
    deleted_count = 0
    payments = list(db.payments.find({}))
    total_payments = len(payments)
    
    print(f"Total payments found: {total_payments}")
    
    for payment in payments:
        should_delete = False
        reason = ""
        
        patient_id = payment.get('patient_id')
        
        if not patient_id:
            should_delete = True
            reason = "Missing patient_id"
        else:
            # Check if patient exists
            # Ensure it's an ObjectId if stored as such, or string if stored as string
            # Based on app.py, it tries to store as ObjectId
            
            patient = db.patients.find_one({'_id': patient_id})
            if not patient:
                should_delete = True
                reason = f"Patient {patient_id} not found"
        
        if should_delete:
            print(f"Deleting payment {payment.get('_id')}: {reason}")
            db.payments.delete_one({'_id': payment['_id']})
            deleted_count += 1
            
    print(f"Cleanup complete. Deleted {deleted_count} orphan payment records.")

if __name__ == "__main__":
    cleanup_orphan_payments()
