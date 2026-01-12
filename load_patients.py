#!/usr/bin/env python3
"""
Backend script to load patient details from JSON file into MongoDB database.
This script reads patient data from result.json and inserts it into the hospital_management database.

Usage:
    python load_patients.py [json_file_path] [--yes] [--skip-duplicates]
    
Arguments:
    json_file_path  Path to the JSON file containing patient data (optional, uses default if not provided)
    --yes, -y       Skip confirmation prompt (useful for automated runs)
    --skip-duplicates  Skip duplicate checking (insert all records)
    --no-skip-duplicates  Enable duplicate checking (default behavior)
"""

import json
import sys
import argparse
from pymongo import MongoClient
from datetime import datetime
import urllib.parse
from pathlib import Path

# MongoDB Connection Configuration
MONGODB_USERNAME = 'sunilsahu'
MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
MONGODB_DB_NAME = 'hospital_management'

# Default path to the JSON file
DEFAULT_JSON_FILE_PATH = '/Users/sunilsahu/myprojects/helloworld/result.json'

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

def normalize_patient_data(patient):
    """
    Normalize patient data to match the database schema.
    - Convert gender M/F to Male/Female
    - Convert empty strings to None
    - Handle age as integer or None
    """
    normalized = {
        'name': patient.get('name', '').strip() or None,
        'age': None,
        'gender': None,
        'email': patient.get('email', '').strip() or None,
        'phone': patient.get('phone', '').strip() or None,
        'address': patient.get('address', '').strip() or None,
        'blood_group': patient.get('blood_group', '').strip() or None,
        'created_at': datetime.now()
    }
    
    # Handle age - convert to int if valid, otherwise None
    age = patient.get('age')
    if age:
        try:
            if isinstance(age, str) and age.strip():
                normalized['age'] = int(age.strip())
            elif isinstance(age, int):
                normalized['age'] = age
        except (ValueError, TypeError):
            normalized['age'] = None
    else:
        normalized['age'] = None
    
    # Convert gender M/F to Male/Female
    gender = patient.get('gender', '').strip().upper()
    if gender == 'M':
        normalized['gender'] = 'Male'
    elif gender == 'F':
        normalized['gender'] = 'Female'
    elif gender in ['MALE', 'FEMALE', 'OTHER']:
        normalized['gender'] = gender.capitalize()
    else:
        normalized['gender'] = None
    
    return normalized

