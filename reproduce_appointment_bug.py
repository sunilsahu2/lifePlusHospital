
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5001/api/appointments"

def check_appointment_filtering():
    print(f"Checking appointment filtering at {BASE_URL}...")
    
    # Random patient ID (or non-existent)
    patient_id = "000000000000000000000000"
    
    print(f"Fetching appointments for fictitious patient_id={patient_id}...")
    try:
        response = requests.get(f"{BASE_URL}?patient_id={patient_id}&limit=5")
        if response.status_code != 200:
            print(f"FAILED: Status code {response.status_code}")
            return

        data = response.json()
        appointments = data.get('appointments', [])
        
        print(f"Found {len(appointments)} appointments.")
        
        if len(appointments) > 0:
            print("❌ FAILURE: Returned appointments even for non-existent patient ID.")
            print("The API is ignoring the patient_id filter.")
            print("First returned appointment:", appointments[0])
        else:
            print("✓ SUCCESS: No appointments returned (Filter might be working, or DB is empty).")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_appointment_filtering()
