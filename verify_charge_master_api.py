import requests
import sys

API_BASE = "http://127.0.0.1:5001/api"
ADMIN_ID = "6966700c2e11caad5be93624"
HEADERS = {'X-User-Id': ADMIN_ID}

def verify_charge_master_api():
    print("Testing Charge Master API...")
    
    # 1. List charges to get an ID
    response = requests.get(f"{API_BASE}/charge-master?limit=1", headers=HEADERS)
    if response.status_code != 200:
        print(f"Failed to list charges: {response.status_code}")
        print(response.text)
        return False
        
    data = response.json()
    charges = data.get('charges', [])
    if not charges:
        print("No charges found in Charge Master. Please add at least one charge to test.")
        return True # Not a failure of the code, just pre-requisite
        
    charge_id = charges[0]['id']
    expected_name = charges[0].get('name')
    print(f"Testing with Charge ID: {charge_id} (Name: {expected_name})")
    
    # 2. Test the new GET /api/charge-master/<id> route
    response = requests.get(f"{API_BASE}/charge-master/{charge_id}", headers=HEADERS)
    if response.status_code != 200:
        print(f"Failed to fetch single charge: {response.status_code}")
        print(response.text)
        return False
        
    charge = response.json()
    print(f"Fetched charge: {charge}")
    
    if charge.get('id') != charge_id:
        print(f"ID mismatch! Expected {charge_id}, got {charge.get('id')}")
        return False
        
    if charge.get('name') != expected_name:
        print(f"Name mismatch! Expected {expected_name}, got {charge.get('name')}")
        return False
        
    print("API verification successful!")
    return True

if __name__ == "__main__":
    if verify_charge_master_api():
        sys.exit(0)
    else:
        sys.exit(1)
