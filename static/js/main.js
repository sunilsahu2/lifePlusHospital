// API Base URL
const API_BASE = '/api';

// Utility function to wrap tables in responsive wrapper for mobile
function wrapTablesInContainer() {
    const tables = document.querySelectorAll('.data-table');
    tables.forEach(table => {
        // Skip if already wrapped
        if (table.parentElement.classList.contains('table-wrapper')) {
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
}

// Utility function to enhance mobile table responsiveness
function enhanceTableResponsiveness() {
    if (window.innerWidth <= 768) {
        const tables = document.querySelectorAll('.data-table');
        tables.forEach(table => {
            const headers = Array.from(table.querySelectorAll('th'));
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    if (headers[index]) {
                        cell.setAttribute('data-label', headers[index].textContent);
                    }
                });
            });
        });
    }
}

// Call after content loads
function afterContentLoad() {
    wrapTablesInContainer();
    enhanceTableResponsiveness();
    // Close mobile menu if open after navigation
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            // Menu will close via onclick handlers
        }
    }
}

// Module loading function - ensure it's globally accessible
window.loadModule = function(moduleName, event) {
    // Update active menu item
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const contentArea = document.getElementById('content-area');
    
    switch(moduleName) {
        case 'doctors':
            loadDoctors();
            break;
        case 'doctor-charges':
            loadDoctorCharges();
            break;
        case 'patients':
            loadPatients();
            break;
        case 'cases':
            loadCases();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'prescriptions':
            loadPrescriptions();
            break;
        case 'billing-payments':
            loadBillingPayments();
            break;
        case 'charge-master':
            loadChargeMaster();
            break;
        case 'payouts':
            loadPayouts();
            break;
        case 'reports':
            loadReports();
            break;
        default:
            contentArea.innerHTML = '<div class="welcome-message"><h1>Module not found</h1></div>';
    }
};

// ==================== DOCTORS MODULE ====================

let currentDoctorsPage = 1;
const doctorsPageLimit = 10;
let doctorsSearchQuery = '';

