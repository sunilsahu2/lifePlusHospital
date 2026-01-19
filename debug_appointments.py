from app import app, db
import pprint

with app.app_context():
    # Check last 5 appointments
    print("\n--- Last 5 Appointments ---")
    recent = list(db.appointments.find().sort('created_at', -1).limit(5))
    for a in recent:
        print(f"ID: {a['_id']}, Date: {a.get('appointment_date')} (Type: {type(a.get('appointment_date'))})")