def load_json_file(file_path):
    """
    Load and parse JSON file.
    Uses a robust parsing approach that extracts individual JSON objects
    even from malformed JSON files.
    """
    import re
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Method 1: Try standard JSON parsing first
        try:
            data = json.loads(content)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                return [data]
        except json.JSONDecodeError:
            pass
        
        # Method 2: Try fixing common issues and parse
        fixed_content = content.strip()
        if not fixed_content.startswith('['):
            fixed_content = '[' + fixed_content
        if not fixed_content.rstrip().endswith(']'):
            fixed_content = re.sub(r',\s*$', '', fixed_content.rstrip())
            fixed_content = fixed_content + ']'
        
        # Remove trailing commas before closing brackets
        fixed_content = re.sub(r',(\s*[}\]])', r'\1', fixed_content)
        
        try:
            data = json.loads(fixed_content)
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass
        
        # Method 3: Extract individual JSON objects using state machine
        # This handles malformed JSON by parsing object by object
        patients = []
        current_obj = ""
        brace_count = 0
        in_string = False
        escape_next = False
        
        for char in content:
            if escape_next:
                current_obj += char
                escape_next = False
                continue
            
            if char == '\\':
                escape_next = True
                current_obj += char
                continue
            
            if char == '"' and not escape_next:
                in_string = not in_string
            
            if not in_string:
                if char == '{':
                    if brace_count == 0:
                        current_obj = char
                    else:
                        current_obj += char
                    brace_count += 1
                elif char == '}':
                    current_obj += char
                    brace_count -= 1
                    if brace_count == 0 and current_obj.strip():
                        try:
                            obj = json.loads(current_obj.strip().rstrip(','))
                            if isinstance(obj, dict) and obj.get('name'):
                                patients.append(obj)
                        except json.JSONDecodeError:
                            pass
                        current_obj = ""
                elif brace_count > 0:
                    current_obj += char
            else:
                if brace_count > 0:
                    current_obj += char
        
        if patients:
            print(f"✓ Extracted {len(patients)} patients using object-by-object parsing")
            return patients
        
        # Method 4: Use regex as last resort (less reliable but handles edge cases)
        # Find all JSON-like objects
        pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        matches = re.finditer(pattern, content)
        patients = []
        seen = set()
        
        for match in matches:
            obj_str = match.group(0)
            # Skip if we've seen this exact object (avoid duplicates)
            if obj_str in seen:
                continue
            seen.add(obj_str)
            
            try:
                obj = json.loads(obj_str)
                if isinstance(obj, dict) and obj.get('name'):
                    patients.append(obj)
            except json.JSONDecodeError:
                continue
        
        if patients:
            print(f"✓ Extracted {len(patients)} patients using regex pattern matching")
            return patients
        
        raise ValueError("Could not parse any valid JSON objects from the file.")
            
    except FileNotFoundError:
        print(f"✗ Error: File not found at {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error reading/parsing file: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

def insert_patients(db, patients_data, skip_duplicates=True):
    """
    Insert patients into MongoDB database.
    
    Args:
        db: MongoDB database object
        patients_data: List of patient dictionaries
        skip_duplicates: If True, skip patients with duplicate phone numbers or names
    """
    patients_collection = db.patients
    inserted_count = 0
    skipped_count = 0
    error_count = 0
    
    print(f"\nProcessing {len(patients_data)} patient records...")
    print("-" * 60)
    
    for idx, patient in enumerate(patients_data, 1):
        try:
            # Normalize the patient data
            normalized = normalize_patient_data(patient)
            
            # Skip if name is missing or invalid
            if not normalized['name'] or normalized['name'].lower() in ['', 'n/a', 'na', 'none']:
                print(f"[{idx}/{len(patients_data)}] ⚠ Skipping: Missing or invalid name")
                skipped_count += 1
                continue
            
            # Check for duplicates if skip_duplicates is True
            if skip_duplicates:
                # Check by phone number if available
                if normalized['phone']:
                    existing = patients_collection.find_one({'phone': normalized['phone']})
                    if existing:
                        print(f"[{idx}/{len(patients_data)}] ⚠ Skipping duplicate: {normalized['name']} (Phone: {normalized['phone']})")
                        skipped_count += 1
                        continue
                
                # Also check by name (exact match)
                existing = patients_collection.find_one({'name': normalized['name']})
                if existing and normalized.get('age') and existing.get('age') == normalized['age']:
                    print(f"[{idx}/{len(patients_data)}] ⚠ Skipping duplicate: {normalized['name']} (Age: {normalized['age']})")
                    skipped_count += 1
                    continue
            
            # Insert the patient
            result = patients_collection.insert_one(normalized)
            inserted_count += 1
            
            # Print progress for every 100 records
            if inserted_count % 100 == 0:
                print(f"[{idx}/{len(patients_data)}] ✓ Inserted {inserted_count} patients so far...")
            
        except Exception as e:
            error_count += 1
            print(f"[{idx}/{len(patients_data)}] ✗ Error inserting {patient.get('name', 'Unknown')}: {e}")
            if error_count > 10:
                print("  Too many errors. Stopping...")
                break
    
    print("-" * 60)
    print(f"\n📊 Summary:")
    print(f"  ✓ Successfully inserted: {inserted_count}")
    print(f"  ⚠ Skipped (duplicates/invalid): {skipped_count}")
    print(f"  ✗ Errors: {error_count}")
    print(f"  Total processed: {len(patients_data)}")
    
    return inserted_count, skipped_count, error_count

def main():
    """Main function to execute the patient data loading process"""
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description='Load patient details from JSON file into MongoDB database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python load_patients.py
  python load_patients.py /path/to/patients.json
  python load_patients.py --yes
  python load_patients.py /path/to/patients.json --yes --no-skip-duplicates
        """
    )
    parser.add_argument(
        'json_file',
        nargs='?',
        default=DEFAULT_JSON_FILE_PATH,
        help=f'Path to JSON file containing patient data (default: {DEFAULT_JSON_FILE_PATH})'
    )
    parser.add_argument(
        '--yes', '-y',
        action='store_true',
        help='Skip confirmation prompt (useful for automated runs)'
    )
    parser.add_argument(
        '--skip-duplicates',
        action='store_true',
        default=True,
        help='Skip duplicate checking based on phone number and name+age (default: True)'
    )
    parser.add_argument(
        '--no-skip-duplicates',
        dest='skip_duplicates',
        action='store_false',
        help='Disable duplicate checking (insert all records even if duplicates exist)'
    )
    
    args = parser.parse_args()
    json_file_path = args.json_file
    skip_confirmation = args.yes
    skip_duplicates = args.skip_duplicates
    
    print("=" * 60)
    print("Patient Data Loader Script")
    print("=" * 60)
    
    # Check if JSON file exists
    json_path = Path(json_file_path)
    if not json_path.exists():
        print(f"✗ Error: JSON file not found at {json_file_path}")
        sys.exit(1)
    
    print(f"📁 JSON file: {json_file_path}")
    print(f"🔍 Duplicate checking: {'Enabled' if skip_duplicates else 'Disabled'}")
    
    # Connect to MongoDB
    try:
        db, client = connect_to_mongodb()
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        sys.exit(1)
    
    # Load JSON data
    print(f"\n📖 Loading JSON data from file...")
    try:
        patients_data = load_json_file(json_file_path)
        print(f"✓ Loaded {len(patients_data)} patient records from JSON file")
    except Exception as e:
        print(f"✗ Failed to load JSON file: {e}")
        sys.exit(1)
    
    # Ask for confirmation before inserting (unless --yes flag is used)
    if not skip_confirmation:
        print(f"\n⚠️  Warning: This will insert {len(patients_data)} patients into the database.")
        if skip_duplicates:
            print("   Duplicates will be skipped based on phone number and name+age.")
        else:
            print("   All records will be inserted (duplicate checking is disabled).")
        response = input("Do you want to continue? (yes/no): ").strip().lower()
        
        if response not in ['yes', 'y']:
            print("❌ Operation cancelled by user.")
            client.close()
            sys.exit(0)
    else:
        print(f"\n⚠️  Processing {len(patients_data)} patient records...")
        if skip_duplicates:
            print("   Duplicates will be skipped based on phone number and name+age.")
    
    # Insert patients
    try:
        inserted, skipped, errors = insert_patients(db, patients_data, skip_duplicates=skip_duplicates)
        
        # Verify insertion
        total_patients = db.patients.count_documents({})
        print(f"\n📈 Current total patients in database: {total_patients}")
        
        if inserted > 0:
            print(f"\n✅ Successfully loaded {inserted} patients into the database!")
        else:
            print(f"\n⚠️  No new patients were inserted. Check skipped/error counts above.")
        
    except Exception as e:
        print(f"\n✗ Error during insertion: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()
        print("\n✓ Database connection closed.")

if __name__ == '__main__':
    main()
