#!/usr/bin/env python3
"""
Script to import case data from Excel file into the database.
For each record:
1. Find or create Patient by name, get patient_id
2. Find or create Doctor by name, get doctor_id  
3. Create a case record
4. Create charge records (OPD Charge, Other Charge, Pathology Charge) linked to the case
"""

import pandas as pd
import json
import sys
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
import urllib.parse
import re

# MongoDB Connection Configuration
MONGODB_USERNAME = 'sunilsahu'
MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
MONGODB_DB_NAME = 'hospital_management'

def to_objectid(id_str):
    """Convert string ID to ObjectId"""
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        return None

def connect_to_mongodb():
    """Establish connection to MongoDB Atlas"""
    try:
        encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
        MONGODB_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'
        
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
        client.server_info()  # Test connection
        db = client[MONGODB_DB_NAME]
        print(f"✓ Successfully connected to MongoDB Atlas database '{MONGODB_DB_NAME}'")
        return db, client
    except Exception as e:
        print(f"✗ MongoDB connection error: {e}")
        raise

def clean_value(value):
    """Clean and convert value to string, handling NaN and None"""
    if pd.isna(value) or value is None:
        return None
    value_str = str(value).strip()
    if value_str.lower() in ['nan', 'none', '']:
        return None
    return value_str

def parse_amount(value):
    """Parse amount from Excel (handles currency symbols, commas)"""
    if pd.isna(value) or value is None:
        return 0.0
    
    value_str = str(value).strip()
    if not value_str or value_str.lower() in ['nan', 'none', '']:
        return 0.0
    
    # Remove currency symbols (₹, $, etc.) and commas
    value_str = re.sub(r'[₹$,\s]', '', value_str)
    
    try:
        return float(value_str)
    except (ValueError, TypeError):
        return 0.0

def parse_date(date_value):
    """Parse date value from Excel"""
    if pd.isna(date_value) or date_value == '' or date_value is None:
        return None
    
    if isinstance(date_value, datetime):
        return date_value
    if isinstance(date_value, pd.Timestamp):
        return date_value.to_pydatetime()
    
    date_str = str(date_value).strip()
    if not date_str or date_str.lower() in ['nan', 'none', '']:
        return None
    
    date_formats = ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d']
    for fmt in date_formats:
        try:
            return datetime.strptime(date_str.split()[0], fmt)  # Take date part only
        except (ValueError, TypeError):
            continue
    
    return None

def find_or_create_patient(db, patient_name, mobile_no=None):
    """Find patient by name, or create if not found"""
    if not patient_name:
        return None
    
    patient_name_clean = patient_name.strip()
    
    # Try to find by exact name match
    patient = db.patients.find_one({'name': patient_name_clean})
    if patient:
        return patient.get('_id')
    
    # Try to find by name ignoring case
    patient = db.patients.find_one({'name': {'$regex': f'^{re.escape(patient_name_clean)}$', '$options': 'i'}})
    if patient:
        return patient.get('_id')
    
    # If not found, create new patient
    patient_data = {
        'name': patient_name_clean,
        'phone': clean_value(mobile_no) if mobile_no else None,
        'created_at': datetime.now()
    }
    
    result = db.patients.insert_one(patient_data)
    print(f"  Created new patient: {patient_name_clean} (ID: {result.inserted_id})")
    return result.inserted_id

def find_or_create_doctor(db, doctor_name):
    """Find doctor by name, or create if not found"""
    if not doctor_name:
        return None
    
    doctor_name_clean = doctor_name.strip()
    
    # Skip "Self" doctor - might need special handling
    if doctor_name_clean.lower() in ['self', '']:
        # Try to find a default doctor or create one
        default_doctor = db.doctors.find_one({'name': 'Self'})
        if default_doctor:
            return default_doctor.get('_id')
        # Create "Self" doctor
        doctor_data = {
            'name': 'Self',
            'specialization': 'General',
            'isActive': True,
            'createdAt': datetime.now()
        }
        result = db.doctors.insert_one(doctor_data)
        print(f"  Created new doctor: Self (ID: {result.inserted_id})")
        return result.inserted_id
    
    # Try to find by exact name match
    doctor = db.doctors.find_one({'name': doctor_name_clean})
    if doctor:
        return doctor.get('_id')
    
    # Try to find by name ignoring case
    doctor = db.doctors.find_one({'name': {'$regex': f'^{re.escape(doctor_name_clean)}$', '$options': 'i'}})
    if doctor:
        return doctor.get('_id')
    
    # If not found, create new doctor
    doctor_data = {
        'name': doctor_name_clean,
        'specialization': 'General',
        'isActive': True,
        'createdAt': datetime.now()
    }
    
    result = db.doctors.insert_one(doctor_data)
    print(f"  Created new doctor: {doctor_name_clean} (ID: {result.inserted_id})")
    return result.inserted_id

