
from pymongo import MongoClient
import os

MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    MONGODB_URI = "mongodb+srv://sunilsahu:sokwer-pubgux-poxxE3@cluster0.qufitms.mongodb.net/?retryWrites=true&w=majority"

client = MongoClient(MONGODB_URI)
db = client['hospital_management']

categories = db.charge_master.distinct('category')
charge_categories = db.charge_master.distinct('charge_category')

print("Categories:", categories)
print("Charge Categories:", charge_categories)

# specific search for DAYCARE
daycare_charges = list(db.charge_master.find({
    '$or': [
        {'category': 'DAYCARE'},
        {'charge_category': 'DAYCARE'},
        {'category': {'$regex': 'DAYCARE', '$options': 'i'}},
        {'charge_category': {'$regex': 'DAYCARE', '$options': 'i'}}
    ]
}).limit(5))

print("\nSample DAYCARE charges:")
for c in daycare_charges:
    print(c.get('name'), c.get('category'), c.get('charge_category'))
