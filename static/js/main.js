// API Base URL
const API_BASE = '/api';

// ==================== SESSION MANAGEMENT ====================
let currentUser = null;

// Check authentication on page load
function checkAuth() {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (!userId || !username) {
        showLoginPage();
        return false;
    }

    // Verify session is still valid
    fetch(`${API_BASE}/auth/check`, {
        headers: {
            'X-User-Id': userId,
            'X-Username': username
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.authenticated && data.user) {
                currentUser = data.user;
                // Don't reload - just populate menu
                populateMenu();
                populateUserInfo();
            } else {
                showLoginPage();
            }
        })
        .catch(() => {
            showLoginPage();
        });

    return true;
}

function showLoginPage() {
    document.body.innerHTML = `
        <div class="login-container">
            <div class="login-box">
                <h1>Hospital Management System</h1>
                <h2>Login</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="username" name="username" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="password" name="password" required autocomplete="current-password">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
                </form>
                <div id="loginError" style="color: #dc2626; margin-top: 12px; display: none;"></div>
            </div>
        </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                currentUser = data.user;
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('username', data.user.username);
                // Reload to show main app
                window.location.reload();
            } else {
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.style.display = 'block';
            }
        })
        .catch(err => {
            errorDiv.textContent = 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        });
}

function handleLogout() {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
            'X-User-Id': userId || '',
            'X-Username': username || ''
        }
    })
        .then(() => {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            currentUser = null;
            showLoginPage();
        })
        .catch(() => {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            currentUser = null;
            showLoginPage();
        });
}

function showMainApp() {
    // Populate menu based on permissions
    populateMenu();
    // Show user info
    populateUserInfo();
}


function populateMenu() {
    const menu = document.getElementById('sidebarMenu');
    if (!menu) return;

    const modules = [
        { name: 'dashboard', label: '📊 Dashboard' },
        { name: 'doctors', label: '👨‍⚕️ Doctors' },
        { name: 'doctor-charges', label: 'Doctor Charges' },
        { name: 'patients', label: '👥 Patients' },
        { name: 'cases', label: '📋 Cases' },
        { name: 'appointments', label: '📅 Appointments' },
        { name: 'billing-payments', label: '💰 Billing & Payments' },
        { name: 'charge-master', label: 'Charge Master' },
        { name: 'payouts', label: 'Payouts' },
        { name: 'reports', label: '📊 Reports' }
    ];

    let menuHTML = '';

    modules.forEach(module => {
        if (hasPermission(module.name, 'view')) {
            menuHTML += `<li><a href="#" onclick="loadModule('${module.name}', event); closeMobileMenu();">${module.label}</a></li>`;
        }
    });

    // Admin-only modules
    if (currentUser && currentUser.username === 'sunilsahu') {
        menuHTML += `<li><a href="#" onclick="loadModule('users', event); closeMobileMenu();">User Management</a></li>`;
        menuHTML += `<li><a href="#" onclick="loadModule('activity-logs', event); closeMobileMenu();">Activity Logs</a></li>`;
    }

    menu.innerHTML = menuHTML;

    // Auto-load dashboard on first load
    if (!window.dashboardLoaded) {
        window.dashboardLoaded = true;
        setTimeout(() => loadModule('dashboard'), 100);
    }
}

function populateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (!userInfo || !currentUser) return;

    userInfo.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${currentUser.full_name || currentUser.username}</div>
        <div style="font-size: 12px; color: #999;">${currentUser.role === 'admin' ? 'Administrator' : 'User'}</div>
    `;
}

function hasPermission(module, action) {
    if (!currentUser) return false;

    // Dashboard is accessible to all authenticated users
    if (module === 'dashboard') return true;

    // Admin has full access
    if (currentUser.username === 'sunilsahu') return true;

    const permissions = currentUser.permissions || {};
    const modulePerms = permissions[module] || {};

    if (action === 'view') return modulePerms.view || false;
    if (action === 'edit') return modulePerms.edit || false;
    if (action === 'delete') return modulePerms.delete || false;

    return false;
}

function getAuthHeaders() {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    return {
        'X-User-Id': userId || '',
        'X-Username': username || '',
        'Content-Type': 'application/json'
    };
}

// Check auth on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        checkAuth();
        // Populate menu if authenticated
        if (localStorage.getItem('userId')) {
            const userId = localStorage.getItem('userId');
            const username = localStorage.getItem('username');
            fetch(`${API_BASE}/auth/check`, {
                headers: {
                    'X-User-Id': userId,
                    'X-Username': username
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.authenticated && data.user) {
                        currentUser = data.user;
                        populateMenu();
                        populateUserInfo();
                    }
                });
        }
    });
} else {
    checkAuth();
    // Populate menu if authenticated
    if (localStorage.getItem('userId')) {
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        fetch(`${API_BASE}/auth/check`, {
            headers: {
                'X-User-Id': userId,
                'X-Username': username
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.authenticated && data.user) {
                    currentUser = data.user;
                    populateMenu();
                    populateUserInfo();
                }
            });
    }
}

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
function loadModule(moduleName, event) {
    // Update active menu item
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }

    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
        console.error('Content area not found');
        return;
    }

    switch (moduleName) {
        case 'dashboard':
            loadDashboard();
            break;
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
        case 'users':
            loadUsers();
            break;
        case 'activity-logs':
            loadActivityLogs();
            break;
        default:
            contentArea.innerHTML = '<div class="welcome-message"><h1>Module not found</h1></div>';
    }
}

