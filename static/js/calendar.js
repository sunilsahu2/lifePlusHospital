// Calendar Module
// Handles calendar views for appointments

let currentCalendarDate = new Date();
let currentCalendarView = 'month'; // 'month' or 'week'
let calendarAppointments = [];
let doctorColors = {};

// Load calendar view
function loadCalendar() {
    const contentArea = document.getElementById('content-area');

    contentArea.innerHTML = `
        <div class="module-content">
            <div class="module-header">
                <h1>📅 Appointments Calendar</h1>
                <button class="btn btn-primary" onclick="showAppointmentForm()">
                    + New Appointment
                </button>
            </div>
            
            <div class="calendar-layout">
                <div>
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <div class="calendar-title" id="calendar-title">Loading...</div>
                            <div class="calendar-controls">
                                <button class="calendar-nav-btn" onclick="navigateCalendar(-1)">← Previous</button>
                                <button class="calendar-nav-btn" onclick="navigateCalendar(0)">Today</button>
                                <button class="calendar-nav-btn" onclick="navigateCalendar(1)">Next →</button>
                                <div class="view-toggle">
                                    <button class="view-toggle-btn active" onclick="switchCalendarView('month')">Month</button>
                                    <button class="view-toggle-btn" onclick="switchCalendarView('week')">Week</button>
                                </div>
                            </div>
                        </div>
                        <div id="calendar-body">
                            <div class="loading-spinner">Loading calendar...</div>
                        </div>
                    </div>
                </div>
                
                <div class="calendar-sidebar">
                    <h3 class="sidebar-title">Today's Schedule</h3>
                    <div id="today-schedule">
                        <div class="loading-spinner">Loading...</div>
                    </div>
                    
                    <div class="doctor-legend" id="doctor-legend">
                        <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Doctors</h4>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load appointments and render calendar
    loadCalendarAppointments();
}

// Load appointments for calendar
function loadCalendarAppointments() {
    fetch(`${API_BASE}/appointments?limit=1000`)
        .then(res => res.json())
        .then(data => {
            calendarAppointments = data.appointments || [];

            // Assign colors to doctors
            assignDoctorColors();

            // Render calendar
            renderCalendar();

            // Render today's schedule
            renderTodaySchedule();

            // Render doctor legend
            renderDoctorLegend();
        })
        .catch(err => {
            console.error('Error loading appointments:', err);
            document.getElementById('calendar-body').innerHTML =
                '<div class="error-state"><p>Error loading appointments</p></div>';
        });
}

// Assign colors to doctors
function assignDoctorColors() {
    const doctors = new Set();
    calendarAppointments.forEach(apt => {
        if (apt.doctor_name) {
            doctors.add(apt.doctor_name);
        }
    });

    const colorClasses = ['doctor-1', 'doctor-2', 'doctor-3', 'doctor-4', 'doctor-5'];
    let colorIndex = 0;

    doctors.forEach(doctor => {
        if (!doctorColors[doctor]) {
            doctorColors[doctor] = colorClasses[colorIndex % colorClasses.length];
            colorIndex++;
        }
    });
}

// Render calendar based on current view
function renderCalendar() {
    if (currentCalendarView === 'month') {
        renderMonthView();
    } else {
        renderWeekView();
    }
}

// Render month view
function renderMonthView() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendar-title').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Get previous month's last days
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    let html = '<div class="calendar-grid">';

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });

    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        html += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
    }

    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const dayAppointments = getAppointmentsForDate(date);

        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="selectCalendarDay('${date.toISOString()}')">
                <div class="day-number">${day}</div>
                ${renderDayAppointments(dayAppointments)}
            </div>
        `;
    }

    // Next month's days to fill the grid
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) {
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
        }
    }

    html += '</div>';
    document.getElementById('calendar-body').innerHTML = html;
}

