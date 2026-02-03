#!/usr/bin/env python3
"""
Analyze database for January 2026 dashboard
Shows: Patient names, number of cases, total payments collected, 
pharmacy charges, nursing charges, doctor charges
"""

from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId
import urllib.parse
import json

# MongoDB Connection
MONGODB_USERNAME = 'sunilsahu'
MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
MONGODB_DB_NAME = 'hospital_management'
encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
MONGODB_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'

# Connect to MongoDB
client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
db = client[MONGODB_DB_NAME]

# Date range for January 2026
jan_start = datetime(2026, 1, 1)
jan_end = datetime(2026, 2, 1)

print("=" * 80)
print("JANUARY 2026 DASHBOARD ANALYSIS")
print("=" * 80)
print()

# Get all cases created in January 2026
cases_jan = list(db.cases.find({
    'created_at': {
        '$gte': jan_start,
        '$lt': jan_end
    }
}))

print(f"Total cases in January 2026: {len(cases_jan)}")
print()

# Aggregate data by patient
patient_data = {}

for case in cases_jan:
    patient_id = case.get('patient_id')
    case_id = case['_id']
    
    # Get patient details
    patient = db.patients.find_one({'_id': patient_id})
    if not patient:
        continue
    
    patient_name = patient.get('name', 'Unknown')
    
    if patient_name not in patient_data:
        patient_data[patient_name] = {
            'patient_id': str(patient_id),
            'patient_name': patient_name,
            'num_cases': 0,
            'total_payments': 0,
            'pharmacy_charges': 0,
            'nursing_charges': 0,
            'doctor_charges': 0,
            'other_charges': 0,
            'case_ids': []
        }
    
    patient_data[patient_name]['num_cases'] += 1
    patient_data[patient_name]['case_ids'].append(str(case_id))
    
    # Get payments for this case
    payments = list(db.payments.find({'case_id': case_id}))
    for payment in payments:
        patient_data[patient_name]['total_payments'] += float(payment.get('amount', 0) or 0)
    
    # Get case charges
    case_charges = list(db.case_charges.find({'case_id': case_id}))
    
    for charge in case_charges:
        charge_amount = float(charge.get('total_amount', 0) or 0)
        charge_type = charge.get('charge_type', 'hospital')
        
        # Get charge master details to determine category
        charge_master_id = charge.get('charge_master_id')
        if charge_master_id:
            charge_master = db.charge_master.find_one({'_id': charge_master_id})
            if charge_master:
                charge_name = charge_master.get('name', '').lower()
                category = charge_master.get('category', '').lower()
                charge_category = charge_master.get('charge_category', '').lower()
                
                # Categorize charges
                if charge_type == 'pharmacy' or 'pharmacy' in charge_name or 'pharmacy' in category or 'pharmacy' in charge_category:
                    patient_data[patient_name]['pharmacy_charges'] += charge_amount
                elif 'nursing' in charge_name or 'nursing' in category or 'nursing' in charge_category:
                    patient_data[patient_name]['nursing_charges'] += charge_amount
                elif charge.get('is_doctor_charge'):
                    patient_data[patient_name]['doctor_charges'] += charge_amount
                else:
                    patient_data[patient_name]['other_charges'] += charge_amount
            else:
                patient_data[patient_name]['other_charges'] += charge_amount
        else:
            if charge.get('is_doctor_charge'):
                patient_data[patient_name]['doctor_charges'] += charge_amount
            else:
                patient_data[patient_name]['other_charges'] += charge_amount
    
    # Get legacy doctor charges
    doctor_charges = list(db.case_doctor_charges.find({'case_id': case_id}))
    for charge in doctor_charges:
        patient_data[patient_name]['doctor_charges'] += float(charge.get('amount', 0) or 0)

# Display results
print("PATIENT-WISE SUMMARY")
print("-" * 80)
print(f"{'Patient Name':<30} {'Cases':>6} {'Payments':>12} {'Pharmacy':>12} {'Nursing':>12} {'Doctors':>12}")
print("-" * 80)

total_cases = 0
total_payments = 0
total_pharmacy = 0
total_nursing = 0
total_doctors = 0

for patient_name in sorted(patient_data.keys()):
    data = patient_data[patient_name]
    print(f"{patient_name:<30} {data['num_cases']:>6} {data['total_payments']:>12.2f} {data['pharmacy_charges']:>12.2f} {data['nursing_charges']:>12.2f} {data['doctor_charges']:>12.2f}")
    
    total_cases += data['num_cases']
    total_payments += data['total_payments']
    total_pharmacy += data['pharmacy_charges']
    total_nursing += data['nursing_charges']
    total_doctors += data['doctor_charges']

print("-" * 80)
print(f"{'TOTAL':<30} {total_cases:>6} {total_payments:>12.2f} {total_pharmacy:>12.2f} {total_nursing:>12.2f} {total_doctors:>12.2f}")
print("=" * 80)
print()

# Save to JSON for dashboard
dashboard_data = {
    'month': 'January 2026',
    'summary': {
        'total_patients': len(patient_data),
        'total_cases': total_cases,
        'total_payments': total_payments,
        'total_pharmacy_charges': total_pharmacy,
        'total_nursing_charges': total_nursing,
        'total_doctor_charges': total_doctors
    },
    'patients': list(patient_data.values())
}

with open('jan_2026_dashboard_data.json', 'w') as f:
    json.dump(dashboard_data, f, indent=2)

print(f"Dashboard data saved to: jan_2026_dashboard_data.json")
print()

# Additional statistics
print("ADDITIONAL STATISTICS")
print("-" * 80)
print(f"Total Patients: {len(patient_data)}")
print(f"Total Cases: {total_cases}")
print(f"Average Cases per Patient: {total_cases / len(patient_data) if patient_data else 0:.2f}")
print(f"Average Payment per Patient: ₹{total_payments / len(patient_data) if patient_data else 0:.2f}")
print(f"Average Payment per Case: ₹{total_payments / total_cases if total_cases else 0:.2f}")
print()
print("Charge Breakdown:")
print(f"  Pharmacy: ₹{total_pharmacy:.2f} ({total_pharmacy / (total_pharmacy + total_nursing + total_doctors) * 100 if (total_pharmacy + total_nursing + total_doctors) > 0 else 0:.1f}%)")
print(f"  Nursing: ₹{total_nursing:.2f} ({total_nursing / (total_pharmacy + total_nursing + total_doctors) * 100 if (total_pharmacy + total_nursing + total_doctors) > 0 else 0:.1f}%)")
print(f"  Doctors: ₹{total_doctors:.2f} ({total_doctors / (total_pharmacy + total_nursing + total_doctors) * 100 if (total_pharmacy + total_nursing + total_doctors) > 0 else 0:.1f}%)")
print("=" * 80)