// Make loadModule globally accessible
window.loadModule = loadModule;

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
                    <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" name="isInhouse" id="isInhouse" style="width: auto;">
                        <label for="isInhouse" style="margin-bottom: 0;">Inhouse Doctor</label>
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
                        if (input.type === 'checkbox') {
                            input.checked = !!doctor[key];
                        } else if (input.type === 'number') {
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

    // Handle checkboxes (not included in FormData if unchecked)
    const checkboxes = event.target.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        data[cb.name] = cb.checked;
    });

    // Remove null/empty values for cleaner data (except for booleans)
    Object.keys(data).forEach(key => {
        if (typeof data[key] !== 'boolean' && (data[key] === '' || data[key] === null)) {
            delete data[key];
        }
    });

    const url = doctorId ? `${API_BASE}/doctors/${doctorId}` : `${API_BASE}/doctors`;
    const method = doctorId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
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
        fetch(`${API_BASE}/doctors/${id}`, { method: 'DELETE' })
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
    // Filter out Inhouse doctors
    const allDoctors = window.doctorsList || [];
    const doctors = allDoctors.filter(d => !d.isInhouse);

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
        headers: { 'Content-Type': 'application/json' },
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
        fetch(`${API_BASE}/doctor-charges/${id}`, { method: 'DELETE' })
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
                                            <button class="btn btn-info" onclick="loadPatientDetail('${patient.id}')">View Details</button>
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
        headers: { 'Content-Type': 'application/json' },
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
        fetch(`${API_BASE}/patients/${id}`, { method: 'DELETE' })
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
                                    <th>Status</th>
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

                // Get case status
                const status = c.status || 'open';
                const statusDisplay = status === 'closed' ? 'Closed' : 'Open';
                const statusColor = status === 'closed' ? '#10b981' : '#3b82f6';
                const statusBg = status === 'closed' ? '#d1fae5' : '#dbeafe';

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
                                        <td>
                                            <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background-color: ${statusBg}; color: ${statusColor};">
                                                ${statusDisplay}
                                            </span>
                                        </td>
                                        <td>${c.admission_date ? new Date(c.admission_date).toLocaleDateString() : ''}</td>
                                        <td>${appointmentsDisplay}</td>
                                        <td>${c.charges_count || 0}</td>
                                        <td>${(c.charges_total || 0).toFixed(2)}</td>
                                        <td>
                                            <button class="btn btn-success" onclick="viewCaseDetails('${c.id}')">View</button>
                                            <button class="btn btn-primary" onclick="editCase('${c.id}')" ${status === 'closed' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Edit</button>
                                            ${currentUser && currentUser.role === 'admin' ? `<button class="btn btn-danger" onclick="deleteCase('${c.id}')">Delete</button>` : ''}
                                        </td>
                                    </tr>
                                `;
            }).join('') : '<tr><td colspan="9" style="text-align: center;">No cases found</td></tr>'}
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
let referredBySearchTimeout = null;
let selectedReferredByName = '';

function showCaseForm(caseId = null, patientId = null, patientName = null) {
    const title = caseId ? 'Edit Case' : 'Add Case';
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="caseForm" onsubmit="saveCase(event, '${caseId || ''}')">
                    <div class="form-group">
                        <label>Patient *</label>
                        <input type="hidden" name="patient_id" id="casePatientIdInput" value="${patientId || ''}" required>
                        <input type="text" id="casePatientSearchInput" placeholder="Search patient by name..." 
                               autocomplete="off" oninput="searchPatientsForCase(event)"
                               value="${patientName || ''}" 
                               ${patientId ? 'disabled style="background-color: #f3f4f6;"' : ''}>
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
                            <label>Time of Admission</label>
                            <input type="time" name="admission_time" step="1">
                        </div>
                        <div class="form-group">
                            <label>Discharge Date</label>
                            <input type="date" name="discharge_date">
                        </div>
                        <div class="form-group">
                            <label>Time of Discharge</label>
                            <input type="time" name="discharge_time" step="1">
                        </div>
                        <div class="form-group">
                            <label>Diagnosis</label>
                            <textarea name="diagnosis"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Referred By</label>
                            <input type="hidden" name="referred_by_type" id="caseReferredByTypeInput">
                            <input type="hidden" name="referred_by_id" id="caseReferredByIdInput">
                            <input type="text" id="caseReferredBySearchInput" placeholder="Search patient or doctor by name..." 
                                   autocomplete="off" oninput="searchReferredBy(event)">
                            <div id="caseReferredBySearchResults" style="display: none; position: absolute; z-index: 1000; background: white; border: 1px solid #ddd; max-height: 200px; overflow-y: auto; width: 100%; margin-top: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>
                        </div>
                        ${caseId ? `
                        <div class="form-group">
                            <label>Status</label>
                            <select name="status" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="open">Open</option>
                                <option value="closed">Closed</option>
                            </select>
                            <div style="font-size: 0.8em; color: #666; margin-top: 4px;">Note: Case can only be closed if all charges are fully paid.</div>
                        </div>
                        ` : ''}
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
                    // Skip referred_by fields - they are handled separately
                    if (key === 'referred_by_id' || key === 'referred_by_type' || key === 'referred_by_name' || key === 'referred_by') {
                        return;
                    }
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (key.includes('date') && c[key]) {
                            input.value = c[key].split('T')[0];
                        } else if ((key === 'admission_time' || key === 'discharge_time') && c[key]) {
                            // Handle time field - could be in format "HH:MM:SS" or "HH:MM"
                            const timeValue = typeof c[key] === 'string' ? c[key].substring(0, 5) : c[key];
                            input.value = timeValue || '';
                        } else if (key === 'status') {
                            input.value = (c[key] || 'open').toLowerCase();
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

                // Populate referred by search field
                const referredByTypeInput = document.getElementById('caseReferredByTypeInput');
                const referredByIdInput = document.getElementById('caseReferredByIdInput');
                const referredBySearchInput = document.getElementById('caseReferredBySearchInput');

                if (c.referred_by_id && c.referred_by_type) {
                    // New format: has type and ID
                    if (referredByTypeInput) referredByTypeInput.value = c.referred_by_type;
                    if (referredByIdInput) referredByIdInput.value = c.referred_by_id;

                    if (referredBySearchInput) {
                        // Use stored name if available, otherwise fetch
                        if (c.referred_by_name) {
                            referredBySearchInput.value = c.referred_by_name;
                            selectedReferredByName = c.referred_by_name;
                        } else {
                            // Fetch the name based on type
                            const apiUrl = c.referred_by_type === 'patient'
                                ? `${API_BASE}/patients/${c.referred_by_id}`
                                : `${API_BASE}/doctors/${c.referred_by_id}`;

                            fetch(apiUrl)
                                .then(r => r.json())
                                .then(item => {
                                    if (referredBySearchInput && item.name) {
                                        referredBySearchInput.value = item.name;
                                        selectedReferredByName = item.name;
                                    }
                                })
                                .catch(err => {
                                    console.error('Error fetching referred by:', err);
                                });
                        }
                    }
                } else if (c.referred_by && !c.referred_by_id) {
                    // Legacy support: if referred_by is a string, populate it but clear type/ID
                    if (referredByTypeInput) referredByTypeInput.value = '';
                    if (referredByIdInput) referredByIdInput.value = '';
                    if (referredBySearchInput) {
                        referredBySearchInput.value = c.referred_by;
                        selectedReferredByName = c.referred_by;
                    }
                } else {
                    // Clear referred by fields if not present
                    if (referredByTypeInput) referredByTypeInput.value = '';
                    if (referredByIdInput) referredByIdInput.value = '';
                    if (referredBySearchInput) {
                        referredBySearchInput.value = '';
                        selectedReferredByName = '';
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

function searchReferredBy(event) {
    const searchInput = document.getElementById('caseReferredBySearchInput');
    const resultsDiv = document.getElementById('caseReferredBySearchResults');
    const referredByTypeInput = document.getElementById('caseReferredByTypeInput');
    const referredByIdInput = document.getElementById('caseReferredByIdInput');

    if (!searchInput || !resultsDiv) return;

    const query = searchInput.value.trim();

    // Clear previous timeout
    if (referredBySearchTimeout) {
        clearTimeout(referredBySearchTimeout);
    }

    // If query is empty, hide results and clear selection
    if (!query) {
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
        if (referredByTypeInput) referredByTypeInput.value = '';
        if (referredByIdInput) referredByIdInput.value = '';
        selectedReferredByName = '';
        return;
    }

    // If query matches selected referrer, don't search
    if (query === selectedReferredByName) {
        resultsDiv.style.display = 'none';
        return;
    }

    // Debounce search
    referredBySearchTimeout = setTimeout(() => {
        // Search both patients and doctors in parallel
        Promise.all([
            fetch(`${API_BASE}/patients?search=${encodeURIComponent(query)}&limit=20`).then(r => r.json()),
            fetch(`${API_BASE}/doctors?search=${encodeURIComponent(query)}&limit=20`).then(r => r.json())
        ])
            .then(([patientsResponse, doctorsResponse]) => {
                const patients = Array.isArray(patientsResponse) ? patientsResponse : (patientsResponse.patients || []);
                const doctors = Array.isArray(doctorsResponse) ? doctorsResponse : (doctorsResponse.doctors || []);

                const allResults = [];

                // Add patients with type indicator
                patients.forEach(patient => {
                    allResults.push({
                        id: patient.id,
                        name: patient.name || '',
                        type: 'patient',
                        phone: patient.phone || '',
                        email: patient.email || ''
                    });
                });

                // Add doctors with type indicator
                doctors.forEach(doctor => {
                    allResults.push({
                        id: doctor.id,
                        name: doctor.name || '',
                        type: 'doctor',
                        specialization: doctor.specialization || '',
                        phone: doctor.phone || ''
                    });
                });

                if (allResults.length === 0) {
                    resultsDiv.innerHTML = '<div style="padding: 10px; color: #666;">No patients or doctors found</div>';
                    resultsDiv.style.display = 'block';
                    return;
                }

                resultsDiv.innerHTML = allResults.map(item => {
                    const typeBadge = item.type === 'patient'
                        ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 8px;">PATIENT</span>'
                        : '<span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 8px;">DOCTOR</span>';

                    const details = item.type === 'patient'
                        ? `${item.phone ? `<br/><small style="color: #666;">${item.phone}</small>` : ''}${item.email ? `<br/><small style="color: #666;">${item.email}</small>` : ''}`
                        : `${item.specialization ? `<br/><small style="color: #666;">${item.specialization}</small>` : ''}${item.phone ? `<br/><small style="color: #666;">${item.phone}</small>` : ''}`;

                    return `
                        <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;" 
                             onmouseover="this.style.backgroundColor='#f0f0f0'" 
                             onmouseout="this.style.backgroundColor='white'"
                             onclick="selectReferredBy('${item.id}', '${(item.name || '').replace(/'/g, "\\'")}', '${item.type}')">
                            ${typeBadge}
                            <strong>${item.name || ''}</strong>
                            ${details}
                        </div>
                    `;
                }).join('');
                resultsDiv.style.display = 'block';
            })
            .catch(err => {
                console.error('Error searching referred by:', err);
                resultsDiv.innerHTML = '<div style="padding: 10px; color: #d32f2f;">Error searching</div>';
                resultsDiv.style.display = 'block';
            });
    }, 300);
}

function selectReferredBy(id, name, type) {
    const referredByTypeInput = document.getElementById('caseReferredByTypeInput');
    const referredByIdInput = document.getElementById('caseReferredByIdInput');
    const referredBySearchInput = document.getElementById('caseReferredBySearchInput');
    const resultsDiv = document.getElementById('caseReferredBySearchResults');

    if (referredByTypeInput) referredByTypeInput.value = type;
    if (referredByIdInput) referredByIdInput.value = id;
    if (referredBySearchInput) {
        referredBySearchInput.value = name;
        selectedReferredByName = name;
    }
    if (resultsDiv) {
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
    }

    // Clear search timeout
    if (referredBySearchTimeout) {
        clearTimeout(referredBySearchTimeout);
        referredBySearchTimeout = null;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.error || 'Failed to save case'); });
            }
            return res.json();
        })
        .then(() => {
            alert('Case saved successfully');
            loadCases(currentCasesPage);
        })
        .catch(err => {
            console.error('Error saving case:', err);
            alert(err.message);
        });
}

function viewCaseDetails(caseId) {
    fetch(`${API_BASE}/cases/${caseId}`)
        .then(res => res.json())
        .then(caseData => {
            const patientCharges = caseData.charges || [];
            const appointments = caseData.appointments || [];
            const isClosed = caseData.status === 'closed';

            const patientChargesTotal = patientCharges.reduce((sum, c) => sum + (c.total_amount || 0), 0);

            const html = `
                <div class="module-content">
                    <div class="module-header">
                        <h1>Case Details: ${caseData.case_number || ''}</h1>
                        ${isClosed ? '<span style="display: inline-block; padding: 6px 16px; border-radius: 12px; font-size: 14px; font-weight: 600; background-color: #d1fae5; color: #10b981; margin-right: 12px;">Case Closed</span>' : ''}
                        <button class="btn btn-secondary" onclick="loadCases(currentCasesPage)">Back</button>
                    </div>
                    <div class="case-details-container">
                        <div class="case-info">
                            <h3>Case Information</h3>
                            <p><strong>Patient:</strong> ${caseData.patient?.name || ''}</p>
                            <p><strong>Case Type:</strong> ${caseData.case_type || ''}</p>
                            <p><strong>Status:</strong> <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background-color: ${isClosed ? '#d1fae5' : '#dbeafe'}; color: ${isClosed ? '#10b981' : '#3b82f6'};">
                                ${isClosed ? 'Closed' : 'Open'}
                            </span></p>
                            <p><strong>Admission Date:</strong> ${caseData.admission_date ? new Date(caseData.admission_date).toLocaleDateString() : ''}${caseData.admission_time ? ' ' + caseData.admission_time : ''}</p>
                            ${caseData.discharge_date ? `<p><strong>Discharge Date:</strong> ${new Date(caseData.discharge_date).toLocaleDateString()}${caseData.discharge_time ? ' ' + caseData.discharge_time : ''}</p>` : ''}
                            ${caseData.closed_at ? `<p><strong>Closed Date:</strong> ${new Date(caseData.closed_at).toLocaleDateString()}</p>` : ''}
                            ${caseData.diagnosis ? `<p><strong>Diagnosis:</strong> ${caseData.diagnosis}</p>` : ''}
                            ${caseData.referred_by_name ? `<p><strong>Referred By:</strong> ${caseData.referred_by_name} <span style="color: #666; font-size: 12px;">(${caseData.referred_by_type === 'patient' ? 'Patient' : 'Doctor'})</span></p>` : caseData.referred_by ? `<p><strong>Referred By:</strong> ${caseData.referred_by}</p>` : ''}
                        </div>
                        ${appointments.length > 0 ? `
                        <div class="case-appointments-section" style="margin-bottom: 24px;">
                            <h3>Appointments</h3>
                            ${isClosed ? '<p style="color: #666; font-size: 14px; margin-bottom: 12px;"><em>Case is closed. No new appointments can be added.</em></p>' : ''}
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
                            <h3>Hospital Charges</h3>
                            ${isClosed ? '<p style="color: #666; font-size: 14px; margin-bottom: 12px;"><em>Case is closed. No new charges can be added.</em></p>' : ''}
                            <button class="btn btn-primary" onclick="showCaseChargeForm('${caseId}')" ${isClosed ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Add Patient Charge</button>
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
                                                    <button class="btn btn-success" onclick="editCaseCharge('${c.id}', '${caseId}')" ${isClosed ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Edit</button>
                                                </td>
                                            </tr>
                                        `;
            }).join('') : '<tr><td colspan="7" style="text-align: center;">No patient charges found</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                            <p style="margin-top: 16px;"><strong>Total Patient Charges: ${patientChargesTotal}</strong></p>
                        </div>
                        <div class="case-prescriptions-section">
                            <h3>Prescriptions</h3>
                            ${isClosed ? '<p style="color: #666; font-size: 14px; margin-bottom: 12px;"><em>Case is closed. No new prescriptions can be uploaded.</em></p>' : ''}
                            <button class="btn btn-primary" onclick="showPrescriptionUploadForm('${caseId}')" ${isClosed ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Upload Prescription</button>
                            <div class="table-scroll-container" style="margin-top: 16px;">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>File Name</th>
                                            <th>Doctor Name</th>
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
                                                    ${pres.file_path ? `<button class="btn btn-success" onclick="viewPrescriptionInLightbox('${pres.file_path}', '${(pres.file_name || '').replace(/'/g, "\\'")}')">View</button>` : ''}
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
    // Check if case is closed
    fetch(`${API_BASE}/cases/${caseId}`)
        .then(res => res.json())
        .then(caseData => {
            if (caseData.status === 'closed') {
                alert('This case is closed. No charges can be added or modified.');
                return Promise.reject(new Error('Case is closed'));
            }

            return Promise.all([
                fetch(`${API_BASE}/charge-master?limit=1000`).then(r => r.json())
            ]);
        })
        .then(([chargeMasterResponse]) => {
            // Handle response format - API returns {charges: [...], total: ...} or array
            let chargeMaster = Array.isArray(chargeMasterResponse)
                ? chargeMasterResponse
                : (chargeMasterResponse.charges || []);

            // Filter for MEDICAL category and Sort by Name Ascending
            chargeMaster = chargeMaster.filter(c =>
                (c.category && c.category.toUpperCase() === 'MEDICAL') ||
                (c.charge_category && c.charge_category.toUpperCase() === 'MEDICAL')
            ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

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
                                <label>Charge Date</label>
                                <input type="date" name="charge_date" value="${new Date().toISOString().split('T')[0]}" required>
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
                            } else if (key === 'charge_date' && charge[key]) {
                                input.value = charge[key].split('T')[0];
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
        })
        .catch(err => {
            if (err.message !== 'Case is closed') {
                console.error('Error loading charge form:', err);
                alert('Error loading charge form: ' + (err.message || err));
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
        headers: { 'Content-Type': 'application/json' },
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
        fetch(`${API_BASE}/case-charges/${id}`, { method: 'DELETE' })
            .then(() => viewCaseDetails(caseId))
            .catch(err => alert('Error deleting charge: ' + err));
    }
}

function showCaseDoctorChargeForm(caseId, chargeId = null) {
    Promise.all([
        fetch(`${API_BASE}/doctors?limit=1000`).then(r => r.json()),
        fetch(`${API_BASE}/charge-master?limit=1000`).then(r => r.json())
    ]).then(([doctorsData, chargeMasterData]) => {
        const doctors = doctorsData.doctors || doctorsData;
        let chargeMaster = chargeMasterData.charges || chargeMasterData;

        // Filter for DOCTOR category and Sort by Name Ascending
        chargeMaster = chargeMaster.filter(c =>
            (c.category && c.category.toUpperCase() === 'DOCTOR') ||
            (c.charge_category && c.charge_category.toUpperCase() === 'DOCTOR')
        ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const title = chargeId ? 'Edit Doctor Charge' : 'Add Doctor Charge';

        const html = `
            <div class="modal">
                <div class="modal-content">
                    <h2>${title}</h2>
                    <form id="caseDoctorChargeForm" onsubmit="saveCaseDoctorCharge(event, '${caseId}', '${chargeId || ''}')">
                        <input type="hidden" name="case_id" value="${caseId}">
                        <div class="form-group">
                            <label>Category (Charge Master)</label>
                            <select name="charge_master_id" id="doctorChargeMasterSelect" onchange="updateCaseDoctorChargeAmount()">
                                <option value="">Select Category</option>
                                ${chargeMaster.map(c => `<option value="${c.id}" data-amount="${c.amount || 0}">${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Doctor</label>
                            <select name="doctor_id" required>
                                <option value="">Select Doctor</option>
                                ${doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Amount</label>
                            <input type="number" name="amount" id="doctorChargeAmountInput" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>Charge Date</label>
                            <input type="date" name="charge_date" value="${new Date().toISOString().split('T')[0]}">
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

        // Initialize Select2 for Doctor Search
        setTimeout(() => {
            if (window.jQuery && window.jQuery.fn.select2) {
                $('#caseDoctorChargeForm select[name="doctor_id"]').select2({
                    dropdownParent: $('.modal-content'),
                    width: '100%',
                    placeholder: "Select Doctor"
                });
            }
        }, 100);

        if (chargeId) {
            fetch(`${API_BASE}/case-doctor-charges/${chargeId}`)
                .then(res => res.json())
                .then(charge => {
                    Object.keys(charge).forEach(key => {
                        const input = document.querySelector(`[name="${key}"]`);
                        if (input) {
                            if (key.includes('date') && charge[key]) {
                                input.value = charge[key].split('T')[0];
                            } else if (key === 'charge_master_id' && charge[key]) {
                                input.value = charge[key];
                            } else if (key === 'rate' || key === 'amount') {
                                document.getElementById('doctorChargeAmountInput').value = charge[key] || '';
                            } else {
                                input.value = charge[key] || '';
                            }
                        }
                    });
                });
        }
    });
}

function updateCaseDoctorChargeAmount() {
    const select = document.getElementById('doctorChargeMasterSelect');
    const amountInput = document.getElementById('doctorChargeAmountInput');
    if (select && amountInput && select.selectedIndex > 0) {
        const amount = select.options[select.selectedIndex].getAttribute('data-amount');
        amountInput.value = amount;
    }
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
        headers: { 'Content-Type': 'application/json' },
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
        fetch(`${API_BASE}/case-doctor-charges/${id}`, { method: 'DELETE' })
            .then(() => viewCaseDetails(caseId))
            .catch(err => alert('Error deleting doctor charge: ' + err));
    }
}

function editCase(id) {
    showCaseForm(id);
}

function deleteCase(id) {
    if (confirm('Are you sure you want to delete this case?')) {
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');

        fetch(`${API_BASE}/cases/${id}`, {
            method: 'DELETE',
            headers: {
                'X-User-Id': userId,
                'X-Username': username
            }
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || 'Failed to delete case'); });
                }
                return res.json();
            })
            .then(() => {
                alert('Case deleted successfully');
                loadCases(currentCasesPage);
            })
            .catch(err => {
                console.error('Error deleting case:', err);
                alert('Error deleting case: ' + err.message);
            });
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
                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-info" onclick="loadCalendar()">📅 Calendar View</button>
                            <button class="btn btn-primary" onclick="showAppointmentForm()">Add Appointment</button>
                        </div>
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
document.addEventListener('click', function (event) {
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

    // Close referred by search results
    const caseReferredBySearchInput = document.getElementById('caseReferredBySearchInput');
    const caseReferredBySearchResults = document.getElementById('caseReferredBySearchResults');
    if (caseReferredBySearchInput && caseReferredBySearchResults &&
        !caseReferredBySearchInput.contains(event.target) &&
        !caseReferredBySearchResults.contains(event.target)) {
        setTimeout(() => {
            if (caseReferredBySearchResults) {
                caseReferredBySearchResults.style.display = 'none';
            }
        }, 200);
    }

    // Close billing patient search results
    const billingPatientSearchInput = document.getElementById('billingPatientSearchInput');
    const billingPatientSearchResults = document.getElementById('billingPatientSearchResults');
    if (billingPatientSearchInput && billingPatientSearchResults &&
        !billingPatientSearchInput.contains(event.target) &&
        !billingPatientSearchResults.contains(event.target)) {
        setTimeout(() => {
            if (billingPatientSearchResults) {
                billingPatientSearchResults.style.display = 'none';
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
        headers: { 'Content-Type': 'application/json' },
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
        fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' })
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
        headers: { 'Content-Type': 'application/json' },
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
        fetch(`${API_BASE}/prescriptions/${id}`, { method: 'DELETE' })
            .then(() => loadPrescriptions(currentPrescriptionsPage))
            .catch(err => alert('Error deleting prescription: ' + err));
    }
}

function showPrescriptionUploadForm(caseId) {
    fetch(`${API_BASE}/cases/${caseId}`)
        .then(res => res.json())
        .then(caseData => {
            // Check if case is closed
            if (caseData.status === 'closed') {
                alert('This case is closed. No prescriptions can be uploaded.');
                return;
            }

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
        fetch(`${API_BASE}/prescriptions/${prescriptionId}`, { method: 'DELETE' })
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

// Prescription Lightbox Functions
let prescriptionZoomLevel = 1;
let prescriptionLightboxImage = null;

function viewPrescriptionInLightbox(filePath, fileName) {
    prescriptionZoomLevel = 1;
    const isPDF = filePath.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filePath);

    const lightboxHTML = `
        <div class="prescription-lightbox-overlay" id="prescriptionLightbox" onclick="closePrescriptionLightbox(event)">
            <div class="prescription-lightbox-container" onclick="event.stopPropagation()">
                <div class="prescription-lightbox-header">
                    <h3>${fileName || 'Prescription'}</h3>
                    <div class="prescription-lightbox-controls">
                        ${isImage ? `
                            <button class="btn btn-secondary" onclick="zoomPrescription('out')" title="Zoom Out">
                                <span style="font-size: 18px;">−</span>
                            </button>
                            <span class="zoom-level" id="prescriptionZoomLevel">100%</span>
                            <button class="btn btn-secondary" onclick="zoomPrescription('in')" title="Zoom In">
                                <span style="font-size: 18px;">+</span>
                            </button>
                        ` : ''}
                        <button class="btn btn-primary" onclick="downloadPrescription('${filePath}', '${(fileName || 'prescription').replace(/'/g, "\\'")}')" title="Download">
                            <span style="font-size: 16px;">⬇</span> Download
                        </button>
                        <button class="btn btn-danger" onclick="closePrescriptionLightbox()" title="Close">
                            <span style="font-size: 18px;">×</span>
                        </button>
                    </div>
                </div>
                <div class="prescription-lightbox-content">
                    ${isPDF ? `
                        <iframe src="${filePath}" class="prescription-pdf-viewer" frameborder="0"></iframe>
                    ` : isImage ? `
                        <img src="${filePath}" id="prescriptionLightboxImage" class="prescription-image-viewer" alt="${fileName || 'Prescription'}" style="transform: scale(${prescriptionZoomLevel}); transition: transform 0.3s ease;">
                    ` : `
                        <div style="padding: 20px; text-align: center;">
                            <p>Preview not available for this file type.</p>
                            <a href="${filePath}" download="${fileName || 'prescription'}" class="btn btn-primary">Download File</a>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    prescriptionLightboxImage = document.getElementById('prescriptionLightboxImage');
    document.body.style.overflow = 'hidden';

    // Close on Escape key
    document.addEventListener('keydown', handlePrescriptionLightboxKeydown);
}

function handlePrescriptionLightboxKeydown(event) {
    if (event.key === 'Escape') {
        closePrescriptionLightbox();
    }
}

function closePrescriptionLightbox(event) {
    if (event && event.target.id !== 'prescriptionLightbox' && !event.target.closest('.prescription-lightbox-container')) {
        return;
    }
    const lightbox = document.getElementById('prescriptionLightbox');
    if (lightbox) {
        lightbox.remove();
        document.body.style.overflow = '';
        prescriptionZoomLevel = 1;
        prescriptionLightboxImage = null;
        document.removeEventListener('keydown', handlePrescriptionLightboxKeydown);
    }
}

function zoomPrescription(direction) {
    if (!prescriptionLightboxImage) return;

    if (direction === 'in') {
        prescriptionZoomLevel = Math.min(prescriptionZoomLevel + 0.25, 3); // Max 300%
    } else if (direction === 'out') {
        prescriptionZoomLevel = Math.max(prescriptionZoomLevel - 0.25, 0.5); // Min 50%
    }

    prescriptionLightboxImage.style.transform = `scale(${prescriptionZoomLevel})`;
    const zoomLevelElement = document.getElementById('prescriptionZoomLevel');
    if (zoomLevelElement) {
        zoomLevelElement.textContent = Math.round(prescriptionZoomLevel * 100) + '%';
    }
}

function downloadPrescription(filePath, fileName) {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName || 'prescription';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==================== BILLING & PAYMENTS MODULE ====================

let selectedBillingPatientId = null;
let selectedBillingCaseId = null;
let billingPatientSearchTimeout = null;

function loadBillingPayments() {
    selectedBillingPatientId = null;
    selectedBillingCaseId = null;

    const html = `
        <div class="module-content">
            <div class="module-header">
                <h1>Billing & Payments</h1>
            </div>
            
            <!-- Full Width Layout -->
            <div class="billing-container" style="position: relative;">
                
                <!-- View 1: Case List -->
                <div id="billingListContainer" style="display: block;">
                    <div style="margin-bottom: 20px; max-width: 800px; margin-left: auto; margin-right: auto;">
                        <input type="text" id="billingSearchInput" 
                               placeholder="Search by Patient Name, Phone or Case #..." 
                               autocomplete="off" 
                               oninput="searchBillingCases(event)"
                               style="width: 100%; padding: 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    </div>
                    
                    <div id="billingCasesList" class="table-scroll-container">
                        <div style="text-align: center; padding: 40px; color: #666;">Loading cases...</div>
                    </div>
                </div>

                <!-- View 2: Billing Details (Hidden by default) -->
                <div id="billingDetailsContainer" style="display: none;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn btn-secondary" onclick="showBillingList()">
                            &larr; Back to Cases
                        </button>
                    </div>
                    <div id="caseBillingContent"></div>
                </div>

            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;

    // Load default OPEN cases
    fetchBillingCases({ status: 'open' });
}

function showBillingList() {
    document.getElementById('billingDetailsContainer').style.display = 'none';
    document.getElementById('billingListContainer').style.display = 'block';
    selectedBillingCaseId = null;
}

let billingSearchTimeout = null;

function searchBillingCases(event) {
    const query = event.target.value.trim();

    if (billingSearchTimeout) clearTimeout(billingSearchTimeout);

    billingSearchTimeout = setTimeout(() => {
        if (!query) {
            fetchBillingCases({ status: 'open' });
        } else {
            // Search all cases (remove status filter to allow finding closed cases if needed)
            fetchBillingCases({ search: query });
        }
    }, 300);
}

function fetchBillingCases(params = {}) {
    const listContainer = document.getElementById('billingCasesList');
    listContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Searching...</div>';

    const queryParams = new URLSearchParams(params).toString();

    fetch(`${API_BASE}/cases?limit=50&${queryParams}`)
        .then(res => res.json())
        .then(data => {
            const cases = Array.isArray(data) ? data : (data.cases || []);
            renderBillingCasesList(cases);
        })
        .catch(err => {
            console.error('Error fetching billing cases:', err);
            listContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: red;">Error loading cases: ${err.message}</div>`;
        });
}

function renderBillingCasesList(cases) {
    const listContainer = document.getElementById('billingCasesList');

    if (cases.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No cases found.</div>';
        return;
    }

    listContainer.innerHTML = cases.map(c => `
        <div class="card" style="margin-bottom: 15px; cursor: pointer; border-left: 4px solid ${c.status === 'open' ? '#2ecc71' : '#95a5a6'};" 
             onclick="selectBillingCase('${c._id || c.id}')">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h4 style="margin: 0 0 5px 0;">${c.patient_name || 'Unknown Patient'}</h4>
                    <div style="font-size: 13px; color: #666;">Case: ${c.case_number || 'N/A'}</div>
                    <div style="font-size: 12px; color: #999;">${new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <div style="text-align: right;">
                    <span class="badge badge-${c.status === 'open' ? 'success' : 'secondary'}">${c.status ? c.status.toUpperCase() : 'OPEN'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function selectBillingCase(caseId) {
    selectedBillingCaseId = caseId;

    // UI Update: Switch View
    document.getElementById('billingListContainer').style.display = 'none';
    document.getElementById('billingDetailsContainer').style.display = 'block';

    loadCaseBilling(caseId);
}

function loadCaseBilling(caseId) {
    selectedBillingCaseId = caseId;

    document.getElementById('caseBillingContent').innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading billing details...</div>';

    fetch(`${API_BASE}/billing/case/${caseId}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to load case details');
            return res.json();
        })
        .then(data => {
            if (!data.case) {
                throw new Error('Case data is missing');
            }
            const caseData = data.case;
            const charges = data.charges || [];
            const payments = data.payments || [];
            const totalCharges = data.total_charges || 0;
            const discount = data.discount || 0;
            const totalAfterDiscount = data.total_after_discount || totalCharges;
            const totalPaid = data.total_paid || 0;
            const balance = data.balance || 0;

            const html = `
        < div style = "background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 100%; box-sizing: border-box;" >
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <h2 style="margin: 0;">Bill for Case: ${caseData.case_number || ''}</h2>
                            ${caseData.status === 'closed' ? `
                                <div style="margin-top: 8px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: #ecfdf5; border: 1px solid #10b981; border-radius: 20px; color: #065f46; font-weight: 600; font-size: 13px;">
                                    <span>🔒 Finalized & Locked</span>
                                </div>
                            ` : ''}
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <button class="btn btn-secondary" onclick="generateBillPDF('${caseId}')">
                                📄 Generate Draft
                            </button>
                            ${caseData.status !== 'closed' && balance <= 0.01 ? `
                                <button class="btn btn-success" onclick="closeCaseAndBill('${caseId}')" style="background: #059669; border: none; font-weight: 700; padding: 10px 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                                    💰 Finalize Bill & Lock Case
                                </button>
                            ` : ''}
                            ${caseData.status === 'closed' ? `
                                <button class="btn btn-primary" onclick="generateBillPDF('${caseId}')" style="background: #2563eb; border: none; font-weight: 700; padding: 10px 20px;">
                                    🖨️ Print Final Bill
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px;">
                        <div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <h3 style="margin-top: 0; margin-bottom: 12px; color: #475569; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                                👤 Patient Info
                            </h3>
                            <p style="margin: 4px 0;"><strong>Name:</strong> ${caseData.patient?.name || ''}</p>
                            <p style="margin: 4px 0;"><strong>Phone:</strong> ${caseData.patient?.phone || ''}</p>
                            <p style="margin: 4px 0;"><strong>Case Type:</strong> ${caseData.case_type || ''}</p>
                            <p style="margin: 4px 0;"><strong>Admission:</strong> ${caseData.admission_date ? new Date(caseData.admission_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div style="padding: 16px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd;">
                            <h3 style="margin-top: 0; margin-bottom: 12px; color: #0369a1; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                                💰 Financial Summary
                            </h3>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span style="color: #64748b;">Gross Total:</span>
                                <strong>₹${totalCharges.toLocaleString('en-IN')}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span style="color: #64748b;">Discount:</span>
                                <span style="color: #dc2626; font-weight: 600;">-₹${discount.toLocaleString('en-IN')}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
                                <span style="color: #64748b;">Net Payable:</span>
                                <strong>₹${totalAfterDiscount.toLocaleString('en-IN')}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #059669;">
                                <span>Paid Amount:</span>
                                <strong>₹${totalPaid.toLocaleString('en-IN')}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 2px solid #bae6fd; font-size: 1.1em;">
                                <strong style="color: #1e293b;">Balance Due:</strong>
                                <strong style="color: ${balance > 0.01 ? '#dc2626' : '#059669'};">₹${balance.toLocaleString('en-IN')}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <div class="billing-sections">
                        <!-- Grouped Charges -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; color: #334155;">Hospital Charges</h3>
                            ${renderBillingGroupTable(charges.filter(c => !c.is_doctor_charge && (!c.charge_type || c.charge_type === 'hospital')), 'hospital', caseId)}
                        </div>

                        <div style="margin-bottom: 30px;">
                            <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; color: #334155;">Doctor Fees</h3>
                            ${renderBillingGroupTable(charges.filter(c => c.is_doctor_charge), 'doctor', caseId)}
                        </div>

                        <div style="margin-bottom: 30px;">
                            <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; color: #334155;">Pathology Charges</h3>
                            ${renderBillingGroupTable(charges.filter(c => c.charge_type === 'pathology'), 'pathology', caseId)}
                        </div>

                        <div style="margin-bottom: 30px;">
                            <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; color: #334155;">Pharmacy Charges</h3>
                            ${renderBillingGroupTable(charges.filter(c => c.charge_type === 'pharmacy'), 'pharmacy', caseId)}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3>Payments History</h3>
                            ${caseData.status !== 'closed' ? `
                                <button class="btn btn-primary" onclick="showBillingPaymentForm('${caseId}')">Record Payment</button>
                            ` : ''}
                        </div>
                        <div class="table-scroll-container" style="max-height: 300px; overflow-y: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Mode</th>
                                        <th>Reference</th>
                                        <th>Notes</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${payments.length > 0 ? payments.map(p => {
                const paymentDate = p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '';
                return `
                                        <tr>
                                            <td>${paymentDate}</td>
                                            <td>${(p.amount || 0).toFixed(2)}</td>
                                            <td>${p.payment_mode || ''}</td>
                                            <td>${p.payment_reference_number || ''}</td>
                                            <td>${p.notes || ''}</td>
                                            <td>
                                                <button class="btn btn-success" onclick="editBillingPayment('${p.id}', '${caseId}')">Edit</button>
                                                <button class="btn btn-danger" onclick="deleteBillingPayment('${p.id}', '${caseId}')">Delete</button>
                                            </td>
                                        </tr>
                                    `;
            }).join('') : '<tr><td colspan="6" style="text-align: center;">No payments found</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div style="margin-top: 32px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        <div style="padding: 20px; background: #fffbeb; border-radius: 8px; border: 1px solid #fef3c7;">
                            <h3 style="margin-top: 0; margin-bottom: 12px; color: #92400e; font-size: 16px;">Applied Discount</h3>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="position: relative; flex: 1;">
                                    <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #64748b;">₹</span>
                                    <input type="number" id="discountAmount" step="0.01" min="0" max="${totalCharges}" 
                                           value="${discount}" 
                                           onchange="updateDiscount('${caseId}', this.value)"
                                           ${caseData.status === 'closed' ? 'disabled style="padding: 10px 10px 10px 25px; border: 1px solid #e2e8f0; border-radius: 6px; width: 100%; opacity: 0.6; background-color: #f8fafc;"' : 'style="padding: 10px 10px 10px 25px; border: 1px solid #cbd5e1; border-radius: 6px; width: 100%; font-size: 16px; font-weight: 600;"'}
                                           placeholder="0.00">
                                </div>
                                <button class="btn btn-warning" onclick="updateDiscount('${caseId}', document.getElementById('discountAmount').value)" ${caseData.status === 'closed' ? 'disabled' : ''}>
                                    Apply
                                </button>
                            </div>
                            <small style="color: #b45309; display: block; margin-top: 8px;">* Discount reduces the total payable amount.</small>
                        </div>

                        <div style="padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                            <p style="color: #64748b; margin-bottom: 8px;">Current Payment Status</p>
                            ${balance > 0.01 ? `
                                <span style="display: inline-block; padding: 8px 16px; background: #fee2e2; color: #991b1b; border-radius: 20px; font-weight: 700;">PENDING: ₹${balance.toLocaleString('en-IN')}</span>
                            ` : `
                                <span style="display: inline-block; padding: 8px 16px; background: #dcfce7; color: #166534; border-radius: 20px; font-weight: 700;">✓ PAID IN FULL</span>
                            `}
                        </div>
                    </div>
                </div >
    `;
            document.getElementById('caseBillingContent').innerHTML = html;

            // Scroll to top for full view
            window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .catch(err => {
            console.error('Error loading case billing:', err);
            document.getElementById('caseBillingContent').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc2626;">
                    <h3>Error Loading Bill</h3>
                    <p style="margin-bottom: 20px;">${err.message}</p>
                    <button class="btn btn-secondary" onclick="loadCaseBilling('${caseId}')">Retry</button>
                </div>
            `;
        });
}


function showBillingPaymentForm(caseId) {
    // Remove any existing modals first
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => modal.remove());

    // Fetch current balance to show in form
    fetch(`${API_BASE}/billing/case/${caseId}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch case details');
            return res.json();
        })
        .then(data => {
            const balance = data.balance || 0;
            const totalAfterDiscount = data.total_after_discount || 0;

            const html = `
    <div class="modal" id="billingPaymentModal">
        <div class="modal-content">
            <h2>Add Payment</h2>
            <form id="billingPaymentForm" onsubmit="return saveBillingPayment(event, '${caseId}')">
                <div class="form-group">
                    <label>Payment Type *</label>
                    <div style="display: flex; gap: 20px; margin-top: 8px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="payment_type" value="full" checked onchange="handlePaymentTypeChange('full', ${balance})" style="margin-right: 8px;">
                                <span>Full Payment (₹${balance.toFixed(2)})</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="payment_type" value="partial" onchange="handlePaymentTypeChange('partial', ${balance})" style="margin-right: 8px;">
                                <span>Partial Payment</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Payment Amount *</label>
                    <input type="number" step="0.01" name="amount" id="paymentAmountInput" value="${balance > 0 ? balance.toFixed(2) : '0.00'}" min="0.01" max="${totalAfterDiscount}" required>
                        <small style="color: #666; display: block; margin-top: 4px;">Balance: ₹${balance.toFixed(2)}</small>
                </div>
                <div class="form-group">
                    <label>Payment Date *</label>
                    <input type="date" name="payment_date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Payment Mode *</label>
                    <select name="payment_mode" required>
                        <option value="">Select Mode</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Reference Number</label>
                    <input type="text" name="payment_reference_number">
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save Payment</button>
                    <button type="button" class="btn btn-secondary" onclick="closeBillingModal()">Cancel</button>
                </div>
            </form>
        </div>
    </div>
    `;
            document.body.insertAdjacentHTML('beforeend', html);
        })
        .catch(err => {
            console.error('Error loading billing data:', err);
            alert('Error loading billing data: ' + err);
        });
}

function handlePaymentTypeChange(paymentType, balance) {
    const amountInput = document.getElementById('paymentAmountInput');
    if (amountInput) {
        if (paymentType === 'full') {
            // Set amount to full balance
            amountInput.value = balance > 0 ? balance.toFixed(2) : '0.00';
            amountInput.readOnly = true;
            amountInput.style.backgroundColor = '#f0f0f0';
        } else {
            // Partial payment - allow user to enter amount
            amountInput.value = '';
            amountInput.readOnly = false;
            amountInput.style.backgroundColor = 'white';
            amountInput.focus();
        }
    }
}

function saveBillingPayment(event, caseId) {
    // Prevent default form submission
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    // Get the form element
    const form = event ? event.target : document.getElementById('billingPaymentForm');
    if (!form) {
        alert('Payment form not found');
        return false;
    }

    // Verify this is the billing payment form, not the payout payment form
    if (form.id !== 'billingPaymentForm' && form.id !== 'billingPaymentEditForm') {
        console.error('Wrong form submitted:', form.id);
        return false;
    }

    const formData = new FormData(form);
    const data = {};

    // Collect all form fields
    for (let [key, value] of formData.entries()) {
        if (value && value.trim() !== '') {
            data[key] = value.trim();
        }
    }

    // Add case_id
    data.case_id = caseId;

    // Convert amount to float
    if (data.amount) {
        data.amount = parseFloat(data.amount);
        if (isNaN(data.amount)) {
            alert('Please enter a valid payment amount');
            return false;
        }
    } else {
        alert('Payment amount is required');
        return false;
    }

    // Convert payment_date to ISO string format (YYYY-MM-DD)
    // Keep it as string, backend will handle conversion
    if (data.payment_date) {
        // payment_date is already in YYYY-MM-DD format from date input
        // Convert to ISO string for backend
        const dateObj = new Date(data.payment_date + 'T00:00:00');
        data.payment_date = dateObj.toISOString();
    } else {
        // Use current date if not provided
        data.payment_date = new Date().toISOString();
    }

    // Ensure payment_mode is provided
    if (!data.payment_mode) {
        alert('Payment mode is required');
        return false;
    }

    console.log('Saving billing payment to /api/payments:', data);
    console.log('Case ID:', caseId);
    console.log('Form ID:', form.id);

    // IMPORTANT: Use /api/payments endpoint, NOT /api/payouts
    fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => {
            console.log('Payment response status:', res.status);
            console.log('Response URL:', res.url);
            if (!res.ok) {
                return res.json().then(err => {
                    console.error('Payment error response:', err);
                    throw new Error(err.error || 'Failed to save payment');
                });
            }
            return res.json();
        })
        .then(responseData => {
            console.log('Payment success response:', responseData);
            if (responseData.message || responseData.id) {
                alert('Payment saved successfully!');
                closeBillingModal();
                loadCaseBilling(caseId);
            } else {
                alert('Error saving payment: ' + (responseData.error || 'Unknown error'));
            }
        })
        .catch(err => {
            console.error('Error saving payment:', err);
            alert('Error saving payment: ' + (err.message || err));
        });

    return false;
}

function editBillingPayment(paymentId, caseId) {
    // Remove any existing modals first
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }

    fetch(`${API_BASE}/payments/${paymentId}`)
        .then(res => res.json())
        .then(payment => {
            const html = `
                <div class="modal">
                    <div class="modal-content">
                        <h2>Edit Payment</h2>
                        <form id="billingPaymentEditForm" onsubmit="updateBillingPayment(event, '${paymentId}', '${caseId}')">
                            <div class="form-group">
                                <label>Payment Amount *</label>
                                <input type="number" step="0.01" name="amount" value="${payment.amount || 0}" required>
                            </div>
                            <div class="form-group">
                                <label>Payment Date *</label>
                                <input type="date" name="payment_date" value="${payment.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" required>
                            </div>
                            <div class="form-group">
                                <label>Payment Mode *</label>
                                <select name="payment_mode" required>
                                    <option value="">Select Mode</option>
                                    <option value="Cash" ${payment.payment_mode === 'Cash' ? 'selected' : ''}>Cash</option>
                                    <option value="Card" ${payment.payment_mode === 'Card' ? 'selected' : ''}>Card</option>
                                    <option value="UPI" ${payment.payment_mode === 'UPI' ? 'selected' : ''}>UPI</option>
                                    <option value="Bank Transfer" ${payment.payment_mode === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                                    <option value="Cheque" ${payment.payment_mode === 'Cheque' ? 'selected' : ''}>Cheque</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Reference Number</label>
                                <input type="text" name="payment_reference_number" value="${payment.payment_reference_number || ''}">
                            </div>
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea name="notes" rows="3">${payment.notes || ''}</textarea>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Update Payment</button>
                                <button type="button" class="btn btn-secondary" onclick="closeBillingModal()">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
        })
        .catch(err => {
            console.error('Error loading payment:', err);
            alert('Error loading payment: ' + err);
        });
}

function updateBillingPayment(event, paymentId, caseId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    // Convert amount to float
    if (data.amount) {
        data.amount = parseFloat(data.amount);
    }

    // Convert payment_date to datetime
    if (data.payment_date) {
        data.payment_date = new Date(data.payment_date);
    }

    fetch(`${API_BASE}/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                closeBillingModal();
                loadCaseBilling(caseId);
            } else {
                alert('Error updating payment: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            console.error('Error updating payment:', err);
            alert('Error updating payment: ' + err);
        });
}

function deleteBillingPayment(paymentId, caseId) {
    if (!confirm('Are you sure you want to delete this payment?')) {
        return;
    }

    fetch(`${API_BASE}/payments/${paymentId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                loadCaseBilling(caseId);
            } else {
                alert('Error deleting payment: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            console.error('Error deleting payment:', err);
            alert('Error deleting payment: ' + err);
        });
}

function updateDiscount(caseId, discountAmount) {
    const discount = parseFloat(discountAmount) || 0;

    // Get current total charges to validate discount
    fetch(`${API_BASE}/billing/case/${caseId}`)
        .then(res => res.json())
        .then(billingData => {
            const totalCharges = billingData.total_charges || 0;

            if (discount < 0) {
                alert('Discount cannot be negative');
                document.getElementById('discountAmount').value = 0;
                return;
            }

            if (discount > totalCharges) {
                alert(`Discount cannot exceed total charges (₹ ${totalCharges.toFixed(2)})`);
                document.getElementById('discountAmount').value = Math.min(discount, totalCharges);
                return;
            }

            fetch(`${API_BASE}/billing/discount/${caseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discount: discount })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.message || data.discount !== undefined) {
                        // Reload billing details to show updated calculations
                        loadCaseBilling(caseId);
                    } else {
                        alert('Error updating discount: ' + (data.error || 'Unknown error'));
                        // Reload to reset the value
                        loadCaseBilling(caseId);
                    }
                })
                .catch(err => {
                    console.error('Error updating discount:', err);
                    alert('Error updating discount: ' + err);
                    // Reload to reset the value
                    loadCaseBilling(caseId);
                });
        })
        .catch(err => {
            console.error('Error fetching billing data:', err);
            alert('Error validating discount: ' + err);
        });
}

function generateBillPDF(caseId) {
    // Fetch billing data and show as HTML in lightbox
    fetch(`${API_BASE}/billing/case/${caseId}`)
        .then(res => res.json())
        .then(data => {
            const caseData = data.case;
            const charges = data.charges || [];
            const payments = data.payments || [];
            const totalCharges = data.total_charges || 0;
            const discount = data.discount || 0;
            const totalAfterDiscount = data.total_after_discount || totalCharges;
            const totalPaid = data.total_paid || 0;
            const balance = data.balance || 0;

            // Generate HTML bill
            const billHTML = generateBillHTML(caseData, charges, payments, totalCharges, discount, totalAfterDiscount, totalPaid, balance);

            // Create lightbox to display bill
            const lightboxHTML = `
                <div class="prescription-lightbox-overlay" id="billLightbox" onclick="closeBillLightbox(event)">
                    <div class="prescription-lightbox-container" onclick="event.stopPropagation()" style="max-width: 90%; max-height: 95vh; width: 100%;">
                        <div class="prescription-lightbox-header">
                            <h3>Bill / Invoice Review - ${caseData.case_number || ''}</h3>
                            <div class="prescription-lightbox-controls">
                                <button class="btn btn-primary" onclick="printBill()" title="Print Bill">
                                    🖨 Print
                                </button>
                                <button class="btn btn-success" onclick="closeCaseAndBill('${caseId}')" id="closeCaseBtn" title="Close Case (Only if fully paid)" ${caseData.status === 'closed' || Math.abs(balance) > 0.01 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                    ✓ Close Case
                                </button>
                                ${Math.abs(balance) > 0.01 ? '<span style="color: #dc2626; font-size: 12px; margin-left: 8px;">(Balance: ₹ ' + balance.toFixed(2) + ')</span>' : ''}
                                <button class="btn btn-danger" onclick="closeBillLightbox()" title="Close">
                                    <span style="font-size: 18px;">×</span>
                                </button>
                            </div>
                        </div>
                        <div class="prescription-lightbox-content" style="padding: 20px; overflow-y: auto; background: white;">
                            <div id="billContent">
                                ${billHTML}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove any existing lightbox
            const existingLightbox = document.getElementById('billLightbox');
            if (existingLightbox) {
                existingLightbox.remove();
            }

            document.body.insertAdjacentHTML('beforeend', lightboxHTML);
            document.body.style.overflow = 'hidden';

            // Close on Escape key
            document.addEventListener('keydown', handleBillLightboxKeydown);
        })
        .catch(err => {
            console.error('Error loading bill:', err);
            alert('Error loading bill: ' + (err.message || err));
        });
}

function generateBillHTML(caseData, charges, payments, totalCharges, discount, totalAfterDiscount, totalPaid, balance) {
    const billDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const billTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Generate an invoice number: INV-CASE_NUM-DATE
    const dateSlug = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const invoiceNumber = `INV-${caseData.case_number || 'N/A'}-${dateSlug}`;

    // Determine watermark text and theme color
    let statusText = 'DRAFT';
    let themeColor = '#64748b'; // Slate

    if (caseData.status === 'closed') {
        statusText = 'FINAL BILL';
        themeColor = '#1e40af'; // Navy Blue
    } else if (Math.abs(balance) < 0.01) {
        statusText = 'PAID';
        themeColor = '#059669'; // Emerald
    } else if (totalPaid > 0) {
        statusText = 'PARTIAL';
        themeColor = '#f59e0b'; // Amber
    }

    return `
        <div class="bill-container" style="max-width: 210mm; margin: 0 auto; background: white; padding: 40px; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; position: relative; border: 1px solid #e2e8f0; border-top: 10px solid ${themeColor}; box-sizing: border-box;">
            
            <!-- Background Watermark for Print -->
            <div class="bill-watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: 900; color: ${themeColor}; opacity: 0.03; z-index: 1; pointer-events: none; white-space: nowrap; display: none;">
                ${statusText}
            </div>

            <!-- Top Header Section: Hospital Info & Invoice Status -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; position: relative; z-index: 2;">
                <div>
                    <div style="margin-bottom: 5px;">
                        <img src="https://lifeplushospital.in/img/logo-1.jpg" alt="Life Plus Hospital" style="height: 60px; width: auto; object-fit: contain;">
                    </div>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                        Row House no: 44, Green Park Society, <br>
                        Lodha Casa Rio Gold Road, Dombivli, Thane 421204<br>
                        PH: +91 93726 74711 | URL: lifeplushospital.in<br>
                        Email: billing@lifeplushospital.com | GSTIN: 07AAALH0000Z1Z5
                    </p>
                </div>
                <div style="text-align: right;">
                    <div style="background: ${themeColor}10; color: ${themeColor}; padding: 6px 16px; border-radius: 6px; display: inline-block; font-weight: 800; font-size: 14px; margin-bottom: 12px; border: 1px solid ${themeColor}30;">
                        ${statusText}
                    </div>
                    <p style="margin: 0; font-size: 24px; font-weight: 800; color: #1e293b;">INVOICE</p>
                    <p style="margin: 4px 0; color: #64748b; font-weight: 600; font-size: 14px;"># ${invoiceNumber}</p>
                </div>
            </div>

            <hr style="border: 0; border-top: 2px solid #f1f5f9; margin-bottom: 30px;">

            <!-- 2-Column Patient & Bill Metadata -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; position: relative; z-index: 2;">
                <div>
                    <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 12px;">Bill To / Patient</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1e293b;">${caseData.patient?.name || ''}</p>
                    <p style="margin: 4px 0; color: #475569; font-size: 14px;">Phone: ${caseData.patient?.phone || 'N/A'}</p>
                    ${caseData.patient?.email ? `<p style="margin: 2px 0; color: #475569; font-size: 14px;">Email: ${caseData.patient.email}</p>` : ''}
                    ${caseData.patient?.address ? `<p style="margin: 8px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.4; max-width: 250px;">${caseData.patient.address}</p>` : ''}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px;">Invoiced On</p>
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #334155;">${billDate}</p>
                    </div>
                    <div>
                        <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px;">Case ID</p>
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #334155;">${caseData.case_number || 'N/A'}</p>
                    </div>
                    <div>
                        <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px;">Admission</p>
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #334155;">${caseData.admission_date ? new Date(caseData.admission_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                    </div>
                    ${caseData.discharge_date ? `
                    <div>
                        <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px;">Discharge</p>
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #334155;">${new Date(caseData.discharge_date).toLocaleDateString('en-IN')}</p>
                    </div>` : ''}
                    ${caseData.billed_at ? `
                    <div style="grid-column: span 2;">
                        <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px;">Billed At</p>
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #059669;">${new Date(caseData.billed_at).toLocaleString('en-IN')}</p>
                    </div>` : ''}
                </div>
            </div>

            <!-- Charge Details Section -->
            <div style="position: relative; z-index: 2; margin-bottom: 40px;">
                <h3 style="font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 20px;">
                    Itemized Breakdown
                </h3>
                
                <p style="margin: 25px 0 10px 0; font-weight: 800; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">🏥 Standard Hospital Charges</p>
                ${renderInvoiceCategoryTable(charges.filter(c => !c.is_doctor_charge && (!c.charge_type || c.charge_type === 'hospital')), 'hospital')}

                <p style="margin: 25px 0 10px 0; font-weight: 800; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">👨‍⚕️ Professional Doctor Fees</p>
                ${renderInvoiceCategoryTable(charges.filter(c => c.is_doctor_charge), 'doctor')}

                <p style="margin: 25px 0 10px 0; font-weight: 800; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">🧪 Pathology Investigations</p>
                ${renderInvoiceCategoryTable(charges.filter(c => c.charge_type === 'pathology'), 'pathology')}

                <p style="margin: 25px 0 10px 0; font-weight: 800; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">💊 Pharmacy & Supplies</p>
                ${renderInvoiceCategoryTable(charges.filter(c => c.charge_type === 'pharmacy'), 'pharmacy')}
            </div>

            <!-- Financials Summary & Official Footer Block -->
            <div style="display: flex; justify-content: flex-end; margin-top: 40px; position: relative; z-index: 2;">
                <!-- Summary Table -->
                <div style="width: 350px;">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 12px 20px; color: #475569; font-size: 14px;">Total Gross Amount</td>
                                <td style="padding: 12px 20px; text-align: right; color: #1e293b; font-weight: 700; font-size: 14px;">₹${totalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            ${discount > 0 ? `
                            <tr>
                                <td style="padding: 12px 20px; color: #dc2626; font-size: 14px;">Discount Applied</td>
                                <td style="padding: 12px 20px; text-align: right; color: #dc2626; font-weight: 700; font-size: 14px;">-₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr style="background: #f1f5f9;">
                                <td style="padding: 12px 20px; color: #1e293b; font-size: 14px; font-weight: 700;">Net Payable</td>
                                <td style="padding: 12px 20px; text-align: right; color: #1e293b; font-weight: 800; font-size: 15px;">₹${totalAfterDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 12px 20px; color: #059669; font-size: 14px;">Total Amount Paid</td>
                                <td style="padding: 12px 20px; text-align: right; color: #059669; font-weight: 700; font-size: 14px;">₹${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr style="background: ${themeColor}; color: white;">
                                <td style="padding: 18px 20px; font-weight: 800; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px;">Outstanding Balance</td>
                                <td style="padding: 18px 20px; text-align: right; font-weight: 900; font-size: 18px;">₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Footer & Signature -->
            <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 2;">
                <div style="color: #94a3b8; font-size: 11px;">
                    <p style="margin: 0;">&nbsp;</p>
                    <p style="margin: 4px 0;">Generated on ${billDate} at ${billTime}</p>
                    <p style="margin: 4px 0;">System Auth Code: LP-BILL-SYS-9941</p>
                </div>
                <div style="text-align: center; border-top: 1px solid #cbd5e1; width: 220px; padding-top: 10px;">
                    <p style="margin: 0; font-size: 12px; font-weight: 700; color: #475569;">Authorized Signatory</p>
                    <p style="margin: 2px 0; font-size: 10px; color: #94a3b8;">(Digital Seal Attached)</p>
                </div>
            </div>

            <div style="margin-top: 40px; text-align: center; color: #64748b; font-size: 11px; font-style: italic; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                This is a computer-authorized document and does not require a physical signature.<br>
                Thank you for trusting Life Plus Hospital with your healthcare needs. Wishing you a speedy recovery!
            </div>
        </div>
    `;
}

function printBill() {
    const billContent = document.getElementById('billContent');
    if (billContent) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Bill / Invoice</title>
                    <style>
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                        }
                        body { 
                            margin: 0; 
                            padding: 0; 
                            font-family: Arial, sans-serif;
                            background: white;
                        }
                        .bill-container {
                            max-width: 210mm;
                            margin: 0 auto;
                            padding: 0;
                            background: white;
                        }
                        .bill-header {
                            padding-top: 80mm !important;
                        }
                        .bill-watermark {
                            display: block !important;
                        }
                        @media print {
                            @page {
                                size: A4;
                                margin: 0;
                            }
                            body {
                                margin: 0;
                                padding: 0;
                            }
                            .bill-container {
                                max-width: 210mm;
                                margin: 0;
                                padding: 0;
                            }
                            .bill-header {
                                padding-top: 80mm !important;
                                page-break-after: avoid;
                            }
                            .bill-watermark {
                                display: block !important;
                            }
                            table {
                                page-break-inside: auto;
                            }
                            tr {
                                page-break-inside: avoid;
                                page-break-after: auto;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${billContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }
}

function handleBillLightboxKeydown(event) {
    if (event.key === 'Escape') {
        closeBillLightbox();
    }
}

function closeBillLightbox(event) {
    if (event && event.target.id !== 'billLightbox' && !event.target.closest('.prescription-lightbox-container')) {
        return;
    }
    const lightbox = document.getElementById('billLightbox');
    if (lightbox) {
        lightbox.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleBillLightboxKeydown);
    }
}


function closeCaseAndBill(caseId) {
    // First check if case can be closed (balance must be 0)
    fetch(`${API_BASE}/billing/case/${caseId}`)
        .then(res => res.json())
        .then(data => {
            const balance = data.balance || 0;

            // Check if balance is zero (fully paid)
            if (Math.abs(balance) > 0.01) {
                alert(`Cannot close case. Outstanding balance: ₹ ${balance.toFixed(2)}\n\nPlease ensure all payments are completed before closing the case.`);
                return;
            }

            if (!confirm('Close this case? This action cannot be undone. The case will be marked as closed and no further modifications will be allowed.')) {
                return;
            }

            fetch(`${API_BASE}/billing/close-case/${caseId}`, {
                method: 'PUT'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.message) {
                        alert('Case closed successfully!');
                        closeBillLightbox();
                        // Reload billing details
                        loadCaseBilling(caseId);
                    } else {
                        alert('Error closing case: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(err => {
                    console.error('Error closing case:', err);
                    alert('Error closing case: ' + err);
                });
        })
        .catch(err => {
            console.error('Error checking case balance:', err);
            alert('Error checking case balance: ' + err);
        });
}

function closeBillingModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// ==================== CHARGE MASTER MODULE ====================

function loadChargeMaster() {
    // Fetch a larger limit or handle server-side if needed, but for now client-side with high limit
    fetch(`${API_BASE}/charge-master?limit=1000`)
        .then(res => res.json())
        .then(data => {
            const charges = data.charges || data;

            const html = `
                <div class="module-content">
                    <div class="module-header" style="margin-bottom: 20px;">
                        <h1>Charge Master</h1>
                        <button class="btn btn-primary" onclick="showChargeMasterForm()">Add Charge</button>
                    </div>
                    
                    <table id="chargeMasterTable" class="display" style="width:100%">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Charge Category</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.isArray(charges) && charges.length > 0 ? charges.map(charge => `
                                <tr>
                                    <td>${charge.name || ''}</td>
                                    <td>${charge.category || ''}</td>
                                    <td>${charge.charge_category || ''}</td>
                                    <td>${charge.amount || ''}</td>
                                    <td>
                                        <button class="btn btn-success" onclick="editChargeMaster('${charge.id}')">Edit</button>
                                        <button class="btn btn-danger" onclick="deleteChargeMaster('${charge.id}')">Delete</button>
                                    </td>
                                </tr>
                            `).join('') : ''}
                        </tbody>
                    </table>
                </div>
            `;
            document.getElementById('content-area').innerHTML = html;

            // Initialize DataTable after DOM update
            setTimeout(() => {
                if (window.jQuery && window.jQuery.fn.DataTable) {
                    $('#chargeMasterTable').DataTable({
                        pageLength: 25,
                        order: [[0, 'asc']], // Sort by name by default
                        columnDefs: [
                            { orderable: false, targets: 4 } // Actions column not sortable
                        ],
                        responsive: true
                    });
                }
                afterContentLoad();
            }, 0);
        })
        .catch(err => console.error('Error loading charge master:', err));
}

function showChargeMasterForm(chargeId = null) {
    Promise.all([
        chargeId ? fetch(`${API_BASE}/charge-master/${chargeId}`).then(res => res.json()) : Promise.resolve(null),
        fetch(`${API_BASE}/charge-category-master`).then(res => res.json())
    ]).then(([charge, categories]) => {
        const title = chargeId ? 'Edit Charge' : 'Add Charge';
        const categoryOptions = Array.isArray(categories) ? categories.map(c => `<option value="${c.name || ''}">`).join('') : '';

        const html = `
            <div class="modal">
                <div class="modal-content">
                    <h2>${title}</h2>
                    <form id="chargeMasterForm" onsubmit="saveChargeMaster(event, '${chargeId || ''}')">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" value="${charge?.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Category</label>
                            <input type="text" name="category" value="${charge?.category || ''}">
                        </div>
                        <div class="form-group">
                            <label>Charge Category</label>
                            <input type="text" name="charge_category" id="chargeCategoryInput" list="chargeCategoriesList" value="${charge?.charge_category || ''}" placeholder="Type or select category...">
                            <datalist id="chargeCategoriesList">
                                ${categoryOptions}
                            </datalist>
                        </div>
                        <div class="form-group">
                            <label>Amount</label>
                            <input type="number" name="amount" step="0.01" value="${charge?.amount || ''}" required>
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
        setTimeout(afterContentLoad, 0);
    }).catch(err => {
        console.error('Error loading charge master form:', err);
        alert('Error loading form data');
    });
}

function saveChargeMaster(event, chargeId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    const chargeCategory = data.charge_category;

    // First save the charge category to master if it's new
    const saveCategoryPromise = chargeCategory ?
        fetch(`${API_BASE}/charge-category-master`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: chargeCategory })
        }).then(res => res.json()) :
        Promise.resolve();

    saveCategoryPromise.then(() => {
        const url = chargeId ? `${API_BASE}/charge-master/${chargeId}` : `${API_BASE}/charge-master`;
        const method = chargeId ? 'PUT' : 'POST';

        return fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    })
        .then(() => loadChargeMaster())
        .catch(err => alert('Error saving charge: ' + err));
}

function editChargeMaster(id) {
    showChargeMasterForm(id);
}

function deleteChargeMaster(id) {
    if (confirm('Are you sure you want to delete this charge?')) {
        fetch(`${API_BASE}/charge-master/${id}`, { method: 'DELETE' })
            .then(() => loadChargeMaster())
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
                    <button class="btn btn-primary" onclick="loadPayoutRecords(1)">Load Records</button>
                    <button class="btn btn-secondary" onclick="generatePayoutReport()">Generate Report</button>
                </div>
            </div>
            <div id="payoutTableContainer" class="table-scroll-container"></div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
    loadPayoutRecords(1);
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
                <div class="table-scroll-container" style="max-height: calc(100vh - 350px); overflow-y: auto;">
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
                </div>
                <div class="pagination" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        ${page > 1 ? `<button class="btn btn-secondary" onclick="loadPayoutRecords(${page - 1})">Previous</button>` : '<span></span>'}
                        <span style="margin: 0 15px;">Page ${page} of ${totalPages}</span>
                        ${page < totalPages ? `<button class="btn btn-secondary" onclick="loadPayoutRecords(${page + 1})">Next</button>` : '<span></span>'}
                    </div>
                    <div style="color: #666;">Total: ${total} payout records</div>
                </div>
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: status })
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
    const startDate = document.getElementById('payoutStartDate')?.value || '';
    const endDate = document.getElementById('payoutEndDate')?.value || '';
    const status = document.getElementById('payoutStatusFilter')?.value || '';

    // Build URL with filters
    let url = `${API_BASE}/payouts/export-excel?`;
    const params = [];
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    if (status) params.push(`payment_status=${status}`);
    url += params.join('&');

    // Show loading message
    const originalText = event?.target?.textContent || 'Generate Report';
    if (event?.target) {
        event.target.textContent = 'Generating...';
        event.target.disabled = true;
    }

    // Fetch and download Excel file
    fetch(url)
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to generate report');
            }
            return res.blob();
        })
        .then(blob => {
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Generate filename with date range
            let filename = 'payouts_report';
            if (startDate && endDate) {
                filename += `_${startDate}_to_${endDate}`;
            } else if (startDate) {
                filename += `_from_${startDate}`;
            } else if (endDate) {
                filename += `_until_${endDate}`;
            }
            filename += '.xlsx';

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            // Reset button
            if (event?.target) {
                event.target.textContent = originalText;
                event.target.disabled = false;
            }

            alert('Report downloaded successfully!');
        })
        .catch(err => {
            console.error('Error generating report:', err);
            alert('Error generating report: ' + (err.message || err));

            // Reset button
            if (event?.target) {
                event.target.textContent = originalText;
                event.target.disabled = false;
            }
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

// ==================== USER MANAGEMENT MODULE ====================

function loadUsers() {
    fetch(`${API_BASE}/users`, {
        headers: getAuthHeaders()
    })
        .then(res => res.json())
        .then(users => {
            if (users.error) {
                alert('Error: ' + users.error);
                return;
            }

            const html = `
            <div class="module-content">
                <div class="module-header">
                    <h1>User Management</h1>
                    <button class="btn btn-primary" onclick="showUserForm()">Add User</button>
                </div>
                <div class="table-scroll-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.length > 0 ? users.map(u => `
                                <tr>
                                    <td>${u.username || ''}</td>
                                    <td>${u.full_name || ''}</td>
                                    <td>${u.email || ''}</td>
                                    <td>${u.role || 'user'}</td>
                                    <td><span style="color: ${u.is_active ? '#10b981' : '#dc2626'}; font-weight: 600;">${u.is_active ? 'Active' : 'Inactive'}</span></td>
                                    <td>
                                        <button class="btn btn-success" onclick="showUserForm('${u.id}')">Edit</button>
                                        ${u.username !== 'sunilsahu' ? `<button class="btn btn-danger" onclick="deleteUser('${u.id}')">Delete</button>` : ''}
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="6" style="text-align: center;">No users found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
            document.getElementById('content-area').innerHTML = html;
        })
        .catch(err => {
            console.error('Error loading users:', err);
            alert('Error loading users: ' + err);
        });
}



function showUserForm(userId = null) {
    const title = userId ? 'Edit User' : 'Add User';
    const modules = ['doctors', 'doctor-charges', 'patients', 'cases', 'appointments', 'billing-payments', 'charge-master', 'payouts', 'reports'];

    let formHTML = `
        <div class="modal">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <h2>${title}</h2>
                <form id="userForm" onsubmit="saveUser(event, '${userId || ''}')">
                    <div class="form-group">
                        <label>Username *</label>
                        <input type="text" name="username" id="userUsername" required ${userId ? 'readonly style="background: #f0f0f0;"' : ''}>
                    </div>
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" name="full_name" id="userFullName">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" id="userEmail">
                    </div>
                    ${!userId ? `
                    <div class="form-group">
                        <label>Password *</label>
                        <input type="password" name="password" required>
                    </div>
                    ` : `
                    <div class="form-group">
                        <label>New Password (leave blank to keep current)</label>
                        <input type="password" name="password">
                    </div>
                    `}
                    <div class="form-group">
                        <label>Status</label>
                        <select name="is_active" id="userIsActive">
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Module Permissions</label>
                        <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px; max-height: 400px; overflow-y: auto;">
                            ${modules.map(module => `
                                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                                    <div style="font-weight: 600; margin-bottom: 8px; text-transform: capitalize;">${module.replace('-', ' ')}</div>
                                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                                        <label style="display: flex; align-items: center; cursor: pointer;">
                                            <input type="checkbox" name="permissions[${module}][view]" id="perm_${module}_view" style="margin-right: 6px;">
                                            <span>View</span>
                                        </label>
                                        <label style="display: flex; align-items: center; cursor: pointer;">
                                            <input type="checkbox" name="permissions[${module}][edit]" id="perm_${module}_edit" style="margin-right: 6px;">
                                            <span>Edit</span>
                                        </label>
                                        <label style="display: flex; align-items: center; cursor: pointer;">
                                            <input type="checkbox" name="permissions[${module}][delete]" id="perm_${module}_delete" style="margin-right: 6px;">
                                            <span>Delete</span>
                                        </label>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" onclick="loadUsers()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = formHTML;

    if (userId) {
        fetch(`${API_BASE}/users`, {
            headers: getAuthHeaders()
        })
            .then(res => res.json())
            .then(users => {
                const user = users.find(u => u.id === userId);
                if (user) {
                    document.getElementById('userUsername').value = user.username || '';
                    document.getElementById('userFullName').value = user.full_name || '';
                    document.getElementById('userEmail').value = user.email || '';
                    document.getElementById('userIsActive').value = user.is_active ? 'true' : 'false';

                    // Set permissions
                    const permissions = user.permissions || {};
                    modules.forEach(module => {
                        const modulePerms = permissions[module] || {};
                        document.getElementById(`perm_${module}_view`).checked = modulePerms.view || false;
                        document.getElementById(`perm_${module}_edit`).checked = modulePerms.edit || false;
                        document.getElementById(`perm_${module}_delete`).checked = modulePerms.delete || false;
                    });
                }
            });
    }
}

function saveUser(event, userId) {
    event.preventDefault();
    const formData = new FormData(event.target);

    // Build permissions object
    const permissions = {};
    const modules = ['doctors', 'doctor-charges', 'patients', 'cases', 'appointments', 'billing-payments', 'charge-master', 'payouts', 'reports'];

    modules.forEach(module => {
        const view = formData.get(`permissions[${module}][view]`) === 'on';
        const edit = formData.get(`permissions[${module}][edit]`) === 'on';
        const del = formData.get(`permissions[${module}][delete]`) === 'on';

        if (view || edit || del) {
            permissions[module] = { view, edit, delete: del };
        }
    });

    const data = {
        username: formData.get('username'),
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        is_active: formData.get('is_active') === 'true',
        permissions: permissions
    };

    if (formData.get('password')) {
        data.password = formData.get('password');
    }

    const url = userId ? `${API_BASE}/users/${userId}` : `${API_BASE}/users`;
    const method = userId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                alert(data.message || 'User saved successfully');
                loadUsers();
            }
        })
        .catch(err => {
            console.error('Error saving user:', err);
            alert('Error saving user: ' + err);
        });
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                alert('User deleted successfully');
                loadUsers();
            }
        })
        .catch(err => {
            console.error('Error deleting user:', err);
            alert('Error deleting user: ' + err);
        });
}

// ==================== ACTIVITY LOGS MODULE ====================

let currentActivityLogsPage = 1;
const activityLogsPageLimit = 50;

function loadActivityLogs(page = 1) {
    currentActivityLogsPage = page;

    const usernameFilter = document.getElementById('activityUsernameFilter')?.value || '';
    const moduleFilter = document.getElementById('activityModuleFilter')?.value || '';
    const actionFilter = document.getElementById('activityActionFilter')?.value || '';

    let url = `${API_BASE}/activity-logs?page=${page}&limit=${activityLogsPageLimit}`;
    if (usernameFilter) url += `&username=${encodeURIComponent(usernameFilter)}`;
    if (moduleFilter) url += `&module=${encodeURIComponent(moduleFilter)}`;
    if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;

    fetch(url, {
        headers: getAuthHeaders()
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
                return;
            }

            const logs = data.logs || [];
            const total = data.total || 0;
            const totalPages = Math.max(1, Math.ceil(total / activityLogsPageLimit));

            const html = `
            <div class="module-content">
                <div class="module-header">
                    <h1>Activity Logs</h1>
                </div>
                <div style="margin-bottom: 20px; padding: 16px; background: #f9fafb; border-radius: 4px;">
                    <h3 style="margin-bottom: 12px;">Filters</h3>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-size: 14px;">Username</label>
                            <input type="text" id="activityUsernameFilter" placeholder="Filter by username..." 
                                   value="${usernameFilter}" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-size: 14px;">Module</label>
                            <select id="activityModuleFilter" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="">All Modules</option>
                                <option value="doctors">Doctors</option>
                                <option value="doctor-charges">Doctor Charges</option>
                                <option value="patients">Patients</option>
                                <option value="cases">Cases</option>
                                <option value="appointments">Appointments</option>
                                <option value="billing-payments">Billing & Payments</option>
                                <option value="charge-master">Charge Master</option>
                                <option value="payouts">Payouts</option>
                                <option value="reports">Reports</option>
                                <option value="users">Users</option>
                                <option value="activity-logs">Activity Logs</option>
                                <option value="auth">Authentication</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-size: 14px;">Action</label>
                            <select id="activityActionFilter" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="">All Actions</option>
                                <option value="view">View</option>
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                                <option value="login">Login</option>
                                <option value="logout">Logout</option>
                            </select>
                        </div>
                        <div style="display: flex; align-items: flex-end;">
                            <button class="btn btn-primary" onclick="loadActivityLogs(1)">Apply Filters</button>
                        </div>
                    </div>
                </div>
                <div class="table-scroll-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Username</th>
                                <th>Action</th>
                                <th>Module</th>
                                <th>Details</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.length > 0 ? logs.map(log => {
                const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : '';
                const details = log.details ? JSON.stringify(log.details) : '';
                return `
                                <tr>
                                    <td>${timestamp}</td>
                                    <td>${log.username || ''}</td>
                                    <td><span style="padding: 4px 8px; border-radius: 4px; background: ${getActionColor(log.action)}; color: white; font-size: 12px; font-weight: 600;">${log.action || ''}</span></td>
                                    <td>${log.module || ''}</td>
                                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${details}">${details || '-'}</td>
                                    <td>${log.ip_address || '-'}</td>
                                </tr>
                            `;
            }).join('') : '<tr><td colspan="6" style="text-align: center;">No activity logs found</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <div class="pagination" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        ${currentActivityLogsPage > 1 ? `<button class="btn btn-secondary" onclick="loadActivityLogs(${currentActivityLogsPage - 1})">Previous</button>` : ''}
                        <span style="margin: 0 15px;">Page ${currentActivityLogsPage} of ${totalPages}</span>
                        ${currentActivityLogsPage < totalPages ? `<button class="btn btn-secondary" onclick="loadActivityLogs(${currentActivityLogsPage + 1})">Next</button>` : ''}
                    </div>
                    <div style="color: #666;">Total: ${total} logs</div>
                </div>
            </div>
        `;

            document.getElementById('content-area').innerHTML = html;

            // Set filter values
            if (document.getElementById('activityModuleFilter')) {
                document.getElementById('activityModuleFilter').value = moduleFilter;
            }
            if (document.getElementById('activityActionFilter')) {
                document.getElementById('activityActionFilter').value = actionFilter;
            }
        })
        .catch(err => {
            console.error('Error loading activity logs:', err);
            alert('Error loading activity logs: ' + err);
        });
}

function getActionColor(action) {
    const colors = {
        'view': '#3b82f6',
        'create': '#10b981',
        'update': '#f59e0b',
        'delete': '#dc2626',
        'login': '#8b5cf6',
        'logout': '#6b7280'
    };
    return colors[action] || '#6b7280';
}

// Helper to render grouped charges in Billing view
function renderBillingGroupTable(charges, type, caseId) {
    if (!charges || charges.length === 0) {
        return `<p style="color: #94a3b8; font-style: italic; padding: 10px; background: #f8fafc; border-radius: 4px; border: 1px dashed #e2e8f0; margin-bottom: 20px;">No ${type} charges found.</p>`;
    }

    const isAdmin = currentUser && currentUser.role === 'admin';

    // Grouping logic for Hospital and Doctor Charges
    let displayCharges = charges;
    if (type === 'hospital' || type === 'doctor') {
        const groups = {};
        charges.forEach(c => {
            const name = c.charge_name || c.description || 'N/A';
            const dateStr = c.charge_date ? new Date(c.charge_date).toLocaleDateString() : (c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A');

            let key = `${name}|${dateStr}`;
            if (type === 'doctor') {
                const doctor = c.doctor_name || 'Unknown Doctor';
                key += `|${doctor}`;
            }

            if (!groups[key]) {
                groups[key] = {
                    ...c,
                    quantity: 0,
                    total_amount: 0,
                    ids: []
                };
            }
            groups[key].quantity += (c.quantity || 1);
            groups[key].total_amount += (c.total_amount || 0);
            groups[key].ids.push(c.id);
        });
        displayCharges = Object.values(groups);

        // Optional: Sort by date descending
        displayCharges.sort((a, b) => {
            const dateA = a.charge_date ? new Date(a.charge_date) : (a.created_at ? new Date(a.created_at) : new Date(0));
            const dateB = b.charge_date ? new Date(b.charge_date) : (b.created_at ? new Date(b.created_at) : new Date(0));
            return dateB - dateA;
        });
    }

    return `
        <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 6px;">
            <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f8fafc;">
                    <tr style="border-bottom: 2px solid #e2e8f0;">
                        <th style="text-align: left; padding: 12px;">Date</th>
                        <th style="text-align: left; padding: 12px;">Details</th>
                        ${type === 'doctor' ? '<th style="text-align: left; padding: 12px;">Doctor</th>' : ''}
                        <th style="text-align: center; padding: 12px;">Qty</th>
                        ${type !== 'pathology' && type !== 'pharmacy' ? '<th style="text-align: right; padding: 12px;">Amount</th>' : ''}
                        <th style="text-align: right; padding: 12px;">Total</th>
                        ${isAdmin && type !== 'hospital' && type !== 'doctor' ? '<th style="text-align: center; padding: 12px;">Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${displayCharges.map(c => `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 10px;">
                                ${c.charge_date ? new Date(c.charge_date).toLocaleDateString() : (c.created_at ? new Date(c.created_at).toLocaleDateString() : '')}
                            </td>
                            <td style="padding: 10px;">${c.charge_name || c.description || 'N/A'}</td>
                            ${type === 'doctor' ? `<td style="padding: 10px;">${c.doctor_name || '-'}</td>` : ''}
                            <td style="padding: 10px; text-align: center;">${c.quantity || 1}</td>
                            ${type !== 'pathology' && type !== 'pharmacy' ? `<td style="padding: 10px; text-align: right;">₹${(c.unit_amount || c.rate || 0).toLocaleString('en-IN')}</td>` : ''}
                            <td style="padding: 10px; text-align: right; font-weight: 600;">₹${(c.total_amount || 0).toLocaleString('en-IN')}</td>
                            ${isAdmin && type !== 'hospital' && type !== 'doctor' ? `
                                <td style="padding: 10px; text-align: center;">
                                    <button class="btn btn-danger btn-sm" onclick="deleteCaseCharge('${c.id}', '${caseId}')" title="Delete Charge">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function deleteCaseCharge(chargeId, caseId) {
    if (!confirm('Are you sure you want to delete this charge? This action cannot be undone.')) {
        return;
    }

    fetch(`${API_BASE}/case-charges/${chargeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                alert('Charge deleted successfully!');
                // Reload billing details
                loadCaseBilling(caseId);
            } else {
                alert('Error deleting charge: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            console.error('Error deleting charge:', err);
            alert('Error deleting charge: ' + err);
        });
}

// Helper to render payments history in Billing view
function renderPaymentsHistoryTable(payments) {
    if (!payments || payments.length === 0) {
        return '<p style="color: #9a6e3a; font-style: italic;">No payments recorded for this case yet.</p>';
    }

    return `
        <div class="table-scroll-container" style="max-height: 200px; overflow-y: auto;">
            <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <thead style="background: #fffaf0; color: #9a6e3a;">
                    <tr style="border-bottom: 1px solid #feebc8;">
                        <th style="text-align: left; padding: 10px;">Date</th>
                        <th style="text-align: left; padding: 10px;">Mode</th>
                        <th style="text-align: left; padding: 10px;">Reference</th>
                        <th style="text-align: right; padding: 10px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments.map(p => `
                        <tr style="border-bottom: 1px solid #fff5f5;">
                            <td style="padding: 10px;">${p.payment_date ? new Date(p.payment_date).toLocaleDateString() : ''}</td>
                            <td style="padding: 10px;">
                                <span style="display: inline-block; padding: 2px 8px; background: #feebc8; border-radius: 12px; font-size: 11px; font-weight: 600; color: #9a6e3a;">
                                    ${p.payment_mode || 'Cash'}
                                </span>
                            </td>
                            <td style="padding: 10px; font-size: 0.9em; color: #64748b;">${p.payment_reference_number || '-'}</td>
                            <td style="padding: 10px; text-align: right; font-weight: 700; color: #166534;">₹${(p.amount || 0).toLocaleString('en-IN')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Show/Add Payment modal in Billing Module
function showBillingAddPaymentModal(caseId, currentBalance) {
    const html = `
        <div class="modal" id="billingPaymentModal">
            <div class="modal-content" style="max-width: 450px;">
                <h2 style="margin-top: 0; color: #2d3748; display: flex; align-items: center; gap: 10px;">
                    💰 Record Payment
                </h2>
                <div style="margin-bottom: 20px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
                    <span style="color: #166534;">Outstanding Balance:</span>
                    <strong style="color: #15803d; font-size: 1.2em; display: block;">₹${currentBalance.toLocaleString('en-IN')}</strong>
                </div>
                <form id="billingPaymentForm" onsubmit="saveBillingPayment(event, '${caseId}')">
                    <div class="form-group">
                        <label>Amount to Pay *</label>
                        <input type="number" name="amount" step="0.01" min="1" max="${currentBalance + 1.1}" value="${currentBalance.toFixed(2)}" required style="font-size: 1.1em; font-weight: 600;">
                    </div>
                    <div class="form-group">
                        <label>Payment Mode *</label>
                        <select name="payment_mode" required>
                            <option value="Cash">Cash</option>
                            <option value="UPI / QR Code">UPI / QR Code</option>
                            <option value="Debit / Credit Card">Debit / Credit Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Reference No. / Transaction ID</label>
                        <input type="text" name="payment_reference_number" placeholder="Optional">
                    </div>
                    <div class="form-group">
                        <label>Remarks</label>
                        <textarea name="notes" placeholder="Any additional notes..." rows="2"></textarea>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 24px;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Save Payment</button>
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('billingPaymentModal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

// Global exposure for billing functions
window.loadBillingPayments = loadBillingPayments;
window.searchPatientsForBilling = searchPatientsForBilling;
window.selectBillingPatient = selectBillingPatient;
window.loadCaseBilling = loadCaseBilling;
window.showBillingAddPaymentModal = showBillingAddPaymentModal;
window.renderBillingGroupTable = renderBillingGroupTable;
window.renderPaymentsHistoryTable = renderPaymentsHistoryTable;

// Helper to render simple table for invoice PDF
function renderInvoiceCategoryTable(charges, type = 'hospital') {
    if (!charges || charges.length === 0) {
        return '<p style="color: #94a3b8; font-style: italic; font-size: 12px; margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #f1f5f9;">No charges recorded in this category.</p>';
    }

    // Grouping Logic (Mirrors renderBillingGroupTable)
    let displayCharges = charges;
    if (type === 'hospital' || type === 'doctor') {
        const groups = {};
        charges.forEach(c => {
            const name = c.charge_name || c.description || 'N/A';
            const dateStr = c.charge_date ? new Date(c.charge_date).toLocaleDateString() : (c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A');

            let key = `${name}|${dateStr}`;
            if (type === 'doctor') {
                const doctor = c.doctor_name || 'Unknown Doctor';
                key += `|${doctor}`;
            }

            if (!groups[key]) {
                groups[key] = {
                    ...c,
                    quantity: 0,
                    total_amount: 0
                };
            }
            groups[key].quantity += (c.quantity || 1);
            groups[key].total_amount += (c.total_amount || 0);
        });
        displayCharges = Object.values(groups);

        // Sort by date descending
        displayCharges.sort((a, b) => {
            const dateA = a.charge_date ? new Date(a.charge_date) : (a.created_at ? new Date(a.created_at) : new Date(0));
            const dateB = b.charge_date ? new Date(b.charge_date) : (b.created_at ? new Date(b.created_at) : new Date(0));
            return dateB - dateA;
        });
    }

    const showAmount = type !== 'pathology' && type !== 'pharmacy';
    const descriptionTitle = type === 'doctor' ? 'Doctor & Specialization' : 'Description';

    return `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border-radius: 6px; overflow: hidden; border: 1px solid #f1f5f9; position: relative;">
            <thead>
                <tr style="background: #f1f5f9; color: #475569;">
                    <th style="padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; width: 14%;">Date</th>
                    <th style="padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; width: ${showAmount ? '60%' : '76%'};">${descriptionTitle}</th>
                    <th style="padding: 10px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; width: 10%;">Qty</th>
                    ${showAmount ? '<th style="padding: 10px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; width: 16%;">Rate</th>' : ''}
                    <th style="padding: 10px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; width: 16%;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${displayCharges.map((c, idx) => `
                    <tr style="background: ${idx % 2 === 0 ? '#fff' : '#fcfcfd'};">
                        <td style="padding: 10px; border-bottom: 1px solid #f8fafc; font-size: 12px; color: #64748b;">${c.charge_date ? new Date(c.charge_date).toLocaleDateString() : (c.created_at ? new Date(c.created_at).toLocaleDateString() : '')}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #f8fafc; font-size: 12px; font-weight: 600; color: #1e293b;">
                            ${type === 'doctor'
            ? `<div>${c.doctor_name || 'Unknown Doctor'}</div><div style="font-size: 11px; color: #64748b; font-weight: 400; margin-top: 2px;">${c.doctor_specialization || c.specialization || ''}</div>`
            : (c.charge_name || c.description || 'N/A')}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #f8fafc; font-size: 12px; text-align: center; color: #475569;">${c.quantity || 1}</td>
                        ${showAmount ? `<td style="padding: 10px; border-bottom: 1px solid #f8fafc; font-size: 12px; text-align: right; color: #64748b;">₹${(c.unit_amount || c.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : ''}
                        <td style="padding: 10px; border-bottom: 1px solid #f8fafc; font-size: 12px; text-align: right; font-weight: 700; color: #1e293b;">₹${(c.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.renderInvoiceCategoryTable = renderInvoiceCategoryTable;

