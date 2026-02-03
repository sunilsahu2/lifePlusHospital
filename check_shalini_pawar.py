from pymongo import MongoClient
from datetime import datetime
import urllib.parse

# MongoDB connection
username = urllib.parse.quote_plus("sunilsahu")
password = urllib.parse.quote_plus("Sunil@1234")
cluster_url = "ac-y9ez2lj.qufitms.mongodb.net"
connection_string = f"mongodb+srv://{username}:{password}@{cluster_url}/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(connection_string)
db = client['hospital_management']

# Search for Mrs Shalini Pawar
patient = db.patients.find_one({'name': {'$regex': 'Shalini Pawar', '$options': 'i'}})

if patient:
    print(f"Patient found: {patient['name']}")
    print(f"Patient ID: {patient['_id']}")
    
    # Get all cases for this patient
    cases = list(db.cases.find({'patient_id': patient['_id']}))
    print(f"\nTotal cases: {len(cases)}")
    
    # Filter cases by admission date in January 2026
    month_start = datetime(2026, 1, 1)
    month_end = datetime(2026, 2, 1)
    
    jan_cases = [c for c in cases if c.get('admission_date') and month_start <= c['admission_date'] < month_end]
    print(f"Cases admitted in January 2026: {len(jan_cases)}")
    
    for case in jan_cases:
        print(f"\n--- Case ID: {case['_id']} ---")
        print(f"Admission Date: {case.get('admission_date')}")
        print(f"Created At: {case.get('created_at')}")
        print(f"Discount: {case.get('discount', 0)}")
        print(f"Status: {case.get('status', 'N/A')}")
        
        # Get charges for this case in January 2026
        charges = list(db.case_charges.find({
            'case_id': case['_id'],
            'created_at': {
                '$gte': month_start,
                '$lt': month_end
            }
        }))
        
        total_charges = sum(float(c.get('total_amount', 0) or 0) for c in charges)
        print(f"Charges in Jan 2026: ₹{total_charges}")
        
        # Get payments for this case in January 2026
        payments = list(db.payments.find({
            'case_id': case['_id'],
            'created_at': {
                '$gte': month_start,
                '$lt': month_end
            }
        }))
        
        total_payments = sum(float(p.get('amount', 0) or 0) for p in payments)
        print(f"Payments in Jan 2026: ₹{total_payments}")
        print(f"Number of charges: {len(charges)}")
        print(f"Number of payments: {len(payments)}")
else:
    print("Patient not found!")

client.close()
