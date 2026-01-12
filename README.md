# Hospital Management System

A comprehensive web-based hospital management system built with Python (Flask) backend and JavaScript/HTML frontend.

## Features

The system includes the following modules:

1. **Doctors** - Manage doctor profiles, specializations, qualifications, and contact information
2. **Doctor Charges** - Set and manage consultation and service charges for doctors
3. **Patients** - Maintain patient records including personal details, medical history
4. **Cases** - Track patient cases, diagnoses, admission/discharge dates
5. **Appointments** - Schedule and manage doctor appointments
6. **Prescriptions** - Create and manage patient prescriptions
7. **Billing-Payments** - Handle billing and payment processing
8. **Charge Master** - Manage hospital charges for various services (Lab, X-Ray, Surgery, etc.)
9. **Reporting** - View summary reports and analytics

## Technology Stack

- **Backend**: Python, Flask, PyMongo
- **Frontend**: HTML, CSS, JavaScript
- **Database**: MongoDB Atlas (Cloud Database)

## Installation

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Setup Instructions

1. **Clone or navigate to the project directory**:
   ```bash
   cd lifePlusHospital
   ```

2. **Create a virtual environment (recommended)**:
   ```bash
   python3 -m venv venv
   
   # On macOS/Linux:
   source venv/bin/activate
   
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python app.py
   ```

5. **Access the application**:
   Open your web browser and navigate to:
   ```
   http://localhost:5001
   ```

## Project Structure

```
lifePlusHospital/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── load_patients.py       # Script to load patient data from JSON file
├── extract_cases.py       # Script to extract case data from Excel file
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Stylesheet
│   └── js/
│       └── main.js       # Frontend JavaScript
├── static/
│   └── uploads/
│       └── prescriptions/ # Uploaded prescription scan files
└── README.md             # This file
```

## Usage

1. **Start the server**: Run `python3 app.py` in the project directory
2. **Open the application**: Navigate to `http://localhost:5001` in your browser
3. **Navigate modules**: Click on any module in the left sidebar menu
4. **Add records**: Click the "Add" button to create new records
5. **Edit records**: Click the "Edit" button on any record row
6. **Delete records**: Click the "Delete" button (with confirmation)

## API Endpoints

The application provides RESTful API endpoints for all modules. All endpoints return JSON responses and use MongoDB ObjectId strings for IDs.

### Patients API

#### Create Patient (Add Patient)
**POST** `/api/patients`

Creates a new patient record.

**Request Body:**
```json
{
  "name": "John Doe",           // Required
  "age": 35,                    // Optional (integer)
  "gender": "Male",             // Optional (string: "Male", "Female", "Other")
  "email": "john.doe@email.com", // Optional (string)
  "phone": "+1234567890",       // Optional (string)
  "address": "123 Main St, City, State", // Optional (string)
  "blood_group": "O+"           // Optional (string: e.g., "A+", "B+", "O+", "AB+")
}
```

**Response (201 Created):**
```json
{
  "id": "69622b7ce24c2200a9be5d4b",
  "message": "Patient created successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Error message description"
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:5001/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 35,
    "gender": "Male",
    "email": "john.doe@email.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State",
    "blood_group": "O+"
  }'
```

#### Get All Patients
**GET** `/api/patients`

Retrieves all patient records.

**Response (200 OK):**
```json
[
  {
    "id": "69622b7ce24c2200a9be5d4b",
    "name": "John Doe",
    "age": 35,
    "gender": "Male",
    "email": "john.doe@email.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State",
    "blood_group": "O+",
    "created_at": "2026-01-10T16:05:40.455000"
  }
]
```

#### Update Patient
**PUT** `/api/patients/<id>`

Updates an existing patient record.

**Request Body:** (All fields optional, only include fields to update)
```json
{
  "name": "John Smith",
  "age": 36,
  "gender": "Male",
  "email": "john.smith@email.com",
  "phone": "+1234567891",
  "address": "456 Oak Ave, City, State",
  "blood_group": "A+"
}
```

**Response (200 OK):**
```json
{
  "message": "Patient updated successfully"
}
```

#### Delete Patient
**DELETE** `/api/patients/<id>`

Deletes a patient record.

