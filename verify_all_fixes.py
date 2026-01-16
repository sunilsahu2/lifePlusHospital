import requests
import json
import concurrent.futures

BASE_URL = 'http://127.0.0.1:5001/api'

def test_inhouse_doctor_logic():
    print("\n--- Verifying Inhouse Doctor Logic ---")
    
    # 1. Create an Inhouse doctor
    inhouse_doctor_data = {
        "name": "Test Inhouse Doctor",
        "specialization": "General",
        "isInhouse": True
    }
    res = requests.post(f"{BASE_URL}/doctors", json=inhouse_doctor_data)
    if res.status_code != 201:
        print(f"Failed to create Inhouse doctor: {res.text}")
        return
    inhouse_id = res.json()['id']
    print(f"Created Inhouse doctor with ID: {inhouse_id}")
    
    # 2. Create a regular doctor
    regular_doctor_data = {
        "name": "Test Regular Doctor",
        "specialization": "Specialist",
        "isInhouse": False
    }
    res = requests.post(f"{BASE_URL}/doctors", json=regular_doctor_data)
    if res.status_code != 201:
        print(f"Failed to create Regular doctor: {res.text}")
        return
    regular_id = res.json()['id']
    print(f"Created Regular doctor with ID: {regular_id}")

    # 3. Get a charge category
    res = requests.get(f"{BASE_URL}/charge-master?limit=1")
    charges = res.json().get('charges', [])
    if not charges:
        print("No charge categories found, creating one...")
        charge_data = {"name": "Test Charge", "category": "Consultation", "base_rate": 100}
        res = requests.post(f"{BASE_URL}/charge-master", json=charge_data)
        charge_id = res.json()['id']
    else:
        charge_id = charges[0]['id']
    print(f"Using charge category ID: {charge_id}")

    # 4. Attempt to create a charge for Inhouse doctor (EXPECT FAILURE)
    inhouse_charge_data = {
        "doctor_id": inhouse_id,
        "charge_master_id": charge_id,
        "amount": 500,
        "payment_mode": "Cash"
    }
    res = requests.post(f"{BASE_URL}/doctor-charges", json=inhouse_charge_data)
    if res.status_code == 400:
        print("SUCCESS: Correctly blocked charge for Inhouse doctor.")
        print(f"Error message: {res.json().get('error', 'No error message')}")
    else:
        print(f"FAILURE: Should have blocked charge for Inhouse doctor, but got status {res.status_code}")
        print(res.text)

    # 5. Attempt to create a charge for Regular doctor (EXPECT SUCCESS)
    regular_charge_data = {
        "doctor_id": regular_id,
        "charge_master_id": charge_id,
        "amount": 600,
        "payment_mode": "Cash"
    }
    res = requests.post(f"{BASE_URL}/doctor-charges", json=regular_charge_data)
    if res.status_code == 201:
        print("SUCCESS: Correctly allowed charge for Regular doctor.")
    else:
        print(f"FAILURE: Should have allowed charge for Regular doctor, but got status {res.status_code}")
        print(res.text)

    # Cleanup
    requests.delete(f"{BASE_URL}/doctors/{inhouse_id}")
    requests.delete(f"{BASE_URL}/doctors/{regular_id}")
    print("Test doctors deactivated.")

def create_case_task(i):
    data = {
        "patient_name": f"Concurrent Test Patient {i}",
        "treatment": "Concurrency Test"
    }
    res = requests.post(f"{BASE_URL}/cases", json=data)
    if res.status_code == 201:
        return res.json().get('id'), i
    return None, i

def test_unique_case_numbers():
    print("\n--- Verifying Unique Case Numbers (Concurrency Test) ---")
    
    num_requests = 5
    case_numbers = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(create_case_task, i) for i in range(num_requests)]
        for future in concurrent.futures.as_completed(futures):
            case_id, i = future.result()
            if case_id:
                # Get the created case to check its number
                res = requests.get(f"{BASE_URL}/cases")
                cases = res.json().get('cases', [])
                # Find our case
                # Actually, /api/cases returns a list, let's find the one we just created
                # Or just fetch by ID if there's an endpoint
                res_detail = requests.get(f"{BASE_URL}/cases/{case_id}")
                if res_detail.status_code == 200:
                    case_num = res_detail.json().get('case_number')
                    case_numbers.append(case_num)
                    print(f"Created case {i} with number: {case_num}")
                else:
                    # Try to find in list
                    for c in cases:
                        if c['id'] == case_id:
                            case_numbers.append(c['case_number'])
                            print(f"Created case {i} with number: {c['case_number']}")
                            break

    # Check for duplicates
    if len(case_numbers) == len(set(case_numbers)):
        print(f"SUCCESS: All {len(case_numbers)} case numbers are unique.")
    else:
        print(f"FAILURE: Duplicate case numbers found: {case_numbers}")

if __name__ == "__main__":
    test_inhouse_doctor_logic()
    test_unique_case_numbers()
