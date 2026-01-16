import requests
import json

BASE_URL = 'http://127.0.0.1:5000/api'

def test_inhouse_doctor_logic():
    print("Starting verification of Inhouse doctor logic...")
    
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

    # 3. Create a charge category (if not exists, we'll try to find one)
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
        print(f"Error message: {res.json()['error']}")
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

    # Cleanup (Optional: deactivate test doctors)
    requests.delete(f"{BASE_URL}/doctors/{inhouse_id}")
    requests.delete(f"{BASE_URL}/doctors/{regular_id}")
    print("Test doctors deactivated.")

if __name__ == "__main__":
    test_inhouse_doctor_logic()
