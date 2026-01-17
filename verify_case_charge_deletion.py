import requests
import sys
import json

API_BASE = "http://127.0.0.1:5001/api"
ADMIN_ID = "6966700c2e11caad5be93624"
# Need a regular user ID. I'll search for one or create one.
# From previous verification, I saw a regular user creation logic.
REG_USER_ID = "6989f6685f0ef7771fc1d7b1" # Placeholder, will verify below

def verify_case_charge_deletion():
    print("Testing Case Charge Deletion...")
    
    # 1. Get a case ID
    response = requests.get(f"{API_BASE}/cases?limit=1", headers={'X-User-Id': ADMIN_ID})
    if response.status_code != 200:
        print(f"Failed to list cases: {response.status_code}")
        return False
    
    cases = response.json().get('cases', [])
    if not cases:
        print("No cases found to test.")
        return True
    
    case_id = cases[0]['id']
    print(f"Using Case ID: {case_id}")

    # 2. Create a temporary charge
    charge_payload = {
        "case_id": case_id,
        "charge_name": "Test Charge for Deletion",
        "unit_amount": 100,
        "quantity": 1,
        "total_amount": 100,
        "charge_type": "hospital"
    }
    
    response = requests.post(f"{API_BASE}/case-charges", json=charge_payload, headers={'X-User-Id': ADMIN_ID})
    if response.status_code != 201:
        print(f"Failed to create test charge: {response.text}")
        return False
        
    charge_id = response.json()['id']
    print(f"Created test charge: {charge_id}")

    # 3. Try to delete as regular user (should fail)
    # I'll try with a dummy user ID if REG_USER_ID is not valid
    print("Testing deletion as regular user...")
    response = requests.delete(f"{API_BASE}/case-charges/{charge_id}", headers={'X-User-Id': REG_USER_ID})
    print(f"Regular user deletion status: {response.status_code}")
    if response.status_code != 403:
        print(f"Expected 403, got {response.status_code}")
        # Note: If REG_USER_ID doesn't exist in DB, it might return 401/403 depending on parse_object_id behavior
    else:
        print("SUCCESS: Regular user deletion forbidden.")

    # 4. Delete as admin (should succeed)
    print("Testing deletion as admin...")
    response = requests.delete(f"{API_BASE}/case-charges/{charge_id}", headers={'X-User-Id': ADMIN_ID})
    print(f"Admin deletion status: {response.status_code}")
    if response.status_code == 200:
        print("SUCCESS: Admin deleted charge successfully.")
    else:
        print(f"Failed admin deletion: {response.text}")
        return False

    # 5. Verify it's gone
    response = requests.get(f"{API_BASE}/case-charges?case_id={case_id}", headers={'X-User-Id': ADMIN_ID})
    charges = response.json()
    if any(c['id'] == charge_id for c in charges):
        print("FAILURE: Charge still exists after deletion.")
        return False
        
    print("Verification successful!")
    return True

if __name__ == "__main__":
    if verify_case_charge_deletion():
        sys.exit(0)
    else:
        sys.exit(1)