function loadDoctors(page = 1) {
    currentDoctorsPage = page;
    const searchParam = doctorsSearchQuery ? `&search=${encodeURIComponent(doctorsSearchQuery)}` : '';
    
    fetch(`${API_BASE}/doctors?page=${page}&limit=${doctorsPageLimit}${searchParam}`)
        .then(res => res.json())
        .then(data => {
            // Handle response format
            const doctors = Array.isArray(data.doctors) ? data.doctors : (Array.isArray(data) ? data : []);
            const total = data.total !== undefined ? data.total : (Array.isArray(doctors) ? doctors.length : 0);
            const totalPages = Math.max(1, Math.ceil(total / doctorsPageLimit));
            
            const html = `
                <div class="module-content">
                    <div class="module-header">
                        <h1>Doctors</h1>
                        <button class="btn btn-primary" onclick="showDoctorForm()">Add Doctor</button>
                    </div>
                    <div class="search-section" style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <input type="text" id="doctorSearchInput" placeholder="Search by name, specialization, phone, or email" 
                               value="${doctorsSearchQuery}" 
                               onkeyup="handleDoctorSearch(event)" 
                               style="flex: 1; max-width: 400px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <button class="btn btn-primary" onclick="searchDoctors()" style="padding: 8px 20px;">Search</button>
                        ${doctorsSearchQuery ? `<button class="btn btn-secondary" onclick="clearDoctorSearch()" style="padding: 8px 20px;">Clear</button>` : ''}
                    </div>
                    <div class="table-scroll-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Specialization</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.isArray(doctors) && doctors.length > 0 ? doctors.map(doctor => `
                                    <tr>
                                        <td>${doctor.name || ''}</td>
                                        <td>${doctor.specialization || ''}</td>
                                        <td>${doctor.phone || ''}</td>
                                        <td>${doctor.email || ''}</td>
                                        <td>
                                            <button class="btn btn-success" onclick="editDoctor('${doctor.id}')">Edit</button>
                                            <button class="btn btn-danger" onclick="deleteDoctor('${doctor.id}')">Delete</button>
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="5" style="text-align: center;">No doctors found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            ${currentDoctorsPage > 1 ? `<button class="btn btn-secondary" onclick="loadDoctors(${currentDoctorsPage - 1})">Previous</button>` : '<span></span>'}
                            <span style="margin: 0 15px;">Page ${currentDoctorsPage} of ${totalPages}</span>
                            ${currentDoctorsPage < totalPages ? `<button class="btn btn-secondary" onclick="loadDoctors(${currentDoctorsPage + 1})">Next</button>` : '<span></span>'}
                        </div>
                        <div style="color: #666;">Total: ${total} doctors</div>
                    </div>
                </div>
            `;
            document.getElementById('content-area').innerHTML = html;
            setTimeout(afterContentLoad, 0);
        })
        .catch(err => {
            console.error('Error loading doctors:', err);
            alert('Error loading doctors: ' + (err.message || err));
        });
}

function handleDoctorSearch(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        searchDoctors();
    }
}

function searchDoctors() {
    const searchInput = document.getElementById('doctorSearchInput');
    if (searchInput) {
        doctorsSearchQuery = searchInput.value.trim();
        loadDoctors(1); // Reset to first page when searching
    }
}

function clearDoctorSearch() {
    doctorsSearchQuery = '';
    loadDoctors(1);
}

function showDoctorForm(doctorId = null) {
    const title = doctorId ? 'Edit Doctor' : 'Add Doctor';
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="doctorForm" onsubmit="saveDoctor(event, '${doctorId || ''}')">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Specialization</label>
                        <input type="text" name="specialization">
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="text" name="phone">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email">
                    </div>
                    <div class="form-group">
                        <label>Qualification</label>
                        <input type="text" name="qualification">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" onclick="loadDoctors()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
    
    if (doctorId) {
        fetch(`${API_BASE}/doctors/${doctorId}`)
            .then(res => res.json())
            .then(doctor => {
                if (doctor.error) {
                    alert('Error loading doctor: ' + doctor.error);
                    loadDoctors();
                    return;
                }
                
                // Populate form fields
                Object.keys(doctor).forEach(key => {
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.type === 'number') {
                            input.value = doctor[key] || '';
                        } else {
                            input.value = doctor[key] || '';
                        }
                    }
                });
            })
            .catch(err => {
                console.error('Error loading doctor:', err);
                alert('Error loading doctor details: ' + err.message);
                loadDoctors();
            });
    }
}

function saveDoctor(event, doctorId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {};
    
    // Convert form data to object
    for (let [key, value] of formData.entries()) {
        data[key] = value || null;
    }
    
    // Remove null/empty values for cleaner data
    Object.keys(data).forEach(key => {
        if (data[key] === '' || data[key] === null) {
            delete data[key];
        }
    });
    
    const url = doctorId ? `${API_BASE}/doctors/${doctorId}` : `${API_BASE}/doctors`;
    const method = doctorId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(responseData => {
        if (responseData.message) {
            alert(responseData.message);
            loadDoctors(currentDoctorsPage); // Reload current page after save
        } else if (responseData.error) {
            alert('Error: ' + responseData.error);
        }
    })
    .catch(err => {
        console.error('Error saving doctor:', err);
        alert('Error saving doctor: ' + err.message);
    });
}

function editDoctor(id) {
    showDoctorForm(id);
}

function deleteDoctor(id) {
    if (confirm('Are you sure you want to deactivate this doctor? The doctor will be removed from the active list.')) {
        fetch(`${API_BASE}/doctors/${id}`, {method: 'DELETE'})
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    alert('Doctor deactivated successfully');
                }
                loadDoctors(currentDoctorsPage); // Reload current page
            })
            .catch(err => alert('Error deactivating doctor: ' + err));
    }
}

// ==================== DOCTOR CHARGES MODULE ====================

let currentDoctorChargesPage = 1;
const doctorChargesPageLimit = 10;

function loadDoctorCharges(page = 1) {
    currentDoctorChargesPage = page;
    
    Promise.all([
        fetch(`${API_BASE}/doctor-charges?page=${page}&limit=${doctorChargesPageLimit}`).then(r => r.json()),
        fetch(`${API_BASE}/doctors?limit=1000`).then(r => r.json()),
        fetch(`${API_BASE}/charge-master?limit=1000`).then(r => r.json())
    ]).then(([chargesResponse, doctorsResponse, chargeMasterResponse]) => {
        // Handle response format
        const charges = chargesResponse.charges || [];
        const total = chargesResponse.total !== undefined ? chargesResponse.total : charges.length;
        const doctors = Array.isArray(doctorsResponse) ? doctorsResponse : (doctorsResponse.doctors || []);
        const chargeMaster = Array.isArray(chargeMasterResponse) ? chargeMasterResponse : (chargeMasterResponse.charges || []);
        
        const html = `
            <div class="module-content">
                <div class="module-header">
                    <h1>Doctor Charges</h1>
                    <button class="btn btn-primary" onclick="showDoctorChargeForm()">Add Doctor Charge</button>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Doctor</th>
                            <th>Charge Master</th>
                            <th>Amount</th>
                            <th>Payment Mode</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${charges.length > 0 ? charges.map(charge => `
                            <tr>
                                <td>${charge.doctor_name || ''}</td>
                                <td>${charge.charge_master_name || ''}</td>
                                <td>${charge.amount || ''}</td>
                                <td>${charge.payment_mode || ''}</td>
                                <td>
                                    <button class="btn btn-success" onclick="editDoctorCharge('${charge.id}')">Edit</button>
                                    <button class="btn btn-danger" onclick="deleteDoctorCharge('${charge.id}')">Delete</button>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" style="text-align: center;">No doctor charges found</td></tr>'}
                    </tbody>
                </table>
                <div class="pagination" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        ${currentDoctorChargesPage > 1 ? `<button class="btn btn-secondary" onclick="loadDoctorCharges(${currentDoctorChargesPage - 1})">Previous</button>` : ''}
                        <span style="margin: 0 15px;">Page ${currentDoctorChargesPage} of ${Math.ceil(total / doctorChargesPageLimit)}</span>
                        ${currentDoctorChargesPage < Math.ceil(total / doctorChargesPageLimit) ? `<button class="btn btn-secondary" onclick="loadDoctorCharges(${currentDoctorChargesPage + 1})">Next</button>` : ''}
                    </div>
                    <div style="color: #666;">Total: ${total} doctor charges</div>
                </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = html;
        window.doctorsList = doctors;
        window.chargeMasterList = chargeMaster;
        setTimeout(afterContentLoad, 0);
    }).catch(err => {
        console.error('Error loading doctor charges:', err);
        alert('Error loading doctor charges: ' + err.message);
    });
}

function showDoctorChargeForm(chargeId = null) {
    const title = chargeId ? 'Edit Doctor Charge' : 'Add Doctor Charge';
    const doctors = window.doctorsList || [];
    const chargeMaster = window.chargeMasterList || [];
    
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="doctorChargeForm" onsubmit="saveDoctorCharge(event, '${chargeId || ''}')">
                    <div class="form-group">
                        <label>Doctor</label>
                        <select name="doctor_id" required>
                            <option value="">Select Doctor</option>
                            ${doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Charge Master</label>
                        <select name="charge_master_id" required>
                            <option value="">Select Charge</option>
                            ${chargeMaster.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Amount</label>
                        <input type="number" name="amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Payment Mode</label>
                        <select name="payment_mode">
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" onclick="loadDoctorCharges()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
    
    if (chargeId) {
        fetch(`${API_BASE}/doctor-charges/${chargeId}`)
            .then(res => res.json())
            .then(charge => {
                Object.keys(charge).forEach(key => {
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input) input.value = charge[key] || '';
                });
            });
    }
}

function saveDoctorCharge(event, chargeId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    const url = chargeId ? `${API_BASE}/doctor-charges/${chargeId}` : `${API_BASE}/doctor-charges`;
    const method = chargeId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(() => loadDoctorCharges(currentDoctorChargesPage))
    .catch(err => alert('Error saving doctor charge: ' + err));
}

function editDoctorCharge(id) {
    showDoctorChargeForm(id);
}

function deleteDoctorCharge(id) {
    if (confirm('Are you sure you want to delete this doctor charge?')) {
        fetch(`${API_BASE}/doctor-charges/${id}`, {method: 'DELETE'})
            .then(() => loadDoctorCharges(currentDoctorChargesPage))
            .catch(err => alert('Error deleting doctor charge: ' + err));
    }
}

// ==================== PATIENTS MODULE ====================

let currentPatientsPage = 1;
const patientsPageLimit = 10;
let patientsSearchQuery = '';

function loadPatients(page = 1) {
    currentPatientsPage = page;
    const searchParam = patientsSearchQuery ? `&search=${encodeURIComponent(patientsSearchQuery)}` : '';
    
    fetch(`${API_BASE}/patients?page=${page}&limit=${patientsPageLimit}${searchParam}`)
        .then(res => res.json())
        .then(data => {
            // Handle response format
            const patients = Array.isArray(data.patients) ? data.patients : (Array.isArray(data) ? data : []);
            const total = data.total !== undefined ? data.total : (Array.isArray(patients) ? patients.length : 0);
            const totalPages = Math.max(1, Math.ceil(total / patientsPageLimit));
            
            const html = `
                <div class="module-content">
                    <div class="module-header">
                        <h1>Patients</h1>
                        <button class="btn btn-primary" onclick="showPatientForm()">Add Patient</button>
                    </div>
                    <div class="search-section" style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <input type="text" id="patientSearchInput" placeholder="Search by name, phone, email, or address" 
                               value="${patientsSearchQuery}" 
                               onkeyup="handlePatientSearch(event)" 
                               style="flex: 1; max-width: 400px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <button class="btn btn-primary" onclick="searchPatients()" style="padding: 8px 20px;">Search</button>
                        ${patientsSearchQuery ? `<button class="btn btn-secondary" onclick="clearPatientSearch()" style="padding: 8px 20px;">Clear</button>` : ''}
                    </div>
                    <div class="table-scroll-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.isArray(patients) && patients.length > 0 ? patients.map(patient => `
                                    <tr>
                                        <td>${patient.name || ''}</td>
                                        <td>${patient.age || ''}</td>
                                        <td>${patient.gender || ''}</td>
                                        <td>${patient.phone || ''}</td>
                                        <td>${patient.email || ''}</td>
                                        <td>
                                            <button class="btn btn-success" onclick="editPatient('${patient.id}')">Edit</button>
                                            <button class="btn btn-danger" onclick="deletePatient('${patient.id}')">Delete</button>
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="6" style="text-align: center;">No patients found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            ${currentPatientsPage > 1 ? `<button class="btn btn-secondary" onclick="loadPatients(${currentPatientsPage - 1})">Previous</button>` : '<span></span>'}
                            <span style="margin: 0 15px;">Page ${currentPatientsPage} of ${totalPages}</span>
                            ${currentPatientsPage < totalPages ? `<button class="btn btn-secondary" onclick="loadPatients(${currentPatientsPage + 1})">Next</button>` : '<span></span>'}
                        </div>
                        <div style="color: #666;">Total: ${total} patients</div>
                    </div>
                </div>
            `;
            document.getElementById('content-area').innerHTML = html;
            setTimeout(afterContentLoad, 0);
        })
        .catch(err => {
            console.error('Error loading patients:', err);
            alert('Error loading patients: ' + (err.message || err));
        });
}

function handlePatientSearch(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        searchPatients();
    }
}

function searchPatients() {
    const searchInput = document.getElementById('patientSearchInput');
    if (searchInput) {
        patientsSearchQuery = searchInput.value.trim();
        loadPatients(1); // Reset to first page when searching
    }
}

function clearPatientSearch() {
    patientsSearchQuery = '';
    loadPatients(1);
}

function showPatientForm(patientId = null) {
    const title = patientId ? 'Edit Patient' : 'Add Patient';
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="patientForm" onsubmit="savePatient(event, '${patientId || ''}')">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Age</label>
                        <input type="number" name="age">
                    </div>
                    <div class="form-group">
                        <label>Gender</label>
                        <select name="gender">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="text" name="phone">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea name="address"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Blood Group</label>
                        <input type="text" name="blood_group">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" onclick="loadPatients()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
    
    if (patientId) {
        fetch(`${API_BASE}/patients/${patientId}`)
            .then(res => res.json())
            .then(patient => {
                Object.keys(patient).forEach(key => {
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input) input.value = patient[key] || '';
                });
            });
    }
}

function savePatient(event, patientId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    const url = patientId ? `${API_BASE}/patients/${patientId}` : `${API_BASE}/patients`;
    const method = patientId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(() => loadPatients(currentPatientsPage))
    .catch(err => alert('Error saving patient: ' + err));
}

function editPatient(id) {
    showPatientForm(id);
}

function deletePatient(id) {
    if (confirm('Are you sure you want to delete this patient?')) {
        fetch(`${API_BASE}/patients/${id}`, {method: 'DELETE'})
            .then(() => loadPatients(currentPatientsPage))
            .catch(err => alert('Error deleting patient: ' + err));
    }
}

// ==================== CASES MODULE ====================

let currentCasesPage = 1;
const casesPageLimit = 10;
let casesSearchQuery = '';

function loadCases(page = 1) {
    currentCasesPage = page;
    const searchParam = casesSearchQuery ? `&search=${encodeURIComponent(casesSearchQuery)}` : '';
    
    fetch(`${API_BASE}/cases?page=${page}&limit=${casesPageLimit}${searchParam}`)
        .then(res => res.json())
        .then(data => {
            // Handle response format
            const cases = Array.isArray(data.cases) ? data.cases : (Array.isArray(data) ? data : []);
            const total = data.total !== undefined ? data.total : (Array.isArray(cases) ? cases.length : 0);
            const totalPages = Math.max(1, Math.ceil(total / casesPageLimit));
            
            const html = `
                <div class="module-content">
                    <div class="module-header">
                        <h1>Cases</h1>
                        <button class="btn btn-primary" onclick="showCaseForm()">Add Case</button>
                    </div>
                    <div class="search-section" style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <input type="text" id="caseSearchInput" placeholder="Search by case number, patient name, phone, or email" 
                               value="${casesSearchQuery}" 
                               onkeyup="handleCaseSearch(event)" 
                               style="flex: 1; max-width: 400px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <button class="btn btn-primary" onclick="searchCases()" style="padding: 8px 20px;">Search</button>
                        ${casesSearchQuery ? `<button class="btn btn-secondary" onclick="clearCaseSearch()" style="padding: 8px 20px;">Clear</button>` : ''}
                    </div>
                    <div class="table-scroll-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Case Number</th>
                                    <th>Patient</th>
                                    <th>Case Type</th>
                                    <th>Admission Date</th>
                                    <th>Appointments</th>
                                    <th>Charges Count</th>
                                    <th>Total Charges</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.isArray(cases) && cases.length > 0 ? cases.map(c => {
                                    const appointments = c.appointments || [];
                                    const appointmentsCount = c.appointments_count || 0;
                                    const nextAptDate = c.next_appointment_date;
                                    const nextAptTime = c.next_appointment_time;
                                    const nextAptDoctor = c.next_appointment_doctor || '';
                                    
                                    let appointmentsDisplay = '';
                                    if (appointmentsCount > 0) {
                                        if (nextAptDate) {
                                            const aptDate = new Date(nextAptDate).toLocaleDateString();
                                            appointmentsDisplay = `<div style="font-size: 12px;">
                                                <div><strong>${appointmentsCount} appointment${appointmentsCount > 1 ? 's' : ''}</strong></div>
                                                <div style="color: #2563eb; margin-top: 4px;">
                                                    Next: ${aptDate} ${nextAptTime || ''}
                                                    ${nextAptDoctor ? `<br/>Dr. ${nextAptDoctor}` : ''}
                                                </div>
                                            </div>`;
                                        } else {
                                            appointmentsDisplay = `<div style="font-size: 12px;"><strong>${appointmentsCount} appointment${appointmentsCount > 1 ? 's' : ''}</strong></div>`;
                                        }
                                    } else {
                                        appointmentsDisplay = '<span style="color: #999;">No appointments</span>';
                                    }
                                    
                                    return `
                                    <tr>
                                        <td>${c.case_number || ''}</td>
                                        <td>${c.patient_name || ''}</td>
                                        <td>${c.case_type || ''}</td>
                                        <td>${c.admission_date ? new Date(c.admission_date).toLocaleDateString() : ''}</td>
                                        <td>${appointmentsDisplay}</td>
                                        <td>${c.charges_count || 0}</td>
                                        <td>${(c.charges_total || 0).toFixed(2)}</td>
                                        <td>
                                            <button class="btn btn-success" onclick="viewCaseDetails('${c.id}')">View</button>
                                            <button class="btn btn-primary" onclick="editCase('${c.id}')">Edit</button>
                                        </td>
                                    </tr>
                                `;
                                }).join('') : '<tr><td colspan="8" style="text-align: center;">No cases found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            ${currentCasesPage > 1 ? `<button class="btn btn-secondary" onclick="loadCases(${currentCasesPage - 1})">Previous</button>` : '<span></span>'}
                            <span style="margin: 0 15px;">Page ${currentCasesPage} of ${totalPages}</span>
                            ${currentCasesPage < totalPages ? `<button class="btn btn-secondary" onclick="loadCases(${currentCasesPage + 1})">Next</button>` : '<span></span>'}
                        </div>
                        <div style="color: #666;">Total: ${total} cases</div>
                    </div>
                </div>
            `;
            document.getElementById('content-area').innerHTML = html;
            setTimeout(afterContentLoad, 0);
        })
        .catch(err => {
            console.error('Error loading cases:', err);
            alert('Error loading cases: ' + (err.message || err));
        });
}

function handleCaseSearch(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        searchCases();
    }
}

function searchCases() {
    const searchInput = document.getElementById('caseSearchInput');
    if (searchInput) {
        casesSearchQuery = searchInput.value.trim();
        loadCases(1); // Reset to first page when searching
    }
}

function clearCaseSearch() {
    casesSearchQuery = '';
    loadCases(1);
}

let patientSearchTimeoutCase = null;
let selectedPatientNameCase = '';

function showCaseForm(caseId = null) {
    const title = caseId ? 'Edit Case' : 'Add Case';
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="caseForm" onsubmit="saveCase(event, '${caseId || ''}')">
                    <div class="form-group">
                        <label>Patient *</label>
                        <input type="hidden" name="patient_id" id="casePatientIdInput" required>
                        <input type="text" id="casePatientSearchInput" placeholder="Search patient by name..." 
                               autocomplete="off" oninput="searchPatientsForCase(event)">
                        <div id="casePatientSearchResults" style="display: none; position: absolute; z-index: 1000; background: white; border: 1px solid #ddd; max-height: 200px; overflow-y: auto; width: 100%; margin-top: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>
                    </div>
                        <div class="form-group">
                            <label>Case Type</label>
                            <select name="case_type" required>
                                <option value="OPD">OPD</option>
                                <option value="IPD">IPD</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Admission Date</label>
                            <input type="date" name="admission_date">
                        </div>
                        <div class="form-group">
                            <label>Discharge Date</label>
                            <input type="date" name="discharge_date">
                        </div>
                        <div class="form-group">
                            <label>Diagnosis</label>
                            <textarea name="diagnosis"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save</button>
                            <button type="button" class="btn btn-secondary" onclick="loadCases(currentCasesPage)">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = html;
        
        if (caseId) {
            fetch(`${API_BASE}/cases/${caseId}`)
                .then(res => res.json())
                .then(c => {
                    Object.keys(c).forEach(key => {
                        const input = document.querySelector(`[name="${key}"]`);
                        if (input) {
                            if (key.includes('date') && c[key]) {
                                input.value = c[key].split('T')[0];
                            } else {
                                input.value = c[key] || '';
                            }
                        }
                    });
                    
                    // Populate patient search field
                    if (c.patient_id) {
                        const patientIdInput = document.getElementById('casePatientIdInput');
                        const patientSearchInput = document.getElementById('casePatientSearchInput');
                        if (patientIdInput) patientIdInput.value = c.patient_id;
                        if (patientSearchInput && c.patient) {
                            patientSearchInput.value = c.patient.name || '';
                            selectedPatientNameCase = c.patient.name || '';
                        } else if (patientSearchInput && c.patient_id) {
                            // Fetch patient name
                            fetch(`${API_BASE}/patients/${c.patient_id}`)
                                .then(r => r.json())
                                .then(patient => {
                                    if (patientSearchInput) {
                                        patientSearchInput.value = patient.name || '';
                                        selectedPatientNameCase = patient.name || '';
                                    }
                                });
                        }
                    }
                });
        }
}

function searchPatientsForCase(event) {
    const searchInput = document.getElementById('casePatientSearchInput');
    const resultsDiv = document.getElementById('casePatientSearchResults');
    const patientIdInput = document.getElementById('casePatientIdInput');
    
    if (!searchInput || !resultsDiv) return;
    
    const query = searchInput.value.trim();
    
    // Clear previous timeout
    if (patientSearchTimeoutCase) {
        clearTimeout(patientSearchTimeoutCase);
    }
    
    // If query is empty, hide results and clear selection
    if (!query) {
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
        if (patientIdInput) patientIdInput.value = '';
        selectedPatientNameCase = '';
        return;
    }
    
    // If query matches selected patient, don't search
    if (query === selectedPatientNameCase) {
        resultsDiv.style.display = 'none';
        return;
    }
    
    // Debounce search
    patientSearchTimeoutCase = setTimeout(() => {
        fetch(`${API_BASE}/patients?search=${encodeURIComponent(query)}&limit=20`)
            .then(res => res.json())
            .then(data => {
                const patients = Array.isArray(data) ? data : (data.patients || []);
                
                if (patients.length === 0) {
                    resultsDiv.innerHTML = '<div style="padding: 10px; color: #666;">No patients found</div>';
                    resultsDiv.style.display = 'block';
                    return;
                }
                
                resultsDiv.innerHTML = patients.map(patient => `
                    <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;" 
                         onmouseover="this.style.backgroundColor='#f0f0f0'" 
                         onmouseout="this.style.backgroundColor='white'"
                         onclick="selectPatientForCase('${patient.id}', '${(patient.name || '').replace(/'/g, "\\'")}')">
                        <strong>${patient.name || ''}</strong>
                        ${patient.phone ? `<br/><small style="color: #666;">${patient.phone}</small>` : ''}
                        ${patient.email ? `<br/><small style="color: #666;">${patient.email}</small>` : ''}
                    </div>
                `).join('');
                resultsDiv.style.display = 'block';
            })
            .catch(err => {
                console.error('Error searching patients:', err);
                resultsDiv.innerHTML = '<div style="padding: 10px; color: #d32f2f;">Error searching patients</div>';
                resultsDiv.style.display = 'block';
            });
    }, 300);
}

function selectPatientForCase(patientId, patientName) {
    const patientIdInput = document.getElementById('casePatientIdInput');
    const patientSearchInput = document.getElementById('casePatientSearchInput');
    const resultsDiv = document.getElementById('casePatientSearchResults');
    
    if (patientIdInput) patientIdInput.value = patientId;
    if (patientSearchInput) {
        patientSearchInput.value = patientName;
        selectedPatientNameCase = patientName;
    }
    if (resultsDiv) {
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
    }
    
    // Clear search timeout
    if (patientSearchTimeoutCase) {
        clearTimeout(patientSearchTimeoutCase);
        patientSearchTimeoutCase = null;
    }
}

function saveCase(event, caseId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    const url = caseId ? `${API_BASE}/cases/${caseId}` : `${API_BASE}/cases`;
    const method = caseId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(() => loadCases(currentCasesPage))
    .catch(err => alert('Error saving case: ' + err));
}

function viewCaseDetails(caseId) {
    fetch(`${API_BASE}/cases/${caseId}`)
        .then(res => res.json())
        .then(caseData => {
            const patientCharges = caseData.charges || [];
            const appointments = caseData.appointments || [];
            
            const patientChargesTotal = patientCharges.reduce((sum, c) => sum + (c.total_amount || 0), 0);
            
            const html = `
                <div class="module-content">
                    <div class="module-header">
                        <h1>Case Details: ${caseData.case_number || ''}</h1>
                        <button class="btn btn-secondary" onclick="loadCases(currentCasesPage)">Back</button>
                    </div>
                    <div class="case-details-container">
                        <div class="case-info">
                            <h3>Case Information</h3>
                            <p><strong>Patient:</strong> ${caseData.patient?.name || ''}</p>
                            <p><strong>Case Type:</strong> ${caseData.case_type || ''}</p>
                            <p><strong>Admission Date:</strong> ${caseData.admission_date ? new Date(caseData.admission_date).toLocaleDateString() : ''}</p>
                            ${caseData.discharge_date ? `<p><strong>Discharge Date:</strong> ${new Date(caseData.discharge_date).toLocaleDateString()}</p>` : ''}
                            ${caseData.diagnosis ? `<p><strong>Diagnosis:</strong> ${caseData.diagnosis}</p>` : ''}
                        </div>
                        ${appointments.length > 0 ? `
                        <div class="case-appointments-section" style="margin-bottom: 24px;">
                            <h3>Appointments</h3>
                            <div class="table-scroll-container" style="margin-top: 16px;">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Doctor</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${appointments.map(apt => `
                                            <tr>
                                                <td>${apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : ''}</td>
                                                <td>${apt.appointment_time || ''}</td>
                                                <td>${apt.doctor_name || ''}</td>
                                                <td>${apt.status || ''}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        ` : ''}
                        <div class="case-charges-section">
                            <h3>Patient Charges</h3>
                            <button class="btn btn-primary" onclick="showCaseChargeForm('${caseId}')">Add Patient Charge</button>
                            <div class="table-scroll-container" style="margin-top: 16px;">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Charge Name</th>
                                            <th>Doctor Name</th>
                                            <th>Quantity</th>
                                            <th>Unit Amount</th>
                                            <th>Total Amount</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${patientCharges.length > 0 ? patientCharges.map(c => {
                                            const chargeName = (c.charge_name || '').toUpperCase();
                                            const showDoctor = chargeName.includes('OPD CHARGE') || 
                                                              chargeName.includes('IPD VISIT CHARGE') ||
                                                              chargeName === 'SURGERY' ||
                                                              chargeName.includes('SURGERY');
                                            const doctorName = showDoctor ? (c.doctor_name || '') : '';
                                            const chargeDate = c.created_at ? new Date(c.created_at).toLocaleDateString() : '';
                                            return `
                                            <tr>
                                                <td>${chargeDate}</td>
                                                <td>${c.charge_name || ''}</td>
                                                <td>${doctorName}</td>
                                                <td>${c.quantity || ''}</td>
                                                <td>${c.unit_amount || ''}</td>
                                                <td>${c.total_amount || ''}</td>
                                                <td>
                                                    <button class="btn btn-success" onclick="editCaseCharge('${c.id}', '${caseId}')">Edit</button>
                                                    <button class="btn btn-danger" onclick="deleteCaseCharge('${c.id}', '${caseId}')">Delete</button>
                                                </td>
                                            </tr>
                                        `;
                                        }).join('') : '<tr><td colspan="7" style="text-align: center;">No patient charges found</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                            <p style="margin-top: 16px;"><strong>Total Patient Charges: ${patientChargesTotal}</strong></p>
                        </div>
                        <div class="case-prescriptions-section" style="margin-top: 24px;">
                            <h3>Prescriptions</h3>
                            <button class="btn btn-primary" onclick="showPrescriptionUploadForm('${caseId}')">Upload Prescription</button>
                            <div class="table-scroll-container" style="margin-top: 16px;">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>File Name</th>
                                            <th>Doctor</th>
                                            <th>Notes</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${(caseData.prescriptions || []).length > 0 ? caseData.prescriptions.map(pres => {
                                            const presDate = pres.prescription_date ? new Date(pres.prescription_date).toLocaleDateString() : '';
                                            return `
                                            <tr>
                                                <td>${presDate}</td>
                                                <td>${pres.file_name || 'N/A'}</td>
                                                <td>${pres.doctor_name || ''}</td>
                                                <td>${pres.notes || ''}</td>
                                                <td>
                                                    ${pres.file_path ? `<a href="${pres.file_path}" target="_blank" class="btn btn-success" style="text-decoration: none; display: inline-block; padding: 4px 12px;">View</a>` : ''}
                                                    <button class="btn btn-danger" onclick="deleteCasePrescription('${pres.id}', '${caseId}')">Delete</button>
                                                </td>
                                            </tr>
                                        `;
                                        }).join('') : '<tr><td colspan="5" style="text-align: center;">No prescriptions found</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('content-area').innerHTML = html;
            window.currentCaseId = caseId;
            setTimeout(afterContentLoad, 0);
        })
        .catch(err => {
            console.error('Error loading case details:', err);
            alert('Error loading case details: ' + (err.message || err));
        });
}

function showCaseChargeForm(caseId, chargeId = null) {
    Promise.all([
        fetch(`${API_BASE}/charge-master?limit=1000`).then(r => r.json())
    ]).then(([chargeMasterResponse]) => {
        // Handle response format - API returns {charges: [...], total: ...} or array
        const chargeMaster = Array.isArray(chargeMasterResponse) 
            ? chargeMasterResponse 
            : (chargeMasterResponse.charges || []);
        
        const title = chargeId ? 'Edit Patient Charge' : 'Add Patient Charge';
        const html = `
            <div class="modal">
                <div class="modal-content">
                    <h2>${title}</h2>
                    <form id="caseChargeForm" onsubmit="saveCaseCharge(event, '${caseId}', '${chargeId || ''}')">
                        <input type="hidden" name="case_id" value="${caseId}">
                        <div class="form-group">
                            <label>Charge Master</label>
                            <select name="charge_master_id" id="chargeMasterSelect" onchange="updateChargeAmount()" required>
                                <option value="">Select Charge</option>
                                ${Array.isArray(chargeMaster) && chargeMaster.length > 0 ? chargeMaster.map(c => `<option value="${c.id}" data-amount="${c.amount || 0}">${c.name}</option>`).join('') : ''}
                            </select>
                        </div>
                        <div class="form-group" id="doctorSelectGroup" style="display: none;">
                            <label>Doctor <span style="color: #666; font-size: 12px;">(Required for OPD/IPD/Surgery charges)</span></label>
                            <select name="doctor_id" id="doctorSelect">
                                <option value="">Select Doctor</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quantity</label>
                            <input type="number" name="quantity" id="quantityInput" value="1" min="1" onchange="calculateTotal()" required>
                        </div>
                        <div class="form-group">
                            <label>Unit Amount</label>
                            <input type="number" name="unit_amount" id="unitAmountInput" step="0.01" readonly required>
                        </div>
                        <div class="form-group">
                            <label>Total Amount</label>
                            <input type="number" name="total_amount" id="totalAmountInput" step="0.01" readonly>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save</button>
                            <button type="button" class="btn btn-secondary" onclick="viewCaseDetails('${caseId}')">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = html;
        
        if (chargeId) {
            Promise.all([
                fetch(`${API_BASE}/case-charges/${chargeId}`).then(r => r.json()),
                fetch(`${API_BASE}/charge-master?limit=1000`).then(r => r.json())
            ]).then(([charge, chargeMasterResponse]) => {
                // Populate form fields
                Object.keys(charge).forEach(key => {
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (key === 'doctor_id' && charge.doctor_id) {
                            // Doctor will be populated after charge master is selected
                            input.value = charge[key] || '';
                        } else {
                            input.value = charge[key] || '';
                        }
                    }
                });
                
                // Set charge master and trigger update
                const chargeMasterSelect = document.getElementById('chargeMasterSelect');
                if (chargeMasterSelect && charge.charge_master_id) {
                    chargeMasterSelect.value = charge.charge_master_id;
                    updateChargeAmount();
                    
                    // After doctors are loaded, set the selected doctor
                    setTimeout(() => {
                        const doctorSelect = document.getElementById('doctorSelect');
                        if (doctorSelect && charge.doctor_id) {
                            doctorSelect.value = charge.doctor_id;
                        }
                    }, 500);
                } else {
                    calculateTotal();
                }
            });
        }
    });
}

function updateChargeAmount() {
    const select = document.getElementById('chargeMasterSelect');
    const unitAmountInput = document.getElementById('unitAmountInput');
    const doctorGroup = document.getElementById('doctorSelectGroup');
    const doctorSelect = document.getElementById('doctorSelect');
    
    if (select && unitAmountInput && select.selectedIndex > 0) {
        const amount = select.options[select.selectedIndex].getAttribute('data-amount');
        const chargeName = select.options[select.selectedIndex].text.trim().toUpperCase();
        const chargeId = select.value;
        
        unitAmountInput.value = amount;
        calculateTotal();
        
        // Check if charge is OPD Charge, IPD DOCTOR VISIT, or SURGERY (case-insensitive)
        const chargeNameUpper = chargeName.toUpperCase();
        const showDoctorSelect = chargeNameUpper.includes('OPD CHARGE') || 
                                 chargeNameUpper.includes('IPD DOCTOR VISIT') ||
                                 chargeNameUpper === 'SURGERY' ||
                                 chargeNameUpper.includes('SURGERY');
        
        if (showDoctorSelect && chargeId) {
            // Show doctor select and fetch doctors
            if (doctorGroup) {
                doctorGroup.style.display = 'block';
                if (doctorSelect) {
                    doctorSelect.innerHTML = '<option value="">Loading doctors...</option>';
                }
                
                // Fetch doctors for this charge
                fetch(`${API_BASE}/doctors-by-charge?charge_master_id=${chargeId}`)
                    .then(res => res.json())
                    .then(doctors => {
                        if (doctorSelect && Array.isArray(doctors)) {
                            if (doctors.length > 0) {
                                doctorSelect.innerHTML = '<option value="">Select Doctor</option>' +
                                    doctors.map(d => `<option value="${d.id}">${d.name || ''}</option>`).join('');
                            } else {
                                doctorSelect.innerHTML = '<option value="">No doctors available for this charge</option>';
                            }
                        }
                    })
                    .catch(err => {
                        console.error('Error loading doctors:', err);
                        if (doctorSelect) {
                            doctorSelect.innerHTML = '<option value="">Error loading doctors</option>';
                        }
                    });
            }
        } else {
            // Hide doctor select
            if (doctorGroup) {
                doctorGroup.style.display = 'none';
            }
            if (doctorSelect) {
                doctorSelect.value = '';
            }
        }
    } else {
        // Hide doctor select if no charge selected
        if (doctorGroup) {
            doctorGroup.style.display = 'none';
        }
        if (doctorSelect) {
            doctorSelect.value = '';
        }
    }
}

function calculateTotal() {
    const quantity = parseFloat(document.getElementById('quantityInput')?.value || 1);
    const unitAmount = parseFloat(document.getElementById('unitAmountInput')?.value || 0);
    const totalInput = document.getElementById('totalAmountInput');
    if (totalInput) {
        totalInput.value = (quantity * unitAmount).toFixed(2);
    }
}

function saveCaseCharge(event, caseId, chargeId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    data.case_id = caseId;
    
    // Convert quantity and amounts to numbers
    if (data.quantity) {
        data.quantity = parseInt(data.quantity);
    }
    if (data.unit_amount) {
        data.unit_amount = parseFloat(data.unit_amount);
    }
    if (data.total_amount) {
        data.total_amount = parseFloat(data.total_amount);
    }
    
    // Remove empty doctor_id if not required
    if (data.doctor_id === '' || !data.doctor_id) {
        delete data.doctor_id;
    }
    
    const url = chargeId ? `${API_BASE}/case-charges/${chargeId}` : `${API_BASE}/case-charges`;
    const method = chargeId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.error || 'Failed to save charge'); });
        }
        return res.json();
    })
    .then(() => {
        alert('Case charge saved successfully');
        viewCaseDetails(caseId);
    })
    .catch(err => {
        console.error('Error saving case charge:', err);
        alert('Error saving case charge: ' + (err.message || err));
    });
}

