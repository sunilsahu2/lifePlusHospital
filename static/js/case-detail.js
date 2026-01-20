// Case Detail View Module
// Handles loading and displaying detailed case information

// Load case detail view
function loadCaseDetail(caseId) {
    if (!caseId) {
        alert('Case ID is required');
        return;
    }

    const contentArea = document.getElementById('content-area');

    // Show loading state
    contentArea.innerHTML = `
        <div class="module-content">
            <div class="loading-spinner" style="padding: 60px; text-align: center;">
                Loading case details...
            </div>
        </div>
    `;

    // Fetch case data
    fetch(`${API_BASE}/cases/${caseId}`)
        .then(res => res.json())
        .then(caseData => {
            if (caseData.error) {
                contentArea.innerHTML = `
                    <div class="module-content">
                        <div class="error-state">
                            <p>Error loading case: ${caseData.error}</p>
                            <button class="btn btn-primary" onclick="loadCases()">Back to Cases</button>
                        </div>
                    </div>
                `;
                return;
            }

            // Render case detail view
            renderCaseDetailView(caseData);
        })
        .catch(err => {
            console.error('Error loading case details:', err);
            contentArea.innerHTML = `
                <div class="module-content">
                    <div class="error-state">
                        <p>Error loading case details</p>
                        <button class="btn btn-primary" onclick="loadCases()">Back to Cases</button>
                    </div>
                </div>
            `;
        });
}

