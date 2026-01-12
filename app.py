from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import urllib.parse
import logging
import os
import uuid
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

app = Flask(__name__)
CORS(app)

# MongoDB Connection Configuration
MONGODB_USERNAME = 'sunilsahu'
MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
MONGODB_DB_NAME = 'hospital_management'

# Connect to MongoDB
try:
    encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
    MONGODB_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
    client.server_info()  # Test connection
    db = client[MONGODB_DB_NAME]
    logging.info(f"✓ Successfully connected to MongoDB Atlas database '{MONGODB_DB_NAME}'")
except Exception as e:
    logging.error(f"✗ MongoDB connection error: {e}")
    raise

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        doc = doc.copy()
        if '_id' in doc:
            doc['id'] = str(doc.pop('_id'))
        # Convert any ObjectId fields to strings
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                doc[key] = str(value)
        return doc
    return doc

# Helper function to parse ObjectId
def parse_object_id(id_str):
    try:
        return ObjectId(id_str)
    except:
        return None

# ==================== ROUTES ====================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/uploads/prescriptions/<filename>')
def uploaded_file(filename):
    return send_from_directory(os.path.join(app.root_path, 'static', 'uploads', 'prescriptions'), filename)

@app.route('/static/manifest.json')
def manifest():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'manifest.json', mimetype='application/json')

@app.route('/static/service-worker.js')
def service_worker():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'service-worker.js', mimetype='application/javascript')

# ==================== DOCTORS API ====================

