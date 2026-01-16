import requests
import json
import time

BASE_URL = "http://localhost:5001/api"

def test_refined_doctor_charges():
    print("--- Verifying Refined Doctor Charge Logic ---")
    
    # 1. Get an active charge master
    cm_resp = requests.get(f"{BASE_URL}/charge-master?limit=1")
    cms = cm_resp.json()
    cm = cms['charges'][0] if 'charges' in cms else cms[0]
    cm_id = cm['id']
    print(f"Using Charge Master: {cm['name']} ({cm_id})")
    
    # 2. Get doctors by charge - verify all active doctors are returned
    docs_resp = requests.get(f"{BASE_URL}/doctors-by-charge?charge_master_id={cm_id}")
    doctors = docs_resp.json()
    print(f"Found {len(doctors)} doctors for charge.")
    
    # Verify we have at least some doctors and check if they are active
    active_docs = [d for d in doctors if d.get('isActive', True)]
    print(f"Active doctors in list: {len(active_docs)}")
    if len(doctors) == len(active_docs):
        print("SUCCESS: All returned doctors are active.")
    else:
        print("WARNING: Some returned doctors might not be active.")

    # 3. Create a test doctor charge for a case
    # Get a case ID first
    cases_resp = requests.get(f"{BASE_URL}/cases?limit=1")
    cases = cases_resp.json()
    case = cases['cases'][0] if 'cases' in cases else cases[0]
    case_id = case['id']
    print(f"Using Case: {case['case_number']} ({case_id})")
    
    doctor_id = doctors[0]['id']
    print(f"Using Doctor: {doctors[0]['name']} ({doctor_id})")
    
    payload = {
        "case_id": case_id,
        "doctor_id": doctor_id,
        "charge_master_id": cm_id,
        "amount": 500.0,
        "notes": "Verification test charge"
    }
    
    create_resp = requests.post(f"{BASE_URL}/case-doctor-charges", json=payload)
    if create_resp.status_code == 201:
        charge_id = create_resp.json()['id']
        print(f"SUCCESS: Created doctor charge with ID: {charge_id}")
        
        # 4. Verify the charge was created with correct name and category
        get_case_resp = requests.get(f"{BASE_URL}/cases/{case_id}")
        case_details = get_case_resp.json()
        
        # Find the new charge in doctor_charges
        new_charge = next((c for c in case_details.get('doctor_charges', []) if str(c.get('id')) == charge_id), None)
        if new_charge:
            print(f"SUCCESS: Found charge in case details.")
            print(f"Charge Name: {new_charge.get('charge_name')}")
            print(f"Charge Type/Category: {new_charge.get('charge_type')}")
            if new_charge.get('charge_name') == cm['name']:
                print("SUCCESS: Charge name matches Charge Master.")
            
            # 5. Test Update (PUT)
            print("--- Verifying Update Logic ---")
            update_payload = {
                "amount": 750.0,
                "notes": "Updated verification test charge"
            }
            update_resp = requests.put(f"{BASE_URL}/case-doctor-charges/{charge_id}", json=update_payload)
            if update_resp.status_code == 200:
                print("SUCCESS: Updated doctor charge.")
                get_case_resp = requests.get(f"{BASE_URL}/cases/{case_id}")
                updated_case = get_case_resp.json()
                updated_charge = next((c for c in updated_case.get('doctor_charges', []) if str(c.get('id')) == charge_id), None)
                if updated_charge and updated_charge.get('amount') == 750.0:
                    print("SUCCESS: Update reflected in case details.")
                else:
                    print(f"FAILURE: Update not reflected. Amount: {updated_charge.get('amount') if updated_charge else 'N/A'}")
            else:
                print(f"FAILURE: Failed to update doctor charge. Status: {update_resp.status_code}")
        else:
            print("FAILURE: Could not find new charge in case details.")
    else:
        print(f"FAILURE: Failed to create doctor charge. Status: {create_resp.status_code}, Error: {create_resp.text}")

if __name__ == "__main__":
    test_refined_doctor_charges()