**Response (200 OK):**
```json
{
  "message": "Patient deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Patient not found"
}
```

### Other API Endpoints

- `GET/POST /api/doctors` - Manage doctors
- `GET /api/doctors/<id>` - Get single doctor
- `PUT /api/doctors/<id>` - Update doctor
- `DELETE /api/doctors/<id>` - Delete doctor
- `GET/POST /api/doctor-charges` - Manage doctor charges
- `GET/POST /api/cases` - Manage cases (with IPD/OPD support)
- `GET /api/cases/<id>` - Get case with all related data
- `GET/POST /api/appointments` - Manage appointments
- `GET/POST /api/prescriptions` - Manage prescriptions
- `GET/POST /api/treatments` - Manage treatments
- `GET/POST /api/case-charges` - Manage case charges
- `GET/POST /api/bills` - Manage bills
- `GET/POST /api/payments` - Manage payments
- `GET/POST /api/charge-master` - Manage charge master
- `GET /api/reports/summary` - Get summary reports

**General API Pattern:**
- `GET /api/{module}` - Retrieve all records
- `GET /api/{module}/{id}` - Get single record (where available)
- `POST /api/{module}` - Create new record
- `PUT /api/{module}/{id}` - Update existing record
- `DELETE /api/{module}/{id}` - Delete record

## Database

The application uses **MongoDB Atlas** (cloud database) for data storage. The database connection is configured in `app.py`:

- **Database Name**: `hospital_management`
- **Connection**: MongoDB Atlas cluster
- **Collections**: Automatically created on first insert
  - `doctors` - Doctor records
  - `doctor_charges` - Doctor-specific charges
  - `patients` - Patient records
  - `cases` - Case records (IPD/OPD)
  - `appointments` - Appointment records
  - `prescriptions` - Prescription records
  - `treatments` - Treatment records
  - `case_charges` - Charges linked to cases
  - `charge_master` - Master charge list
  - `bills` - Bill records
  - `payments` - Payment records

**MongoDB Connection Details:**
- Connection string is configured in `app.py`
- Database credentials are managed securely
- All IDs use MongoDB ObjectId format (24-character hex strings)

## Data Import Utilities

The project includes utility scripts for importing data from external sources:

### Load Patients from JSON

**Script**: `load_patients.py`

Loads patient data from a JSON file into the database.

**Usage**:
```bash
python load_patients.py [json_file_path] [--yes] [--skip-duplicates]
```

**Arguments**:
- `json_file_path` - Path to the JSON file containing patient data (optional, uses default if not provided)
- `--yes`, `-y` - Skip confirmation prompt (useful for automated runs)
- `--skip-duplicates` - Skip duplicate checking (insert all records)
- `--no-skip-duplicates` - Enable duplicate checking (default behavior)

**Example**:
```bash
# Load patients from default file with confirmation
python load_patients.py

# Load patients from specific file without confirmation
python load_patients.py /path/to/patients.json --yes

# Load all patients without duplicate checking
python load_patients.py /path/to/patients.json --yes --skip-duplicates
```

**JSON Format**:
```json
[
  {
    "name": "John Doe",
    "age": 35,
    "gender": "Male",
    "email": "john.doe@email.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State",
    "blood_group": "O+"
  }
]
```

### Extract Cases from Excel

**Script**: `extract_cases.py`

Extracts case information from Excel files (all sheets) and creates JSON data compatible with the case table structure.

**Usage**:
```bash
python extract_cases.py [excel_file_path] [output_json_path]
```

**Arguments**:
- `excel_file_path` - Path to the Excel file (default: `/Users/sunilsahu/Downloads/Book2-2.xlsx`)
- `output_json_path` - Path to save the output JSON file (default: `cases_data.json`)

**Example**:
```bash
# Extract cases from default Excel file
python extract_cases.py

# Extract cases from specific Excel file
python extract_cases.py /path/to/cases.xlsx

# Extract cases and save to specific output file
python extract_cases.py /path/to/cases.xlsx /path/to/output.json
```

**Excel Format Requirements**:
- Headers should be in row 2 (row 1 can be empty)
- Required columns:
  - `Patient Name` - Patient name
  - `Doctor Name` - Doctor name
  - `Date` - Case date (used as admission_date)
  - `Purpose` - Diagnosis/purpose (optional)
