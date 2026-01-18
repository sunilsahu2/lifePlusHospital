
import requests

BASE_URL = "http://localhost:5000/api"
CASE_ID = "696bdd6cc00374ccb55ec05c"
HEADERS = {
    'X-User-Id': '6966700c2e11caad5be93624',
    'X-Username': 'sunilsahu'
}

print(f"Attempting to fetch billing for Case ID: {CASE_ID}")
try:
    resp = requests.get(f"{BASE_URL}/billing/case/{CASE_ID}", headers=HEADERS)
    print(f"Status: {resp.status_code}")
    print("Response:", resp.text)
except Exception as e:
    print(f"Request failed: {e}")
