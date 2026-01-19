from app import app, db, parse_object_id
import pprint

with app.app_context():
    # Find patient
    patient = db.patients.find_one({"name": "TEST PATIENT 3"})
    if not patient:
        print("❌ Patient 'TEST PATIENT 3' not found")
        exit()
        
    patient_id = patient['_id']
    print(f"Checking cases for patient: {patient['name']} (ID: {patient_id})")
    
    # Get cases
    # Emulating logic from app.py:get_cases
    pipeline = [
        {'$match': {'patient_id': patient_id}},
        {
            '$lookup': {
                'from': 'patients',
                'localField': 'patient_id',
                'foreignField': '_id',
                'as': 'patient'
            }
        },
        {'$unwind': {'path': '$patient', 'preserveNullAndEmptyArrays': True}},
        {
            '$lookup': {
                'from': 'doctors',
                'localField': 'doctor_id',
                'foreignField': '_id',
                'as': 'doctor'
            }
        },
        {'$unwind': {'path': '$doctor', 'preserveNullAndEmptyArrays': True}},
        # Join with payments to calculate total paid
        {
            '$lookup': {
                'from': 'payments',
                'localField': '_id',
                'foreignField': 'case_id',
                'as': 'payments'
            }
        },
        # Join with case_charges to calculate total charges
        {
            '$lookup': {
                'from': 'case_charges',
                'localField': '_id',
                'foreignField': 'case_id',
                'as': 'charges'
            }
        },
        {
            '$project': {
                '_id': 1,
                'case_number': 1,
                'status': 1,
                'discount': 1, # Explicitly project discount
                'charges_total': {'$sum': '$charges.total_amount'},
                'paid_amount': {'$sum': '$payments.amount'}
            }
        }
    ]
    
    cases = list(db.cases.aggregate(pipeline))
    
    total_due_sum = 0
    
    for c in cases:
        charges = float(c.get('charges_total', 0) or 0)
        paid = float(c.get('paid_amount', 0) or 0)
        discount = float(c.get('discount', 0) or 0)
        
        # Logic from app.py (inference based on bug report)
        # Verify how due_amount should be calculated vs how it might be
        net_charges = max(0, charges - discount)
        due_amount = net_charges - paid
        
        print(f"\nCase: {c.get('case_number')} (Status: {c.get('status')})")
        print(f"  Charges Total: {charges}")
        print(f"  Discount:      {discount}")
        print(f"  Paid Amount:   {paid}")
        print(f"  Calc. Due:     {due_amount} (Charges - Discount - Paid)")
        
        total_due_sum += due_amount
        
    print(f"\nTotal Due Sum across all cases: {total_due_sum}")
