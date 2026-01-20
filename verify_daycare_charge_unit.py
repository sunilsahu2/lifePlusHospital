
import unittest
from flask import session
from app import app, db, parse_object_id
from datetime import datetime
import json

class TestDaycareCharge(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        self.app = app.test_client()
        self.ctx = app.app_context()
        self.ctx.push()
        
        # Create a test user or just mock session in test_client
        # But for login_required, we need 'user_id' in session.
        # We can use session transaction to set it.

    def tearDown(self):
        self.ctx.pop()

    def test_add_daycare_charge_to_opd_case(self):
        with self.app as c:
            with c.session_transaction() as sess:
                sess['user_id'] = 'hardcoded_test_user_id' # Mock user ID
                sess['username'] = 'test_admin'
                sess['role'] = 'admin'

            # 1. Create Patient
            patient_data = {
                'name': 'Test Patient Daycare Unit',
                'phone': '5550002222', 
                'gender': 'Female',
                'age': 25
            }
            res = c.post('/api/patients', json=patient_data)
            if res.status_code == 201:
                patient_id = res.json['id']
                print(f"✓ Patient created: {patient_id}")
            else:
                 # Search if exists
                 res = c.get(f'/api/patients?search={patient_data["name"]}')
                 patient_id = res.json['patients'][0]['id']
                 print(f"✓ Found patient: {patient_id}")

            # 2. Create OPD Case
            case_data = {
                'patient_id': patient_id,
                'case_type': 'OPD',
                'description': 'Test OPD Case Unit',
                'admission_date': datetime.now().isoformat()
            }
            res = c.post('/api/cases', json=case_data)
            self.assertEqual(res.status_code, 201)
            case_id = res.json['id']
            print(f"✓ OPD Case created: {case_id}")

            # 3. Find/Create DAYCARE Charge
            charges = list(db.charge_master.find({
                '$or': [
                    {'category': 'DAYCARE'},
                    {'charge_category': 'DAYCARE'}
                ]
            }).limit(1))
            
            if charges:
                daycare_charge = charges[0]
                print(f"✓ Found DAYCARE charge: {daycare_charge['name']}")
            else:
                daycare_charge_data = {
                    'name': 'TEST DAYCARE UNIT',
                    'category': 'DAYCARE',
                    'amount': 500
                }
                res = c.post('/api/charge-master', json=daycare_charge_data)
                daycare_charge = daycare_charge_data
                daycare_charge['_id'] = res.json['id']
                print(f"✓ Created test DAYCARE charge")

            # 4. Add DAYCARE Charge
            charge_data = {
                'case_id': case_id,
                'charge_master_id': str(daycare_charge['_id']),
                'quantity': 1,
                'unit_amount': daycare_charge.get('amount', 500),
                'total_amount': daycare_charge.get('amount', 500),
                'charge_type': 'hospital'
            }
            res = c.post('/api/case-charges', json=charge_data)
            
            if res.status_code != 201:
                 print(f"✗ Failed to add charge: {res.json}")
            self.assertEqual(res.status_code, 201)
            print(f"✓ Charge added successfully")

            # 5. Verify
            res = c.get(f'/api/cases/{case_id}')
            case = res.json
            found = any(c['charge_master_id'] == str(daycare_charge['_id']) for c in case['charges'])
            self.assertTrue(found)
            print(f"✓ Verified charge in case details")

if __name__ == '__main__':
    unittest.main()