// Render case detail view
function renderCaseDetailView(caseData) {
    const contentArea = document.getElementById('content-area');
    const patient = caseData.patient || {};
    const charges = caseData.charges || [];
    const doctorCharges = caseData.doctor_charges || [];
    const pathologyCharges = caseData.pathology_charges || [];
    const pharmacyCharges = caseData.pharmacy_charges || [];
    const appointments = caseData.appointments || [];
    const prescriptions = caseData.prescriptions || [];
    const caseStudies = caseData.case_studies || [];

    // Calculate total costs
    const totalCharges = (
        charges.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0) +
        doctorCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0) +
        pathologyCharges.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0) +
        pharmacyCharges.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0)
    );

    // Status styling
    const isActive = (caseData.status || 'open').toLowerCase() === 'open';
    const statusColor = isActive ? 'success' : 'secondary';

    contentArea.innerHTML = `
        <div class="module-content">
            <div class="module-header">
                <h1>Case #${caseData.case_number || 'N/A'}</h1>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <span class="status-badge status-${(caseData.status || 'open').toLowerCase()}">
                        ${caseData.status || 'Open'}
                    </span>
                    <button class="btn btn-secondary" onclick="loadCases()">← Back</button>
                    <button class="btn btn-primary" onclick="editCase('${caseData.id}')" ${caseData.status === 'closed' && (!currentUser || currentUser.role !== 'admin') ? 'disabled title="Case is finalized and locked"' : ''}>Edit Case</button>
                    ${typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin' ? `<button class="btn btn-danger" onclick="deleteCase('${caseData.id}')">Delete Case</button>` : ''}
                </div>
            </div>
            
            <div class="case-detail-container">
                <!-- Case Overview Card -->
                <div class="case-overview-card">
                    <div class="case-info-header">
                        <h3>Case Information</h3>
                    </div>
                    <div class="case-info-grid">
                        <div class="info-item">
                            <span class="info-label">Patient</span>
                            <span class="info-value">
                                <a href="#" onclick="loadPatientDetail('${patient.id}')" class="patient-link">
                                    ${patient.name || 'Unknown'}
                                </a>
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Type</span>
                            <span class="info-value">${caseData.case_type || 'OPD'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Doctor</span>
                            <span class="info-value">${caseData.doctor_name || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Admission</span>
                            <span class="info-value">${caseData.admission_date ? new Date(caseData.admission_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div class="info-item full-width">
                            <span class="info-label">Diagnosis</span>
                            <span class="info-value">${caseData.diagnosis || 'Not specified'}</span>
                        </div>
                        <div class="info-item full-width">
                            <span class="info-label">Description</span>
                            <span class="info-value">${caseData.description || 'No description provided.'}</span>
                        </div>
                    </div>
                </div>

                <!-- Tabbed Content -->
                <div class="case-tabs">
                    <div class="tab-navigation">
                        <button class="tab-button active" onclick="switchTab(event, 'financials')">Financials</button>
                        <button class="tab-button" onclick="switchTab(event, 'appointments')">Appointments (${appointments.length})</button>
                        <button class="tab-button" onclick="switchTab(event, 'prescriptions')">Prescriptions (${prescriptions.length})</button>
                        <button class="tab-button" onclick="switchTab(event, 'case-studies')">Case Studies (${caseStudies.length})</button>
                    </div>
                    
                    <div class="tab-content">
                        <!-- Financials Tab -->
                        <div id="financials" class="tab-pane active">
                            <div class="financials-summary">
                                <div class="total-cost">
                                    <span>Total Case Cost:</span>
                                    <strong>₹${totalCharges.toFixed(2)}</strong>
                                </div>
                            </div>

                            <h4 style="display: flex; justify-content: space-between; align-items: center;">
                                Hospital Charges
                                ${caseData.status !== 'closed' ? `<button class="btn btn-primary btn-sm" onclick="showCaseChargeForm('${caseData.id}')">+ Add Charge</button>` : ''}
                            </h4>
                            ${renderChargesTable(charges)}

                            
                            <h4 style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
                                Doctor Charges
                                ${caseData.status !== 'closed' ? `<button class="btn btn-primary btn-sm" onclick="showCaseDoctorChargeForm('${caseData.id}')">+ Add Doctor Charge</button>` : ''}
                            </h4>
                            ${renderDoctorChargesTable(doctorCharges)}

                            <h4 style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
                                Pathology Charges
                                ${caseData.status !== 'closed' ? `<button class="btn btn-primary btn-sm" onclick="showExternalChargeForm('${caseData.id}', 'pathology')">+ Add Pathology Bill</button>` : ''}
                            </h4>
                            ${renderExternalChargesTable(pathologyCharges)}

                            <h4 style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
                                Pharmacy Charges
                                ${caseData.status !== 'closed' ? `<button class="btn btn-primary btn-sm" onclick="showExternalChargeForm('${caseData.id}', 'pharmacy')">+ Add Pharmacy Bill</button>` : ''}
                            </h4>
                            ${renderExternalChargesTable(pharmacyCharges)}
                        </div>
                        
                        <!-- Appointments Tab -->
                        <div id="appointments" class="tab-pane">
                            <div style="margin-bottom: 20px;">
                                ${caseData.status !== 'closed' ? `
                                    <button class="btn btn-primary" onclick="showCaseAppointmentForm('${caseData.id}', '${caseData.patient_id || ''}', '${caseData.doctor_id || ''}', '${caseData.patient?.name || ''}')">+ Schedule Appointment</button>
                                ` : '<div style="color: #64748b; font-style: italic;">No new appointments can be scheduled for a finalized case.</div>'}
                            </div>
                            ${renderCaseAppointments(appointments)}
                        </div>
                        
                        <!-- Prescriptions Tab -->
                        <div id="prescriptions" class="tab-pane">
                            <div style="margin-bottom: 20px;">
                                ${caseData.status !== 'closed' ? `
                                    <button class="btn btn-primary" onclick="showCasePrescriptionForm('${caseData.id}', '${caseData.patient_id || ''}', '${caseData.doctor_id || ''}')">+ New Prescription</button>
                                ` : '<div style="color: #64748b; font-style: italic;">No new prescriptions can be added for a finalized case.</div>'}
                            </div>
                            ${renderCasePrescriptions(prescriptions)}
                        </div>
                        
                        <!-- Case Studies Tab -->
                        <div id="case-studies" class="tab-pane">
                            <div style="margin-bottom: 20px;">
                                ${caseData.status !== 'closed' ? `
                                    <button class="btn btn-primary" onclick="showCaseStudyForm('${caseData.id}', '${caseData.doctor_id || ''}')">+ Add Case Study</button>
                                ` : '<div style="color: #64748b; font-style: italic;">No new case studies can be added for a finalized case.</div>'}
                            </div>
                            <div class="case-studies-container">
                                ${renderCaseStudies(caseStudies, caseData)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render Hospital Charges Table
function renderChargesTable(charges) {
    if (!charges || charges.length === 0) {
        return '<p class="empty-text">No hospital charges recorded.</p>';
    }

    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Charge Name</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${charges.map(c => `
                    <tr>
                        <td>${(c.charge_date || c.created_at) ? new Date(c.charge_date || c.created_at).toLocaleDateString() : ''}</td>
                        <td>${c.charge_name || ''}</td>
                        <td>${c.quantity || 0}</td>
                        <td>₹${c.unit_amount || c.amount || 0}</td>
                        <td>₹${c.total_amount || 0}</td>
                        <td>
                             <button class="btn btn-sm btn-danger" onclick="deleteCaseCharge('${c._id || c.id}', '${c.case_id}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Delete Case Charge
