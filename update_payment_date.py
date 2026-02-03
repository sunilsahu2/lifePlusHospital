from pymongo import MongoClient
from datetime import datetime
from bson.objectid import ObjectId

# MongoDB connection (using the same connection as app.py)
client = MongoClient('mongodb+srv://sunilsahu:Sunil%401234@ac-y9ez2lj.qufitms.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['hospital_management']

# Payment ID to update
payment_id = '696e612b2ce6fc6ac5d4fc2f'

# New payment date: January 1, 2026, 18:30:00
new_payment_date = datetime(2026, 1, 1, 18, 30, 0)

print(f"Updating payment {payment_id}...")
print(f"New payment date: {new_payment_date}")

# Update the payment
result = db.payments.update_one(
    {'_id': ObjectId(payment_id)},
    {'$set': {
        'payment_date': new_payment_date,
        'updated_at': datetime.now()
    }}
)

if result.modified_count > 0:
    print("✅ Payment updated successfully!")
    
    # Verify the update
    updated_payment = db.payments.find_one({'_id': ObjectId(payment_id)})
    print(f"\nUpdated payment details:")
    print(f"  Payment ID: {updated_payment['_id']}")
    print(f"  Case ID: {updated_payment.get('case_id')}")
    print(f"  Amount: ₹{updated_payment.get('amount')}")
    print(f"  Payment Date: {updated_payment.get('payment_date')}")
else:
    print("❌ No payment was updated. Payment ID might be incorrect.")

client.close()
