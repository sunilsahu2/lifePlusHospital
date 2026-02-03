#!/usr/bin/env python3
"""
Check all unique charge categories in the database
"""

from pymongo import MongoClient
import urllib.parse

# MongoDB Connection
MONGODB_USERNAME = 'sunilsahu'
MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
MONGODB_DB_NAME = 'hospital_management'
encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
MONGODB_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'

# Connect to MongoDB
client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
db = client[MONGODB_DB_NAME]

print("Checking charge_master categories...")
print("=" * 80)

# Get all unique categories
categories = db.charge_master.distinct('category')
charge_categories = db.charge_master.distinct('charge_category')

print("\nCategories found:")
for cat in sorted(categories):
    count = db.charge_master.count_documents({'category': cat})
    print(f"  {cat}: {count} items")

print("\nCharge Categories found:")
for cat in sorted(charge_categories):
    count = db.charge_master.count_documents({'charge_category': cat})
    print(f"  {cat}: {count} items")

print("\nCharge types in case_charges:")
charge_types = db.case_charges.distinct('charge_type')
for ct in sorted(charge_types):
    count = db.case_charges.count_documents({'charge_type': ct})
    print(f"  {ct}: {count} items")

print("\nSample charge_master records:")
samples = list(db.charge_master.find().limit(10))
for sample in samples:
    print(f"  Name: {sample.get('name')}")
    print(f"    Category: {sample.get('category', 'N/A')}")
    print(f"    Charge Category: {sample.get('charge_category', 'N/A')}")
    print()