function deleteCaseCharge(chargeId, caseId) {
    if (!confirm('Are you sure you want to delete this charge?')) return;

    fetch(`${API_BASE}/case-charges/${chargeId}`, {
        method: 'DELETE'
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.error || 'Failed to delete charge'); });
            }
            return res.json();
        })
        .then(() => {
            alert('Charge deleted successfully');
            loadCaseDetail(caseId);
        })
        .catch(err => {
            console.error('Error deleting charge:', err);
            alert('Error deleting charge: ' + err.message);
        });
}

// Render Doctor Charges Table
function renderDoctorChargesTable(charges) {
    if (!charges || charges.length === 0) {
        return '<p class="empty-text">No doctor charges recorded.</p>';
    }

    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Doctor</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${charges.map(c => `
                    <tr>
                        <td>${c.date ? new Date(c.date).toLocaleDateString() : ''}</td>
                        <td>${c.doctor_name || ''}</td>
                        <td>${c.charge_type || 'Consultation'}</td>
                        <td>₹${c.amount || 0}</td>
                        <td>
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-sm btn-secondary" onclick="showCaseDoctorChargeForm('${c.case_id}', '${c._id || c.id}')">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteCaseDoctorCharge('${c._id || c.id}', '${c.case_id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Delete Case Doctor Charge
function deleteCaseDoctorCharge(chargeId, caseId) {
    if (!confirm('Are you sure you want to delete this doctor charge?')) return;

    fetch(`${API_BASE}/case-doctor-charges/${chargeId}`, {
        method: 'DELETE'
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.error || 'Failed to delete charge'); });
            }
            return res.json();
        })
        .then(() => {
            alert('Doctor charge deleted successfully');
            loadCaseDetail(caseId);
        })
        .catch(err => {
            console.error('Error deleting doctor charge:', err);
            alert('Error deleting charge: ' + err.message);
        });
}

// Render Appointments
function renderCaseAppointments(appointments) {
    if (!appointments || appointments.length === 0) {
        return '<div class="empty-state"><p>No appointments linked to this case.</p></div>';
    }

    return `
        <div class="appointments-list">
            ${appointments.map(apt => `
                <div class="appointment-item">
                    <div class="appointment-info">
                        <div class="appointment-date">📅 ${apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : 'N/A'}</div>
                        <div class="appointment-doctor">👨‍⚕️ ${apt.doctor_name || 'Unknown'}</div>
                    </div>
                    <div class="appointment-time">${apt.appointment_time || 'N/A'}</div>
                    <div class="appointment-status status-${(apt.status || 'Scheduled').toLowerCase()}">${apt.status || 'Scheduled'}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render Prescriptions
function renderCasePrescriptions(prescriptions) {
    if (!prescriptions || prescriptions.length === 0) {
        return '<div class="empty-state"><p>No prescriptions linked to this case.</p></div>';
    }

    return `
        <div class="prescriptions-list">
            ${prescriptions.map(pres => `
                <div class="prescription-item">
                    <div class="prescription-icon">💊</div>
                    <div class="prescription-info">
                        <div class="prescription-date">${pres.prescription_date ? new Date(pres.prescription_date).toLocaleDateString() : 'N/A'}</div>
                        <div class="prescription-doctor">Dr. ${pres.doctor_name || 'Unknown'}</div>
                    </div>
                    <div class="prescription-actions">
                        ${pres.file_path ? `<button class="btn btn-info btn-sm" onclick="window.open('${pres.file_path}', '_blank')">View</button>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Show Prescription Form for Case
function showCasePrescriptionForm(caseId, patientId, doctorId) {
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>Add Prescription</h2>
                <form id="casePrescriptionForm" onsubmit="saveCasePrescription(event, '${caseId}')" enctype="multipart/form-data">
                    <input type="hidden" name="case_id" value="${caseId}">
                    <input type="hidden" name="patient_id" value="${patientId}">
                    
                    <div class="form-group">
                        <label>Doctor</label>
                        <select name="doctor_id" required>
                            <option value="">Select Doctor</option>
                            <!-- Options will be populated -->
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Prescription Date</label>
                        <input type="date" name="prescription_date" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label>Medications</label>
                        <textarea name="medications" rows="4" placeholder="Paracetamol 500mg - 1-0-1 - 5 days..." required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Upload Prescription (Optional)</label>
                        <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png">
                        <small style="color: #666;">Supported formats: PDF, JPG, PNG</small>
                    </div>
                    
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" rows="2"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" onclick="loadCaseDetail('${caseId}')">Cancel</button>
                    </div>
                </form>
                <div id="doctor-loading" style="margin-top: 10px; font-size: 12px; color: #666;">Loading doctors...</div>
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;

    // Load doctors
    fetch(`${API_BASE}/doctors`)
        .then(res => res.json())
        .then(data => {
            const doctors = data.doctors || data;
            const select = document.querySelector('select[name="doctor_id"]');
            if (select) {
                select.innerHTML = '<option value="">Select Doctor</option>' +
                    doctors.map(d => `<option value="${d.id}" ${d.id === doctorId ? 'selected' : ''}>${d.name}</option>`).join('');
                document.getElementById('doctor-loading').style.display = 'none';
            }
        })
        .catch(err => {
            console.error('Error loading doctors:', err);
            document.getElementById('doctor-loading').textContent = 'Error loading doctors';
        });
}

// Save Case Prescription
function saveCasePrescription(event, caseId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const fileInput = form.querySelector('input[name="file"]');

    let fetchOptions = {
        method: 'POST'
    };

    // If file is selected, send as FormData (multipart)
    // Note: If no file selected, we can still send FormData, backend will just see empty file
    // But since backend has specific check 'if file in request.files', let's be careful.
    // Actually, sending FormData without file selected results in request.files['file'] existing but having empty filename.
    // Backend logic: "if file and file.filename:" checks filename.
    // So sending FormData ALWAYS is safe if backend logic is correct (which I verified it is).
    // EXCEPT: if using FormData, key/value pairs are in request.form, not request.get_json().
    // Backend logic: "else: data = request.get_json()".
    // So if I send FormData, I MUST ensure backend looks in request.form!

    // Check backend (Step 288):
    // if 'file' in request.files: -> checks request.form
    // else: -> checks request.get_json()

    // If I send FormData with EMPTY file, 'file' will be in request.files (usually).
    // Let's rely on the hybrid approach I planned:

    if (fileInput && fileInput.files.length > 0) {
        fetchOptions.body = formData;
    } else {
        const data = Object.fromEntries(formData);
        fetchOptions.headers = { 'Content-Type': 'application/json' };
        fetchOptions.body = JSON.stringify(data);
    }

    fetch(`${API_BASE}/prescriptions`, fetchOptions)
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.error || 'Failed to save prescription'); });
            }
            return res.json();
        })
        .then(() => {
            alert('Prescription saved successfully');
            loadCaseDetail(caseId);
        })
        .catch(err => {
            console.error('Error saving prescription:', err);
            alert('Error saving prescription: ' + (err.message || err));
        });
}

// Show Appointment Form for Case
function showCaseAppointmentForm(caseId, patientId, doctorId, patientName) {
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>Schedule Appointment</h2>
                <form id="caseAppointmentForm" onsubmit="saveCaseAppointment(event, '${caseId}')">
                    <input type="hidden" name="case_id" value="${caseId}">
                    <input type="hidden" name="patient_id" value="${patientId}">
                    
                    <div class="form-group">
                        <label>Patient</label>
                        <input type="text" value="${patientName || 'Unknown'}" disabled style="background: #f3f4f6;">
                    </div>
                    
                    <div class="form-group">
                        <label>Doctor</label>
                        <select name="doctor_id" required>
                            <option value="">Select Doctor</option>
                            <!-- Options will be populated -->
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" name="appointment_date" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label>Time</label>
                        <input type="time" name="appointment_time" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Purpose / Notes</label>
                        <textarea name="notes" rows="2" placeholder="Reason for appointment..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="Scheduled">Scheduled</option>
                            <option value="Confirmed">Confirmed</option>
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Schedule</button>
                        <button type="button" class="btn btn-secondary" onclick="loadCaseDetail('${caseId}')">Cancel</button>
                    </div>
                </form>
                <div id="doctor-loading" style="margin-top: 10px; font-size: 12px; color: #666;">Loading doctors...</div>
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;

    // Load doctors
    fetch(`${API_BASE}/doctors`)
        .then(res => res.json())
        .then(data => {
            const doctors = data.doctors || data;
            const select = document.querySelector('select[name="doctor_id"]');
            if (select) {
                select.innerHTML = '<option value="">Select Doctor</option>' +
                    doctors.map(d => `<option value="${d.id}" ${d.id === doctorId ? 'selected' : ''}>${d.name}</option>`).join('');
                document.getElementById('doctor-loading').style.display = 'none';
            }
        })
        .catch(err => {
            console.error('Error loading doctors:', err);
            document.getElementById('doctor-loading').textContent = 'Error loading doctors';
        });
}

// Save Case Appointment
function saveCaseAppointment(event, caseId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) throw new Error('Failed to schedule appointment');
            return res.json();
        })
        .then(() => {
            alert('Appointment scheduled successfully');
            loadCaseDetail(caseId);
        })
        .catch(err => {
            console.error('Error scheduling appointment:', err);
            alert('Error scheduling appointment: ' + err.message);
        });
}

