from app import app, db
import pprint

with app.app_context():
    print(f"Payouts Count: {db.payouts.count_documents({})}")
    print("\n--- Last 5 Payouts ---")
    payouts = list(db.payouts.find().sort('created_at', -1).limit(5))
    for p in payouts:
        print(f"ID: {p['_id']}, Status: {p.get('payment_status')}, Date: {p.get('date_time')}")
        print(f"  Doctor Charge: {p.get('doctor_charge_amount')}")
        print(f"  Partial Amount: {p.get('partial_payment_amount')}")
        print(f"  Payment Date: {p.get('payment_date')}")
