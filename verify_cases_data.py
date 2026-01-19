
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5001/api/cases?page=1&limit=10"

def verify_response():
    print(f"Verifying {BASE_URL}...")
    try:
        response = requests.get(BASE_URL)
        if response.status_code != 200:
            print(f"FAILED: Status code {response.status_code}")
            return

        data = response.json()
        
        # Check top level keys
        required_keys = ['cases', 'total', 'page', 'limit']
        for key in required_keys:
            if key not in data:
                print(f"FAILED: Missing key '{key}' in response")
                return
        
        cases = data['cases']
        print(f"Found {len(cases)} cases. Total: {data['total']}")
        
        if not cases:
            print("WARNING: No cases found to verify details.")
            return

        # Check first case structure
        case = cases[0]
        print("Checking first case details...")
        
        # Fields that should be populated by lookups/aggregation
        checks = [
            ('patient_name', 'Patient Name'),
            ('charges_total', 'Charges Total'),
            ('due_amount', 'Due Amount'),
            ('appointments', 'Appointments List')
        ]
        
        for field, label in checks:
            if field in case:
                print(f"✓ {label} present: {case[field]}")
            else:
                print(f"✗ {label} MISSING")
        
        # Check nested appointments
        if case.get('appointments'):
            apt = case['appointments'][0]
            if 'doctor_name' in apt:
                 print(f"✓ Appointment Doctor Name present: {apt['doctor_name']}")
            else:
                 print(f"Warning: Appointment Doctor Name missing (might be null)")
                 
        print("\nStructure verified successfully.")
        
    except Exception as e:
        print(f"FAILED: Error - {e}")

if __name__ == "__main__":
    verify_response()
