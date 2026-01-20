
import requests
import json
from datetime import datetime

BASE_URL = 'http://localhost:5001/api'

def run_verification():
    print("Starting verification for DAYCARE charges on OPD cases...")

    # 1. Create a Test Patient
    print("\n1. Creating Test Patient...")
    patient_data = {
        'name': 'Test Patient Daycare',
        'phone': '5550001111',
        'gender': 'Male',
        'age': 30
    }
    s = requests.Session()
    # Try to login first (assuming default/test credentials exist or I can create a session)
    # The app seems to use session.
    # Let's try to login with a known user if possible.
    # Or, since I can run code on the server, I can might be able to generate a session token?
    # Simpler: The backend checks `if 'user_id' not in session`.
    # I can't fake this easily from outside without the secret key.
    
    # ALTERNATIVE: Use the existing `app.py` context in a script instead of `requests` against localhost.
    # This avoids the auth issue by mocking the session.
    pass
        res = requests.post(f"{BASE_URL}/patients", json=patient_data)
        if res.status_code == 201:
            patient_id = res.json()['id']
            print(f"✓ Patient created: {patient_id}")
        else:
            print(f"⚠ Could not create patient (might exist), searching...")
            # print(f"Response: {res.text}")
            res = requests.get(f"{BASE_URL}/patients?search=Test Patient Daycare")
            if res.status_code != 200:
                print(f"✗ Failed to search: {res.status_code} - {res.text}")
                return
            patients = res.json().get('patients', [])
            if patients:
                patient_id = patients[0]['id']
                print(f"✓ Found existing patient: {patient_id}")
            else:
                print("✗ Failed to get patient")
                return
    except Exception as e:
        print(f"✗ Error: {e}")
        return

    # 2. Create an OPD Case
    print("\n2. Creating OPD Case...")
    case_data = {
        'patient_id': patient_id,
        'case_type': 'OPD',
        'description': 'Test OPD Case for Daycare Charge',
        'admission_date': datetime.now().isoformat()
    }
    try:
        res = requests.post(f"{BASE_URL}/cases", json=case_data)
        if res.status_code == 201:
            case_id = res.json()['id']
            print(f"✓ OPD Case created: {case_id}")
        else:
            print(f"✗ Failed to create case: {res.text}")
            return
    except Exception as e:
        print(f"✗ Error: {e}")
        return

    # 3. Find a DAYCARE Charge
    print("\n3. Finding a DAYCARE Charge in Charge Master...")
    try:
        res = requests.get(f"{BASE_URL}/charge-master?limit=1000")
        charges = res.json().get('charges', [])
        
        daycare_charge = None
        for c in charges:
            cat = c.get('category', '').upper()
            chk_cat = c.get('charge_category', '').upper()
            if cat == 'DAYCARE' or chk_cat == 'DAYCARE':
                daycare_charge = c
                break
        
        if daycare_charge:
            print(f"✓ Found DAYCARE charge: {daycare_charge['name']} (ID: {daycare_charge['id']})")
        else:
            print("✗ No DAYCARE charge found in Charge Master. Cannot verify.")
            # Create one for testing if not found?
            print("Creating a temporary DAYCARE charge...")
            new_charge = {
                'name': 'TEST DAYCARE CHARGE',
                'category': 'DAYCARE',
                'amount': 500,
                'description': 'Test charge'
            }
            res = requests.post(f"{BASE_URL}/charge-master", json=new_charge)
            if res.status_code == 201:
                daycare_charge = {'id': res.json()['id'], 'name': 'TEST DAYCARE CHARGE', 'amount': 500}
                print(f"✓ Created test DAYCARE charge: {daycare_charge['id']}")
            else:
                print(f"✗ Failed to create test charge: {res.text}")
                return
    except Exception as e:
        print(f"✗ Error: {e}")
        return

    # 4. Add DAYCARE Charge to OPD Case
    print("\n4. Adding DAYCARE Charge to OPD Case...")
    charge_data = {
        'case_id': case_id,
        'charge_master_id': daycare_charge['id'],
        'charge_name': daycare_charge['name'],
        'quantity': 1,
        'unit_amount': daycare_charge['amount'],
        'total_amount': daycare_charge['amount'],
        'charge_type': 'hospital' # Frontend defaults to hospital for this
    }
    try:
        res = requests.post(f"{BASE_URL}/case-charges", json=charge_data)
        if res.status_code == 201:
             print(f"✓ Charge added successfully: {res.json()['id']}")
        else:
             print(f"✗ Failed to add charge: {res.text}")
             return
    except Exception as e:
        print(f"✗ Error: {e}")
        return

    # 5. Verify Case Details
    print("\n5. Verifying Case Details...")
    try:
        res = requests.get(f"{BASE_URL}/cases/{case_id}")
        case = res.json()
        charges = case.get('charges', [])
        
        found = False
        for c in charges:
            if c['charge_master_id'] == daycare_charge['id']:
                found = True
                print(f"✓ Verified charge exists in case details: {c['charge_name']} - {c['total_amount']}")
                break
        
        if not found:
            print("✗ Charge not found in case details!")
        
    except Exception as e:
        print(f"✗ Error: {e}")

    print("\nVerification Complete.")

if __name__ == "__main__":
    run_verification()
