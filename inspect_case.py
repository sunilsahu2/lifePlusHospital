
import logging
from pymongo import MongoClient
import os
import urllib.parse
from bson.objectid import ObjectId

# MongoDB Connection (Copied from app.py)
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    MONGODB_USERNAME = 'sunilsahu'
    MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
    MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
    MONGODB_DB_NAME = 'hospital_management'
    encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
    MONGODB_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'

client = MongoClient(MONGODB_URI)
db = client['hospital_management']

def inspect_case(case_number):
    print(f"--- Inspecting {case_number} ---")
    case = db.cases.find_one({'case_number': case_number})
    if not case:
        print("Case not found")
        return

    case_id = case['_id']
    print(f"Case ID: {case_id}")
    print(f"Status: {case.get('status')}")
    print(f"Discount: {case.get('discount')}")

    # Charges
    print("\n--- Charges ---")
    charges = list(db.case_charges.find({'case_id': case_id}))
    total_hospital = 0
    for c in charges:
        print(f"Charge: {c.get('charge_name')} | Amount: {c.get('total_amount')}")
        total_hospital += c.get('total_amount', 0)
    
    print(f"Total Hospital Charges: {total_hospital}")

    # Doctor Charges (Legacy)
    print("\n--- Doctor Charges (Legacy) ---")
    doc_charges = list(db.case_doctor_charges.find({'case_id': case_id}))
    total_doctor = 0
    for c in doc_charges:
        val = c.get('amount', 0)
        print(f"Dr Charge: {val}")
        total_doctor += val
    print(f"Total Doctor Charges: {total_doctor}")

    grand_total_charges = total_hospital + total_doctor
    print(f"\nGRAND TOTAL CHARGES: {grand_total_charges}")

    # Payments
    print("\n--- Payments ---")
    payments = list(db.payments.find({'case_id': case_id}))
    total_paid = 0
    for p in payments:
        val = p.get('amount', 0)
        print(f"Payment: {val} | Type: {p.get('payment_type')} | Date: {p.get('payment_date')}")
        total_paid += val
    
    print(f"TOTAL PAID: {total_paid}")

    print(f"\n--- Result ---")
    print(f"Calculated Due: {grand_total_charges - total_paid}")

if __name__ == "__main__":
    inspect_case("CASE-2026-0063")
