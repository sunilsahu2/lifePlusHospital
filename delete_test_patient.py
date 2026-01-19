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

def delete_patient_records(patient_name):
    print(f"Searching for patient: {patient_name}...")
    
    # 1. Find Patient
    # Case insensitive search
    patient = db.patients.find_one({'name': {'$regex': f'^{patient_name}$', '$options': 'i'}})
    
    if not patient:
        print(f"Patient '{patient_name}' not found.")
        return

    patient_id = patient['_id']
    print(f"Found patient: {patient['name']} (ID: {patient_id})")

    # 2. Find associated Cases
    cases = list(db.cases.find({'patient_id': patient_id}))
    case_ids = [c['_id'] for c in cases]
    print(f"Found {len(case_ids)} cases associated with the patient.")

    # 3. Delete Linked Records
    
    # Define collections that link by case_id
    collections_by_case = [
        'case_charges',
        'case_doctor_charges',
        'case_studies', 
        'payouts',
        'payments',
        'prescriptions',
        'appointments' # Appointments might be linked by case_id
    ]

    for col_name in collections_by_case:
        if case_ids:
            result = db[col_name].delete_many({'case_id': {'$in': case_ids}})
            print(f"Deleted {result.deleted_count} records from {col_name} (by case_id).")
    
    # 4. Delete Records linked directly by patient_id (that might not have case_id or for completeness)
    collections_by_patient = [
        'prescriptions',
        'appointments',
        'cases' # Delete cases last
    ]
    
    for col_name in collections_by_patient:
        result = db[col_name].delete_many({'patient_id': patient_id})
        print(f"Deleted {result.deleted_count} records from {col_name} (by patient_id).")

    # 5. Delete Patient
    result = db.patients.delete_one({'_id': patient_id})
    print(f"Deleted patient record: {result.deleted_count}")

    print("Deletion complete.")

if __name__ == "__main__":
    delete_patient_records("TEST PATIENT 3")