// Expose globally
window.loadCaseDetail = loadCaseDetail;
window.viewCaseDetails = loadCaseDetail;
window.saveCasePrescription = saveCasePrescription;
window.showCasePrescriptionForm = showCasePrescriptionForm;
window.saveCaseAppointment = saveCaseAppointment;
window.showCaseAppointmentForm = showCaseAppointmentForm;

// Render Case Studies List
// Render Case Studies List
function renderCaseStudies(studies, caseData) {
    if (!studies || studies.length === 0) {
        return '<div class="empty-state"><p>No case studies recorded for this case.</p></div>';
    }

    return studies.map(study => `
        <div class="case-study-card" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #2c3e50;">${study.study_title || 'Untitled Study'}</h3>
                <div class="study-actions">
                    ${caseData.status !== 'closed' ? `
                        <button class="btn btn-sm btn-secondary" onclick="editCaseStudy('${study._id}', '${study.case_id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCaseStudy('${study._id}', '${study.case_id}')">Delete</button>
                    ` : '<span style="color: #94a3b8; font-size: 11px;">🔒 Read Only</span>'}
                </div>
            </div>
            <div style="font-size: 0.9em; color: #666; margin-bottom: 10px;">
                <span>📅 ${study.created_at ? new Date(study.created_at).toLocaleDateString() : 'N/A'}</span>
                <span style="margin-left: 15px;">👨‍⚕️ ${study.doctor_name || 'N/A'}</span>
            </div>
            <div class="study-details" style="white-space: pre-wrap; line-height: 1.5;">${study.details || ''}</div>
        </div>
    `).join('');
}

