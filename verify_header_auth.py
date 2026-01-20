
import requests
import json
from pymongo import MongoClient
from bson import ObjectId

BASE_URL = 'http://localhost:5001/api'

def run_test():
    # 1. Get a valid user ID directly from DB
    MONGODB_URI = "mongodb+srv://sunilsahu:sokwer-pubgux-poxxE3@cluster0.qufitms.mongodb.net/?retryWrites=true&w=majority"
    client = MongoClient(MONGODB_URI)
    db = client['hospital_management']
    
    # Create temp user if needed or get existing
    user = db.users.find_one({'username': 'sunilsahu'})
    if not user:
        print("User 'sunilsahu' not found, finding any active user...")
        user = db.users.find_one({'is_active': True})
    
    if not user:
        print("No active user found.")
        return

    user_id = str(user['_id'])
    print(f"Using User ID: {user_id}")
    
    # 2. Make request WITHOUT session cookie, BUT WITH header
    # We use requests.post directly (no Session object) so no cookies are stored/sent
    
    # Find an open case to add charge to
    case = db.cases.find_one({'status': {'$ne': 'closed'}})
    if not case:
        print("No open case found.")
        return
    case_id = str(case['_id'])
    
    charge_data = {
        'case_id': case_id,
        'charge_type': 'hospital',
        'amount': 50,
        'quantity': 1,
        'charge_name': 'TEST HEADER AUTH CHARGE'
    }
    
    headers = {
        'X-User-Id': user_id,
        'Content-Type': 'application/json'
    }
    
    print(f"Attempting to add charge with X-User-Id header (No Cookie)...")
    try:
        res = requests.post(f"{BASE_URL}/case-charges", json=charge_data, headers=headers)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
        
        if res.status_code == 201:
            print("✓ Header Authentication Success!")
        else:
            print("✗ Header Authentication Failed")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    run_test()
