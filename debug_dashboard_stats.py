from app import app, db
from datetime import datetime, timedelta
import pprint

with app.app_context():
    print(f"Server datetime.now(): {datetime.now()}")
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    print(f"Today Start: {today_start}")
    print(f"Tomorrow Start: {today_start + timedelta(days=1)}")
    
    # 1. Check recent payments
    print("\n--- Last 5 Payments ---")
    recent = list(db.payments.find().sort('created_at', -1).limit(5))
    for p in recent:
        print(f"ID: {p['_id']}, Amount: {p.get('amount')}, Date: {p.get('payment_date')} (Type: {type(p.get('payment_date'))})")
        
    # 2. Run the query
    print("\n--- Query Execution ---")
    query = {
        'payment_date': {
            '$gte': today_start,
            '$lt': today_start + timedelta(days=1)
        }
    }
    print(f"Query: {query}")
    payments_today = list(db.payments.find(query))
    print(f"Found {len(payments_today)} payments today.")
    for p in payments_today:
        print(f" - {p.get('amount')} at {p.get('payment_date')}")
        
    print(f"Total Collections: {sum(p.get('amount', 0) for p in payments_today)}")