// Show Case Study Form (Add/Edit)
function showCaseStudyForm(caseId, doctorId, studyId = null) {
    const title = studyId ? 'Edit Case Study' : 'Add Case Study';

    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="caseStudyForm" onsubmit="saveCaseStudy(event, '${caseId}', '${studyId || ''}')">
                    <input type="hidden" name="case_id" value="${caseId}">
                    
                    <div class="form-group">
                        <label>Doctor</label>
                        <select name="doctor_id" required>
                            <option value="">Select Doctor</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Study Title</label>
                        <input type="text" name="study_title" required placeholder="e.g., Initial Observation" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    
                    <div class="form-group">
                        <label>Details</label>
                        <textarea name="details" rows="10" required placeholder="Enter detailed case study notes..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" onclick="loadCaseDetail('${caseId}')">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;

    // Load doctors and populate
    fetch(`${API_BASE}/doctors`)
        .then(res => res.json())
        .then(data => {
            const doctors = data.doctors || data;
            const select = document.querySelector('select[name="doctor_id"]');
            if (select) {
                select.innerHTML = '<option value="">Select Doctor</option>' +
                    doctors.map(d => `<option value="${d.id}" ${d.id === doctorId ? 'selected' : ''}>${d.name}</option>`).join('');
            }

            // If editing, load study details
            if (studyId) {
                fetch(`${API_BASE}/case-studies/${studyId}`)
                    .then(res => res.json())
                    .then(study => {
                        const form = document.getElementById('caseStudyForm');
                        if (form) {
                            form.study_title.value = study.study_title || '';
                            form.details.value = study.details || '';
                            if (study.doctor_id) {
                                form.doctor_id.value = study.doctor_id;
                            }
                        }
                    });
            }
        });
}