// Render week view
function renderWeekView() {
    const startOfWeek = getStartOfWeek(currentCalendarDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    // Update title
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    document.getElementById('calendar-title').textContent =
        `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;

    let html = '<div class="week-view">';

    // Empty corner cell
    html += '<div class="time-slot"></div>';

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const isToday = date.toDateString() === today.toDateString();
        html += `
            <div class="week-day-header ${isToday ? 'today' : ''}">
                ${dayNames[date.getDay()]}<br>${date.getDate()}
            </div>
        `;
    }

    // Time slots (8 AM to 6 PM)
    for (let hour = 8; hour <= 18; hour++) {
        const timeStr = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
        html += `<div class="time-slot">${timeStr}</div>`;

        // Day columns
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            const dayAppointments = getAppointmentsForDate(date);

            html += `<div class="week-day-column">${renderDayAppointments(dayAppointments)}</div>`;
        }
    }

    html += '</div>';
    document.getElementById('calendar-body').innerHTML = html;
}

// Get appointments for a specific date
function getAppointmentsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return calendarAppointments.filter(apt => {
        if (!apt.appointment_date) return false;
        const aptDateStr = new Date(apt.appointment_date).toISOString().split('T')[0];
        return aptDateStr === dateStr;
    });
}

// Render day appointments
function renderDayAppointments(appointments) {
    if (appointments.length === 0) return '';

    let html = '';
    appointments.slice(0, 3).forEach(apt => {
        const doctorClass = doctorColors[apt.doctor_name] || 'doctor-1';
        const time = apt.appointment_time || '';
        const patient = apt.patient_name || 'Unknown';

        html += `
            <div class="appointment-block ${doctorClass}" onclick="event.stopPropagation(); viewAppointment('${apt.id}')" title="${time} - ${patient} - ${apt.doctor_name}">
                ${time} ${patient}
            </div>
        `;
    });

    if (appointments.length > 3) {
        html += `<div class="appointment-block" style="background: #6b7280;">+${appointments.length - 3} more</div>`;
    }

    return html;
}

// Render today's schedule
function renderTodaySchedule() {
    const today = new Date();
    const todayAppointments = getAppointmentsForDate(today);

    const scheduleDiv = document.getElementById('today-schedule');

    if (todayAppointments.length === 0) {
        scheduleDiv.innerHTML = '<div class="empty-state"><p>No appointments today</p></div>';
        return;
    }

    let html = '';
    todayAppointments.forEach(apt => {
        html += `
            <div class="sidebar-appointment" onclick="viewAppointment('${apt.id}')">
                <div class="sidebar-appointment-time">${apt.appointment_time || 'Time not set'}</div>
                <div class="sidebar-appointment-patient">👤 ${apt.patient_name || 'Unknown'}</div>
                <div class="sidebar-appointment-doctor">👨‍⚕️ ${apt.doctor_name || 'Unknown'}</div>
            </div>
        `;
    });

    scheduleDiv.innerHTML = html;
}

// Render doctor legend
function renderDoctorLegend() {
    const legendDiv = document.getElementById('doctor-legend');

    let html = '<h4 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Doctors</h4>';

    Object.keys(doctorColors).forEach(doctor => {
        const colorClass = doctorColors[doctor];
        html += `
            <div class="legend-item">
                <div class="legend-color appointment-block ${colorClass}" style="margin: 0;"></div>
                <span>${doctor}</span>
            </div>
        `;
    });

    legendDiv.innerHTML = html;
}

// Navigate calendar
function navigateCalendar(direction) {
    if (direction === 0) {
        // Today
        currentCalendarDate = new Date();
    } else if (currentCalendarView === 'month') {
        // Previous/Next month
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    } else {
        // Previous/Next week
        currentCalendarDate.setDate(currentCalendarDate.getDate() + (direction * 7));
    }

    renderCalendar();
    renderTodaySchedule();
}

// Switch calendar view
function switchCalendarView(view) {
    currentCalendarView = view;

    // Update button states
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    renderCalendar();
}

// Get start of week (Sunday)
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

// Select calendar day
function selectCalendarDay(dateStr) {
    const date = new Date(dateStr);
    const appointments = getAppointmentsForDate(date);

    if (appointments.length > 0) {
        alert(`Appointments on ${date.toLocaleDateString()}:\n\n` +
            appointments.map(apt => `${apt.appointment_time || 'Time not set'} - ${apt.patient_name} with ${apt.doctor_name}`).join('\n'));
    } else {
        if (confirm(`No appointments on ${date.toLocaleDateString()}. Would you like to create one?`)) {
            showAppointmentForm();
        }
    }
}

// View appointment details
function viewAppointment(appointmentId) {
    // TODO: Implement appointment details view
    alert('Appointment details view - Coming soon!');
}

// Make functions globally available
window.loadCalendar = loadCalendar;
window.navigateCalendar = navigateCalendar;
window.switchCalendarView = switchCalendarView;
window.selectCalendarDay = selectCalendarDay;
window.viewAppointment = viewAppointment;
