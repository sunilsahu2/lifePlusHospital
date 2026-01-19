import requests
import json
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:5001/api/dashboard/financial-grid'

def test_grid():
    try:
        # Test Default (Last 10 days)
        print("--- Testing Default (Last 10 Days) ---")
        resp = requests.get(BASE_URL)
        if resp.status_code == 200:
            data = resp.json()
            print(f"Success! Received {len(data)} rows.")
            if len(data) > 0:
                print("Sample Row:", json.dumps(data[0], indent=2))
        else:
            print(f"Error: {resp.status_code} - {resp.text}")

        # Test Custom Range
        print("\n--- Testing Custom Range (Last 3 Days) ---")
        end = datetime.now()
        start = end - timedelta(days=2)
        params = {
            'start_date': start.strftime('%Y-%m-%d'),
            'end_date': end.strftime('%Y-%m-%d')
        }
        resp = requests.get(BASE_URL, params=params)
        if resp.status_code == 200:
            data = resp.json()
            print(f"Success! Received {len(data)} rows for range {params}.")
            for row in data:
                print(f"  {row['date']}: Coll={row['collections']}, Pay={row['payouts']}, Net={row['net']}")
        else:
            print(f"Error: {resp.status_code} - {resp.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_grid()
