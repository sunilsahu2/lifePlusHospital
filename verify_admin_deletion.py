import requests
import json
import time

BASE_URL = "http://localhost:5001/api"
ADMIN_ID = "6966700c2e11caad5be93624" # Verified ID for 'sunilsahu'

def verify_admin_deletion():
    print("--- Verifying Admin Case Deletion ---")
    
    # 1. Create a test case
    case_payload = {
        "admission_date": "2026-01-16",
        "patient_id": "696334ddc86c415d36c02e53", # Existing patient ID
        "case_type": "OPD",
        "doctor_id": "696334ddc86c415d36c02e54"
    }
    
    create_resp = requests.post(f"{BASE_URL}/cases", json=case_payload)
    if create_resp.status_code != 201:
        print(f"Failed to create test case: {create_resp.text}")
        return
    
    case_id = create_resp.json()['id']
    print(f"Created test case: {case_id}")
    
    # 2. Try deleting without headers (Unauthorized)
    print("\nTest 1: Delete without headers")
    resp = requests.delete(f"{BASE_URL}/cases/{case_id}")
    print(f"Status: {resp.status_code}, Response: {resp.text}")
    if resp.status_code == 401:
        print("SUCCESS: Unauthorized without headers")
    else:
        print("FAILURE: Expected 401")

    # 3. Create a regular user for testing
    print("\nCreating test regular user...")
    import pymongo, urllib.parse, hashlib
    client = pymongo.MongoClient('mongodb+srv://sunilsahu:' + urllib.parse.quote_plus('sokwer-pubgux-poxxE3') + '@cluster0.qufitms.mongodb.net/hospital_management')
    db = client.hospital_management
    db.users.update_one({'username': 'reguser'}, {'$set': {'username': 'reguser', 'password': hashlib.sha256('pass123'.encode()).hexdigest(), 'role': 'user', 'is_active': True}}, upsert=True)
    reg_user = db.users.find_one({'username': 'reguser'})
    reg_user_id = str(reg_user['_id'])
    print(f"Regular User ID: {reg_user_id}")
    
    # 4. Try deleting with regular user role (Forbidden)
    print("\nTest 2: Delete with regular user role")
    resp = requests.delete(f"{BASE_URL}/cases/{case_id}", headers={'X-User-Id': reg_user_id})
    print(f"Status: {resp.status_code}, Response: {resp.text}")
    if resp.status_code == 403:
        print("SUCCESS: Forbidden for regular user")
    else:
        print("FAILURE: Expected 403")
        
    # 5. Try deleting with admin role (Success)
    print("\nTest 3: Delete with admin role")
    resp = requests.delete(f"{BASE_URL}/cases/{case_id}", headers={'X-User-Id': ADMIN_ID})
    print(f"Status: {resp.status_code}, Response: {resp.text}")
    if resp.status_code == 200:
        print("SUCCESS: Case deleted by admin")
    else:
        print("FAILURE: Expected 200")

    # 6. Verify case is actually deleted
    print("\nVerifying case removal...")
    resp = requests.get(f"{BASE_URL}/cases/{case_id}")
    if resp.status_code == 404:
        print("SUCCESS: Case not found after deletion")
    else:
        print(f"FAILURE: Case still exists. Status: {resp.status_code}")

if __name__ == "__main__":
    verify_admin_deletion()