def get_charge_master_by_name(db, charge_name):
    """Get charge master entry by name (case-insensitive exact match)"""
    if not charge_name:
        return None
    
    # Try exact match (case-sensitive)
    charge = db.charge_master.find_one({'name': charge_name})
    if charge:
        return charge.get('_id')
    
    # Try case-insensitive exact match
    charge = db.charge_master.find_one({'name': {'$regex': f'^{re.escape(charge_name)}$', '$options': 'i'}})
    if charge:
        return charge.get('_id')
    
    return None

def create_case_charge(db, case_id, charge_master_id, charge_name, amount, charge_date):
    """Create a case charge record"""
    if not charge_master_id or amount <= 0:
        return None
    
    try:
        charge = {
            'case_id': case_id,
            'charge_master_id': charge_master_id,
            'charge_name': charge_name,
            'amount': float(amount),
            'quantity': 1,
            'total_amount': float(amount),
            'charge_date': charge_date if isinstance(charge_date, datetime) else datetime.now(),
            'notes': '',
            'created_at': datetime.now()
        }
        
        result = db.case_charges.insert_one(charge)
        return result.inserted_id
    except Exception as e:
        print(f"    Error creating charge: {e}")
        return None

def import_cases_from_excel(excel_file_path, dry_run=False):
    """Import cases from Excel file into database"""
    
    if not os.path.exists(excel_file_path):
        print(f"Error: File not found: {excel_file_path}")
        return False
    
    # Connect to database
    db, client = connect_to_mongodb()
    
    # Get charge master entries for the three charge types (try multiple name variations)
    charge_masters = {}
    
    # Try to find OPD Charge
    opd_id = get_charge_master_by_name(db, 'OPD Charge') or get_charge_master_by_name(db, 'OPD CHARGE')
    charge_masters['OPD Charge'] = opd_id
    charge_masters['OPD_NAME'] = 'OPD Charge'
    
    # Try to find Other Charge
    other_id = get_charge_master_by_name(db, 'Other Charge') or get_charge_master_by_name(db, 'Other Charges')
    charge_masters['Other Charge'] = other_id
    charge_masters['OTHER_NAME'] = 'Other Charge'
    
    # Try to find Pathology Charge
    path_id = get_charge_master_by_name(db, 'Pathology Charge')
    charge_masters['Pathology Charge'] = path_id
    charge_masters['PATHOLOGY_NAME'] = 'Pathology Charge'
    
    print("\nCharge Master IDs:")
    if charge_masters['OPD Charge']:
        charge = db.charge_master.find_one({'_id': charge_masters['OPD Charge']})
        print(f"  OPD Charge: {charge.get('name')} (ID: {charge_masters['OPD Charge']})")
    else:
        print(f"  OPD Charge: NOT FOUND - charges of this type will be skipped")
    
    if charge_masters['Other Charge']:
        charge = db.charge_master.find_one({'_id': charge_masters['Other Charge']})
        charge_masters['OTHER_NAME'] = charge.get('name')  # Use actual name from DB
        print(f"  Other Charge: {charge.get('name')} (ID: {charge_masters['Other Charge']})")
    else:
        print(f"  Other Charge: NOT FOUND - charges of this type will be skipped")
    
    if charge_masters['Pathology Charge']:
        charge = db.charge_master.find_one({'_id': charge_masters['Pathology Charge']})
        print(f"  Pathology Charge: {charge.get('name')} (ID: {charge_masters['Pathology Charge']})")
    else:
        print(f"  Pathology Charge: NOT FOUND - charges of this type will be skipped")
    
    try:
        # Read all sheet names
        xl_file = pd.ExcelFile(excel_file_path)
        print(f"\nFound {len(xl_file.sheet_names)} sheet(s): {', '.join(xl_file.sheet_names)}")
        
        total_cases = 0
        total_errors = 0
        
        # Process each sheet
        for sheet_name in xl_file.sheet_names:
            print(f"\n{'='*80}")
            print(f"Processing sheet: {sheet_name}")
            print(f"{'='*80}")
            
            try:
                # Read the sheet with header at row 1 (skip first row)
                df = pd.read_excel(excel_file_path, sheet_name=sheet_name, skiprows=1)
                df = df.dropna(how='all')  # Remove empty rows
                
                if df.empty:
                    print(f"  Sheet '{sheet_name}' is empty, skipping...")
                    continue
                
                print(f"  Found {len(df)} data rows")
                
                # Process each row
                for idx, row in df.iterrows():
                    try:
                        patient_name = clean_value(row.get('Patient Name', ''))
                        doctor_name = clean_value(row.get('Doctor Name', ''))
                        
                        # Skip if no patient or doctor name
                        if not patient_name or not doctor_name:
                            continue
                        
                        # Get or create patient
                        mobile_no = row.get('Mobile No', None)
                        patient_id = find_or_create_patient(db, patient_name, mobile_no)
                        if not patient_id:
                            print(f"  Row {idx + 3}: Skipped - Could not create/find patient")
                            total_errors += 1
                            continue
                        
                        # Get or create doctor
                        doctor_id = find_or_create_doctor(db, doctor_name)
                        if not doctor_id:
                            print(f"  Row {idx + 3}: Skipped - Could not create/find doctor")
                            total_errors += 1
                            continue
                        
                        # Get date from Excel (use for both created_at and admission_date)
                        date_value = parse_date(row.get('Date', ''))
                        case_date = date_value if date_value else datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                        
                        # Get diagnosis/purpose
                        diagnosis = clean_value(row.get('Purpose', ''))
                        
                        # Create case
                        case_data = {
                            'patient_id': patient_id,
                            'doctor_id': doctor_id,
                            'case_number': None,  # Will be auto-generated
                            'case_type': 'OPD',
                            'refered_by': None,
                            'diagnosis': diagnosis,
                            'status': 'Open',
                            'admission_date': case_date,
                            'discharge_date': None,
                            'notes': None,
                            'created_at': case_date
                        }
                        
                        if dry_run:
                            print(f"  Row {idx + 3}: Would create case for {patient_name} / {doctor_name}")
                            total_cases += 1
                            continue
                        
                        # Generate case number
                        year = case_date.year
                        last_case = db.cases.find_one(
                            {'case_number': {'$regex': f'^CASE-{year}-'}},
                            sort=[('case_number', -1)]
                        )
                        
                        if last_case and last_case.get('case_number'):
                            try:
                                last_num = int(last_case['case_number'].split('-')[-1])
                                case_number = f'CASE-{year}-{str(last_num + 1).zfill(3)}'
                            except:
                                case_number = f'CASE-{year}-001'
                        else:
                            case_number = f'CASE-{year}-001'
                        
                        case_data['case_number'] = case_number
                        
                        # Insert case
                        case_result = db.cases.insert_one(case_data)
                        case_id = case_result.inserted_id
                        
                        # Get charge amounts from Excel
                        # User requirement: "here amount for that charge will be fetched from the excel sheet column 'Final Charges'"
                        final_charges = parse_amount(row.get('Final Charges', 0))
                        opd_charges = parse_amount(row.get('OPD Charges', 0))
                        other_charges = parse_amount(row.get('Other Charges', 0))
                        pathology_charges = parse_amount(row.get('Pathology Charges', 0))
                        
                        # Create charge records
                        charges_created = 0
                        
                        # Strategy: Use individual charge columns if they have values
                        # Otherwise, use Final Charges (as per user requirement)
                        
                        # OPD Charge - use OPD Charges column if available
                        if charge_masters['OPD Charge'] and opd_charges > 0:
                            create_case_charge(db, case_id, charge_masters['OPD Charge'], charge_masters.get('OPD_NAME', 'OPD Charge'), opd_charges, case_date)
                            charges_created += 1
                        
                        # Other Charge - use Other Charges column if available
                        if charge_masters['Other Charge'] and other_charges > 0:
                            create_case_charge(db, case_id, charge_masters['Other Charge'], charge_masters.get('OTHER_NAME', 'Other Charge'), other_charges, case_date)
                            charges_created += 1
                        
                        # Pathology Charge - use Pathology Charges column if available
                        if charge_masters['Pathology Charge'] and pathology_charges > 0:
                            create_case_charge(db, case_id, charge_masters['Pathology Charge'], charge_masters.get('PATHOLOGY_NAME', 'Pathology Charge'), pathology_charges, case_date)
                            charges_created += 1
                        
                        # If Final Charges exists and no individual charges were created, use Final Charges for Other Charge
                        # (As per user requirement: "amount for that charge will be fetched from the excel sheet column 'Final Charges'")
                        total_individual = opd_charges + other_charges + pathology_charges
                        if final_charges > 0 and total_individual == 0 and charges_created == 0:
                            if charge_masters['Other Charge']:
                                create_case_charge(db, case_id, charge_masters['Other Charge'], charge_masters.get('OTHER_NAME', 'Other Charge'), final_charges, case_date)
                                charges_created += 1
                        
                        print(f"  Row {idx + 3}: Created case {case_number} for {patient_name} / {doctor_name} ({charges_created} charges)")
                        total_cases += 1
                        
                    except Exception as e:
                        print(f"  Row {idx + 3}: Error - {e}")
                        import traceback
                        traceback.print_exc()
                        total_errors += 1
                        continue
                
            except Exception as e:
                print(f"  Error processing sheet '{sheet_name}': {e}")
                import traceback
                traceback.print_exc()
                total_errors += 1
                continue
        
        # Summary
        print(f"\n{'='*80}")
        print(f"Import Summary:")
        print(f"  Total cases created: {total_cases}")
        print(f"  Total errors: {total_errors}")
        print(f"{'='*80}")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()

if __name__ == '__main__':
    excel_file = "/Users/sunilsahu/Downloads/Book2-2.xlsx"
    dry_run = '--dry-run' in sys.argv or '--dryrun' in sys.argv
    
    if len(sys.argv) > 1 and not sys.argv[1].startswith('--'):
        excel_file = sys.argv[1]
    
    if dry_run:
        print("DRY RUN MODE - No changes will be made to the database\n")
    
    import_cases_from_excel(excel_file, dry_run=dry_run)