- Supported date formats: `YYYY-MM-DD`, `DD-MM-YYYY`, `DD/MM/YYYY`, etc.
- Additional columns are preserved in the output as `_extra_*` fields

**Output JSON Format**:
```json
[
  {
    "patient_name": "Mr Shubham",
    "doctor_name": "Self",
    "patient_id": null,
    "doctor_id": null,
    "case_number": null,
    "case_type": "OPD",
    "status": "Open",
    "diagnosis": "CBC, Crp, Urine R",
    "refered_by": null,
    "admission_date": "2024-09-04",
    "discharge_date": null,
    "notes": null,
    "_sheet_name": "Sheet2",
    "_row_number": 3
  }
]
```

**Note**: The extracted JSON contains patient and doctor names, not IDs. You'll need to map these names to existing patient and doctor IDs in your database before inserting the cases.

### Import Cases from Excel (Full Import)

**Script**: `import_cases_from_excel.py`

Imports case data from Excel files directly into the database. This script automatically:
- Finds or creates patients by name
- Finds or creates doctors by name
- Creates case records
- Creates case charges linked to the cases (OPD Charge, Other Charge, Pathology Charge)

**Usage**:
```bash
python import_cases_from_excel.py [excel_file_path] [--dry-run]
```

**Arguments**:
- `excel_file_path` - Path to the Excel file (default: `/Users/sunilsahu/Downloads/Book2-2.xlsx`)
- `--dry-run` - Preview mode (doesn't insert data, just shows what would be created)

**Example**:
```bash
# Preview what would be imported (dry run)
python import_cases_from_excel.py --dry-run

# Import cases from default Excel file
python import_cases_from_excel.py

# Import cases from specific Excel file
python import_cases_from_excel.py /path/to/cases.xlsx
```

**Requirements**:
- Excel file must have headers in row 2 (row 1 can be empty)
- Required columns:
  - `Patient Name` - Patient name (will be found or created)
  - `Doctor Name` - Doctor name (will be found or created)
  - `Date` - Case date (used as admission_date)
  - `Purpose` - Diagnosis/purpose (optional)
  - `OPD Charges` - OPD charge amount (optional)
  - `Other Charges` - Other charge amount (optional)
  - `Pathology Charges` - Pathology charge amount (optional)
  - `Final Charges` - Final total charges (used if individual charges are not specified)

**Charge Master Requirements**:
- The script requires the following charge master entries (case-insensitive):
  - `OPD Charge` or `OPD CHARGE`
  - `Other Charge` or `Other Charges`
  - `Pathology Charge`

**How it works**:
1. **Patient Lookup/Creation**: Searches for patient by name (exact or case-insensitive match). If not found, creates a new patient record.
2. **Doctor Lookup/Creation**: Searches for doctor by name (exact or case-insensitive match). If not found, creates a new doctor record. Special handling for "Self" doctor name.
3. **Case Creation**: Creates a case record with auto-generated case number (format: `CASE-YYYY-XXX`).
4. **Charge Creation**: Creates case charge records for:
   - OPD Charge (if "OPD Charges" column has value)
   - Other Charge (if "Other Charges" column has value)
   - Pathology Charge (if "Pathology Charges" column has value)
   - If no individual charges but "Final Charges" exists, creates a charge using Final Charges amount

**Note**: The script processes all sheets in the Excel file. It skips empty rows and handles date parsing for various formats.

## Notes

- All dates should be entered in `YYYY-MM-DD` format (or `YYYY-MM-DDTHH:MM` for datetime fields)
- The application runs on port **5001** by default
- The application runs in debug mode by default (suitable for development)
- All API responses use JSON format
- MongoDB ObjectIds are returned as strings in API responses
- For production deployment, disable debug mode and use a proper web server (e.g., Gunicorn)
- Update MongoDB connection credentials in `app.py` for production use
- Prescription scan files are stored in `static/uploads/prescriptions/` directory
- Prescription file names follow the format: `<patientName>_<ddmmyyyyHHMM>.ext`

## License

This project is open source and available for educational purposes.