function editCaseCharge(id, caseId) {
    showCaseChargeForm(caseId, id);
}

function deleteCaseCharge(id, caseId) {
    if (confirm('Are you sure you want to delete this charge?')) {
        fetch(`${API_BASE}/case-charges/${id}`, {method: 'DELETE'})
            .then(() => viewCaseDetails(caseId))
            .catch(err => alert('Error deleting charge: ' + err));
    }
}

function showCaseDoctorChargeForm(caseId, chargeId = null) {
    fetch(`${API_BASE}/doctors`).then(r => r.json()).then(doctors => {
        const title = chargeId ? 'Edit Doctor Charge' : 'Add Doctor Charge';
        const html = `
            <div class="modal">
                <div class="modal-content">
                    <h2>${title}</h2>
                    <form id="caseDoctorChargeForm" onsubmit="saveCaseDoctorCharge(event, '${caseId}', '${chargeId || ''}')">
                        <input type="hidden" name="case_id" value="${caseId}">
                        <div class="form-group">
                            <label>Doctor</label>
                            <select name="doctor_id" required>
                                <option value="">Select Doctor</option>
                                ${doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Amount</label>
                            <input type="number" name="amount" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>Charge Date</label>
                            <input type="date" name="charge_date">
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea name="notes"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save</button>
                            <button type="button" class="btn btn-secondary" onclick="viewCaseDetails('${caseId}')">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = html;
        
        if (chargeId) {
            fetch(`${API_BASE}/case-doctor-charges/${chargeId}`)
                .then(res => res.json())
                .then(charge => {
                    Object.keys(charge).forEach(key => {
                        const input = document.querySelector(`[name="${key}"]`);
                        if (input) {
                            if (key.includes('date') && charge[key]) {
                                input.value = charge[key].split('T')[0];
                            } else {
                                input.value = charge[key] || '';
                            }
                        }
                    });
                });
        }
    });
}

function saveCaseDoctorCharge(event, caseId, chargeId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    data.case_id = caseId;
    
    const url = chargeId ? `${API_BASE}/case-doctor-charges/${chargeId}` : `${API_BASE}/case-doctor-charges`;
    const method = chargeId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(() => viewCaseDetails(caseId))
    .catch(err => alert('Error saving doctor charge: ' + err));
}

function editCaseDoctorCharge(id, caseId) {
    showCaseDoctorChargeForm(caseId, id);
}

function deleteCaseDoctorCharge(id, caseId) {
    if (confirm('Are you sure you want to delete this doctor charge?')) {
        fetch(`${API_BASE}/case-doctor-charges/${id}`, {method: 'DELETE'})
            .then(() => viewCaseDetails(caseId))
            .catch(err => alert('Error deleting doctor charge: ' + err));
    }
}

function editCase(id) {
    showCaseForm(id);
}

function deleteCase(id) {
    if (confirm('Are you sure you want to delete this case?')) {
        fetch(`${API_BASE}/cases/${id}`, {method: 'DELETE'})
            .then(() => loadCases(currentCasesPage))
            .catch(err => alert('Error deleting case: ' + err));
    }
}

// ==================== APPOINTMENTS MODULE ====================

let currentAppointmentsPage = 1;
const appointmentsPageLimit = 10;

function loadAppointments(page = 1) {
    currentAppointmentsPage = page;
    
    fetch(`${API_BASE}/appointments?page=${page}&limit=${appointmentsPageLimit}`)
        .then(res => res.json())
        .then(data => {
            const appointments = data.appointments || data;
            const total = data.total !== undefined ? data.total : (Array.isArray(appointments) ? appointments.length : 0);
            
            const html = `
                <div class="module-content">
                    <div class="module-header">
                        <h1>Appointments</h1>
                        <button class="btn btn-primary" onclick="showAppointmentForm()">Add Appointment</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.isArray(appointments) && appointments.length > 0 ? appointments.map(apt => `
                                <tr>
                                    <td>${apt.patient_name || ''}</td>
                                    <td>${apt.doctor_name || ''}</td>
                                    <td>${apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : ''}</td>
                                    <td>${apt.appointment_time || ''}</td>
                                    <td>${apt.status || ''}</td>
                                    <td>
                                        <button class="btn btn-success" onclick="editAppointment('${apt.id}')">Edit</button>
                                        <button class="btn btn-danger" onclick="deleteAppointment('${apt.id}')">Delete</button>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="6" style="text-align: center;">No appointments found</td></tr>'}
                        </tbody>
                    </table>
                    <div class="pagination" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            ${currentAppointmentsPage > 1 ? `<button class="btn btn-secondary" onclick="loadAppointments(${currentAppointmentsPage - 1})">Previous</button>` : ''}
                            <span style="margin: 0 15px;">Page ${currentAppointmentsPage} of ${Math.ceil(total / appointmentsPageLimit)}</span>
                            ${currentAppointmentsPage < Math.ceil(total / appointmentsPageLimit) ? `<button class="btn btn-secondary" onclick="loadAppointments(${currentAppointmentsPage + 1})">Next</button>` : ''}
                        </div>
                        <div style="color: #666;">Total: ${total} appointments</div>
                    </div>
                </div>
            `;
            document.getElementById('content-area').innerHTML = html;
            setTimeout(afterContentLoad, 0);
        })
        .catch(err => console.error('Error loading appointments:', err));
}

let patientSearchTimeout = null;
let selectedPatientName = '';

function showAppointmentForm(appointmentId = null) {
    Promise.all([
        fetch(`${API_BASE}/doctors?limit=1000`).then(r => r.json())
    ]).then(([doctorsResponse]) => {
        const doctors = Array.isArray(doctorsResponse) ? doctorsResponse : (doctorsResponse.doctors || []);
        
        const title = appointmentId ? 'Edit Appointment' : 'Add Appointment';
        const html = `
            <div class="modal">
                <div class="modal-content">
                    <h2>${title}</h2>
                    <form id="appointmentForm" onsubmit="saveAppointment(event, '${appointmentId || ''}')">
                        <div class="form-group">
                            <label>Patient <span style="color: red;">*</span></label>
                            <input type="hidden" name="patient_id" id="patientIdInput" required>
                            <input type="text" id="patientSearchInput" placeholder="Type patient name to search..." 
                                   onkeyup="searchPatientsForAppointment(event)" 
                                   onfocus="searchPatientsForAppointment(event)"
                                   autocomplete="off"
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <div id="patientSearchResults" style="position: relative; width: 100%;"></div>
                        </div>
                        <div class="form-group">
                            <label>Case <span style="color: #666; font-size: 12px;">(Optional)</span></label>
                            <input type="text" id="caseSearchInput" placeholder="Search cases by case number..." 
                                   onkeyup="filterCases()" 
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
                            <select name="case_id" id="caseSelect" size="5" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="">Select Case</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Doctor <span style="color: #666; font-size: 12px;">(Optional)</span></label>
                            <select name="doctor_id" id="doctorSelect">
                                <option value="">Select Doctor</option>
                                ${doctors.map(d => `<option value="${d.id}">${d.name || ''}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Appointment Date</label>
                            <input type="date" name="appointment_date" required>
                        </div>
                        <div class="form-group">
                            <label>Appointment Time</label>
                            <input type="time" name="appointment_time" required>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select name="status">
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save</button>
                            <button type="button" class="btn btn-secondary" onclick="loadAppointments()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = html;
        
        if (appointmentId) {
            Promise.all([
                fetch(`${API_BASE}/appointments/${appointmentId}`).then(r => r.json()),
                fetch(`${API_BASE}/cases?limit=1000`).then(r => r.json())
            ]).then(([apt, casesResponse]) => {
                const cases = Array.isArray(casesResponse) ? casesResponse : (casesResponse.cases || []);
                
                // Populate form fields
                Object.keys(apt).forEach(key => {
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input && key !== 'patient_id') {
                        if (key.includes('date') && apt[key]) {
                            input.value = apt[key].split('T')[0];
                        } else if (key.includes('time') && apt[key]) {
                            input.value = apt[key].split('T')[1]?.split('.')[0] || apt[key];
                        } else {
                            input.value = apt[key] || '';
                        }
                    }
                });
                
                // Populate patient search field
                if (apt.patient_id) {
                    const patientIdInput = document.getElementById('patientIdInput');
                    const patientSearchInput = document.getElementById('patientSearchInput');
                    if (patientIdInput) patientIdInput.value = apt.patient_id;
                    if (patientSearchInput) {
                        // Fetch patient name
                        fetch(`${API_BASE}/patients/${apt.patient_id}`)
                            .then(r => r.json())
                            .then(patient => {
                                if (patientSearchInput) {
                                    patientSearchInput.value = patient.name || '';
                                    selectedPatientName = patient.name || '';
                                }
                            });
                    }
                    // Load cases for selected patient
                    loadCasesForPatient(apt.patient_id, apt.case_id, cases);
                }
            });
        }
    });
}

