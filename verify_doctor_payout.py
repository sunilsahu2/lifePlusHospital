import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5001/api"

def run_test():
    # 1. Create Doctor
    print("Creating Doctor...")
    doc_res = requests.post(f"{BASE_URL}/doctors", json={
        "name": "Dr Resmy Warrior Test",
        "specialization": "General",
        "phone": "9999999999",
        "email": "resmy@test.com"
    })
    if doc_res.status_code != 201:
        print("Failed to create doctor:", doc_res.text)
        return
    doctor_id = doc_res.json()['id']
    print(f"Doctor ID: {doctor_id}")

    # 2. Create Charge Master (Hospital Rate = 1000)
    print("Creating Charge Master...")
    cm_res = requests.post(f"{BASE_URL}/charge-master", json={
        "name": "Opd charge Test",
        "category": "Consultation",
        "amount": 1000.0,
        "description": "Test Charge"
    })
    cm_id = cm_res.json()['id']
    print(f"Charge Master ID: {cm_id} (Hospital Rate: 1000)")

    # 3. Create Doctor Charge (Doctor Rate = 300)
    print("Creating Doctor Charge Config...")
    dc_res = requests.post(f"{BASE_URL}/doctor-charges", json={
        "doctor_id": doctor_id,
        "charge_master_id": cm_id,
        "amount": 300.0
    })
    print("Doctor Charge Config Created (Rate: 300)")

    # 4. Create Case
    print("Creating Case...")
    case_res = requests.post(f"{BASE_URL}/cases", json={
        "patient_name": "Test Patient Payout",
        "phone": "8888888888",
        "doctor_id": doctor_id,
        "case_type": "OPD",
        "admission_date": datetime.now().isoformat()
    })
    case_id = case_res.json()['id']
    print(f"Case ID: {case_id}")
    
    # Debug: Check stored case
    get_case_res = requests.get(f"{BASE_URL}/cases/{case_id}")
    # print("Stored Case:", json.dumps(get_case_res.json(), indent=2))
    
    # 5. Add Case Charge (Hospital Rate 1000)
    print("Adding Case Charge...")
    cc_res = requests.post(f"{BASE_URL}/case-charges", json={
        "case_id": case_id,
        "doctor_id": doctor_id,
        "charge_master_id": cm_id,
        "quantity": 1,
        "unit_amount": 1000.0,
        "total_amount": 1000.0,
        "charge_date": datetime.now().isoformat()
    })
    print("Case Charge Added (Amount: 1000)")

    # 7. Verify Payout Summary Endpoint (NEW)
    print("Verifying Payout Summary Endpoint...")
    summary_res = requests.get(f"{BASE_URL}/cases/{case_id}/payout-summary")
    if summary_res.status_code == 200:
        summary = summary_res.json()
        print(f"Payout Summary: Hospital Charge: {summary['total_charge_amount']}, Doctor Charge: {summary['doctor_charge_amount']}")
        if abs(summary['doctor_charge_amount'] - 300.0) < 0.01:
            print("SUCCESS: Summary Endpoint returned correct Doctor Charge (300.0)")
        else:
            print(f"FAILURE: Summary Endpoint returned {summary['doctor_charge_amount']}")
    else:
        print(f"FAILURE: Summary Endpoint failed with {summary_res.status_code}")

    # 6. Verify Payout Calculation via API
    # We'll use get_doctor_payouts logic (simulating what a report would see)
    # Since get_doctor_payouts takes a date, we use today
    print("Verifying Doctor Payouts API...")
    date_str = datetime.now().strftime('%Y-%m-%d')
    payout_res = requests.get(f"{BASE_URL}/doctor-payouts?date={date_str}")
    
    found = False
    if payout_res.status_code == 200:
        data = payout_res.json()
        for p in data:
            if p['case_id'] == case_id:
                found = True
                print(f"Found Payout Record for Case {case_id}")
                print(f"Total Charge Amount: {p['total_charge_amount']}")
                print(f"Doctor Charge Amount: {p['doctor_charge_amount']}")
                
                # Check breakdowns
                for doc_charge in p['doctor_charges']:
                     print(f"  - Doctor: {doc_charge['doctor_name']}, Amount: {doc_charge['total_amount']}")

                if abs(p['doctor_charge_amount'] - 300.0) < 0.01:
                    print("SUCCESS: Doctor Charge Amount is 300.0")
                else:
                    print(f"FAILURE: Doctor Charge Amount is {p['doctor_charge_amount']}, expected 300.0")
                break
    
    
    if not found:
        print("FAILURE: Payout record for case not found in doctor-payouts response.")

    # 8. Verify Pending Payouts Endpoint (NEW)
    print("Verifying Pending Payouts Endpoint...")
    pending_res = requests.get(f"{BASE_URL}/payouts/pending")
    if pending_res.status_code == 200:
        pending_list = pending_res.json()
        pending_case = next((p for p in pending_list if p['case_id'] == case_id), None)
        
        if pending_case:
            print(f"Found Pending Payout for Case {case_id}")
            print(f"Pending Amount: {pending_case['amount']}")
            if abs(pending_case['amount'] - 300.0) < 0.01:
                print("SUCCESS: Pending Payout Amount is 300.0")
            else:
                print(f"FAILURE: Pending Payout Amount is {pending_case['amount']}")
        else:
            print("FAILURE: Case not found in Pending Payouts list")
    else:
        print(f"FAILURE: Pending Payouts endpoint failed with {pending_res.status_code}")

if __name__ == "__main__":
    run_test()