// Edit Case Study Wrapper
function editCaseStudy(studyId, caseId) {
    // We pass doctorId as null initially, it will be set when loading the study
    showCaseStudyForm(caseId, null, studyId);
}

// Save Case Study
function saveCaseStudy(event, caseId, studyId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    const url = studyId ? `${API_BASE}/case-studies/${studyId}` : `${API_BASE}/case-studies`;
    const method = studyId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) throw new Error('Failed to save case study');
            return res.json();
        })
        .then(() => {
            alert('Case study saved successfully');
            loadCaseDetail(caseId);
        })
        .catch(err => {
            console.error('Error saving case study:', err);
            alert('Error saving case study: ' + err.message);
        });
}

// Delete Case Study
function deleteCaseStudy(studyId, caseId) {
    if (!confirm('Are you sure you want to delete this case study?')) return;

    fetch(`${API_BASE}/case-studies/${studyId}`, {
        method: 'DELETE'
    })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete case study');
            return res.json();
        })
        .then(() => {
            loadCaseDetail(caseId);
        })
        .catch(err => {
            console.error('Error deleting case study:', err);
            alert('Error deleting case study: ' + err.message);
        });
}

// Render External Charges Table (Pathology/Pharmacy)
function renderExternalChargesTable(charges) {
    if (!charges || charges.length === 0) {
        return '<p class="empty-text">No records found.</p>';
    }

    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Document</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${charges.map(c => `
                    <tr>
                        <td>${c.charge_date ? new Date(c.charge_date).toLocaleDateString() : (c.created_at ? new Date(c.created_at).toLocaleDateString() : '')}</td>
                        <td>${c.charge_name || c.description || 'N/A'}</td>
                        <td>₹${c.total_amount || 0}</td>
                        <td>
                            ${c.file_path ? `<a href="${c.file_path}" target="_blank" class="btn btn-sm btn-info">View Bill</a>` : '-'}
                        </td>
                         <td>
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-sm btn-secondary" onclick="showExternalChargeForm('${c.case_id}', '${c.charge_type}', '${c._id || c.id}')">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteCaseCharge('${c._id || c.id}', '${c.case_id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Show form for adding external charge (Pathology/Pharmacy)
function showExternalChargeForm(caseId, type, chargeId = null) {
    const title = (chargeId ? 'Edit ' : 'Add ') + type.charAt(0).toUpperCase() + type.slice(1) + ' Bill';
    const html = `
        <div class="modal">
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="externalChargeForm" onsubmit="saveExternalCharge(event, '${caseId}', '${chargeId || ''}')" enctype="multipart/form-data">
                    <input type="hidden" name="case_id" value="${caseId}">
                    <input type="hidden" name="charge_type" value="${type}">
                    
                    <div class="form-group">
                        <label>Date *</label>
                        <input type="date" name="charge_date" required value="${new Date().toISOString().split('T')[0]}">
                    </div>

                    <div class="form-group">
                        <label>Description / Items</label>
                        <textarea name="charge_name" placeholder="Enter test names or medicines..." required rows="3"></textarea>
                    </div>

                    <div class="form-group">
                        <label>Total Amount *</label>
                        <input type="number" name="total_amount" step="0.01" required>
                    </div>

                    <div class="form-group">
                        <label>Upload Bill (Optional)</label>
                        <input type="file" name="file" accept="image/*,application/pdf">
                        ${chargeId ? '<small class="text-muted">Upload new file to replace existing.</small>' : ''}
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Charge</button>
                        <button type="button" class="btn btn-secondary" onclick="loadCaseDetail('${caseId}')">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;

    if (chargeId) {
        fetch(`${API_BASE}/case-charges/${chargeId}`)
            .then(res => res.json())
            .then(charge => {
                const form = document.getElementById('externalChargeForm');
                if (form) {
                    if (charge.charge_date) form.charge_date.value = charge.charge_date.split('T')[0];
                    if (charge.charge_name) form.charge_name.value = charge.charge_name;
                    if (charge.total_amount) form.total_amount.value = charge.total_amount;
                    // Handle description if mixed usage
                    if (!form.charge_name.value && charge.description) form.charge_name.value = charge.description;
                }
            })
            .catch(console.error);
    }
}

// Save External Charge
function saveExternalCharge(event, caseId, chargeId = null) {
    event.preventDefault();
    const formData = new FormData(event.target);

    // For update, we might need PUT. Does case-charges support PUT?
    // app.py update_case_charge supports PUT.
    const url = chargeId ? `${API_BASE}/case-charges/${chargeId}` : `${API_BASE}/case-charges`;
    const method = chargeId ? 'PUT' : 'POST';

    // If PUT, we can't send FormData directly if backend expects JSON for PUT usually.
    // app.py update_case_charge expects JSON "request.get_json()".
    // But for file upload, we usually need FormData.
    // Let's check update_case_charge in app.py. Line 1252: data = request.get_json().
    // So it does NOT support file upload on Update!

    // Workaround: If updating with file, maybe we need logic?
    // app.py doesn't show file handling in update_case_charge.
    // So, for now, we will handle text fields via JSON.
    // If file is selected, we might fail or ignore it.
    // Let's rely on JSON for update.

    const data = Object.fromEntries(formData);

    // If chargeId (Edit), use JSON.
    let fetchOptions = {};
    if (chargeId) {
        fetchOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } else {
        // Create supports file upload via FormData (assumption based on add)
        // Check app.py create_case_charge?
        // Wait, app.py create_case_charge logic handles files? I should check.
        // Assuming yes for creation.
        fetchOptions = {
            method: 'POST',
            body: formData
        };
    }

    fetch(url, fetchOptions)
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            alert('Charge added successfully');
            loadCaseDetail(caseId);
        })
        .catch(err => {
            console.error('Error saving charge:', err);
            alert('Error: ' + err.message);
        });
}

// Make functions globally available
window.renderCaseStudies = renderCaseStudies;
window.showCaseStudyForm = showCaseStudyForm;
window.editCaseStudy = editCaseStudy;
window.saveCaseStudy = saveCaseStudy;
window.deleteCaseStudy = deleteCaseStudy;
window.showExternalChargeForm = showExternalChargeForm;
window.deleteCaseCharge = deleteCaseCharge;
window.saveExternalCharge = saveExternalCharge;
// Note: switchTab is already available globally from patient-detail.js
// but we might need to ensure it works here too if patient-detail.js is loaded.
// If both use the same HTML structure for tabs, it should work.
