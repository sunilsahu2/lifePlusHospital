// Patient Detail View Module
// Handles loading and displaying detailed patient information with tabs

// Load patient detail view
function loadPatientDetail(patientId) {
    if (!patientId) {
        alert('Patient ID is required');
        return;
    }

    const contentArea = document.getElementById('content-area');

    // Show loading state
    contentArea.innerHTML = `
        <div class="module-content">
            <div class="loading-spinner" style="padding: 60px; text-align: center;">
                Loading patient details...
            </div>
        </div>
    `;

    // Fetch patient data
    Promise.all([
        fetch(`${API_BASE}/patients/${patientId}`).then(r => r.json()),
        fetch(`${API_BASE}/cases?patient_id=${patientId}&limit=100`).then(r => r.json()),
        fetch(`${API_BASE}/appointments?patient_id=${patientId}&limit=100`).then(r => r.json()),
        fetch(`${API_BASE}/prescriptions?patient_id=${patientId}&limit=100`).then(r => r.json())
    ]).then(([patient, casesData, appointmentsData, prescriptionsData]) => {
        if (patient.error) {
            contentArea.innerHTML = `
                <div class="module-content">
                    <div class="error-state">
                        <p>Error loading patient: ${patient.error}</p>
                        <button class="btn btn-primary" onclick="loadPatients()">Back to Patients</button>
                    </div>
                </div>
            `;
            return;
        }

        const cases = casesData.cases || [];
        const appointments = appointmentsData.appointments || [];
        const prescriptions = prescriptionsData.prescriptions || [];

        // Calculate billing summary from cases
        const totalAmount = cases.reduce((sum, c) => sum + (c.charges_total || 0), 0);
        const paidAmount = cases.reduce((sum, c) => sum + (c.paid_amount || 0), 0);

        // Render patient detail view
        renderPatientDetailView(patient, cases, appointments, prescriptions, totalAmount, paidAmount);
    }).catch(err => {
        console.error('Error loading patient details:', err);
        contentArea.innerHTML = `
            <div class="module-content">
                <div class="error-state">
                    <p>Error loading patient details</p>
                    <button class="btn btn-primary" onclick="loadPatients()">Back to Patients</button>
                </div>
            </div>
        `;
    });
}