@app.route('/api/doctors', methods=['GET'])
def get_doctors():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '').strip()
        skip = (page - 1) * limit
        
        # Build query for search - by default only show active doctors
        query = {'$or': [{'isActive': True}, {'isActive': {'$exists': False}}]}  # Show active doctors (isActive is True or doesn't exist)
        if search:
            search_conditions = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'specialization': {'$regex': search, '$options': 'i'}},
                {'phone': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}}
            ]
            query = {
                '$and': [
                    {'$or': [{'isActive': True}, {'isActive': {'$exists': False}}]},
                    {'$or': search_conditions}
                ]
            }
        
        # Get total count for pagination
        total = db.doctors.count_documents(query)
        
        # Get paginated results
        doctors = list(db.doctors.find(query).sort('created_at', -1).skip(skip).limit(limit))
        
        return jsonify({
            'doctors': serialize_doc(doctors),
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        logging.error(f"Error getting doctors: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/doctors/<id>', methods=['GET'])
def get_doctor(id):
    try:
        doctor = db.doctors.find_one({'_id': parse_object_id(id)})
        if doctor:
            return jsonify(serialize_doc(doctor))
        return jsonify({'error': 'Doctor not found'}), 404
    except Exception as e:
        logging.error(f"Error getting doctor: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/doctors', methods=['POST'])
def create_doctor():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        
        # Set defaults
        data['created_at'] = datetime.now()
        if 'isActive' not in data:
            data['isActive'] = True  # Set as active by default
        
        result = db.doctors.insert_one(data)
        return jsonify({'id': str(result.inserted_id), 'message': 'Doctor created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating doctor: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/doctors/<id>', methods=['PUT'])
def update_doctor(id):
    try:
        data = request.get_json()
        doctor_id = parse_object_id(id)
        
        # Check if doctor exists
        existing_doctor = db.doctors.find_one({'_id': doctor_id})
        if not existing_doctor:
            return jsonify({'error': 'Doctor not found'}), 404
        
        # Don't allow updating isActive through PUT (use DELETE endpoint for deactivation)
        if 'isActive' in data:
            del data['isActive']
        
        data['updated_at'] = datetime.now()
        result = db.doctors.update_one({'_id': doctor_id}, {'$set': data})
        if result.modified_count or result.matched_count:
            return jsonify({'message': 'Doctor updated successfully'})
        return jsonify({'message': 'Doctor updated successfully'})  # Even if no fields changed
    except Exception as e:
        logging.error(f"Error updating doctor: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/doctors/<id>', methods=['DELETE'])
def delete_doctor(id):
    try:
        result = db.doctors.update_one(
            {'_id': parse_object_id(id)},
            {'$set': {'isActive': False, 'deactivated_at': datetime.now()}}
        )
        if result.modified_count:
            return jsonify({'message': 'Doctor deactivated successfully'})
        return jsonify({'error': 'Doctor not found'}), 404
    except Exception as e:
        logging.error(f"Error deactivating doctor: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== PATIENTS API ====================

@app.route('/api/patients', methods=['GET'])
def get_patients():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '').strip()
        skip = (page - 1) * limit
        
        # Build query for search
        query = {}
        if search:
            search_conditions = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'phone': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}},
                {'address': {'$regex': search, '$options': 'i'}}
            ]
            query = {'$or': search_conditions}
        
        # Get total count for pagination
        total = db.patients.count_documents(query)
        
        # Get paginated results
        patients = list(db.patients.find(query).sort('created_at', -1).skip(skip).limit(limit))
        
        return jsonify({
            'patients': serialize_doc(patients),
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        logging.error(f"Error getting patients: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/<id>', methods=['GET'])
def get_patient(id):
    try:
        patient = db.patients.find_one({'_id': parse_object_id(id)})
        if patient:
            return jsonify(serialize_doc(patient))
        return jsonify({'error': 'Patient not found'}), 404
    except Exception as e:
        logging.error(f"Error getting patient: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients', methods=['POST'])
def create_patient():
    try:
        data = request.get_json()
        data['created_at'] = datetime.now()
        result = db.patients.insert_one(data)
        return jsonify({'id': str(result.inserted_id), 'message': 'Patient created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating patient: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/<id>', methods=['PUT'])
def update_patient(id):
    try:
        data = request.get_json()
        data['updated_at'] = datetime.now()
        result = db.patients.update_one({'_id': parse_object_id(id)}, {'$set': data})
        if result.modified_count:
            return jsonify({'message': 'Patient updated successfully'})
        return jsonify({'error': 'Patient not found'}), 404
    except Exception as e:
        logging.error(f"Error updating patient: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/<id>', methods=['DELETE'])
def delete_patient(id):
    try:
        result = db.patients.delete_one({'_id': parse_object_id(id)})
        if result.deleted_count:
            return jsonify({'message': 'Patient deleted successfully'})
        return jsonify({'error': 'Patient not found'}), 404
    except Exception as e:
        logging.error(f"Error deleting patient: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== CASES API ====================

@app.route('/api/cases', methods=['GET'])
def get_cases():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '').strip()
        skip = (page - 1) * limit
        
        # Build query for search
        query = {}
        if search:
            # Search by case_number (exact match preferred)
            cases_by_number = list(db.cases.find({'case_number': {'$regex': search, '$options': 'i'}}))
            case_ids = [case['_id'] for case in cases_by_number]
            
            # Also search in patients by name, phone, email
            patients = list(db.patients.find({
                '$or': [
                    {'name': {'$regex': search, '$options': 'i'}},
                    {'phone': {'$regex': search, '$options': 'i'}},
                    {'email': {'$regex': search, '$options': 'i'}}
                ]
            }))
            patient_ids = [patient['_id'] for patient in patients]
            
            # Combine search conditions
            search_conditions = []
            if case_ids:
                search_conditions.append({'_id': {'$in': case_ids}})
            if patient_ids:
                search_conditions.append({'patient_id': {'$in': patient_ids}})
            if search_conditions:
                query = {'$or': search_conditions}
        
        # Get total count for pagination
        total = db.cases.count_documents(query)
        
        # Get paginated results
        cases = list(db.cases.find(query).sort('created_at', -1).skip(skip).limit(limit))
        
        # Populate patient names and convert patient_id to string
        # Also get charge counts and totals for each case
        for case in cases:
            if 'patient_id' in case:
                patient_id_obj = case['patient_id']
                # Convert patient_id to ObjectId if it's a string
                if isinstance(patient_id_obj, str):
                    patient_id_obj = parse_object_id(patient_id_obj)
                case['patient_id'] = str(patient_id_obj) if patient_id_obj else ''
                if patient_id_obj:
                    patient = db.patients.find_one({'_id': patient_id_obj})
                    if patient:
                        case['patient_name'] = patient.get('name', '')
                    else:
                        case['patient_name'] = ''
                else:
                    case['patient_name'] = ''
            
            # Get case charges count and total
            case_id = case['_id']
            case_charges = list(db.case_charges.find({'case_id': case_id}))
            case['charges_count'] = len(case_charges)
            case['charges_total'] = sum(charge.get('total_amount', 0) for charge in case_charges)
            
            # Get appointments for this case
            case_appointments = list(db.appointments.find({'case_id': case_id}).sort('appointment_date', 1))
            case['appointments_count'] = len(case_appointments)
            # Get next appointment (upcoming appointment)
            upcoming_appointments = [apt for apt in case_appointments if apt.get('status') != 'Cancelled' and apt.get('appointment_date')]
            if upcoming_appointments:
                now = datetime.now().date()
                future_appointments = []
                for apt in upcoming_appointments:
                    apt_date = apt.get('appointment_date')
                    if isinstance(apt_date, datetime):
                        apt_date_obj = apt_date.date()
                    elif isinstance(apt_date, str):
                        try:
                            apt_date_obj = datetime.fromisoformat(apt_date.split('T')[0]).date()
                        except:
                            continue
                    else:
                        continue
                    if apt_date_obj >= now:
                        future_appointments.append(apt)
                
                if future_appointments:
                    next_apt = future_appointments[0]
                    case['next_appointment_date'] = next_apt.get('appointment_date')
                    case['next_appointment_time'] = next_apt.get('appointment_time')
                    if 'doctor_id' in next_apt and next_apt['doctor_id']:
                        doctor = db.doctors.find_one({'_id': next_apt['doctor_id']})
                        if doctor:
                            case['next_appointment_doctor'] = doctor.get('name', '')
            # Populate appointment names for display
            appointments_for_display = []
            for apt in case_appointments[:5]:  # Limit to 5 most recent for display
                apt_display = {
                    'id': str(apt['_id']),
                    'appointment_date': apt.get('appointment_date'),
                    'appointment_time': apt.get('appointment_time'),
                    'status': apt.get('status')
                }
                if 'doctor_id' in apt and apt['doctor_id']:
                    doctor = db.doctors.find_one({'_id': apt['doctor_id']})
                    if doctor:
                        apt_display['doctor_name'] = doctor.get('name', '')
                appointments_for_display.append(apt_display)
            case['appointments'] = serialize_doc(appointments_for_display)
        
        return jsonify({
            'cases': serialize_doc(cases),
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        logging.error(f"Error getting cases: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cases/<id>', methods=['GET'])
def get_case(id):
    try:
        case = db.cases.find_one({'_id': parse_object_id(id)})
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        # Populate patient
        if 'patient_id' in case:
            patient_id_obj = case['patient_id']
            # Convert patient_id to ObjectId if it's a string
            if isinstance(patient_id_obj, str):
                patient_id_obj = parse_object_id(patient_id_obj)
            if patient_id_obj:
                patient = db.patients.find_one({'_id': patient_id_obj})
                if patient:
                    case['patient'] = serialize_doc(patient)
        
        # Get case charges (patient charges)
        case_charges = list(db.case_charges.find({'case_id': parse_object_id(id)}))
        # Populate charge master names and doctor names
        for charge in case_charges:
            if 'charge_master_id' in charge:
                charge_master = db.charge_master.find_one({'_id': charge['charge_master_id']})
                if charge_master:
                    charge['charge_name'] = charge_master.get('name', '')
            
            # Populate doctor name if doctor_id exists
            if 'doctor_id' in charge:
                doctor = db.doctors.find_one({'_id': charge['doctor_id']})
                if doctor:
                    charge['doctor_name'] = doctor.get('name', '')
        case['charges'] = serialize_doc(case_charges)
        
        # Get case doctor charges
        case_doctor_charges = list(db.case_doctor_charges.find({'case_id': parse_object_id(id)}))
        # Populate doctor names
        for charge in case_doctor_charges:
            if 'doctor_id' in charge:
                doctor = db.doctors.find_one({'_id': charge['doctor_id']})
                if doctor:
                    charge['doctor_name'] = doctor.get('name', '')
        case['doctor_charges'] = serialize_doc(case_doctor_charges)
        
        # Get appointments for this case
        case_appointments = list(db.appointments.find({'case_id': parse_object_id(id)}))
        # Populate patient names and doctor names
        for apt in case_appointments:
            if 'patient_id' in apt:
                patient = db.patients.find_one({'_id': apt['patient_id']})
                if patient:
                    apt['patient_name'] = patient.get('name', '')
            if 'doctor_id' in apt:
                doctor = db.doctors.find_one({'_id': apt['doctor_id']})
                if doctor:
                    apt['doctor_name'] = doctor.get('name', '')
        case['appointments'] = serialize_doc(case_appointments)
        
        # Get prescriptions for this case
        case_prescriptions = list(db.prescriptions.find({'case_id': parse_object_id(id)}).sort('created_at', -1))
        # Populate patient and doctor names
        for pres in case_prescriptions:
            if 'patient_id' in pres and pres['patient_id']:
                patient = db.patients.find_one({'_id': pres['patient_id']})
                if patient:
                    pres['patient_name'] = patient.get('name', '')
            if 'doctor_id' in pres and pres['doctor_id']:
                doctor = db.doctors.find_one({'_id': pres['doctor_id']})
                if doctor:
                    pres['doctor_name'] = doctor.get('name', '')
        case['prescriptions'] = serialize_doc(case_prescriptions)
        
        return jsonify(serialize_doc(case))
    except Exception as e:
        logging.error(f"Error getting case: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cases', methods=['POST'])
def create_case():
    try:
        data = request.get_json()
        
        # Convert patient_id to ObjectId if present
        if 'patient_id' in data and data['patient_id']:
            data['patient_id'] = parse_object_id(data['patient_id'])
        
        # Generate case number
        if 'case_number' not in data or not data['case_number']:
            year = datetime.now().year
            last_case = db.cases.find_one({'case_number': {'$regex': f'CASE-{year}-'}}, sort=[('case_number', -1)])
            if last_case:
                last_num = int(last_case['case_number'].split('-')[-1])
                data['case_number'] = f'CASE-{year}-{last_num + 1:04d}'
            else:
                data['case_number'] = f'CASE-{year}-1000'
        
        data['created_at'] = datetime.now()
        result = db.cases.insert_one(data)
        return jsonify({'id': str(result.inserted_id), 'message': 'Case created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating case: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cases/<id>', methods=['PUT'])
def update_case(id):
    try:
        data = request.get_json()
        
        # Convert patient_id to ObjectId if present
        if 'patient_id' in data and data['patient_id']:
            data['patient_id'] = parse_object_id(data['patient_id'])
        
        data['updated_at'] = datetime.now()
        result = db.cases.update_one({'_id': parse_object_id(id)}, {'$set': data})
        if result.modified_count:
            return jsonify({'message': 'Case updated successfully'})
        return jsonify({'error': 'Case not found'}), 404
    except Exception as e:
        logging.error(f"Error updating case: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cases/<id>', methods=['DELETE'])
def delete_case(id):
    try:
        result = db.cases.delete_one({'_id': parse_object_id(id)})
        if result.deleted_count:
            return jsonify({'message': 'Case deleted successfully'})
        return jsonify({'error': 'Case not found'}), 404
    except Exception as e:
        logging.error(f"Error deleting case: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== APPOINTMENTS API ====================

@app.route('/api/appointments', methods=['GET'])
def get_appointments():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        skip = (page - 1) * limit
        
        # Get total count for pagination
        total = db.appointments.count_documents({})
        
        # Get paginated results
        appointments = list(db.appointments.find().sort('created_at', -1).skip(skip).limit(limit))
        
        # Populate patient names and doctor names
        for apt in appointments:
            if 'patient_id' in apt:
                patient = db.patients.find_one({'_id': apt['patient_id']})
                if patient:
                    apt['patient_name'] = patient.get('name', '')
            if 'doctor_id' in apt:
                doctor = db.doctors.find_one({'_id': apt['doctor_id']})
                if doctor:
                    apt['doctor_name'] = doctor.get('name', '')
        
        return jsonify({
            'appointments': serialize_doc(appointments),
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        logging.error(f"Error getting appointments: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    try:
        data = request.get_json()
        
        # Convert IDs to ObjectId if present
        if 'patient_id' in data and data['patient_id']:
            data['patient_id'] = parse_object_id(data['patient_id'])
        if 'case_id' in data and data['case_id']:
            data['case_id'] = parse_object_id(data['case_id'])
        if 'doctor_id' in data and data['doctor_id']:
            data['doctor_id'] = parse_object_id(data['doctor_id'])
        
        data['created_at'] = datetime.now()
        result = db.appointments.insert_one(data)
        return jsonify({'id': str(result.inserted_id), 'message': 'Appointment created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating appointment: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/appointments/<id>', methods=['PUT'])
def update_appointment(id):
    try:
        data = request.get_json()
        
        # Convert IDs to ObjectId if present
        if 'patient_id' in data and data['patient_id']:
            data['patient_id'] = parse_object_id(data['patient_id'])
        if 'case_id' in data and data['case_id']:
            data['case_id'] = parse_object_id(data['case_id'])
        if 'doctor_id' in data and data['doctor_id']:
            data['doctor_id'] = parse_object_id(data['doctor_id'])
        
        data['updated_at'] = datetime.now()
        result = db.appointments.update_one({'_id': parse_object_id(id)}, {'$set': data})
        if result.modified_count:
            return jsonify({'message': 'Appointment updated successfully'})
        return jsonify({'error': 'Appointment not found'}), 404
    except Exception as e:
        logging.error(f"Error updating appointment: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/appointments/<id>', methods=['DELETE'])
def delete_appointment(id):
    try:
        result = db.appointments.delete_one({'_id': parse_object_id(id)})
        if result.deleted_count:
            return jsonify({'message': 'Appointment deleted successfully'})
        return jsonify({'error': 'Appointment not found'}), 404
    except Exception as e:
        logging.error(f"Error deleting appointment: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== PRESCRIPTIONS API ====================

@app.route('/api/prescriptions', methods=['GET'])
def get_prescriptions():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        skip = (page - 1) * limit
        case_id = request.args.get('case_id')
        
        # Build query
        query = {}
        if case_id:
            query['case_id'] = parse_object_id(case_id)
        
        # Get total count for pagination
        total = db.prescriptions.count_documents(query)
        
        # Get paginated results
        prescriptions = list(db.prescriptions.find(query).sort('created_at', -1).skip(skip).limit(limit))
        
        # Populate patient and doctor names
        for pres in prescriptions:
            if 'patient_id' in pres and pres['patient_id']:
                patient = db.patients.find_one({'_id': pres['patient_id']})
                if patient:
                    pres['patient_name'] = patient.get('name', '')
            if 'doctor_id' in pres and pres['doctor_id']:
                doctor = db.doctors.find_one({'_id': pres['doctor_id']})
                if doctor:
                    pres['doctor_name'] = doctor.get('name', '')
        
        return jsonify({
            'prescriptions': serialize_doc(prescriptions),
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        logging.error(f"Error getting prescriptions: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions', methods=['POST'])
def create_prescription():
    try:
        # Check if this is a file upload
        if 'file' in request.files:
            file = request.files['file']
            case_id = request.form.get('case_id')
            patient_id = request.form.get('patient_id')
            doctor_id = request.form.get('doctor_id')
            prescription_date = request.form.get('prescription_date')
            notes = request.form.get('notes', '')
            
            if file and file.filename:
                # Generate unique filename
                filename = secure_filename(file.filename)
                file_ext = os.path.splitext(filename)[1]
                unique_filename = f"{uuid.uuid4()}{file_ext}"
                
                # Ensure upload directory exists
                upload_dir = os.path.join(app.root_path, 'static', 'uploads', 'prescriptions')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Save file
                file_path = os.path.join(upload_dir, unique_filename)
                file.save(file_path)
                
                # Create prescription record
                prescription_data = {
                    'case_id': parse_object_id(case_id) if case_id else None,
                    'patient_id': parse_object_id(patient_id) if patient_id else None,
                    'doctor_id': parse_object_id(doctor_id) if doctor_id else None,
                    'prescription_date': datetime.strptime(prescription_date, '%Y-%m-%d') if prescription_date else datetime.now(),
                    'file_path': f'/static/uploads/prescriptions/{unique_filename}',
                    'file_name': filename,
                    'notes': notes,
                    'created_at': datetime.now()
                }
                
                result = db.prescriptions.insert_one(prescription_data)
                return jsonify({'id': str(result.inserted_id), 'message': 'Prescription uploaded successfully'}), 201
            else:
                return jsonify({'error': 'No file provided'}), 400
        else:
            # JSON data (for backward compatibility)
            data = request.get_json()
            # Convert IDs to ObjectId if present
            if 'case_id' in data and data['case_id']:
                data['case_id'] = parse_object_id(data['case_id'])
            if 'patient_id' in data and data['patient_id']:
                data['patient_id'] = parse_object_id(data['patient_id'])
            if 'doctor_id' in data and data['doctor_id']:
                data['doctor_id'] = parse_object_id(data['doctor_id'])
            if 'prescription_date' in data and data['prescription_date']:
                if isinstance(data['prescription_date'], str):
                    data['prescription_date'] = datetime.strptime(data['prescription_date'], '%Y-%m-%d')
            
            data['created_at'] = datetime.now()
            result = db.prescriptions.insert_one(data)
            return jsonify({'id': str(result.inserted_id), 'message': 'Prescription created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating prescription: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/<id>', methods=['PUT'])
def update_prescription(id):
    try:
        data = request.get_json()
        data['updated_at'] = datetime.now()
        result = db.prescriptions.update_one({'_id': parse_object_id(id)}, {'$set': data})
        if result.modified_count:
            return jsonify({'message': 'Prescription updated successfully'})
        return jsonify({'error': 'Prescription not found'}), 404
    except Exception as e:
        logging.error(f"Error updating prescription: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/<id>', methods=['DELETE'])
def delete_prescription(id):
    try:
        result = db.prescriptions.delete_one({'_id': parse_object_id(id)})
        if result.deleted_count:
            return jsonify({'message': 'Prescription deleted successfully'})
        return jsonify({'error': 'Prescription not found'}), 404
    except Exception as e:
        logging.error(f"Error deleting prescription: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== CHARGE MASTER API ====================

@app.route('/api/charge-master', methods=['GET'])
def get_charge_master():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        skip = (page - 1) * limit
        
        # Get total count for pagination
        total = db.charge_master.count_documents({})
        
        # Get paginated results
        charges = list(db.charge_master.find().sort('created_at', -1).skip(skip).limit(limit))
        
        return jsonify({
            'charges': serialize_doc(charges),
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        logging.error(f"Error getting charge master: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/charge-master', methods=['POST'])
def create_charge_master():
    try:
        data = request.get_json()
        data['created_at'] = datetime.now()
        result = db.charge_master.insert_one(data)
        return jsonify({'id': str(result.inserted_id), 'message': 'Charge created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/charge-master/<id>', methods=['PUT'])
def update_charge_master(id):
    try:
        data = request.get_json()
        data['updated_at'] = datetime.now()
        result = db.charge_master.update_one({'_id': parse_object_id(id)}, {'$set': data})
        if result.modified_count:
            return jsonify({'message': 'Charge updated successfully'})
        return jsonify({'error': 'Charge not found'}), 404
    except Exception as e:
        logging.error(f"Error updating charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/charge-master/<id>', methods=['DELETE'])
def delete_charge_master(id):
    try:
        result = db.charge_master.delete_one({'_id': parse_object_id(id)})
        if result.deleted_count:
            return jsonify({'message': 'Charge deleted successfully'})
        return jsonify({'error': 'Charge not found'}), 404
    except Exception as e:
        logging.error(f"Error deleting charge: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== CASE CHARGES API (Patient Charges) ====================

@app.route('/api/case-charges', methods=['GET'])
def get_case_charges():
    try:
        case_id = request.args.get('case_id')
        query = {}
        if case_id:
            query['case_id'] = parse_object_id(case_id)
        charges = list(db.case_charges.find(query))
        
        # Populate charge master names
        for charge in charges:
            if 'charge_master_id' in charge:
                charge_master = db.charge_master.find_one({'_id': charge['charge_master_id']})
                if charge_master:
                    charge['charge_name'] = charge_master.get('name', '')
        
        return jsonify(serialize_doc(charges))
    except Exception as e:
        logging.error(f"Error getting case charges: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/case-charges', methods=['POST'])
def create_case_charge():
    try:
        data = request.get_json()
        
        # Convert case_id and charge_master_id to ObjectId
        if 'case_id' in data and data['case_id']:
            data['case_id'] = parse_object_id(data['case_id'])
        if 'charge_master_id' in data and data['charge_master_id']:
            data['charge_master_id'] = parse_object_id(data['charge_master_id'])
        if 'doctor_id' in data and data['doctor_id']:
            data['doctor_id'] = parse_object_id(data['doctor_id'])
        
        # Convert quantity and amounts to proper types
        if 'quantity' in data:
            data['quantity'] = int(data['quantity']) if data['quantity'] else 1
        if 'unit_amount' in data:
            data['unit_amount'] = float(data['unit_amount']) if data['unit_amount'] else 0.0
        if 'total_amount' in data:
            data['total_amount'] = float(data['total_amount']) if data['total_amount'] else 0.0
        elif 'quantity' in data and 'unit_amount' in data:
            # Calculate total_amount if not provided
            data['total_amount'] = float(data['quantity']) * float(data['unit_amount'])
        
        data['created_at'] = datetime.now()
        result = db.case_charges.insert_one(data)
        
        # If doctor_id exists, create payout record
        if 'doctor_id' in data and data['doctor_id'] and 'case_id' in data and data['case_id']:
            try:
                # Get case details
                case = db.cases.find_one({'_id': data['case_id']})
                if case:
                    # Get patient name
                    patient_name = ''
                    if 'patient_id' in case:
                        patient = db.patients.find_one({'_id': case['patient_id']})
                        if patient:
                            patient_name = patient.get('name', '')
                    
                    # Calculate doctor charge amount from doctor_charges collection
                    doctor_charge_amount = 0
                    if 'charge_master_id' in data and data['charge_master_id']:
                        doctor_charge = db.doctor_charges.find_one({
                            'doctor_id': data['doctor_id'],
                            'charge_master_id': data['charge_master_id']
                        })
                        if doctor_charge:
                            # Get amount from doctor_charges and multiply by quantity
                            doctor_charge_amount = doctor_charge.get('amount', 0) * data.get('quantity', 1)
                    
                    # Use the total_amount of this specific charge
                    total_charge_amount = data.get('total_amount', 0)
                    
                    # Create payout record
                    payout_data = {
                        'case_id': data['case_id'],
                        'doctor_id': data['doctor_id'],
                        'case_charge_id': result.inserted_id,  # Link to the case charge
                        'date_time': datetime.now(),
                        'case_number': case.get('case_number', ''),
                        'patient_name': patient_name,
                        'case_type': case.get('case_type', ''),
                        'total_charge_amount': total_charge_amount,
                        'doctor_charge_amount': doctor_charge_amount,
                        'payment_status': 'pending',
                        'created_at': datetime.now()
                    }
                    db.payouts.insert_one(payout_data)
            except Exception as payout_error:
                logging.error(f"Error creating payout record: {payout_error}")
                # Don't fail the case charge creation if payout creation fails
        
        return jsonify({'id': str(result.inserted_id), 'message': 'Case charge created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating case charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/case-charges/<id>', methods=['PUT'])
def update_case_charge(id):
    try:
        data = request.get_json()
        
        # Convert IDs to ObjectId if present
        if 'case_id' in data and data['case_id']:
            data['case_id'] = parse_object_id(data['case_id'])
        if 'charge_master_id' in data and data['charge_master_id']:
            data['charge_master_id'] = parse_object_id(data['charge_master_id'])
        if 'doctor_id' in data and data['doctor_id']:
            data['doctor_id'] = parse_object_id(data['doctor_id'])
        
        # Convert quantity and amounts to proper types
        if 'quantity' in data:
            data['quantity'] = int(data['quantity']) if data['quantity'] else 1
        if 'unit_amount' in data:
            data['unit_amount'] = float(data['unit_amount']) if data['unit_amount'] else 0.0
        if 'total_amount' in data:
            data['total_amount'] = float(data['total_amount']) if data['total_amount'] else 0.0
        elif 'quantity' in data and 'unit_amount' in data:
            # Calculate total_amount if not provided
            data['total_amount'] = float(data['quantity']) * float(data['unit_amount'])
        
        data['updated_at'] = datetime.now()
        result = db.case_charges.update_one({'_id': parse_object_id(id)}, {'$set': data})
        if result.modified_count:
            return jsonify({'message': 'Case charge updated successfully'})
        return jsonify({'error': 'Case charge not found'}), 404
    except Exception as e:
        logging.error(f"Error updating case charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/case-charges/<id>', methods=['DELETE'])
def delete_case_charge(id):
    try:
        result = db.case_charges.delete_one({'_id': parse_object_id(id)})
        if result.deleted_count:
            return jsonify({'message': 'Case charge deleted successfully'})
        return jsonify({'error': 'Case charge not found'}), 404
    except Exception as e:
        logging.error(f"Error deleting case charge: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== DOCTOR CHARGES API ====================

@app.route('/api/doctor-charges', methods=['GET'])
def get_doctor_charges():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        skip = (page - 1) * limit
        
        doctor_id = request.args.get('doctor_id')
        query = {}
        if doctor_id:
            query['doctor_id'] = parse_object_id(doctor_id)
        
        # Get total count for pagination
        total = db.doctor_charges.count_documents(query)
        
        # Get paginated results
        charges = list(db.doctor_charges.find(query).sort('created_at', -1).skip(skip).limit(limit))
        
        # Populate doctor names and charge master names
        for charge in charges:
            if 'doctor_id' in charge:
                doctor = db.doctors.find_one({'_id': charge['doctor_id']})
                if doctor:
                    charge['doctor_name'] = doctor.get('name', '')
            if 'charge_master_id' in charge:
                charge_master = db.charge_master.find_one({'_id': charge['charge_master_id']})
                if charge_master:
                    charge['charge_master_name'] = charge_master.get('name', '')
        
        return jsonify({
            'charges': serialize_doc(charges),
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        logging.error(f"Error getting doctor charges: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/doctors-by-charge', methods=['GET'])
def get_doctors_by_charge():
    try:
        charge_master_id = request.args.get('charge_master_id')
        if not charge_master_id:
            return jsonify({'error': 'charge_master_id parameter is required'}), 400
        
        # Find all doctor_charges for this charge_master_id
        doctor_charges = list(db.doctor_charges.find({'charge_master_id': parse_object_id(charge_master_id)}))
        
        # Get unique doctor IDs
        doctor_ids = list(set([charge['doctor_id'] for charge in doctor_charges if 'doctor_id' in charge]))
        
        # Get doctor details - only show active doctors
        doctors = []
        for doctor_id in doctor_ids:
            doctor = db.doctors.find_one({'_id': doctor_id})
            if doctor:
                # Check if doctor is active (isActive is True or doesn't exist)
                is_active = doctor.get('isActive', True)
                if is_active:
                    doctors.append(serialize_doc(doctor))
        
        return jsonify(doctors)
    except Exception as e:
        logging.error(f"Error getting doctors by charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/doctor-charges/<id>', methods=['GET'])
def get_doctor_charge(id):
    try:
        charge = db.doctor_charges.find_one({'_id': parse_object_id(id)})
        if not charge:
            return jsonify({'error': 'Doctor charge not found'}), 404
        
        # Populate names
        if 'doctor_id' in charge:
            doctor = db.doctors.find_one({'_id': charge['doctor_id']})
            if doctor:
                charge['doctor_name'] = doctor.get('name', '')
        if 'charge_master_id' in charge:
            charge_master = db.charge_master.find_one({'_id': charge['charge_master_id']})
            if charge_master:
                charge['charge_master_name'] = charge_master.get('name', '')
        
        return jsonify(serialize_doc(charge))
    except Exception as e:
        logging.error(f"Error getting doctor charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/doctor-charges', methods=['POST'])
def create_doctor_charge():
    try:
        data = request.get_json()
        data['created_at'] = datetime.now()
        result = db.doctor_charges.insert_one(data)
        return jsonify({'id': str(result.inserted_id), 'message': 'Doctor charge created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating doctor charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/doctor-charges/<id>', methods=['PUT'])
def update_doctor_charge(id):
    try:
        data = request.get_json()
        data['updated_at'] = datetime.now()
        result = db.doctor_charges.update_one({'_id': parse_object_id(id)}, {'$set': data})
        if result.modified_count:
            return jsonify({'message': 'Doctor charge updated successfully'})
        return jsonify({'error': 'Doctor charge not found'}), 404
    except Exception as e:
        logging.error(f"Error updating doctor charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/doctor-charges/<id>', methods=['DELETE'])
def delete_doctor_charge(id):
    try:
        result = db.doctor_charges.delete_one({'_id': parse_object_id(id)})
        if result.deleted_count:
            return jsonify({'message': 'Doctor charge deleted successfully'})
        return jsonify({'error': 'Doctor charge not found'}), 404
    except Exception as e:
        logging.error(f"Error deleting doctor charge: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== CASE DOCTOR CHARGES API ====================

@app.route('/api/case-doctor-charges', methods=['GET'])
def get_case_doctor_charges():
    try:
        case_id = request.args.get('case_id')
        query = {}
        if case_id:
            query['case_id'] = parse_object_id(case_id)
        
        charges = list(db.case_doctor_charges.find(query))
        
        # Populate doctor names
        for charge in charges:
            if 'doctor_id' in charge:
                doctor = db.doctors.find_one({'_id': charge['doctor_id']})
                if doctor:
                    charge['doctor_name'] = doctor.get('name', '')
        
        return jsonify(serialize_doc(charges))
    except Exception as e:
        logging.error(f"Error getting case doctor charges: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/case-doctor-charges/<id>', methods=['GET'])
def get_case_doctor_charge(id):
    try:
        charge = db.case_doctor_charges.find_one({'_id': parse_object_id(id)})
        if not charge:
            return jsonify({'error': 'Case doctor charge not found'}), 404
        
        # Populate doctor name
        if 'doctor_id' in charge:
            doctor = db.doctors.find_one({'_id': charge['doctor_id']})
            if doctor:
                charge['doctor_name'] = doctor.get('name', '')
        
        return jsonify(serialize_doc(charge))
    except Exception as e:
        logging.error(f"Error getting case doctor charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/case-doctor-charges', methods=['POST'])
def create_case_doctor_charge():
    try:
        data = request.get_json()
        data['created_at'] = datetime.now()
        result = db.case_doctor_charges.insert_one(data)
        return jsonify({'id': str(result.inserted_id), 'message': 'Case doctor charge created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating case doctor charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/case-doctor-charges/<id>', methods=['PUT'])
def update_case_doctor_charge(id):
    try:
        data = request.get_json()
        data['updated_at'] = datetime.now()
        result = db.case_doctor_charges.update_one({'_id': parse_object_id(id)}, {'$set': data})
        if result.modified_count:
            return jsonify({'message': 'Case doctor charge updated successfully'})
        return jsonify({'error': 'Case doctor charge not found'}), 404
    except Exception as e:
        logging.error(f"Error updating case doctor charge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/case-doctor-charges/<id>', methods=['DELETE'])
def delete_case_doctor_charge(id):
    try:
        result = db.case_doctor_charges.delete_one({'_id': parse_object_id(id)})
        if result.deleted_count:
            return jsonify({'message': 'Case doctor charge deleted successfully'})
        return jsonify({'error': 'Case doctor charge not found'}), 404
    except Exception as e:
        logging.error(f"Error deleting case doctor charge: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== BILLS API (Optimized with Aggregation) ====================

@app.route('/api/bills', methods=['GET'])
def get_bills():
    try:
        case_id = request.args.get('case_id')
        query = {}
        if case_id:
            query['case_id'] = parse_object_id(case_id)
        
        # Use aggregation pipeline for efficient joins
        pipeline = [
            {'$match': query} if query else {'$match': {}},
            {
                '$lookup': {
                    'from': 'cases',
                    'localField': 'case_id',
                    'foreignField': '_id',
                    'as': 'case'
                }
            },
            {'$unwind': {'path': '$case', 'preserveNullAndEmptyArrays': True}},
            {
                '$lookup': {
                    'from': 'patients',
                    'localField': 'case.patient_id',
                    'foreignField': '_id',
                    'as': 'patient'
                }
            },
            {'$unwind': {'path': '$patient', 'preserveNullAndEmptyArrays': True}},
            {
                '$project': {
                    '_id': 1,
                    'case_id': 1,
                    'total_amount': 1,
                    'paid_amount': 1,
                    'balance_amount': 1,
                    'status': 1,
                    'created_at': 1,
                    'case_number': '$case.case_number',
                    'patient_name': '$patient.name'
                }
            }
        ]
        
        bills = list(db.bills.aggregate(pipeline))
        return jsonify(serialize_doc(bills))
    except Exception as e:
        logging.error(f"Error getting bills: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bills', methods=['POST'])
def create_bill():
    try:
        data = request.get_json()
        
        # Calculate bill amounts from case charges
        case_id = parse_object_id(data.get('case_id'))
        case_charges = list(db.case_charges.find({'case_id': case_id}))
        total_amount = sum(charge.get('total_amount', 0) for charge in case_charges)
        
        data['total_amount'] = data.get('total_amount', total_amount)
        data['paid_amount'] = data.get('paid_amount', 0)
        data['balance_amount'] = data['total_amount'] - data['paid_amount']
        data['status'] = data.get('status', 'pending')
        data['created_at'] = datetime.now()
        
        result = db.bills.insert_one(data)
        return jsonify({'id': str(result.inserted_id), 'message': 'Bill created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating bill: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bills/<id>', methods=['PUT'])
def update_bill(id):
    try:
        data = request.get_json()
        data['updated_at'] = datetime.now()
        
        # Recalculate balance if amounts changed
        if 'paid_amount' in data or 'total_amount' in data:
            bill = db.bills.find_one({'_id': parse_object_id(id)})
            if bill:
                total = data.get('total_amount', bill.get('total_amount', 0))
                paid = data.get('paid_amount', bill.get('paid_amount', 0))
                data['balance_amount'] = total - paid
        
        result = db.bills.update_one({'_id': parse_object_id(id)}, {'$set': data})
        if result.modified_count:
            return jsonify({'message': 'Bill updated successfully'})
        return jsonify({'error': 'Bill not found'}), 404
    except Exception as e:
        logging.error(f"Error updating bill: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bills/<id>', methods=['DELETE'])
def delete_bill(id):
    try:
        result = db.bills.delete_one({'_id': parse_object_id(id)})
        if result.deleted_count:
            return jsonify({'message': 'Bill deleted successfully'})
        return jsonify({'error': 'Bill not found'}), 404
    except Exception as e:
        logging.error(f"Error deleting bill: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== PAYMENTS API (Optimized with Aggregation) ====================

@app.route('/api/payments', methods=['GET'])
def get_payments():
    try:
        case_id = request.args.get('case_id')
        query = {}
        if case_id:
            query['case_id'] = parse_object_id(case_id)
        
        # Use aggregation pipeline for efficient joins
        pipeline = [
            {'$match': query} if query else {'$match': {}},
            {
                '$lookup': {
                    'from': 'cases',
                    'localField': 'case_id',
                    'foreignField': '_id',
                    'as': 'case'
                }
            },
            {'$unwind': {'path': '$case', 'preserveNullAndEmptyArrays': True}},
            {
                '$lookup': {
                    'from': 'patients',
                    'localField': 'case.patient_id',
                    'foreignField': '_id',
                    'as': 'patient'
                }
            },
            {'$unwind': {'path': '$patient', 'preserveNullAndEmptyArrays': True}},
            {
                '$project': {
                    '_id': 1,
                    'case_id': 1,
                    'amount': 1,
                    'payment_mode': 1,
                    'payment_date': 1,
                    'notes': 1,
                    'created_at': 1,
                    'case_number': '$case.case_number',
                    'patient_name': '$patient.name'
                }
            }
        ]
        
        payments = list(db.payments.aggregate(pipeline))
        return jsonify(serialize_doc(payments))
    except Exception as e:
        logging.error(f"Error getting payments: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/payments', methods=['POST'])
def create_payment():
    try:
        data = request.get_json()
        data['created_at'] = datetime.now()
        
        # Update bill paid amount
        case_id = parse_object_id(data.get('case_id'))
        if case_id:
            bill = db.bills.find_one({'case_id': case_id})
            if bill:
                new_paid = bill.get('paid_amount', 0) + data.get('amount', 0)
                db.bills.update_one(
                    {'_id': bill['_id']},
                    {
                        '$set': {
                            'paid_amount': new_paid,
                            'balance_amount': bill.get('total_amount', 0) - new_paid,
                            'status': 'paid' if new_paid >= bill.get('total_amount', 0) else 'partial'
                        }
                    }
                )
        
        result = db.payments.insert_one(data)
        return jsonify({'id': str(result.inserted_id), 'message': 'Payment created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating payment: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/payments/<id>', methods=['PUT'])
def update_payment(id):
    try:
        data = request.get_json()
        data['updated_at'] = datetime.now()
        result = db.payments.update_one({'_id': parse_object_id(id)}, {'$set': data})
        if result.modified_count:
            return jsonify({'message': 'Payment updated successfully'})
        return jsonify({'error': 'Payment not found'}), 404
    except Exception as e:
        logging.error(f"Error updating payment: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/payments/<id>', methods=['DELETE'])
def delete_payment(id):
    try:
        result = db.payments.delete_one({'_id': parse_object_id(id)})
        if result.deleted_count:
            return jsonify({'message': 'Payment deleted successfully'})
        return jsonify({'error': 'Payment not found'}), 404
    except Exception as e:
        logging.error(f"Error deleting payment: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== DOCTOR PAYOUTS API ====================

@app.route('/api/doctor-payouts', methods=['GET'])
def get_doctor_payouts():
    try:
        date = request.args.get('date')  # Format: YYYY-MM-DD
        if not date:
            return jsonify({'error': 'Date parameter is required'}), 400
        
        # Parse date
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        start_date = datetime.combine(date_obj.date(), datetime.min.time())
        end_date = datetime.combine(date_obj.date(), datetime.max.time())
        
        # Find all cases for the date (using admission_date)
        cases = list(db.cases.find({
            'admission_date': {
                '$gte': start_date,
                '$lte': end_date
            }
        }))
        
        payouts = []
        for case in cases:
            # Get patient name
            patient_name = ''
            if 'patient_id' in case:
                patient = db.patients.find_one({'_id': case['patient_id']})
                if patient:
                    patient_name = patient.get('name', '')
            
            # Calculate total charge amount (from case_charges)
            case_charges = list(db.case_charges.find({'case_id': case['_id']}))
            total_charge_amount = sum(charge.get('total_amount', 0) for charge in case_charges)
            
            # Get doctor charge amounts from doctor_charges collection based on charge_master_id
            # For each case_charge with doctor_id, look up the doctor_charges amount for that category
            doctor_charges_by_doctor = {}
            for charge in case_charges:
                if 'doctor_id' in charge and charge['doctor_id'] and 'charge_master_id' in charge and charge['charge_master_id']:
                    doctor_id = charge['doctor_id']
                    charge_master_id = charge['charge_master_id']
                    quantity = charge.get('quantity', 1)
                    
                    # Look up doctor_charges to get the amount for this doctor and charge category
                    doctor_charge = db.doctor_charges.find_one({
                        'doctor_id': doctor_id,
                        'charge_master_id': charge_master_id
                    })
                    
                    if doctor_charge:
                        # Get the amount from doctor_charges and multiply by quantity
                        doctor_charge_amount = doctor_charge.get('amount', 0) * quantity
                        
                        doctor_id_str = str(doctor_id)
                        if doctor_id_str not in doctor_charges_by_doctor:
                            doctor_charges_by_doctor[doctor_id_str] = {
                                'doctor_id': doctor_id_str,
                                'doctor_name': '',
                                'total_amount': 0
                            }
                        doctor_charges_by_doctor[doctor_id_str]['total_amount'] += doctor_charge_amount
            
            # Populate doctor names
            for doctor_id_str, doctor_charge_data in doctor_charges_by_doctor.items():
                doctor = db.doctors.find_one({'_id': parse_object_id(doctor_id_str)})
                if doctor:
                    doctor_charge_data['doctor_name'] = doctor.get('name', '')
            
            # If no doctor charges found in case_charges, check case_doctor_charges for backward compatibility
            if not doctor_charges_by_doctor and 'doctor_id' in case:
                doctor = db.doctors.find_one({'_id': case['doctor_id']})
                if doctor:
                    case_doc_charges = list(db.case_doctor_charges.find({'case_id': case['_id'], 'doctor_id': case['doctor_id']}))
                    if case_doc_charges:
                        total_doc_amount = sum(charge.get('amount', 0) for charge in case_doc_charges)
                        doctor_charges_by_doctor[str(case['doctor_id'])] = {
                            'doctor_id': str(case['doctor_id']),
                            'doctor_name': doctor.get('name', ''),
                            'total_amount': total_doc_amount
                        }
            
            # Calculate total doctor charge amount for the case
            total_doctor_charge_amount = sum(doc_charge['total_amount'] for doc_charge in doctor_charges_by_doctor.values())
            
            payouts.append({
                'case_id': str(case['_id']),
                'case_number': case.get('case_number', ''),
                'patient_name': patient_name,
                'case_type': case.get('case_type', ''),
                'total_charge_amount': total_charge_amount,
                'doctor_charge_amount': total_doctor_charge_amount,
                'doctor_charges': list(doctor_charges_by_doctor.values())  # List of doctor charges with doctor names
            })
        
        return jsonify(serialize_doc(payouts))
    except Exception as e:
        logging.error(f"Error getting doctor payouts: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== PAYOUTS API ====================

@app.route('/api/payouts', methods=['GET'])
def get_payouts():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        skip = (page - 1) * limit
        
        # Optional filters
        case_id = request.args.get('case_id')
        doctor_id = request.args.get('doctor_id')
        payment_status = request.args.get('payment_status')
        date = request.args.get('date')  # Format: YYYY-MM-DD (single date)
        start_date = request.args.get('start_date')  # Format: YYYY-MM-DD
        end_date = request.args.get('end_date')  # Format: YYYY-MM-DD
        
        query = {}
        if case_id:
            query['case_id'] = parse_object_id(case_id)
        if doctor_id:
            query['doctor_id'] = parse_object_id(doctor_id)
        if payment_status:
            query['payment_status'] = payment_status
        
        # Date range filtering (priority: start_date/end_date > date)
        if start_date and end_date:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
            query['date_time'] = {
                '$gte': datetime.combine(start_date_obj.date(), datetime.min.time()),
                '$lte': datetime.combine(end_date_obj.date(), datetime.max.time())
            }
        elif date:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            query['date_time'] = {
                '$gte': datetime.combine(date_obj.date(), datetime.min.time()),
                '$lte': datetime.combine(date_obj.date(), datetime.max.time())
            }
        
        # Get total count
        total = db.payouts.count_documents(query)
        
        # Get paginated results
        payouts = list(db.payouts.find(query).sort('date_time', -1).skip(skip).limit(limit))
        
        # Populate doctor names
        for payout in payouts:
            if 'doctor_id' in payout and payout['doctor_id']:
                doctor = db.doctors.find_one({'_id': payout['doctor_id']})
                if doctor:
                    payout['doctor_name'] = doctor.get('name', '')
        
        return jsonify({
            'payouts': serialize_doc(payouts),
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        logging.error(f"Error getting payouts: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/payouts', methods=['POST'])
def create_payout():
    try:
        data = request.get_json()
        
        # Convert IDs to ObjectId if present
        if 'case_id' in data and data['case_id']:
            data['case_id'] = parse_object_id(data['case_id'])
        if 'doctor_id' in data and data['doctor_id']:
            data['doctor_id'] = parse_object_id(data['doctor_id'])
        
        # Convert amounts to proper types
        if 'total_charge_amount' in data:
            data['total_charge_amount'] = float(data['total_charge_amount']) if data['total_charge_amount'] else 0.0
        if 'doctor_charge_amount' in data:
            data['doctor_charge_amount'] = float(data['doctor_charge_amount']) if data['doctor_charge_amount'] else 0.0
        if 'partial_payment_amount' in data:
            data['partial_payment_amount'] = float(data['partial_payment_amount']) if data['partial_payment_amount'] else 0.0
        
        # Set default values
        if 'payment_status' not in data:
            data['payment_status'] = 'pending'
        if 'date_time' not in data:
            data['date_time'] = datetime.now()
        
        data['created_at'] = datetime.now()
        result = db.payouts.insert_one(data)
        return jsonify({'id': str(result.inserted_id), 'message': 'Payout created successfully'}), 201
    except Exception as e:
        logging.error(f"Error creating payout: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/payouts/<id>', methods=['PUT'])
def update_payout(id):
    try:
        data = request.get_json()
        update_data = {'updated_at': datetime.now()}
        
        # Allow updating payment_status, payment_comment, payment_mode, payment_reference_number, payment_date, partial_payment_amount
        allowed_fields = ['payment_status', 'payment_comment', 'payment_mode', 'payment_reference_number', 'payment_date', 'partial_payment_amount']
        for field in allowed_fields:
            if field in data:
                if field == 'partial_payment_amount':
                    # Convert to float for partial payment amount
                    update_data[field] = float(data[field]) if data[field] else 0.0
                else:
                    update_data[field] = data[field]
        
        # If payment_status is being set to 'paid' or 'partial_paid', set payment_date if not provided
        if 'payment_status' in update_data and update_data['payment_status'] in ['paid', 'partial_paid']:
            if 'payment_date' not in update_data:
                update_data['payment_date'] = datetime.now()
        
        if len(update_data) == 1:  # Only updated_at
            return jsonify({'error': 'No valid fields to update'}), 400
        
        result = db.payouts.update_one({'_id': parse_object_id(id)}, {'$set': update_data})
        if result.modified_count:
            return jsonify({'message': 'Payout updated successfully'})
        return jsonify({'error': 'Payout not found'}), 404
    except Exception as e:
        logging.error(f"Error updating payout: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== REPORTS API ====================

@app.route('/api/reports/summary', methods=['GET'])
def get_summary():
    try:
        summary = {
            'doctors': db.doctors.count_documents({}),
            'patients': db.patients.count_documents({}),
            'cases': db.cases.count_documents({}),
            'appointments': db.appointments.count_documents({}),
            'prescriptions': db.prescriptions.count_documents({})
        }
        return jsonify(summary)
    except Exception as e:
        logging.error(f"Error getting summary: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
