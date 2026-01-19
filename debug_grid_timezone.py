from app import app, db
from datetime import datetime, timedelta
import pprint

with app.app_context():
    print(f"Server Now: {datetime.now()}")
    
    # Simulate Grid Logic (Naive)
    end_date = datetime.now()
    start_date = end_date # Just today
    
    start_dt = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_dt = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    print(f"Naive Query Window: {start_dt} to {end_dt}")
    
    query = {'payment_date': {'$gte': start_dt, '$lte': end_dt}}
    count = db.payments.count_documents(query)
    print(f"Naive Count: {count}")
    
    # Simulate Grid Logic (IST Adjusted)
    ist_offset = timedelta(hours=5, minutes=30)
    utc_start = start_dt - ist_offset
    utc_end = end_dt - ist_offset
    
    print(f"IST Adjusted Query Window: {utc_start} to {utc_end}")
    
    query_adj = {'payment_date': {'$gte': utc_start, '$lte': utc_end}}
    count_adj = db.payments.count_documents(query_adj)
    print(f"Adjusted Count: {count_adj}")
    
    # Show actual records
    print("\n--- Recent Payments (Raw) ---")
    payments = list(db.payments.find().sort('payment_date', -1).limit(5))
    for p in payments:
        print(f"Date: {p.get('payment_date')} | Amount: {p.get('amount')}")
