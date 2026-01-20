
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
        
    def tearDown(self):
        self.ctx.pop()

    def test_add_edit_delete_daycare_charge(self):
        with self.app as c:
            with c.session_transaction() as sess:
                sess['user_id'] = 'hardcoded_test_user_id' # Mock user ID
                sess['username'] = 'test_admin'
                sess['role'] = 'admin'

            # 1. Create Patient
            patient_data = {
                'name': 'Test Patient Edit Delete',
                'phone': '5550003333', 
                'gender': 'Male',
                'age': 40
            }
            res = c.post('/api/patients', json=patient_data)
            if res.status_code == 201:
                patient_id = res.json['id']
            else:
                 res = c.get(f'/api/patients?search={patient_data["name"]}')
                 patient_id = res.json['patients'][0]['id']

            # 2. Create OPD Case
            case_data = {
                'patient_id': patient_id,
                'case_type': 'OPD',
                'description': 'Test OPD Case Edit/Delete',
                'admission_date': datetime.now().isoformat()
            }
            res = c.post('/api/cases', json=case_data)
            case_id = res.json['id']
            print(f"✓ Case created: {case_id}")

            # 3. Add Charge
            charges = list(db.charge_master.find({'category': 'DAYCARE'}).limit(1))
            daycare_charge = charges[0] if charges else {'_id': 'fake', 'name': 'fake', 'amount': 100}

            charge_data = {
                'case_id': case_id,
                'charge_master_id': str(daycare_charge['_id']),
                'quantity': 1,
                'unit_amount': daycare_charge.get('amount', 100),
                'total_amount': daycare_charge.get('amount', 100),
                'charge_type': 'hospital'
            }
            res = c.post('/api/case-charges', json=charge_data)
            self.assertEqual(res.status_code, 201)
            charge_id = res.json['id']
            print(f"✓ Charge added: {charge_id}")

            # 4. Edit Charge (PUT)
            edit_data = {
                'case_id': case_id,
                'quantity': 2,
                'total_amount': daycare_charge.get('amount', 100) * 2
            }
            res = c.put(f'/api/case-charges/{charge_id}', json=edit_data)
            self.assertEqual(res.status_code, 200)
            print(f"✓ Charge edited successfully")
            
            # Verify edit
            res = c.get(f'/api/case-charges/{charge_id}')
            self.assertEqual(res.json['quantity'], 2)

            # 5. Delete Charge (DELETE)
            res = c.delete(f'/api/case-charges/{charge_id}')
            self.assertEqual(res.status_code, 200)
            print(f"✓ Charge deleted successfully")

            # Verify deletion
            res = c.get(f'/api/case-charges/{charge_id}')
            self.assertEqual(res.status_code, 404)

if __name__ == '__main__':
    unittest.main()
