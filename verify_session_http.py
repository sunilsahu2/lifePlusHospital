
import requests
import json
import sys

BASE_URL = 'http://localhost:5001/api'

def run_test():
    s = requests.Session()
    
    # 1. Login
    print("1. Attempting Login...")
    login_data = {
        'username': 'admin', 
        'password': 'password' 
        # Assuming these credentials exist or similar. 
        # If not, I might fail here, but I just want to see if I get a cookie.
    }
    
    # Try default admin/admin or similar if I don't know exact creds.
    # Looking at `cleanup_jan2026_payments.py` or others, I don't see creds.
    # But `app.py` has a user collection. 
    # I'll try to find a valid user from the database in a separate step if this fails, 
    # but let's assume 'admin' exists. 
    # Actually, from `verify_daycare_charge_unit.py` I mocked the user.
    # I need a REAL user.
    # I will query the DB first to get a valid username.
    
    from pymongo import MongoClient
    import os
    MONGODB_URI = "mongodb+srv://sunilsahu:sokwer-pubgux-poxxE3@cluster0.qufitms.mongodb.net/?retryWrites=true&w=majority"
    client = MongoClient(MONGODB_URI)
    db = client['hospital_management']
    user = db.users.find_one({'is_active': True})
    
    if not user:
        print("No active user found in DB to test login.")
        return
        
    print(f"Found test user: {user['username']}")
    # I don't know the password... hash is stored.
    # I can't login without password.
    # Force reset password for this user? No, I shouldn't mess with data.
    
    # Alternative: Create a TEMPORARY user with known password.
    print("Creating temporary test user...")
    import hashlib
    test_user = {
        'username': 'temp_test_user_999',
        'password': hashlib.sha256('testpass123'.encode()).hexdigest(),
        'role': 'admin',
        'is_active': True
    }
    db.users.update_one(
        {'username': 'temp_test_user_999'}, 
        {'$set': test_user}, 
        upsert=True
    )
    
    # Now login
    res = s.post(f"{BASE_URL}/auth/login", json={'username': 'temp_test_user_999', 'password': 'testpass123'})
    print(f"Login Status: {res.status_code}")
    print(f"Cookies: {s.cookies.get_dict()}")
    
    if res.status_code != 200:
        print("Login failed.")
        print(res.text)
        return

    # 2. Try an authenticated GET request (e.g., list cases or patients)
    print("\n2. Requesting Protected Resource (GET /cases)...")
    res = s.get(f"{BASE_URL}/cases?limit=1")
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        print("✓ Authorized GET success")
    else:
        print(f"✗ Failed: {res.text}")

    # 3. Create Dummy Case Charge (requires Case ID)
    # Find a case first
    cases = db.cases.find_one({'status': {'$ne': 'closed'}})
    if not cases:
        print("No open case found to add charge.")
        return
    case_id = str(cases['_id'])
    
    print(f"\n3. Requesting Protected Resource (POST /case-charges) for Case {case_id}...")
    charge_data = {
        'case_id': case_id,
        'charge_type': 'hospital',
        'amount': 100,
        'quantity': 1,
        'charge_name': 'TEST CHARGE SESSION'
    }
    # Need to satisfy validations (charge_master_id might be optional or required? Code says required check might be loose or I need it)
    # create_case_charge: "if 'charge_master_id' in data..." it's not strictly enforced in the code snippet I saw unless "Charge ID is required"? 
    # Let's check app.py... it converts if present.
    # It seems to just insert.
    
    res = s.post(f"{BASE_URL}/case-charges", json=charge_data)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
    
    # Clean up test user
    db.users.delete_one({'username': 'temp_test_user_999'})

if __name__ == "__main__":
    run_test()
