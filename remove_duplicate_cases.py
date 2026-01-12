#!/usr/bin/env python3
"""
Script to remove duplicate cases with the same case_number.
For each set of duplicates, keeps the case with the most related data.
If equal, keeps the oldest case (first created).
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

def count_relations(db, case_id):
    """Count all related records for a case."""
    appointments = db.appointments.count_documents({'case_id': case_id})
    prescriptions = db.prescriptions.count_documents({'case_id': case_id})
    treatments = db.treatments.count_documents({'case_id': case_id})
    charges = db.case_charges.count_documents({'case_id': case_id})
    bills = db.bills.count_documents({'case_id': case_id})
    return {
        'appointments': appointments,
        'prescriptions': prescriptions,
        'treatments': treatments,
        'charges': charges,
        'bills': bills,
        'total': appointments + prescriptions + treatments + charges + bills
    }

def remove_duplicate_cases(dry_run=True, specific_patient=None):
    """Remove duplicate cases. If dry_run=True, only reports what would be deleted."""
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    
    # Find the specific patient if provided
    patient_filter = {}
    if specific_patient:
        patient = db.patients.find_one({'name': {'$regex': f'^{specific_patient}', '$options': 'i'}})
        if patient:
            patient_filter = {'patient_id': patient.get('_id')}
            print(f"Filtering for patient: {patient.get('name')} (ID: {patient.get('_id')})")
        else:
            print(f"ERROR: Patient '{specific_patient}' not found!")
            return
    
    # Get all cases (optionally filtered by patient)
    all_cases = list(db.cases.find(patient_filter))
    
    # Group cases by case_number
    cases_by_number = defaultdict(list)
    for case in all_cases:
        case_number = case.get('case_number')
        if case_number:
            cases_by_number[case_number].append(case)
    
    # Find duplicates
    duplicates = {cn: cases for cn, cases in cases_by_number.items() if len(cases) > 1}
    
    print(f"\nFound {len(duplicates)} duplicate case numbers")
    print("=" * 80)
    
    total_to_delete = 0
    cases_to_delete = []
    
    for case_number, duplicate_cases in sorted(duplicates.items()):
        print(f"\nCase Number: {case_number} ({len(duplicate_cases)} duplicates)")
        
        # Get patient names and relation counts for each duplicate
        case_details = []
        for case in duplicate_cases:
            case_id = case.get('_id')
            patient_id = case.get('patient_id')
            patient = db.patients.find_one({'_id': patient_id}) if patient_id else None
            patient_name = patient.get('name') if patient else 'Unknown'
            
            relations = count_relations(db, case_id)
            case_details.append({
                'case_id': case_id,
                'patient_name': patient_name,
                'created_at': case.get('created_at'),
                'relations': relations
            })
        
        # Sort by total relations (descending), then by created_at (ascending)
        case_details.sort(key=lambda x: (-x['relations']['total'], x['created_at']))
        
        # Keep the first one
        keep_case = case_details[0]
        delete_cases = case_details[1:]
        
        print(f"  KEEPING: Case ID {keep_case['case_id']}")
        print(f"    Patient: {keep_case['patient_name']}")
        print(f"    Created: {keep_case['created_at']}")
        print(f"    Relations: {keep_case['relations']['total']} total (Appts: {keep_case['relations']['appointments']}, Presc: {keep_case['relations']['prescriptions']}, Treat: {keep_case['relations']['treatments']}, Charges: {keep_case['relations']['charges']}, Bills: {keep_case['relations']['bills']})")
        
        print(f"  DELETING: {len(delete_cases)} duplicate case(s)")
        for case_info in delete_cases:
            print(f"    - Case ID: {case_info['case_id']} (Patient: {case_info['patient_name']}, Created: {case_info['created_at']}, Relations: {case_info['relations']['total']})")
            cases_to_delete.append(case_info['case_id'])
            total_to_delete += 1
    
    print("\n" + "=" * 80)
    print(f"SUMMARY: {total_to_delete} duplicate cases would be deleted")
    
    if not dry_run and cases_to_delete:
        print(f"\nDeleting {len(cases_to_delete)} duplicate cases...")
        for case_id in cases_to_delete:
            result = db.cases.delete_one({'_id': case_id})
            if result.deleted_count > 0:
                print(f"  ✓ Deleted case ID: {case_id}")
            else:
                print(f"  ✗ Failed to delete case ID: {case_id}")
        print(f"\n✓ Successfully deleted {len(cases_to_delete)} duplicate cases")
    elif dry_run:
        print("\nThis was a DRY RUN. No cases were actually deleted.")
        print("Run with --execute flag to actually delete duplicates.")
    else:
        print("\nNo duplicates to delete.")

if __name__ == '__main__':
    dry_run = '--execute' not in sys.argv
    specific_patient = None
    
    # Check for patient filter
    if '--patient' in sys.argv:
        idx = sys.argv.index('--patient')
        if idx + 1 < len(sys.argv):
            specific_patient = sys.argv[idx + 1]
    
    if dry_run:
        print("=" * 80)
        print("DRY RUN MODE - No cases will be deleted")
        print("Add --execute flag to actually delete duplicates")
        print("=" * 80)
    
    remove_duplicate_cases(dry_run=dry_run, specific_patient=specific_patient)
