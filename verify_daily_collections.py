import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5001/api"

def verify_daily_collections():
    print("--- Verifying Today's Collections Stat ---")
    
    # 1. Get current stats
    initial_stats = requests.get(f"{BASE_URL}/dashboard/stats").json()
    initial_collections = initial_stats.get('today_collections', 0)
    print(f"Initial Today's Collections: ₹{initial_collections}")
    
    # 2. Add a test payment for today
    # Need a case ID first
    case_resp = requests.get(f"{BASE_URL}/cases?limit=1").json()
    cases = case_resp['cases'] if 'cases' in case_resp else case_resp
    if not cases:
        print("No cases found to add payment to.")
        return
    
    case_id = cases[0]['id']
    test_amount = 500.0
    
    payment_payload = {
        "case_id": case_id,
        "amount": test_amount,
        "payment_date": datetime.now().isoformat(),
        "payment_method": "Cash",
        "notes": "Verification collection test"
    }
    
    print(f"\nAdding test payment of ₹{test_amount} to Case ID: {case_id}")
    pay_resp = requests.post(f"{BASE_URL}/payments", json=payment_payload)
    if pay_resp.status_code != 201:
        print(f"Failed to add payment: {pay_resp.text}")
        return
    
    # 3. Verify updated stats
    updated_stats = requests.get(f"{BASE_URL}/dashboard/stats").json()
    updated_collections = updated_stats.get('today_collections', 0)
    print(f"Updated Today's Collections: ₹{updated_collections}")
    
    expected_collections = initial_collections + test_amount
    if updated_collections == expected_collections:
        print("\nSUCCESS: Today's Collections stat updated correctly!")
    else:
        print(f"\nFAILURE: Expected ₹{expected_collections}, but got ₹{updated_collections}")

if __name__ == "__main__":
    verify_daily_collections()