// Render patient detail view
function renderPatientDetailView(patient, cases, appointments, prescriptions, totalAmount, paidAmount) {
    const contentArea = document.getElementById('content-area');

    const initials = getInitials(patient.name || 'Unknown');
    const activeCases = cases.filter(c => c.status && c.status.toLowerCase() === 'open');
    const upcomingAppointments = appointments.filter(a => {
        if (!a.appointment_date) return false;
        const aptDate = new Date(a.appointment_date);
        return aptDate >= new Date();
    }).slice(0, 3);

    const dueAmount = totalAmount - paidAmount;
    const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    contentArea.innerHTML = `
        <div class="module-content">
            <div class="module-header">
                <h1>Patient Details</h1>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-secondary" onclick="loadPatients()">← Back</button>
                    <button class="btn btn-primary" onclick="editPatient('${patient.id}')">Edit Patient</button>
                </div>
            </div>
            
            <div class="patient-detail-container">
                <!-- Patient Profile Card -->
                <div class="patient-profile-card">
                    <div class="patient-photo">
                        ${initials}
                    </div>
                    <div class="patient-name">${patient.name || 'Unknown'}</div>
                    <div class="patient-meta">
                        ${patient.age || '-'} years • ${patient.gender || '-'}
                    </div>
                    
                    <ul class="patient-info-list">
                        <li class="patient-info-item">
                            <span class="patient-info-icon">📞</span>
                            <span class="patient-info-text">${patient.phone || 'Not provided'}</span>
                        </li>
                        <li class="patient-info-item">
                            <span class="patient-info-icon">📧</span>
                            <span class="patient-info-text">${patient.email || 'Not provided'}</span>
                        </li>
                        <li class="patient-info-item">
                            <span class="patient-info-icon">🩸</span>
                            <span class="patient-info-text">Blood Type: ${patient.blood_group || 'Unknown'}</span>
                        </li>
                        <li class="patient-info-item">
                            <span class="patient-info-text">${patient.address || 'Not provided'}</span>
                        </li>
                        <li class="patient-info-item">
                            <span class="patient-info-icon">💰</span>
                            <span class="patient-info-text" style="font-weight: bold;">
                                Total Due: <span style="color: ${(totalAmount - paidAmount) > 0 ? '#ef4444' : '#10b981'}">₹${(totalAmount - paidAmount).toLocaleString('en-IN')}</span>
                            </span>
                        </li>
                    </ul>
                    
                    <div class="patient-actions">
                        <button class="btn btn-success" onclick="showCaseForm(null, '${patient.id}', '${patient.name || ''}')">
                            + New Case
                        </button>
                        <button class="btn btn-info" onclick="showAppointmentForm(null, '${patient.id}')">
                            + Schedule Appointment
                        </button>
                    </div>
                </div>
                
                <!-- Tabbed Content -->
                <div class="patient-tabs">
                    <div class="tab-navigation">
                        <button class="tab-button active" onclick="switchTab(event, 'overview')">Overview</button>
                        <button class="tab-button" onclick="switchTab(event, 'cases')">Cases (${cases.length})</button>
                        <button class="tab-button" onclick="switchTab(event, 'appointments')">Appointments (${appointments.length})</button>
                        <button class="tab-button" onclick="switchTab(event, 'prescriptions')">Prescriptions (${prescriptions.length})</button>
                        <button class="tab-button" onclick="switchTab(event, 'billing')">Billing</button>
                    </div>
                    
                    <div class="tab-content">
                        <!-- Overview Tab -->
                        <div id="overview" class="tab-pane active">
                            <h3>Active Cases</h3>
                            ${renderActiveCases(activeCases, patient.id, patient.name || '')}
                            
                            <h3 style="margin-top: 32px;">Upcoming Appointments</h3>
                            ${renderUpcomingAppointments(upcomingAppointments)}
                            
                            <h3 style="margin-top: 32px;">Recent Prescriptions</h3>
                            ${renderRecentPrescriptions(prescriptions.slice(0, 3))}
                        </div>
                        
                        <!-- Cases Tab -->
                        <div id="cases" class="tab-pane">
                            <h3>All Cases</h3>
                            ${renderAllCases(cases, patient.id, patient.name || '')}
                        </div>
                        
                        <!-- Appointments Tab -->
                        <div id="appointments" class="tab-pane">
                            <h3>All Appointments</h3>
                            ${renderAllAppointments(appointments)}
                        </div>
                        
                        <!-- Prescriptions Tab -->
                        <div id="prescriptions" class="tab-pane">
                            <h3>All Prescriptions</h3>
                            ${renderAllPrescriptions(prescriptions)}
                        </div>
                        
                        <!-- Billing Tab -->
                        <div id="billing" class="tab-pane">
                            <h3>Billing Summary</h3>
                            ${renderBillingSummary(totalAmount, paidAmount, dueAmount, paymentProgress)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Switch tabs
function switchTab(event, tabId) {
    // Remove active class from all buttons and panes
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    // Add active class to clicked button and corresponding pane
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Render active cases
function renderActiveCases(cases, patientId, patientName = '') {
    if (cases.length === 0) {
        return `
            <div class="empty-state">
                <p>No active cases</p>
                <button class="btn btn-primary" onclick="showCaseForm(null, '${patientId}', '${patientName}')">Create New Case</button>
            </div>
        `;
    }

    let html = '<div class="cases-grid">';
    cases.forEach(caseItem => {
        html += `
            <div class="case-card">
                <div class="case-header">
                    <div class="case-number">${caseItem.case_number || 'N/A'}</div>
                    <span class="case-status-badge ${(caseItem.status || 'open').toLowerCase()}">
                        ${caseItem.status || 'Open'}
                    </span>
                </div>
                <div class="case-details">
                    <div class="case-detail-row">
                        <span class="case-detail-label">Type:</span>
                        <span>${caseItem.case_type || 'OPD'}</span>
                    </div>
                    <div class="case-detail-row">
                        <span class="case-detail-label">Diagnosis:</span>
                        <span>${caseItem.diagnosis || 'Not specified'}</span>
                    </div>
                    <div class="case-detail-row">
                        <span class="case-detail-label">Admission:</span>
                        <span>${caseItem.admission_date ? new Date(caseItem.admission_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="case-detail-row">
                        <span class="case-detail-label">Pending Due:</span>
                        <span style="font-weight: bold; color: ${(caseItem.due_amount || 0) > 0 ? '#ef4444' : '#10b981'}">
                            ₹${(caseItem.due_amount || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
                <div class="case-actions">
                    <button class="btn btn-info btn-sm" onclick="viewCaseDetails('${caseItem.id}')">View Details</button>
                    <button class="btn btn-success btn-sm" onclick="editCase('${caseItem.id}')">Edit</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Render all cases
function renderAllCases(cases, patientId, patientName = '') {
    if (cases.length === 0) {
        return `
            <div class="empty-state">
                <p>No cases found</p>
                <button class="btn btn-primary" onclick="showCaseForm(null, '${patientId}', '${patientName}')">Create New Case</button>
            </div>
        `;
    }

    return renderActiveCases(cases, patientId, patientName);
}

// Render upcoming appointments
function renderUpcomingAppointments(appointments) {
    if (appointments.length === 0) {
        return '<div class="empty-state"><p>No upcoming appointments</p></div>';
    }

    let html = '<div class="appointments-list">';
    appointments.forEach(apt => {
        const date = apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : 'Not set';
        const time = apt.appointment_time || 'Not set';
        const doctor = apt.doctor_name || 'Unknown';

        html += `
            <div class="appointment-item">
                <div class="appointment-info">
                    <div class="appointment-date">📅 ${date}</div>
                    <div class="appointment-doctor">👨‍⚕️ ${doctor}</div>
                </div>
                <div class="appointment-time">${time}</div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Render all appointments
function renderAllAppointments(appointments) {
    if (appointments.length === 0) {
        return '<div class="empty-state"><p>No appointments found</p></div>';
    }

    return renderUpcomingAppointments(appointments);
}

// Render recent prescriptions
function renderRecentPrescriptions(prescriptions) {
    if (prescriptions.length === 0) {
        return '<div class="empty-state"><p>No prescriptions found</p></div>';
    }

    let html = '<div class="prescriptions-list">';
    prescriptions.forEach(pres => {
        const date = pres.prescription_date ? new Date(pres.prescription_date).toLocaleDateString() : 'Not set';
        const doctor = pres.doctor_name || 'Unknown';

        html += `
            <div class="prescription-item">
                <div class="prescription-icon">💊</div>
                <div class="prescription-info">
                    <div class="prescription-date">${date}</div>
                    <div class="prescription-doctor">Dr. ${doctor}</div>
                </div>
                <div class="prescription-actions">
                    ${pres.file_path ? `<button class="btn btn-info btn-sm" onclick="window.open('${pres.file_path}', '_blank')">View</button>` : ''}
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Render all prescriptions
function renderAllPrescriptions(prescriptions) {
    return renderRecentPrescriptions(prescriptions);
}

// Render billing summary
function renderBillingSummary(total, paid, due, progress) {
    return `
        <div class="billing-summary-card">
            <h4>Payment Overview</h4>
            <div class="billing-row">
                <span class="billing-label">Total Amount:</span>
                <span class="billing-amount">₹${total.toLocaleString('en-IN')}</span>
            </div>
            <div class="billing-row">
                <span class="billing-label">Paid Amount:</span>
                <span class="billing-amount">₹${paid.toLocaleString('en-IN')}</span>
            </div>
            <div class="billing-row">
                <span class="billing-label">Due Amount:</span>
                <span class="billing-amount">₹${due.toLocaleString('en-IN')}</span>
            </div>
            <div class="billing-progress">
                <div class="billing-progress-bar">
                    <div class="billing-progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        </div>
        <div style="margin-top: 20px; text-align: center;">
            <button class="btn btn-success">Record Payment</button>
            <button class="btn btn-info" style="margin-left: 12px;">View All Transactions</button>
        </div>
    `;
}

// Get initials from name
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Make functions globally available
window.loadPatientDetail = loadPatientDetail;
window.switchTab = switchTab;
window.viewCaseDetails = function (caseId) {
    // TODO: Implement case details view
    alert('Case details view - Coming soon!');
};