let allPatientCases = []; // Store all cases for the selected patient

function searchPatientsForAppointment(event) {
    const searchInput = document.getElementById('patientSearchInput');
    const resultsDiv = document.getElementById('patientSearchResults');
    const patientIdInput = document.getElementById('patientIdInput');
    
    if (!searchInput || !resultsDiv) return;
    
    const searchTerm = searchInput.value.trim();
    
    // Clear previous timeout
    if (patientSearchTimeout) {
        clearTimeout(patientSearchTimeout);
    }
    
    // If search is empty, clear results and selected patient
    if (searchTerm === '') {
        resultsDiv.innerHTML = '';
        if (patientIdInput) patientIdInput.value = '';
        selectedPatientName = '';
        // Clear cases dropdown
        const caseSelect = document.getElementById('caseSelect');
        if (caseSelect) {
            caseSelect.innerHTML = '<option value="">Select Case</option>';
            allPatientCases = [];
        }
        return;
    }
    
    // Debounce API call
    patientSearchTimeout = setTimeout(() => {
        fetch(`${API_BASE}/patients?search=${encodeURIComponent(searchTerm)}&limit=20`)
            .then(r => r.json())
            .then(data => {
                const patients = Array.isArray(data) ? data : (data.patients || []);
                
                if (patients.length === 0) {
                    resultsDiv.innerHTML = '<div style="border: 1px solid #ddd; border-top: none; background: white; padding: 8px; border-radius: 0 0 4px 4px; max-height: 200px; overflow-y: auto;"><div style="padding: 8px; color: #666;">No patients found</div></div>';
                    return;
                }
                
                const html = `
                    <div style="position: absolute; width: 100%; border: 1px solid #ddd; border-top: none; background: white; z-index: 1000; border-radius: 0 0 4px 4px; max-height: 200px; overflow-y: auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        ${patients.map(p => `
                            <div onclick="selectPatientForAppointment('${p.id}', '${(p.name || '').replace(/'/g, "\\'")}')" 
                                 style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;" 
                                 onmouseover="this.style.backgroundColor='#f5f5f5'" 
                                 onmouseout="this.style.backgroundColor='white'">
                                <div style="font-weight: 500;">${p.name || ''}</div>
                                ${p.phone ? `<div style="font-size: 12px; color: #666; margin-top: 2px;">${p.phone}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
                resultsDiv.innerHTML = html;
            })
            .catch(err => {
                console.error('Error searching patients:', err);
                resultsDiv.innerHTML = '<div style="border: 1px solid #ddd; border-top: none; background: white; padding: 8px; border-radius: 0 0 4px 4px;"><div style="padding: 8px; color: #d32f2f;">Error searching patients</div></div>';
            });
    }, 300); // 300ms debounce
}

function selectPatientForAppointment(patientId, patientName) {
    const searchInput = document.getElementById('patientSearchInput');
    const resultsDiv = document.getElementById('patientSearchResults');
    const patientIdInput = document.getElementById('patientIdInput');
    
    if (searchInput) searchInput.value = patientName;
    if (patientIdInput) patientIdInput.value = patientId;
    if (resultsDiv) resultsDiv.innerHTML = '';
    selectedPatientName = patientName;
    
    // Clear search timeout
    if (patientSearchTimeout) {
        clearTimeout(patientSearchTimeout);
        patientSearchTimeout = null;
    }
    
    // Load cases for selected patient
    loadCasesForPatient(patientId);
}

// Close patient search results when clicking outside
document.addEventListener('click', function(event) {
    const searchInput = document.getElementById('patientSearchInput');
    const resultsDiv = document.getElementById('patientSearchResults');
    const caseSearchInput = document.getElementById('casePatientSearchInput');
    const caseResultsDiv = document.getElementById('casePatientSearchResults');
    
    // Close appointment patient search results
    if (searchInput && resultsDiv && 
        !searchInput.contains(event.target) && 
        !resultsDiv.contains(event.target)) {
        // Small delay to allow click events on results to fire first
        setTimeout(() => {
            if (resultsDiv) {
                const currentHtml = resultsDiv.innerHTML;
                // Only clear if it's still showing results (not empty)
                if (currentHtml && currentHtml.trim() !== '') {
                    // Don't clear if patient is selected
                    const patientIdInput = document.getElementById('patientIdInput');
                    if (!patientIdInput || !patientIdInput.value) {
                        resultsDiv.innerHTML = '';
                    }
                }
            }
        }, 200);
    }
    
    // Close case patient search results
    if (caseSearchInput && caseResultsDiv && 
        !caseSearchInput.contains(event.target) && 
        !caseResultsDiv.contains(event.target)) {
        setTimeout(() => {
            if (caseResultsDiv) {
                caseResultsDiv.style.display = 'none';
            }
        }, 200);
    }
});

function loadCasesForPatient(selectedPatientId = null, selectedCaseId = null, allCases = null) {
    const caseSelect = document.getElementById('caseSelect');
    const caseSearchInput = document.getElementById('caseSearchInput');
    const patientIdInput = document.getElementById('patientIdInput');
    
    if (!caseSelect) return;
    
    const patientId = selectedPatientId || patientIdInput?.value;
    if (!patientId) {
        caseSelect.innerHTML = '<option value="">Select Case</option>';
        allPatientCases = [];
        if (caseSearchInput) caseSearchInput.value = '';
        return;
    }
    
    // Load cases for this patient
    const loadCases = (casesList) => {
        const cases = Array.isArray(casesList) ? casesList : (casesList.cases || []);
        allPatientCases = cases.filter(c => c.patient_id === patientId);
        filterCases(selectedCaseId);
    };
    
    // If cases were already provided, use them
    if (allCases) {
        loadCases(allCases);
        return;
    }
    
    // Load cases for this patient
    fetch(`${API_BASE}/cases?limit=1000`)
        .then(r => r.json())
        .then(data => {
            loadCases(data);
        })
        .catch(err => {
            console.error('Error loading cases:', err);
            caseSelect.innerHTML = '<option value="">Error loading cases</option>';
            allPatientCases = [];
        });
}

function filterCases(selectedCaseId = null) {
    const caseSelect = document.getElementById('caseSelect');
    const caseSearchInput = document.getElementById('caseSearchInput');
    
    if (!caseSelect) return;
    
    const searchTerm = caseSearchInput ? caseSearchInput.value.toLowerCase().trim() : '';
    
    // Filter cases based on search term
    const filteredCases = allPatientCases.filter(c => {
        const caseNumber = (c.case_number || '').toLowerCase();
        return caseNumber.includes(searchTerm);
    });
    
    // Build options HTML
    let optionsHTML = '<option value="">Select Case</option>';
    filteredCases.forEach(c => {
        const isSelected = selectedCaseId === c.id ? 'selected' : '';
        optionsHTML += `<option value="${c.id}" ${isSelected}>${c.case_number || ''}</option>`;
    });
    
    caseSelect.innerHTML = optionsHTML;
    
    // If there's a selected case ID, try to select it
    if (selectedCaseId) {
        const option = caseSelect.querySelector(`option[value="${selectedCaseId}"]`);
        if (option) {
            caseSelect.value = selectedCaseId;
        }
    }
}

function saveAppointment(event, appointmentId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Remove empty optional fields
    if (!data.case_id || data.case_id === '') {
        delete data.case_id;
    }
    if (!data.doctor_id || data.doctor_id === '') {
        delete data.doctor_id;
    }
    
    const url = appointmentId ? `${API_BASE}/appointments/${appointmentId}` : `${API_BASE}/appointments`;
    const method = appointmentId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(() => loadAppointments(currentAppointmentsPage))
    .catch(err => alert('Error saving appointment: ' + err));
}

function editAppointment(id) {
    showAppointmentForm(id);
}

function deleteAppointment(id) {
    if (confirm('Are you sure you want to delete this appointment?')) {
        fetch(`${API_BASE}/appointments/${id}`, {method: 'DELETE'})
            .then(() => loadAppointments(currentAppointmentsPage))
            .catch(err => alert('Error deleting appointment: ' + err));
    }
}

// ==================== PRESCRIPTIONS MODULE ====================

let currentPrescriptionsPage = 1;
const prescriptionsPageLimit = 10;

function loadPrescriptions(page = 1) {
    currentPrescriptionsPage = page;
    
    fetch(`${API_BASE}/prescriptions?page=${page}&limit=${prescriptionsPageLimit}`)
        .then(res => res.json())
        .then(data => {
            const prescriptions = data.prescriptions || data;
            const total = data.total !== undefined ? data.total : (Array.isArray(prescriptions) ? prescriptions.length : 0);
            
            const html = `
                <div class="module-content">
                    <div class="module-header">
                        <h1>Prescriptions</h1>
                        <button class="btn btn-primary" onclick="showPrescriptionForm()">Add Prescription</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.isArray(prescriptions) && prescriptions.length > 0 ? prescriptions.map(pres => `
                                <tr>
                                    <td>${pres.patient_name || ''}</td>
                                    <td>${pres.doctor_name || ''}</td>
                                    <td>${pres.prescription_date ? new Date(pres.prescription_date).toLocaleDateString() : ''}</td>
                                    <td>
                                        <button class="btn btn-success" onclick="editPrescription('${pres.id}')">Edit</button>
                                        <button class="btn btn-danger" onclick="deletePrescription('${pres.id}')">Delete</button>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" style="text-align: center;">No prescriptions found</td></tr>'}
                        </tbody>
                    </table>
                    <div class="pagination" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            ${currentPrescriptionsPage > 1 ? `<button class="btn btn-secondary" onclick="loadPrescriptions(${currentPrescriptionsPage - 1})">Previous</button>` : ''}
                            <span style="margin: 0 15px;">Page ${currentPrescriptionsPage} of ${Math.ceil(total / prescriptionsPageLimit)}</span>
                            ${currentPrescriptionsPage < Math.ceil(total / prescriptionsPageLimit) ? `<button class="btn btn-secondary" onclick="loadPrescriptions(${currentPrescriptionsPage + 1})">Next</button>` : ''}
                        </div>
                        <div style="color: #666;">Total: ${total} prescriptions</div>
                    </div>
                </div>
            `;
            document.getElementById('content-area').innerHTML = html;
            setTimeout(afterContentLoad, 0);
        })
        .catch(err => console.error('Error loading prescriptions:', err));
}

function showPrescriptionForm(prescriptionId = null) {
    const title = prescriptionId ? 'Edit Prescription' : 'Add Prescription';
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="prescriptionForm" onsubmit="savePrescription(event, '${prescriptionId || ''}')">
                    <div class="form-group">
                        <label>Patient ID</label>
                        <input type="text" name="patient_id" required>
                    </div>
                    <div class="form-group">
                        <label>Doctor ID</label>
                        <input type="text" name="doctor_id" required>
                    </div>
                    <div class="form-group">
                        <label>Prescription Date</label>
                        <input type="date" name="prescription_date" required>
                    </div>
                    <div class="form-group">
                        <label>Medications</label>
                        <textarea name="medications"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" onclick="loadPrescriptions()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
    
    if (prescriptionId) {
        fetch(`${API_BASE}/prescriptions/${prescriptionId}`)
            .then(res => res.json())
            .then(pres => {
                Object.keys(pres).forEach(key => {
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (key.includes('date') && pres[key]) {
                            input.value = pres[key].split('T')[0];
                        } else {
                            input.value = pres[key] || '';
                        }
                    }
                });
            });
    }
}

function savePrescription(event, prescriptionId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    const url = prescriptionId ? `${API_BASE}/prescriptions/${prescriptionId}` : `${API_BASE}/prescriptions`;
    const method = prescriptionId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(() => loadPrescriptions(currentPrescriptionsPage))
    .catch(err => alert('Error saving prescription: ' + err));
}

function editPrescription(id) {
    showPrescriptionForm(id);
}

function deletePrescription(id) {
    if (confirm('Are you sure you want to delete this prescription?')) {
        fetch(`${API_BASE}/prescriptions/${id}`, {method: 'DELETE'})
            .then(() => loadPrescriptions(currentPrescriptionsPage))
            .catch(err => alert('Error deleting prescription: ' + err));
    }
}

function showPrescriptionUploadForm(caseId) {
    fetch(`${API_BASE}/cases/${caseId}`)
        .then(res => res.json())
        .then(caseData => {
            const patientId = caseData.patient_id || '';
            const patientName = caseData.patient?.name || '';
            
            const html = `
                <div class="modal">
                    <div class="modal-content" style="max-width: 600px;">
                        <h2>Upload Prescription</h2>
                        <form id="prescriptionUploadForm" onsubmit="uploadPrescriptionForCase(event, '${caseId}')" enctype="multipart/form-data">
                            <input type="hidden" name="case_id" value="${caseId}">
                            <input type="hidden" name="patient_id" value="${patientId}">
                            <div class="form-group">
                                <label>Patient</label>
                                <input type="text" value="${patientName}" readonly style="background-color: #f0f0f0;">
                            </div>
                            <div class="form-group">
                                <label>Doctor <span style="color: #666; font-size: 12px;">(Optional)</span></label>
                                <select name="doctor_id" id="prescriptionDoctorSelect">
                                    <option value="">Select Doctor</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Prescription Date</label>
                                <input type="date" name="prescription_date" value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                            <div class="form-group">
                                <label>Prescription File *</label>
                                <input type="file" name="file" accept="image/*,.pdf" required>
                                <small style="color: #666;">Accepted formats: Images (JPG, PNG, etc.) or PDF</small>
                            </div>
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea name="notes" rows="3" placeholder="Enter any notes about this prescription"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Upload Prescription</button>
                                <button type="button" class="btn btn-secondary" onclick="closePrescriptionUploadModal()">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
            
            // Load doctors
            fetch(`${API_BASE}/doctors?limit=1000`)
                .then(res => res.json())
                .then(data => {
                    const doctors = Array.isArray(data) ? data : (data.doctors || []);
                    const doctorSelect = document.getElementById('prescriptionDoctorSelect');
                    if (doctorSelect) {
                        doctorSelect.innerHTML = '<option value="">Select Doctor</option>' + 
                            doctors.map(d => `<option value="${d.id}">${d.name || ''}</option>`).join('');
                    }
                });
        })
        .catch(err => {
            console.error('Error loading case data:', err);
            alert('Error loading case data: ' + err);
        });
}

function uploadPrescriptionForCase(event, caseId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    fetch(`${API_BASE}/prescriptions`, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.message || data.id) {
            alert('Prescription uploaded successfully');
            closePrescriptionUploadModal();
            viewCaseDetails(caseId);
        } else {
            alert('Error uploading prescription: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error('Error uploading prescription:', err);
        alert('Error uploading prescription: ' + err);
    });
}

function closePrescriptionUploadModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function deleteCasePrescription(prescriptionId, caseId) {
    if (confirm('Are you sure you want to delete this prescription?')) {
        fetch(`${API_BASE}/prescriptions/${prescriptionId}`, {method: 'DELETE'})
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    alert('Prescription deleted successfully');
                    viewCaseDetails(caseId);
                } else {
                    alert('Error deleting prescription: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(err => {
                console.error('Error deleting prescription:', err);
                alert('Error deleting prescription: ' + err);
            });
    }
}

// ==================== BILLING & PAYMENTS MODULE ====================

function loadBillingPayments() {
    const html = `
        <div class="module-content">
            <div class="module-header">
                <h1>Billing & Payments</h1>
            </div>
            <div class="billing-search">
                <h3>Search Patient</h3>
                <input type="text" id="patientSearchInput" placeholder="Search by patient name or phone" onkeyup="searchPatientsForBilling()">
                <div id="patientSearchResults"></div>
            </div>
            <div id="billingDetails" style="display:none;">
                <h3>Case Selection</h3>
                <div id="casesList"></div>
                <div id="caseBillingDetails"></div>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
}

function searchPatientsForBilling() {
    const query = document.getElementById('patientSearchInput').value;
    if (!query || query.length < 2) {
        const resultsDiv = document.getElementById('patientSearchResults');
        if (resultsDiv) resultsDiv.innerHTML = '';
        return;
    }
    
    fetch(`${API_BASE}/patients?search=${encodeURIComponent(query)}&limit=50`)
        .then(res => res.json())
        .then(data => {
            // Handle both old format (array) and new format (object with patients property)
            const patients = Array.isArray(data) ? data : (data.patients || []);
            
            const html = `
                <ul class="search-results">
                    ${patients.length > 0 ? patients.map(p => `<li onclick="selectPatient('${p.id}', '${p.name || ''}')">${p.name || ''} - ${p.phone || ''}</li>`).join('') : '<li class="no-results">No patients found</li>'}
                </ul>
            `;
            const resultsDiv = document.getElementById('patientSearchResults');
            if (resultsDiv) resultsDiv.innerHTML = html;
        })
        .catch(err => {
            console.error('Error searching patients:', err);
            const resultsDiv = document.getElementById('patientSearchResults');
            if (resultsDiv) resultsDiv.innerHTML = '<li class="no-results">Error searching patients</li>';
        });
}

function selectPatient(patientId, patientName) {
    window.selectedPatientId = patientId;
    window.selectedPatientName = patientName;
    
    fetch(`${API_BASE}/cases?page=1&limit=100`)
        .then(res => res.json())
        .then(data => {
            const patientCases = data.cases.filter(c => c.patient_id === patientId);
            const html = `
                <h4>Cases for ${patientName}</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Case Number</th>
                            <th>Case Type</th>
                            <th>Admission Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patientCases.map(c => `
                            <tr>
                                <td>${c.case_number || ''}</td>
                                <td>${c.case_type || ''}</td>
                                <td>${c.admission_date ? new Date(c.admission_date).toLocaleDateString() : ''}</td>
                                <td><button class="btn btn-primary" onclick="showCaseBilling('${c.id}')">View Bill</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('casesList').innerHTML = html;
            document.getElementById('billingDetails').style.display = 'block';
            document.getElementById('patientSearchResults').innerHTML = '';
        });
}

function showCaseBilling(caseId) {
    Promise.all([
        fetch(`${API_BASE}/cases/${caseId}`).then(r => r.json()),
        fetch(`${API_BASE}/bills?case_id=${caseId}`).then(r => r.json()),
        fetch(`${API_BASE}/payments?case_id=${caseId}`).then(r => r.json())
    ]).then(([caseData, bills, payments]) => {
        const patientCharges = caseData.charges || [];
        const totalCharges = patientCharges.reduce((sum, c) => sum + (c.total_amount || 0), 0);
        const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const balance = totalCharges - totalPaid;
        
        // Auto-create bill if not exists
        if (bills.length === 0 && totalCharges > 0) {
            fetch(`${API_BASE}/bills`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    case_id: caseId,
                    total_amount: totalCharges,
                    paid_amount: totalPaid,
                    balance_amount: balance
                })
            }).then(() => showCaseBilling(caseId));
            return;
        }
        
        const html = `
            <div class="billing-summary">
                <h3>Bill Summary - ${caseData.case_number || ''}</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Charge Name</th>
                            <th>Quantity</th>
                            <th>Unit Amount</th>
                            <th>Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patientCharges.map(c => `
                            <tr>
                                <td>${c.charge_name || ''}</td>
                                <td>${c.quantity || ''}</td>
                                <td>${c.unit_amount || ''}</td>
                                <td>${c.total_amount || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="bill-totals">
                    <p><strong>Total Charges: ${totalCharges}</strong></p>
                    <p><strong>Total Paid: ${totalPaid}</strong></p>
                    <p><strong>Balance: ${balance}</strong></p>
                </div>
                <button class="btn btn-primary" onclick="showPaymentForm('${caseId}')">Add Payment</button>
                <h4>Payment History</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Payment Mode</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.map(p => `
                            <tr>
                                <td>${p.payment_date ? new Date(p.payment_date).toLocaleDateString() : ''}</td>
                                <td>${p.amount || ''}</td>
                                <td>${p.payment_mode || ''}</td>
                                <td>${p.notes || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('caseBillingDetails').innerHTML = html;
        window.currentBillingCaseId = caseId;
    });
}

function showPaymentForm(caseId) {
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>Add Payment</h2>
                <form id="paymentForm" onsubmit="savePayment(event, '${caseId}')">
                    <div class="form-group">
                        <label>Amount</label>
                        <input type="number" name="amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Payment Mode</label>
                        <select name="payment_mode" required>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Payment Date</label>
                        <input type="date" name="payment_date" required>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" onclick="showCaseBilling('${caseId}')">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('caseBillingDetails').innerHTML = html;
}

function savePayment(event, caseId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    data.case_id = caseId;
    
    fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(() => showCaseBilling(caseId))
    .catch(err => alert('Error saving payment: ' + err));
}

// ==================== CHARGE MASTER MODULE ====================

let currentChargeMasterPage = 1;
const chargeMasterPageLimit = 10;

function loadChargeMaster(page = 1) {
    currentChargeMasterPage = page;
    
    fetch(`${API_BASE}/charge-master?page=${page}&limit=${chargeMasterPageLimit}`)
        .then(res => res.json())
        .then(data => {
            const charges = data.charges || data;
            const total = data.total !== undefined ? data.total : (Array.isArray(charges) ? charges.length : 0);
            
            const html = `
                <div class="module-content">
                    <div class="module-header">
                        <h1>Charge Master</h1>
                        <button class="btn btn-primary" onclick="showChargeMasterForm()">Add Charge</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.isArray(charges) && charges.length > 0 ? charges.map(charge => `
                                <tr>
                                    <td>${charge.name || ''}</td>
                                    <td>${charge.category || ''}</td>
                                    <td>${charge.amount || ''}</td>
                                    <td>
                                        <button class="btn btn-success" onclick="editChargeMaster('${charge.id}')">Edit</button>
                                        <button class="btn btn-danger" onclick="deleteChargeMaster('${charge.id}')">Delete</button>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" style="text-align: center;">No charges found</td></tr>'}
                        </tbody>
                    </table>
                    <div class="pagination" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            ${currentChargeMasterPage > 1 ? `<button class="btn btn-secondary" onclick="loadChargeMaster(${currentChargeMasterPage - 1})">Previous</button>` : ''}
                            <span style="margin: 0 15px;">Page ${currentChargeMasterPage} of ${Math.ceil(total / chargeMasterPageLimit)}</span>
                            ${currentChargeMasterPage < Math.ceil(total / chargeMasterPageLimit) ? `<button class="btn btn-secondary" onclick="loadChargeMaster(${currentChargeMasterPage + 1})">Next</button>` : ''}
                        </div>
                        <div style="color: #666;">Total: ${total} charges</div>
                    </div>
                </div>
            `;
            document.getElementById('content-area').innerHTML = html;
            setTimeout(afterContentLoad, 0);
        })
        .catch(err => console.error('Error loading charge master:', err));
}

function showChargeMasterForm(chargeId = null) {
    const title = chargeId ? 'Edit Charge' : 'Add Charge';
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="chargeMasterForm" onsubmit="saveChargeMaster(event, '${chargeId || ''}')">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" name="category">
                    </div>
                    <div class="form-group">
                        <label>Amount</label>
                        <input type="number" name="amount" step="0.01" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" onclick="loadChargeMaster()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
    
    if (chargeId) {
        fetch(`${API_BASE}/charge-master/${chargeId}`)
            .then(res => res.json())
            .then(charge => {
                Object.keys(charge).forEach(key => {
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input) input.value = charge[key] || '';
                });
            });
    }
}

function saveChargeMaster(event, chargeId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    const url = chargeId ? `${API_BASE}/charge-master/${chargeId}` : `${API_BASE}/charge-master`;
    const method = chargeId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(() => loadChargeMaster(currentChargeMasterPage))
    .catch(err => alert('Error saving charge: ' + err));
}

function editChargeMaster(id) {
    showChargeMasterForm(id);
}

function deleteChargeMaster(id) {
    if (confirm('Are you sure you want to delete this charge?')) {
        fetch(`${API_BASE}/charge-master/${id}`, {method: 'DELETE'})
            .then(() => loadChargeMaster(currentChargeMasterPage))
            .catch(err => alert('Error deleting charge: ' + err));
    }
}

// ==================== DOCTOR PAYOUTS MODULE ====================

let currentPayoutPage = 1;
const payoutPageLimit = 10;

function loadPayouts(page = 1) {
    currentPayoutPage = page;
    
    const html = `
        <div class="module-content">
            <div class="module-header">
                <h1>Payouts</h1>
                <button class="btn btn-primary" onclick="showPayoutForm()">Create Payout</button>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <div class="form-group" style="margin: 0;">
                        <label>Start Date</label>
                        <input type="date" id="payoutStartDate" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label>End Date</label>
                        <input type="date" id="payoutEndDate" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label>Payment Status</label>
                        <select id="payoutStatusFilter">
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="loadPayoutRecords()">Load Records</button>
                    <button class="btn btn-secondary" onclick="generatePayoutReport()">Generate Report</button>
                </div>
            </div>
            <div id="payoutTableContainer"></div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
    loadPayoutRecords();
}

function loadPayoutRecords(page = 1) {
    currentPayoutPage = page;
    const startDate = document.getElementById('payoutStartDate')?.value || '';
    const endDate = document.getElementById('payoutEndDate')?.value || '';
    const status = document.getElementById('payoutStatusFilter')?.value || '';
    
    let url = `${API_BASE}/payouts?page=${page}&limit=${payoutPageLimit}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    if (status) url += `&payment_status=${status}`;
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const payouts = data.payouts || [];
            const total = data.total || 0;
            const totalPages = Math.max(1, Math.ceil(total / payoutPageLimit));
            
            const html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Case Number</th>
                            <th>Patient Name</th>
                            <th>Doctor Name</th>
                            <th>OPD/IPD</th>
                            <th>Total Charge Amount</th>
                            <th>Doctor Charge Amount</th>
                            <th>Payment Status</th>
                            <th>Payment Details</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payouts.length > 0 ? payouts.map(p => {
                            const dateTime = p.date_time ? new Date(p.date_time).toLocaleString() : '';
                            const paymentDate = p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '';
                            const isPaidOrPartial = p.payment_status === 'paid' || p.payment_status === 'partial_paid';
                            const paymentDetails = isPaidOrPartial ? `
                                <div style="font-size: 11px;">
                                    ${paymentDate ? `<div><strong>Date:</strong> ${paymentDate}</div>` : ''}
                                    ${p.payment_mode ? `<div><strong>Mode:</strong> ${p.payment_mode}</div>` : ''}
                                    ${p.payment_reference_number ? `<div><strong>Ref:</strong> ${p.payment_reference_number}</div>` : ''}
                                    ${p.payment_status === 'partial_paid' && p.partial_payment_amount ? `<div><strong>Partial Amount:</strong> ${(p.partial_payment_amount || 0).toFixed(2)}</div>` : ''}
                                    ${p.payment_comment ? `<div><strong>Comment:</strong> ${p.payment_comment}</div>` : ''}
                                </div>
                            ` : '-';
                            
                            // Set row background color based on payment status
                            let rowColor = '#fff3cd'; // Yellow for pending/cancelled (default)
                            if (p.payment_status === 'paid') {
                                rowColor = '#d4edda'; // Green for paid
                            } else if (p.payment_status === 'partial_paid') {
                                rowColor = '#cfe2ff'; // Blue for partial paid
                            }
                            
                            const doctorChargeAmount = p.doctor_charge_amount || 0;
                            const partialAmount = p.partial_payment_amount || 0;
                            const remainingAmount = doctorChargeAmount - partialAmount;
                            const displayAmount = p.payment_status === 'partial_paid' 
                                ? `<span style="color: #0d6efd;">${partialAmount.toFixed(2)}</span> / ${doctorChargeAmount.toFixed(2)}<br/><small style="color: #666;">Remaining: ${remainingAmount.toFixed(2)}</small>`
                                : doctorChargeAmount.toFixed(2);
                            
                            return `
                                <tr style="background-color: ${rowColor};">
                                    <td>${dateTime}</td>
                                    <td>${p.case_number || ''}</td>
                                    <td>${p.patient_name || ''}</td>
                                    <td>${p.doctor_name || ''}</td>
                                    <td>${p.case_type || ''}</td>
                                    <td>${(p.total_charge_amount || 0).toFixed(2)}</td>
                                    <td style="font-size: 12px;">${displayAmount}</td>
                                    <td>
                                        <select onchange="updatePayoutStatus('${p.id}', this.value)" style="padding: 4px;">
                                            <option value="pending" ${p.payment_status === 'pending' ? 'selected' : ''}>Pending</option>
                                            <option value="partial_paid" ${p.payment_status === 'partial_paid' ? 'selected' : ''}>Partial Paid</option>
                                            <option value="paid" ${p.payment_status === 'paid' ? 'selected' : ''}>Paid</option>
                                            <option value="cancelled" ${p.payment_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                        </select>
                                    </td>
                                    <td style="font-size: 11px;">${paymentDetails}</td>
                                    <td>
                                        <button class="btn btn-primary" onclick="showPaymentForm('${p.id}', '${p.doctor_charge_amount || 0}', '${p.payment_status || 'pending'}')" ${p.payment_status === 'paid' ? 'disabled' : ''}>${p.payment_status === 'partial_paid' ? 'Add Payment' : 'Mark Paid'}</button>
                                        <button class="btn btn-success" onclick="viewPayoutCase('${p.case_id}')">View Case</button>
                                    </td>
                                </tr>
                            `;
                        }).join('') : '<tr><td colspan="10" style="text-align: center;">No payout records found</td></tr>'}
                    </tbody>
                </table>
                ${totalPages > 1 ? `
                    <div class="pagination" style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
                        <button class="btn btn-secondary" onclick="loadPayoutRecords(${Math.max(1, page - 1)})" ${page === 1 ? 'disabled' : ''}>Previous</button>
                        <span>Page ${page} of ${totalPages}</span>
                        <button class="btn btn-secondary" onclick="loadPayoutRecords(${Math.min(totalPages, page + 1)})" ${page === totalPages ? 'disabled' : ''}>Next</button>
                    </div>
                ` : ''}
            `;
            document.getElementById('payoutTableContainer').innerHTML = html;
        })
        .catch(err => {
            console.error('Error loading payout records:', err);
            alert('Error loading payout records: ' + err);
        });
}

function updatePayoutStatus(payoutId, status) {
    // If status is 'paid' or 'partial_paid', show payment form
    if (status === 'paid' || status === 'partial_paid') {
        // Get the payout record to get doctor_charge_amount
        fetch(`${API_BASE}/payouts?case_id=&doctor_id=&payment_status=&page=1&limit=1000`)
            .then(res => res.json())
            .then(data => {
                const payout = data.payouts?.find(p => p.id === payoutId);
                const doctorChargeAmount = payout?.doctor_charge_amount || 0;
                const currentStatus = payout?.payment_status || 'pending';
                showPaymentForm(payoutId, doctorChargeAmount, currentStatus, status);
            })
            .catch(err => {
                console.error('Error fetching payout:', err);
                showPaymentForm(payoutId, 0, 'pending', status);
            });
    } else {
        // For pending or cancelled, just update status
        fetch(`${API_BASE}/payouts/${payoutId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({payment_status: status})
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                alert('Payment status updated successfully');
                loadPayoutRecords(currentPayoutPage);
            } else {
                alert('Error updating payment status: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            console.error('Error updating payout status:', err);
            alert('Error updating payment status: ' + err);
        });
    }
}

function showPaymentForm(payoutId, doctorChargeAmount = 0, currentStatus = 'pending', targetStatus = 'paid') {
    const isPartialPayment = targetStatus === 'partial_paid';
    const existingPartialAmount = currentStatus === 'partial_paid' ? parseFloat(document.querySelector(`[data-payout-id="${payoutId}"]`)?.dataset?.partialAmount || 0) : 0;
    const remainingAmount = doctorChargeAmount - existingPartialAmount;
    
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>${isPartialPayment ? 'Add Partial Payment' : 'Mark Payment as Done'}</h2>
                <form id="paymentForm" onsubmit="savePayment(event, '${payoutId}', ${doctorChargeAmount}, '${targetStatus}')">
                    ${isPartialPayment ? `
                        <div class="form-group">
                            <label>Total Doctor Charge Amount</label>
                            <input type="number" value="${doctorChargeAmount.toFixed(2)}" readonly style="background-color: #f0f0f0;">
                        </div>
                        <div class="form-group">
                            <label>Already Paid Amount</label>
                            <input type="number" value="${existingPartialAmount.toFixed(2)}" readonly style="background-color: #f0f0f0;">
                        </div>
                        <div class="form-group">
                            <label>Remaining Amount</label>
                            <input type="number" value="${remainingAmount.toFixed(2)}" readonly style="background-color: #f0f0f0;">
                        </div>
                        <div class="form-group">
                            <label>Partial Payment Amount *</label>
                            <input type="number" name="partial_payment_amount" step="0.01" min="0.01" max="${remainingAmount}" required 
                                   placeholder="Enter partial payment amount" onchange="updatePartialTotal(this, ${existingPartialAmount}, ${doctorChargeAmount})">
                            <small style="color: #666;">Maximum: ${remainingAmount.toFixed(2)}</small>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label>Payment Mode *</label>
                        <select name="payment_mode" required>
                            <option value="">Select Payment Mode</option>
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="Online Payment">Online Payment</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Reference Number</label>
                        <input type="text" name="payment_reference_number" placeholder="Enter reference number (if any)">
                    </div>
                    <div class="form-group">
                        <label>Payment Date</label>
                        <input type="date" name="payment_date" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Comment</label>
                        <textarea name="payment_comment" rows="3" placeholder="Enter any comments or notes"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">${isPartialPayment ? 'Add Partial Payment' : 'Mark as Paid'}</button>
                        <button type="button" class="btn btn-secondary" onclick="closePaymentModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function updatePartialTotal(input, existingAmount, totalAmount) {
    const partialAmount = parseFloat(input.value) || 0;
    const newTotal = existingAmount + partialAmount;
    if (newTotal > totalAmount) {
        alert(`Total payment cannot exceed ${totalAmount.toFixed(2)}. Please enter a smaller amount.`);
        input.value = (totalAmount - existingAmount).toFixed(2);
    }
}

function closePaymentModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function savePayment(event, payoutId, doctorChargeAmount, targetStatus) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const paymentData = {
        payment_status: targetStatus || 'paid',
        payment_mode: formData.get('payment_mode'),
        payment_reference_number: formData.get('payment_reference_number') || '',
        payment_comment: formData.get('payment_comment') || ''
    };
    
    // Handle partial payment
    if (targetStatus === 'partial_paid') {
        const partialAmount = parseFloat(formData.get('partial_payment_amount')) || 0;
        if (partialAmount <= 0) {
            alert('Please enter a valid partial payment amount');
            return;
        }
        
        // Get existing partial amount from the payout record
        fetch(`${API_BASE}/payouts?case_id=&doctor_id=&payment_status=&page=1&limit=1000`)
            .then(res => res.json())
            .then(data => {
                const payout = data.payouts?.find(p => p.id === payoutId);
                const existingPartial = payout?.partial_payment_amount || 0;
                const newPartialTotal = existingPartial + partialAmount;
                
                if (newPartialTotal > doctorChargeAmount) {
                    alert(`Total partial payment (${newPartialTotal.toFixed(2)}) cannot exceed doctor charge amount (${doctorChargeAmount.toFixed(2)})`);
                    return;
                }
                
                paymentData.partial_payment_amount = newPartialTotal;
                
                // If partial payment equals full amount, mark as paid
                if (Math.abs(newPartialTotal - doctorChargeAmount) < 0.01) {
                    paymentData.payment_status = 'paid';
                    paymentData.partial_payment_amount = doctorChargeAmount;
                }
                
                savePaymentData(payoutId, paymentData);
            })
            .catch(err => {
                console.error('Error fetching payout:', err);
                // Fallback: use the entered amount
                paymentData.partial_payment_amount = partialAmount;
                savePaymentData(payoutId, paymentData);
            });
    } else {
        savePaymentData(payoutId, paymentData);
    }
}

function savePaymentData(payoutId, paymentData) {
    const paymentDate = document.querySelector('[name="payment_date"]')?.value;
    if (paymentDate) {
        paymentData.payment_date = paymentDate + 'T00:00:00';
    }
    
    fetch(`${API_BASE}/payouts/${payoutId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(paymentData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            const statusMsg = paymentData.payment_status === 'partial_paid' ? 'Partial payment added successfully' : 'Payment marked as done successfully';
            alert(statusMsg);
            closePaymentModal();
            loadPayoutRecords(currentPayoutPage);
        } else {
            alert('Error saving payment: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error('Error saving payment:', err);
        alert('Error saving payment: ' + err);
    });
}

function viewPayoutCase(caseId) {
    // First load the cases module
    loadModule('cases', null);
    // Then after the module loads, show the case details
    setTimeout(() => {
        viewCaseDetails(caseId);
    }, 300);
}

function showPayoutForm(payoutId = null) {
    Promise.all([
        fetch(`${API_BASE}/cases?limit=1000`).then(r => r.json()),
        fetch(`${API_BASE}/doctors?limit=1000`).then(r => r.json())
    ]).then(([casesResponse, doctorsResponse]) => {
        const cases = Array.isArray(casesResponse) ? casesResponse : (casesResponse.cases || []);
        const doctors = Array.isArray(doctorsResponse) ? doctorsResponse : (doctorsResponse.doctors || []);
        
        const title = payoutId ? 'Edit Payout' : 'Create Payout';
        const html = `
            <div class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <h2>${title}</h2>
                    <form id="payoutForm" onsubmit="savePayout(event, '${payoutId || ''}')">
                        <div class="form-group">
                            <label>Case *</label>
                            <select name="case_id" id="payoutCaseSelect" onchange="loadCaseDetailsForPayout(this.value)" required>
                                <option value="">Select Case</option>
                                ${cases.map(c => `<option value="${c.id}">${c.case_number || ''} - ${c.patient_name || ''}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Doctor</label>
                            <select name="doctor_id" id="payoutDoctorSelect">
                                <option value="">Select Doctor</option>
                                ${doctors.map(d => `<option value="${d.id}">${d.name || ''}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Date & Time *</label>
                            <input type="datetime-local" name="date_time" id="payoutDateTime" required>
                        </div>
                        <div class="form-group">
                            <label>Case Number</label>
                            <input type="text" name="case_number" id="payoutCaseNumber" readonly style="background-color: #f0f0f0;">
                        </div>
                        <div class="form-group">
                            <label>Patient Name</label>
                            <input type="text" name="patient_name" id="payoutPatientName" readonly style="background-color: #f0f0f0;">
                        </div>
                        <div class="form-group">
                            <label>Case Type (OPD/IPD)</label>
                            <input type="text" name="case_type" id="payoutCaseType" readonly style="background-color: #f0f0f0;">
                        </div>
                        <div class="form-group">
                            <label>Total Charge Amount *</label>
                            <input type="number" name="total_charge_amount" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>Doctor Charge Amount *</label>
                            <input type="number" name="doctor_charge_amount" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>Payment Status</label>
                            <select name="payment_status">
                                <option value="pending">Pending</option>
                                <option value="partial_paid">Partial Paid</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${payoutId ? 'Update' : 'Create'} Payout</button>
                            <button type="button" class="btn btn-secondary" onclick="closePayoutModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Set default date time to now
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('payoutDateTime').value = now.toISOString().slice(0, 16);
        
        if (payoutId) {
            // Load payout data for editing
            fetch(`${API_BASE}/payouts?case_id=&doctor_id=&payment_status=&page=1&limit=1000`)
                .then(res => res.json())
                .then(data => {
                    const payout = data.payouts?.find(p => p.id === payoutId);
                    if (payout) {
                        Object.keys(payout).forEach(key => {
                            const input = document.querySelector(`[name="${key}"]`);
                            if (input) {
                                if (key === 'date_time' && payout[key]) {
                                    const date = new Date(payout[key]);
                                    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                                    input.value = date.toISOString().slice(0, 16);
                                } else if (key.includes('_id')) {
                                    input.value = payout[key] || '';
                                } else {
                                    input.value = payout[key] || '';
                                }
                            }
                        });
                        if (payout.case_id) {
                            loadCaseDetailsForPayout(payout.case_id);
                        }
                    }
                });
        }
    });
}

function loadCaseDetailsForPayout(caseId) {
    if (!caseId) return;
    
    fetch(`${API_BASE}/cases/${caseId}`)
        .then(res => res.json())
        .then(caseData => {
            const caseNumberInput = document.getElementById('payoutCaseNumber');
            const patientNameInput = document.getElementById('payoutPatientName');
            const caseTypeInput = document.getElementById('payoutCaseType');
            
            if (caseNumberInput) caseNumberInput.value = caseData.case_number || '';
            if (patientNameInput) patientNameInput.value = caseData.patient?.name || '';
            if (caseTypeInput) caseTypeInput.value = caseData.case_type || '';
        })
        .catch(err => {
            console.error('Error loading case details:', err);
        });
}

function savePayout(event, payoutId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Convert date_time to proper format
    if (data.date_time) {
        data.date_time = new Date(data.date_time).toISOString();
    }
    
    const url = payoutId ? `${API_BASE}/payouts/${payoutId}` : `${API_BASE}/payouts`;
    const method = payoutId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
        if (data.message || data.id) {
            alert(payoutId ? 'Payout updated successfully' : 'Payout created successfully');
            closePayoutModal();
            loadPayoutRecords(currentPayoutPage);
        } else {
            alert('Error saving payout: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error('Error saving payout:', err);
        alert('Error saving payout: ' + err);
    });
}

function closePayoutModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function generatePayoutReport() {
    const date = document.getElementById('payoutDate').value;
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    fetch(`${API_BASE}/doctor-payouts?date=${date}`)
        .then(res => res.json())
        .then(data => {
            const totalChargeAmount = data.reduce((sum, item) => sum + (item.total_charge_amount || 0), 0);
            const totalDoctorChargeAmount = data.reduce((sum, item) => sum + (item.doctor_charge_amount || 0), 0);
            
            const html = `
                <div class="payout-report">
                    <h3>Payout Report for ${date}</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Case Number</th>
                                <th>Patient Name</th>
                                <th>OPD/IPD</th>
                                <th>Total Charge Amount</th>
                                <th>Doctor Charge Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(item => {
                                const doctorCharges = item.doctor_charges || [];
                                let doctorChargeDisplay = '';
                                if (doctorCharges.length > 0) {
                                    doctorChargeDisplay = doctorCharges.map(dc => 
                                        `${dc.doctor_name || 'Unknown Doctor'}: ${(dc.total_amount || 0).toFixed(2)}`
                                    ).join('<br/>');
                                } else {
                                    doctorChargeDisplay = (item.doctor_charge_amount || 0).toFixed(2);
                                }
                                
                                return `
                                <tr>
                                    <td>${item.case_number || ''}</td>
                                    <td>${item.patient_name || ''}</td>
                                    <td>${item.case_type || ''}</td>
                                    <td>${(item.total_charge_amount || 0).toFixed(2)}</td>
                                    <td style="font-size: 12px;">${doctorChargeDisplay}</td>
                                </tr>
                            `;
                            }).join('')}
                        </tbody>
                    </table>
                    <div class="payout-totals">
                        <p><strong>Total Charge Amount: ${totalChargeAmount}</strong></p>
                        <p><strong>Total Doctor Charge Amount: ${totalDoctorChargeAmount}</strong></p>
                    </div>
                </div>
            `;
            document.getElementById('payoutResults').innerHTML = html;
        })
        .catch(err => {
            console.error('Error generating payout report:', err);
            alert('Error generating payout report: ' + err);
        });
}

// ==================== REPORTS MODULE ====================

function loadReports() {
    fetch(`${API_BASE}/reports/summary`)
        .then(res => res.json())
        .then(data => {
            const html = `
                <div class="module-content">
                    <div class="module-header">
                        <h1>Reports</h1>
                    </div>
                    <div class="reports-summary">
                        <h3>Summary Report</h3>
                        <div class="summary-cards">
                            <div class="summary-card">
                                <h4>Doctors</h4>
                                <p class="summary-number">${data.doctors || 0}</p>
                            </div>
                            <div class="summary-card">
                                <h4>Patients</h4>
                                <p class="summary-number">${data.patients || 0}</p>
                            </div>
                            <div class="summary-card">
                                <h4>Cases</h4>
                                <p class="summary-number">${data.cases || 0}</p>
                            </div>
                            <div class="summary-card">
                                <h4>Appointments</h4>
                                <p class="summary-number">${data.appointments || 0}</p>
                            </div>
                            <div class="summary-card">
                                <h4>Prescriptions</h4>
                                <p class="summary-number">${data.prescriptions || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('content-area').innerHTML = html;
        })
        .catch(err => console.error('Error loading reports:', err));
}
