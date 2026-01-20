
import requests
import json
from pymongo import MongoClient
from bson import ObjectId
import datetime

BASE_URL = 'http://localhost:5001/api'
MONGODB_URI = "mongodb+srv://sunilsahu:sokwer-pubgux-poxxE3@cluster0.qufitms.mongodb.net/?retryWrites=true&w=majority"

def run_test():
    client = MongoClient(MONGODB_URI)
    db = client['hospital_management']
    
    # 1. Setup: Ensure we have a closed case
    # Create a dummy case and close it
    case_data = {
        'patient_id': '000000000000000000000000', # Dummy
        'doctor_id': '000000000000000000000000', # Dummy
        'case_type': 'OPD',
        'status': 'closed',
        'case_number': 'TEST-CLOSE-EDIT',
        'admission_date': datetime.datetime.now(),
        'created_at': datetime.datetime.now()
    }
    
    # Just insert directly to DB to ensure it's closed
    res = db.cases.insert_one(case_data)
    case_id = str(res.inserted_id)
    print(f"Created closed test case: {case_id}")
    
    # 2. Get Admin User
    admin_user = db.users.find_one({'role': 'admin', 'is_active': True})
    if not admin_user:
        print("No admin user found.")
        return
    admin_id = str(admin_user['_id'])
    print(f"Using Admin ID: {admin_id}")
    
    # 3. Test Admin Update (using Header Auth)
    print("\n--- Testing Admin Update on Closed Case ---")
    update_data = {
        'description': 'Updated by Admin on Closed Case',
        'status': 'closed' # Keep it closed
    }
    
    headers = {
        'X-User-Id': admin_id,
        'Content-Type': 'application/json'
    }

    try:
        res = requests.put(f"{BASE_URL}/cases/{case_id}", json=update_data, headers=headers)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
        
        if res.status_code == 200:
            print("✓ Admin Update Success!")
        else:
            print("✗ Admin Update Failed")
    except Exception as e:
        print(f"Request failed: {e}")

    # 4. Test Non-Admin Update (Should Fail)
    print("\n--- Testing Non-Admin Update on Closed Case ---")
    
    # Create non-admin user if needed or find one
    staff_user = db.users.find_one({'role': {'$ne': 'admin'}, 'is_active': True})
    if not staff_user:
        print("No non-admin user found for negative test.")
    else:
        staff_id = str(staff_user['_id'])
        print(f"Using Staff ID: {staff_id}")
        
        headers_staff = {
            'X-User-Id': staff_id,
            'Content-Type': 'application/json'
        }
        
        try:
            res = requests.put(f"{BASE_URL}/cases/{case_id}", json=update_data, headers=headers_staff)
            print(f"Status: {res.status_code}")
            print(f"Response: {res.text}")
            
            if res.status_code == 400 and "Cannot update a closed case" in res.text:
                print("✓ Non-Admin Blocked Successfully!")
            else:
                print("✗ Non-Admin WAS NOT BLOCKED correctly.")
        except Exception as e:
            print(f"Request failed: {e}") 
            
    # Cleanup
    db.cases.delete_one({'_id': ObjectId(case_id)})
    print("\nCleanup done.")
    
if __name__ == "__main__":
    run_test()
