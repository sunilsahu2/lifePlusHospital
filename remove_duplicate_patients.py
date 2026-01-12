#!/usr/bin/env python3
"""
Script to remove duplicate patients with the same name.
Logic:
1. If duplicates have the same phone number, keep one (with most data or oldest)
2. If duplicates have different phone numbers, keep all (different people)
3. If some have phone numbers and some don't, keep the ones with phone numbers
4. If none have phone numbers, keep one
"""

from pymongo import MongoClient
from bson import ObjectId
from collections import defaultdict
import urllib.parse
import sys

MONGODB_USERNAME = 'sunilsahu'
MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
MONGODB_DB_NAME = 'hospital_management'
encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
MONGODB_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'

def normalize_phone(phone):
    """Normalize phone number for comparison."""
    if not phone:
        return ''
    # Remove spaces, dashes, parentheses
    return ''.join(c for c in str(phone) if c.isdigit())

def count_relations(db, patient_id):
    """Count all related records for a patient."""
    cases = db.cases.count_documents({'patient_id': patient_id})
    appointments = db.appointments.count_documents({'patient_id': patient_id})
    prescriptions = db.prescriptions.count_documents({'patient_id': patient_id})
    treatments = db.treatments.count_documents({'patient_id': patient_id})
    bills = db.bills.count_documents({'patient_id': patient_id})
    return {
        'cases': cases,
        'appointments': appointments,
        'prescriptions': prescriptions,
        'treatments': treatments,
        'bills': bills,
        'total': cases + appointments + prescriptions + treatments + bills
    }

def remove_duplicate_patients(dry_run=True):
    """Remove duplicate patients based on name and phone number."""
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    
    # Get all patients
    all_patients = list(db.patients.find({}))
    
    # Group by normalized name (case-insensitive)
    patients_by_name = defaultdict(list)
    for patient in all_patients:
        name = (patient.get('name') or '').strip()
        if name:
            normalized_name = name.lower().strip()
            patients_by_name[normalized_name].append(patient)
    
    # Find duplicates
    duplicates = {name: patients for name, patients in patients_by_name.items() if len(patients) > 1}
    
    print(f"Total patients: {len(all_patients)}")
    print(f"Unique names: {len(patients_by_name)}")
    print(f"Duplicate names: {len(duplicates)}")
    print("=" * 80)
    
    total_to_delete = 0
    patients_to_delete = []
    
    for normalized_name, duplicate_patients in sorted(duplicates.items()):
        original_name = duplicate_patients[0].get('name')
        print(f"\nPatient Name: '{original_name}' ({len(duplicate_patients)} duplicates)")
        
        # Get phone numbers and normalize them
        patient_details = []
        for patient in duplicate_patients:
            phone = patient.get('phone') or ''
            normalized_phone = normalize_phone(phone)
            relations = count_relations(db, patient.get('_id'))
            
            patient_details.append({
                'patient_id': patient.get('_id'),
                'name': patient.get('name'),
                'phone': phone,
                'normalized_phone': normalized_phone,
                'email': patient.get('email') or '',
                'address': patient.get('address') or '',
                'created_at': patient.get('created_at'),
                'relations': relations
            })
        
        # Group by normalized phone number
        by_phone = defaultdict(list)
        for detail in patient_details:
            phone_key = normalized_phone if detail['normalized_phone'] else '_no_phone_'
            by_phone[phone_key].append(detail)
        
        # Separate patients with and without phone numbers
        has_phone = [p for p in patient_details if p['normalized_phone']]
        no_phone = [p for p in patient_details if not p['normalized_phone']]
        
        cases_to_keep = []
        cases_to_delete = []
        
        # If we have patients with phone and without phone, prioritize those with phone
        if has_phone and no_phone:
            # Keep all with phone, delete all without phone
            cases_to_keep = has_phone
            cases_to_delete = no_phone
        elif has_phone:
            # All have phone numbers - group by normalized phone
            by_phone = defaultdict(list)
            for detail in has_phone:
                by_phone[detail['normalized_phone']].append(detail)
            
            # If different phone numbers, keep all (different people)
            if len(by_phone) > 1:
                cases_to_keep = has_phone
            else:
                # Same phone number - keep one with most data/oldest
                has_phone.sort(key=lambda x: (-x['relations']['total'], x['created_at']))
                cases_to_keep.append(has_phone[0])
                cases_to_delete.extend(has_phone[1:])
        else:
            # None have phone numbers - keep one with most data/oldest
            no_phone.sort(key=lambda x: (-x['relations']['total'], x['created_at']))
            cases_to_keep.append(no_phone[0])
            cases_to_delete.extend(no_phone[1:])
        
        # Print what will be kept/deleted
        print(f"  KEEPING: {len(cases_to_keep)} patient(s)")
        for keep in cases_to_keep:
            print(f"    - ID: {keep['patient_id']}, Phone: '{keep['phone']}', Relations: {keep['relations']['total']} total (Cases: {keep['relations']['cases']}, Appts: {keep['relations']['appointments']}, Presc: {keep['relations']['prescriptions']})")
        
        print(f"  DELETING: {len(cases_to_delete)} duplicate patient(s)")
        for delete in cases_to_delete:
            print(f"    - ID: {delete['patient_id']}, Phone: '{delete['phone']}', Relations: {delete['relations']['total']} total")
            patients_to_delete.append(delete['patient_id'])
            total_to_delete += 1
    
    print("\n" + "=" * 80)
    print(f"SUMMARY: {total_to_delete} duplicate patients would be deleted")
    
    if not dry_run and patients_to_delete:
        print(f"\nDeleting {len(patients_to_delete)} duplicate patients...")
        deleted_count = 0
        for patient_id in patients_to_delete:
            result = db.patients.delete_one({'_id': patient_id})
            if result.deleted_count > 0:
                deleted_count += 1
                print(f"  ✓ Deleted patient ID: {patient_id}")
            else:
                print(f"  ✗ Failed to delete patient ID: {patient_id}")
        print(f"\n✓ Successfully deleted {deleted_count} duplicate patients")
    elif dry_run:
        print("\nThis was a DRY RUN. No patients were actually deleted.")
        print("Run with --execute flag to actually delete duplicates.")
    else:
        print("\nNo duplicates to delete.")

if __name__ == '__main__':
    dry_run = '--execute' not in sys.argv
    
    if dry_run:
        print("=" * 80)
        print("DRY RUN MODE - No patients will be deleted")
        print("Add --execute flag to actually delete duplicates")
        print("=" * 80)
    
    remove_duplicate_patients(dry_run=dry_run)
