
import requests
import json

BASE_URL = "http://localhost:5001/api/cases"
SEARCH_TERM = "CASE-2026-0063"

def check_case_due():
    print(f"Searching for {SEARCH_TERM}...")
    try:
        response = requests.get(f"{BASE_URL}?search={SEARCH_TERM}&limit=1")
        if response.status_code != 200:
            print(f"FAILED: Status code {response.status_code}")
            return

        data = response.json()
        cases = data.get('cases', [])
        
        if not cases:
            print("Case not found in API search")
            return

        case = cases[0]
        print(f"Case: {case.get('case_number')}")
        print(f"Charges Total: {case.get('charges_total')}")
        print(f"Paid Amount: {case.get('paid_amount')}")
        print(f"Discount: {case.get('discount', 'MISSING')}")
        print(f"Due Amount: {case.get('due_amount')}")
        
        if case.get('due_amount') == 0:
            print("✓ CORRECT: Due amount is 0")
        else:
            print(f"✗ WRONG: Due amount should be 0, but is {case.get('due_amount')}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_case_due()
