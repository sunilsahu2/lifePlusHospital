#!/usr/bin/env python3
"""
Script to extract case information from Excel file and create JSON data
compatible with the case table structure.
"""

import pandas as pd
import json
from datetime import datetime
import sys
import os

def parse_date(date_value):
    """Parse date value from Excel (handles various formats)"""
    if pd.isna(date_value) or date_value == '' or date_value is None:
        return None
    
    # If it's already a datetime object
    if isinstance(date_value, datetime):
        return date_value.strftime('%Y-%m-%d')
    
    # If it's a pandas Timestamp
    if isinstance(date_value, pd.Timestamp):
        return date_value.strftime('%Y-%m-%d')
    
    # Try to parse as string
    date_str = str(date_value).strip()
    if not date_str or date_str.lower() in ['nan', 'none', '']:
        return None
    
    # Try different date formats
    date_formats = [
        '%Y-%m-%d',
        '%d-%m-%Y',
        '%d/%m/%Y',
        '%m/%d/%Y',
        '%Y/%m/%d',
        '%d.%m.%Y',
        '%m.%d.%Y',
    ]
    
    for fmt in date_formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            continue
    
    # If all parsing fails, return None
    print(f"Warning: Could not parse date: {date_value}")
    return None

def clean_value(value):
    """Clean and convert value to string, handling NaN and None"""
    if pd.isna(value) or value is None:
        return None
    value_str = str(value).strip()
    if value_str.lower() in ['nan', 'none', '']:
        return None
    return value_str

