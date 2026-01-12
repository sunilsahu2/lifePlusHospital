#!/usr/bin/env python3
"""
Script to import case data from additional Excel sheets (Sheet1, Sheet4, Sheet5, Sheet8, Sheet9, Sheet10, Sheet12, Sheet16)
These sheets have a different structure where headers are in row 1 (after skiprows=1)
"""

import pandas as pd
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import urllib.parse
import re
import sys

MONGODB_USERNAME = 'sunilsahu'
MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
MONGODB_DB_NAME = 'hospital_management'
encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
MONGODB_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'

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
            return datetime.strptime(date_str.split()[0], fmt)
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
    
    # Handle "Self" doctor
    if doctor_name_clean.lower() in ['self', '']:
        default_doctor = db.doctors.find_one({'name': 'Self'})
        if default_doctor:
            return default_doctor.get('_id')
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
    
    charge = db.charge_master.find_one({'name': charge_name})
    if charge:
        return charge.get('_id')
    
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

def import_additional_sheets(excel_file_path, dry_run=False):
    """Import cases from additional Excel sheets"""
    import os
    
    sheets_to_import = ['Sheet1', 'Sheet4', 'Sheet5', 'Sheet8', 'Sheet9', 'Sheet10', 'Sheet12', 'Sheet16']
    
    if not os.path.exists(excel_file_path):
        print(f"Error: File not found: {excel_file_path}")
        return False
    
    # Connect to database
    db, client = connect_to_mongodb()
    
    # Get charge master entries
    charge_masters = {}
    opd_id = get_charge_master_by_name(db, 'OPD Charge') or get_charge_master_by_name(db, 'OPD CHARGE')
    charge_masters['OPD Charge'] = opd_id
    charge_masters['OPD_NAME'] = 'OPD Charge'
    
    other_id = get_charge_master_by_name(db, 'Other Charge') or get_charge_master_by_name(db, 'Other Charges')
    charge_masters['Other Charge'] = other_id
    charge_masters['OTHER_NAME'] = 'Other Charge'
    
    path_id = get_charge_master_by_name(db, 'Pathology Charge')
    charge_masters['Pathology Charge'] = path_id
    charge_masters['PATHOLOGY_NAME'] = 'Pathology Charge'
    
    print("\nCharge Master IDs:")
    if charge_masters['OPD Charge']:
        charge = db.charge_master.find_one({'_id': charge_masters['OPD Charge']})
        print(f"  OPD Charge: {charge.get('name')} (ID: {charge_masters['OPD Charge']})")
    if charge_masters['Other Charge']:
        charge = db.charge_master.find_one({'_id': charge_masters['Other Charge']})
        charge_masters['OTHER_NAME'] = charge.get('name')
        print(f"  Other Charge: {charge.get('name')} (ID: {charge_masters['Other Charge']})")
    if charge_masters['Pathology Charge']:
        charge = db.charge_master.find_one({'_id': charge_masters['Pathology Charge']})
        print(f"  Pathology Charge: {charge.get('name')} (ID: {charge_masters['Pathology Charge']})")
    
    try:
        xl_file = pd.ExcelFile(excel_file_path)
        total_cases = 0
        total_errors = 0
        
        for sheet_name in sheets_to_import:
            if sheet_name not in xl_file.sheet_names:
                print(f"\n⚠️  Sheet '{sheet_name}' not found in Excel file, skipping...")
                continue
            
            print(f"\n{'='*80}")
            print(f"Processing sheet: {sheet_name}")
            print(f"{'='*80}")
            
            try:
                # Read with skiprows=1 (first row is empty, second row has headers)
                df = pd.read_excel(excel_file_path, sheet_name=sheet_name, skiprows=1)
                df = df.dropna(how='all')  # Remove empty rows
                
                if df.empty:
                    print(f"  Sheet '{sheet_name}' is empty, skipping...")
                    continue
                
                # First row after skiprows=1 contains headers, so skip it for data
                # Column positions (based on header row):
                # 2 = Date, 3 = Patient Name, 6 = Mobile No, 7 = Doctor Name, 8 = Purpose
                # 9 = OPD Charges, 10 = Pathology Charges, 14 = Other Charges, 21 = Final Charges
                
                # Get column indices by checking the header row
                header_row = df.iloc[0] if len(df) > 0 else None
                
                # Find column indices by checking header values
                date_col = None
                patient_col = None
                mobile_col = None
                doctor_col = None
                purpose_col = None
                opd_col = None
                path_col = None
                other_col = None
                final_col = None
                
                for idx, val in enumerate(header_row):
                    val_str = str(val).strip().lower() if pd.notna(val) else ''
                    if 'date' in val_str and date_col is None:
                        date_col = idx
                    elif 'patient' in val_str and 'name' in val_str and patient_col is None:
                        patient_col = idx
                    elif 'mobile' in val_str and mobile_col is None:
                        mobile_col = idx
                    elif 'doctor' in val_str and 'name' in val_str and doctor_col is None:
                        doctor_col = idx
                    elif 'purpose' in val_str and purpose_col is None:
                        purpose_col = idx
                    elif 'opd' in val_str and 'charg' in val_str and opd_col is None:
                        opd_col = idx
                    elif 'pathology' in val_str and 'charg' in val_str and path_col is None:
                        path_col = idx
                    elif 'other' in val_str and 'charg' in val_str and other_col is None and 'discount' not in val_str:
                        other_col = idx
                    elif 'final' in val_str and 'charg' in val_str and final_col is None:
                        final_col = idx
                
                # Skip header row for data processing
                data_df = df.iloc[1:].reset_index(drop=True)
                
                print(f"  Found {len(data_df)} data rows")
                print(f"  Column mapping: Date={date_col}, Patient={patient_col}, Doctor={doctor_col}")
                
                # Process each row
                for idx, row in data_df.iterrows():
                    try:
                        # Get values by column index
                        patient_name = clean_value(row.iloc[patient_col] if patient_col is not None else None)
                        doctor_name = clean_value(row.iloc[doctor_col] if doctor_col is not None else None)
                        mobile_no = clean_value(row.iloc[mobile_col] if mobile_col is not None else None)
                        
                        # Skip if no patient or doctor name
                        if not patient_name or not doctor_name:
                            continue
                        
                        # Get or create patient
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
                        
                        # Get date
                        date_value = parse_date(row.iloc[date_col] if date_col is not None else None)
                        case_date = date_value if date_value else datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                        
                        # Get diagnosis/purpose
                        diagnosis = clean_value(row.iloc[purpose_col] if purpose_col is not None else None)
                        
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
                        
                        # Create case
                        case_data = {
                            'patient_id': patient_id,
                            'doctor_id': doctor_id,
                            'case_number': case_number,
                            'case_type': 'OPD',
                            'refered_by': None,
                            'diagnosis': diagnosis,
                            'status': 'Open',
                            'admission_date': case_date,
                            'discharge_date': None,
                            'notes': None,
                            'created_at': case_date
                        }
                        
                        case_result = db.cases.insert_one(case_data)
                        case_id = case_result.inserted_id
                        
                        # Get charge amounts
                        opd_charges = parse_amount(row.iloc[opd_col] if opd_col is not None else None)
                        pathology_charges = parse_amount(row.iloc[path_col] if path_col is not None else None)
                        other_charges = parse_amount(row.iloc[other_col] if other_col is not None else None)
                        final_charges = parse_amount(row.iloc[final_col] if final_col is not None else None)
                        
                        # Create charge records
                        charges_created = 0
                        
                        if charge_masters['OPD Charge'] and opd_charges > 0:
                            create_case_charge(db, case_id, charge_masters['OPD Charge'], charge_masters.get('OPD_NAME', 'OPD Charge'), opd_charges, case_date)
                            charges_created += 1
                        
                        if charge_masters['Other Charge'] and other_charges > 0:
                            create_case_charge(db, case_id, charge_masters['Other Charge'], charge_masters.get('OTHER_NAME', 'Other Charge'), other_charges, case_date)
                            charges_created += 1
                        
                        if charge_masters['Pathology Charge'] and pathology_charges > 0:
                            create_case_charge(db, case_id, charge_masters['Pathology Charge'], charge_masters.get('PATHOLOGY_NAME', 'Pathology Charge'), pathology_charges, case_date)
                            charges_created += 1
                        
                        # If Final Charges exists and no individual charges were created, use Final Charges
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

def connect_to_mongodb():
    """Establish connection to MongoDB Atlas"""
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
        client.server_info()
        db = client[MONGODB_DB_NAME]
        print(f"✓ Successfully connected to MongoDB Atlas database '{MONGODB_DB_NAME}'")
        return db, client
    except Exception as e:
        print(f"✗ MongoDB connection error: {e}")
        raise

if __name__ == '__main__':
    import os
    excel_file = "/Users/sunilsahu/Downloads/Book2-2.xlsx"
    dry_run = '--dry-run' in sys.argv or '--dryrun' in sys.argv
    
    if len(sys.argv) > 1 and not sys.argv[1].startswith('--'):
        excel_file = sys.argv[1]
    
    if dry_run:
        print("DRY RUN MODE - No changes will be made to the database\n")
    
    import_additional_sheets(excel_file, dry_run=dry_run)
