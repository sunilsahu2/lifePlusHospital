from app import app, db
import pprint

with app.app_context():
    print("--- Inspecting Case Charges ---")
    charges = list(db.case_charges.find().limit(5))
    for c in charges:
        val = c.get('total_amount')
        print(f"Charge ID: {c.get('_id')}, total_amount: {val} (Type: {type(val)})")

    print("\n--- Inspecting Payments ---")
    payments = list(db.payments.find().limit(5))
    for p in payments:
        val = p.get('amount')
        print(f"Payment ID: {p.get('_id')}, amount: {val} (Type: {type(val)})")

    print("\n--- Inspecting Cases Discount ---")
    cases = list(db.cases.find().limit(5))
    for c in cases:
        val = c.get('discount')
        print(f"Case ID: {c.get('_id')}, discount: {val} (Type: {type(val)})")
