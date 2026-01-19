import requests
import json
from datetime import datetime

BASE_URL = 'http://localhost:5001/api/dashboard/financial-details'

def test_details():
    try:
        # Use today's date or a date with known data (e.g. from previous verification)
        # Previous verification showed data for 2026-01-18 (which is "today" in local context if server is ahead/behind, or just yesterday)
        # Let's try 2026-01-19 (Today) and 2026-01-18
        
        dates_to_test = ['2026-01-19', '2026-01-18']
        
        for date_str in dates_to_test:
            print(f"\n--- Testing Details for {date_str} ---")
            resp = requests.get(BASE_URL, params={'date': date_str})
            
            if resp.status_code == 200:
                data = resp.json()
                print(f"Success! Date: {data.get('date')}")
                
                colls = data.get('collections', [])
                print(f"Collections ({len(colls)}):")
                for c in colls:
                    print(f"  - Patient: {c['patient_name']}, Case: {c['case_number']}, Amount: {c['amount']}")
                    
                payouts = data.get('payouts', [])
                print(f"Payouts ({len(payouts)}):")
                for p in payouts:
                    print(f"  - Doctor: {p['doctor_name']}, Type: {p['type']}, Amount: {p['amount']}")
            else:
                print(f"Error: {resp.status_code} - {resp.text}")

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_details()