def extract_cases_from_excel(excel_file_path, output_json_path):
    """Extract cases from Excel file and create JSON compatible with case table"""
    
    if not os.path.exists(excel_file_path):
        print(f"Error: File not found: {excel_file_path}")
        return False
    
    try:
        # Read all sheet names
        xl_file = pd.ExcelFile(excel_file_path)
        print(f"Found {len(xl_file.sheet_names)} sheet(s): {', '.join(xl_file.sheet_names)}")
        
        all_cases = []
        
        # Process each sheet
        for sheet_name in xl_file.sheet_names:
            print(f"\nProcessing sheet: {sheet_name}")
            
            try:
                # Read the sheet without header first to inspect structure
                df_raw = pd.read_excel(excel_file_path, sheet_name=sheet_name, header=None)
                
                if df_raw.empty or len(df_raw) < 2:
                    print(f"  Warning: Sheet '{sheet_name}' has insufficient rows, skipping...")
                    continue
                
                # Check if row 1 (index 1) contains headers
                header_row = df_raw.iloc[1].tolist()
                print(f"  Header row: {header_row[:10]}...")  # Show first 10 columns
                
                # Read with header at row 1 (skiprows=1 means skip first row, use second as header)
                df = pd.read_excel(excel_file_path, sheet_name=sheet_name, skiprows=1)
                
                # Skip empty rows (where all values are NaN)
                df = df.dropna(how='all')
                
                if df.empty:
                    print(f"  Warning: Sheet '{sheet_name}' has no data rows, skipping...")
                    continue
                
                print(f"  Found {len(df)} data rows")
                print(f"  Columns: {list(df.columns)[:10]}...")  # Show first 10 columns
                
                # Normalize column names (lowercase, strip whitespace)
                df.columns = [str(col).strip() if pd.notna(col) else f'Unnamed_{i}' for i, col in enumerate(df.columns)]
                
                # Try to identify column mappings (case-insensitive)
                column_map = {}
                for col in df.columns:
                    col_lower = str(col).lower().strip()
                    
                    # Map common column names
                    if 'sr' in col_lower and 'no' in col_lower:
                        column_map['sr_no'] = col
                    elif col_lower == 'date' or (col_lower.startswith('date') and 'balance' not in col_lower and 'paid' not in col_lower):
                        # Prefer exact 'date' column, avoid balance/paid date columns
                        if 'date' not in column_map:
                            column_map['date'] = col
                    elif 'patient' in col_lower and 'name' in col_lower:
                        column_map['patient_name'] = col
                    elif 'patient' in col_lower and 'id' in col_lower:
                        column_map['patient_id'] = col
                    elif 'doctor' in col_lower and 'name' in col_lower:
                        column_map['doctor_name'] = col
                    elif 'doctor' in col_lower and 'id' in col_lower:
                        column_map['doctor_id'] = col
                    elif 'case' in col_lower and 'number' in col_lower or 'case' in col_lower and 'no' in col_lower:
                        column_map['case_number'] = col
                    elif 'case' in col_lower and 'type' in col_lower:
                        column_map['case_type'] = col
                    elif 'status' in col_lower:
                        column_map['status'] = col
                    elif 'diagnosis' in col_lower or 'purpose' in col_lower:
                        if 'diagnosis' not in column_map:
                            column_map['diagnosis'] = col
                    elif 'refer' in col_lower or 'referred' in col_lower:
                        column_map['refered_by'] = col
                    elif 'admission' in col_lower and 'date' in col_lower:
                        column_map['admission_date'] = col
                    elif 'discharge' in col_lower and 'date' in col_lower:
                        column_map['discharge_date'] = col
                    elif 'note' in col_lower and 'notes' not in col_lower:
                        column_map['notes'] = col
                
                print(f"  Detected column mappings: {column_map}")
                
                # Process each row
                for idx, row in df.iterrows():
                    try:
                        # Get patient name
                        patient_name = clean_value(row.get(column_map.get('patient_name', '')))
                        
                        # Get doctor name
                        doctor_name = clean_value(row.get(column_map.get('doctor_name', '')))
                        
                        # Skip if no patient or doctor name
                        if not patient_name and not doctor_name:
                            continue
                        
                        # Get date (use as admission_date if no admission_date column)
                        date_value = parse_date(row.get(column_map.get('date', '')))
                        admission_date = parse_date(row.get(column_map.get('admission_date', ''))) or date_value
                        
                        # Get purpose/diagnosis
                        diagnosis = clean_value(row.get(column_map.get('diagnosis', '')))
                        
                        case_data = {
                            # Patient and doctor info (names will need to be mapped to IDs)
                            'patient_name': patient_name,
                            'doctor_name': doctor_name,
                            'patient_id': clean_value(row.get(column_map.get('patient_id', ''))),
                            'doctor_id': clean_value(row.get(column_map.get('doctor_id', ''))),
                            
                            # Case fields
                            'case_number': clean_value(row.get(column_map.get('case_number', ''))),
                            'case_type': clean_value(row.get(column_map.get('case_type', 'OPD'))) or 'OPD',
                            'status': clean_value(row.get(column_map.get('status', 'Open'))) or 'Open',
                            'diagnosis': diagnosis,
                            'refered_by': clean_value(row.get(column_map.get('refered_by', ''))),
                            'admission_date': admission_date,
                            'discharge_date': parse_date(row.get(column_map.get('discharge_date', ''))),
                            'notes': clean_value(row.get(column_map.get('notes', ''))),
                        }
                        
                        # Add all other columns as extra data (for reference)
                        for col in df.columns:
                            if col not in column_map.values():
                                value = clean_value(row.get(col))
                                if value and str(value).strip():
                                    # Store only non-empty values
                                    case_data[f'_extra_{col}'] = value
                        
                        # Add metadata
                        case_data['_sheet_name'] = sheet_name
                        case_data['_row_number'] = idx + 3  # +3 because Excel is 1-indexed, we skip 1 row, and pandas is 0-indexed
                        all_cases.append(case_data)
                        
                    except Exception as e:
                        print(f"  Error processing row {idx + 3}: {e}")
                        import traceback
                        traceback.print_exc()
                        continue
                
                print(f"  Extracted {len([c for c in all_cases if c.get('_sheet_name') == sheet_name])} cases from this sheet")
                
            except Exception as e:
                print(f"  Error processing sheet '{sheet_name}': {e}")
                import traceback
                traceback.print_exc()
                continue
        
        # Save to JSON file
        print(f"\n{'='*80}")
        print(f"Total cases extracted: {len(all_cases)}")
        print(f"Saving to: {output_json_path}")
        
        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(all_cases, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully saved {len(all_cases)} cases to {output_json_path}")
        
        # Print sample
        if all_cases:
            print(f"\nSample case (first one):")
            sample = all_cases[0]
            for key in ['patient_name', 'doctor_name', 'case_number', 'case_type', 'diagnosis', 'admission_date']:
                if key in sample:
                    print(f"  {key}: {sample[key]}")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    excel_file = "/Users/sunilsahu/Downloads/Book2-2.xlsx"
    output_file = "/Users/sunilsahu/myprojects/LPHospital3/lifePlusHospital/cases_data.json"
    
    if len(sys.argv) > 1:
        excel_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    
    extract_cases_from_excel(excel_file, output_file)
