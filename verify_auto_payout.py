import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5001/api"

def verify():
    print("--- Verifying Auto-Payout Creation ---")
    
    # 1. Create Doctor
    print("\nCreating Doctor...")
    doc_res = requests.post(f"{BASE_URL}/doctors", json={
        "name": "Dr Auto Payout Test",
        "specialization": "Specialist",
        "phone": "7777777777",
        "email": "auto@test.com"
    })
    if doc_res.status_code != 201:
        print("Failed to create doctor:", doc_res.text)
        return
    doctor_id = doc_res.json()['id']
    print(f"Doctor ID: {doctor_id}")

    # 2. Create Charge Master (Hospital Rate = 1000)
    print("Creating Charge Master...")
    cm_res = requests.post(f"{BASE_URL}/charge-master", json={
        "name": "Auto Charge Test",
        "category": "Consultation",
        "amount": 2000.0,
        "description": "Auto Test Charge"
    })
    cm_id = cm_res.json()['id']
    print(f"Charge Master ID: {cm_id} (Hospital Rate: 2000)")

    # 3. Create Doctor Charge Config (Doctor Rate = 500)
    print("Creating Doctor Charge Config...")
    dc_res = requests.post(f"{BASE_URL}/doctor-charges", json={
        "doctor_id": doctor_id,
        "charge_master_id": cm_id,
        "amount": 500.0
    })
    print("Doctor Charge Config Created (Rate: 500)")

    # 4. Create Case
    print("\nCreating Case...")
    case_res = requests.post(f"{BASE_URL}/cases", json={
        "patient_name": "Test Patient AutoSync",
        "phone": "8888888889",
        "doctor_id": doctor_id,
        "case_type": "OPD",
        "admission_date": datetime.now().isoformat()
    })
    case_id = case_res.json()['id']
    print(f"Case ID: {case_id}")
    
    # 5. Add Case Charge (Trigger)
    print("\nAdding Case Charge... (Should trigger sync)")
    cc_res = requests.post(f"{BASE_URL}/case-charges", json={
        "case_id": case_id,
        "doctor_id": doctor_id,
        "charge_master_id": cm_id,
        "quantity": 1
        # Defaults to charge master rates if not provided, or logic inside handles it
    })
    if cc_res.status_code == 201:
        print("Case Charge Added Successfully.")
    else:
        print(f"Failed to add case charge: {cc_res.text}")
        return

    # 6. Verify Payout exists immediately
    print("\nVerifying Payout Record exists...")
    # We can check via the 'payouts' list with case_id
    payout_res = requests.get(f"{BASE_URL}/payouts?case_id={case_id}")
    
    if payout_res.status_code == 200:
        data = payout_res.json()
        payouts = data.get('payouts', [])
        found_payout = next((p for p in payouts if p['doctor_id'] == doctor_id), None)
        
        if found_payout:
            print("FOUND Payout Record!")
            print(f"Status: {found_payout.get('payment_status')}")
            print(f"Doctor Amount: {found_payout.get('doctor_charge_amount')}")
            
            if found_payout.get('payment_status') == 'pending':
                print("SUCCESS: Payment Status is 'pending'")
            else:
                print(f"FAILURE: Payment Status is {found_payout.get('payment_status')}")
                
            if abs(found_payout.get('doctor_charge_amount') - 500.0) < 0.01:
                print("SUCCESS: Doctor Amount is 500.0")
            else:
                 print(f"FAILURE: Doctor Amount is {found_payout.get('doctor_charge_amount')}")
                 
            # Additional Check: Iterate quantity
            print("\nAdding another charge to verify update...")
            cc_res_2 = requests.post(f"{BASE_URL}/case-charges", json={
                "case_id": case_id,
                "doctor_id": doctor_id,
                "charge_master_id": cm_id,
                "quantity": 2
            })
            
            # Check updated amount (should be 500 + 1000 = 1500)
            payout_res_2 = requests.get(f"{BASE_URL}/payouts?case_id={case_id}")
            payouts_2 = payout_res_2.json().get('payouts', [])
            updated_payout = next((p for p in payouts_2 if p['doctor_id'] == doctor_id), None)
            
            if abs(updated_payout.get('doctor_charge_amount') - 1500.0) < 0.01:
                print("SUCCESS: Updated Doctor Amount is 1500.0")
            else:
                print(f"FAILURE: Updated Doctor Amount is {updated_payout.get('doctor_charge_amount')}")
            
        else:
            print("FAILURE: No payout record found after adding charge.")
    else:
        print(f"FAILURE: Failed to fetch payouts: {payout_res.status_code}")

if __name__ == "__main__":
    verify()
