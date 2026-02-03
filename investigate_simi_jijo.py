import requests
import json

# Get detailed case information
case_ids = ['696354329284b2c2ff6b67f6', '696354329284b2c2ff6b6807']

print("=" * 80)
print("Mrs Simi Jijo - Detailed Investigation")
print("=" * 80)

for case_id in case_ids:
    print(f"\n{'='*80}")
    print(f"Case ID: {case_id}")
    print(f"{'='*80}")
    
    # Get case details
    try:
        case_response = requests.get(f"http://localhost:5001/api/cases/{case_id}")
        case = case_response.json()
        
        print(f"\nCase Details:")
        print(f"  Admission Date: {case.get('admission_date', 'N/A')}")
        print(f"  Created At: {case.get('created_at', 'N/A')}")
        print(f"  Status: {case.get('status', 'N/A')}")
        print(f"  Discount: ₹{case.get('discount', 0)}")
        
        # Get charges for this case
        charges_response = requests.get(f"http://localhost:5001/api/cases/{case_id}/charges")
        charges = charges_response.json()
        
        print(f"\n  Charges (Total: {len(charges)}):")
        total_charges = 0
        for charge in charges:
            amount = charge.get('total_amount', 0)
            total_charges += amount
            print(f"    - {charge.get('charge_name', 'Unknown')}: ₹{amount} (Created: {charge.get('created_at', 'N/A')})")
        print(f"  Total Charges: ₹{total_charges}")
        
        # Get payments for this case
        payments_response = requests.get(f"http://localhost:5001/api/payments?case_id={case_id}")
        payments = payments_response.json()
        
        print(f"\n  Payments (Total: {len(payments)}):")
        total_payments = 0
        for payment in payments:
            amount = payment.get('amount', 0)
            total_payments += amount
            print(f"    - ₹{amount} on {payment.get('payment_date', 'N/A')} (Created: {payment.get('created_at', 'N/A')})")
        print(f"  Total Payments: ₹{total_payments}")
        
        discount = case.get('discount', 0)
        balance = total_charges - discount - total_payments
        print(f"\n  Summary:")
        print(f"    Total Charges: ₹{total_charges}")
        print(f"    Discount: ₹{discount}")
        print(f"    After Discount: ₹{total_charges - discount}")
        print(f"    Payments: ₹{total_payments}")
        print(f"    Balance: ₹{balance}")
        
    except Exception as e:
        print(f"  Error: {e}")

print(f"\n{'='*80}")
print("Analysis Complete")
print(f"{'='*80}")
