#!/usr/bin/env python3
"""
Migration script to rename payout_to_doctor collection to payouts
This script copies all documents from payout_to_doctor to payouts
"""

import os
from pymongo import MongoClient
from datetime import datetime
import urllib.parse

# MongoDB Connection Configuration - same as app.py
MONGODB_USERNAME = 'sunilsahu'
MONGODB_PASSWORD = 'sokwer-pubgux-poxxE3'
MONGODB_CLUSTER = 'cluster0.qufitms.mongodb.net'
MONGODB_DB_NAME = 'hospital_management'

# Build MongoDB URI
encoded_password = urllib.parse.quote_plus(MONGODB_PASSWORD)
MONGO_URI = f'mongodb+srv://{MONGODB_USERNAME}:{encoded_password}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority'
DB_NAME = MONGODB_DB_NAME

def migrate_payouts_collection():
    """Migrate data from payout_to_doctor to payouts collection"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Check if payout_to_doctor collection exists
        if 'payout_to_doctor' not in db.list_collection_names():
            print("Collection 'payout_to_doctor' does not exist. Nothing to migrate.")
            return
        
        # Get all documents from payout_to_doctor
        old_collection = db.payout_to_doctor
        new_collection = db.payouts
        
        count = old_collection.count_documents({})
        print(f"Found {count} documents in payout_to_doctor collection")
        
        if count == 0:
            print("No documents to migrate.")
            return
        
        # Copy all documents to payouts collection
        documents = list(old_collection.find({}))
        
        # Check if payouts collection already has documents
        existing_count = new_collection.count_documents({})
        if existing_count > 0:
            print(f"Note: payouts collection already has {existing_count} documents.")
            print("Checking if documents need to be migrated...")
            
            # Check if all documents from old collection already exist in new collection
            existing_ids = set(str(doc['_id']) for doc in new_collection.find({}, {'_id': 1}))
            old_ids = set(str(doc['_id']) for doc in documents)
            
            if old_ids.issubset(existing_ids):
                print("All documents from payout_to_doctor already exist in payouts collection.")
                print("Migration already completed. Dropping old collection...")
                old_collection.drop()
                print("Old collection 'payout_to_doctor' has been dropped.")
                client.close()
                print("Migration completed!")
                return
            else:
                print("Some documents need to be migrated. Continuing...")
        
        # Insert documents into new collection (skip duplicates)
        inserted_count = 0
        skipped_count = 0
        for doc in documents:
            try:
                # Check if document already exists
                if new_collection.find_one({'_id': doc['_id']}):
                    skipped_count += 1
                    continue
                new_collection.insert_one(doc)
                inserted_count += 1
            except Exception as e:
                # If duplicate key error, skip
                if 'duplicate' in str(e).lower() or 'E11000' in str(e):
                    skipped_count += 1
                    continue
                print(f"Error inserting document {doc.get('_id')}: {e}")
        
        if skipped_count > 0:
            print(f"Skipped {skipped_count} duplicate document(s).")
        
        print(f"Successfully migrated {inserted_count} documents from payout_to_doctor to payouts")
        
        # Drop the old collection if migration was successful
        if inserted_count == count:
            try:
                old_collection.drop()
                print("Old collection 'payout_to_doctor' has been dropped.")
            except Exception as e:
                print(f"Warning: Could not drop old collection: {e}")
                print("Old collection 'payout_to_doctor' has been kept. You can drop it manually later.")
        else:
            print(f"Warning: Only {inserted_count} out of {count} documents were migrated. Old collection kept.")
        
        client.close()
        print("Migration completed!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        raise

if __name__ == '__main__':
    print("=" * 60)
    print("Payout Collection Migration Script")
    print("=" * 60)
    print(f"Database: {DB_NAME}")
    print(f"MongoDB URI: {MONGO_URI}")
    print("=" * 60)
    migrate_payouts_collection()
