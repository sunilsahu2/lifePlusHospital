// Dashboard Module
// Handles loading and displaying dashboard statistics, activity feed, and upcoming appointments

// Load dashboard
function loadDashboard() {
    const contentArea = document.getElementById('content-area');

    contentArea.innerHTML = `
        <div class="module-content">
            <div class="module-header">
                <h1>Dashboard</h1>
                <button class="btn btn-primary" onclick="refreshDashboard()">
                    <span>🔄</span> Refresh
                </button>
            </div>
            
            <!-- Statistics Cards -->
            <div class="dashboard-stats">
                <div class="stat-card stat-card-patients">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-label">Total Patients</div>
                        <div class="stat-value" id="stat-patients">-</div>
                        <div class="stat-trend" id="trend-patients">
                            <span class="trend-indicator">-</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card stat-card-cases">
                    <div class="stat-icon">🏥</div>
                    <div class="stat-content">
                        <div class="stat-label">Active Cases</div>
                        <div class="stat-value" id="stat-cases">-</div>
                        <div class="stat-trend" id="trend-cases">
                            <span class="trend-indicator">-</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card stat-card-appointments">
                    <div class="stat-icon">📅</div>
                    <div class="stat-content">
                        <div class="stat-label">Appointments Today</div>
                        <div class="stat-value" id="stat-appointments">-</div>
                        <div class="stat-trend" id="trend-appointments">
                            <span class="trend-indicator">-</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card stat-card-revenue">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-label">Revenue (This Month)</div>
                        <div class="stat-value" id="stat-revenue">-</div>
                        <div class="stat-trend" id="trend-revenue">
                            <span class="trend-indicator">-</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Activity and Appointments Row -->
            <div class="dashboard-row">
                <!-- Recent Activity -->
                <div class="dashboard-section activity-section">
                    <h3>Recent Activity</h3>
                    <div class="activity-timeline" id="activity-timeline">
                        <div class="loading-spinner">Loading...</div>
                    </div>
                </div>
                
                <!-- Upcoming Appointments -->
                <div class="dashboard-section appointments-section">
                    <h3>Upcoming Appointments (Today)</h3>
                    <div class="appointments-widget" id="appointments-widget">
                        <div class="loading-spinner">Loading...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load dashboard data
    loadDashboardStats();
    loadDashboardActivity();
    loadUpcomingAppointments();

    // Auto-refresh every 5 minutes
    if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
    }
    window.dashboardRefreshInterval = setInterval(() => {
        loadDashboardStats();
        loadDashboardActivity();
        loadUpcomingAppointments();
    }, 300000); // 5 minutes
}

// Load dashboard statistics
function loadDashboardStats() {
    fetch(`${API_BASE}/dashboard/stats`)
        .then(res => res.json())
        .then(data => {
            // Update patients stat
            animateValue('stat-patients', 0, data.total_patients, 1000);
            updateTrend('trend-patients', data.patients_trend, 'this week');

            // Update cases stat
            animateValue('stat-cases', 0, data.active_cases, 1000);
            updateTrend('trend-cases', data.cases_trend, 'today');

            // Update appointments stat
            animateValue('stat-appointments', 0, data.today_appointments, 1000);
            updateTrend('trend-appointments', data.appointments_trend, 'vs yesterday');

            // Update revenue stat
            animateValue('stat-revenue', 0, data.revenue_this_month, 1000, true);
            updateTrend('trend-revenue', data.revenue_trend, 'this month');
        })
        .catch(err => {
            console.error('Error loading dashboard stats:', err);
        });
}

// Load dashboard activity feed
function loadDashboardActivity() {
    fetch(`${API_BASE}/dashboard/activity?limit=10`)
        .then(res => res.json())
        .then(data => {
            const timeline = document.getElementById('activity-timeline');

            if (!data.activities || data.activities.length === 0) {
                timeline.innerHTML = '<div class="empty-state"><p>No recent activity</p></div>';
                return;
            }

            let html = '<div class="activity-list">';
            data.activities.forEach(activity => {
                const icon = getActivityIcon(activity.type);
                const timeAgo = getTimeAgo(activity.timestamp);

                html += `
                    <div class="activity-item">
                        <div class="activity-icon">${icon}</div>
                        <div class="activity-content">
                            <div class="activity-message">${activity.message}</div>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            timeline.innerHTML = html;
        })
        .catch(err => {
            console.error('Error loading dashboard activity:', err);
            document.getElementById('activity-timeline').innerHTML =
                '<div class="error-state"><p>Error loading activity</p></div>';
        });
}

// Load upcoming appointments
function loadUpcomingAppointments() {
    fetch(`${API_BASE}/dashboard/upcoming-appointments`)
        .then(res => res.json())
        .then(data => {
            const widget = document.getElementById('appointments-widget');

            if (!data.appointments || data.appointments.length === 0) {
                widget.innerHTML = '<div class="empty-state"><p>No appointments scheduled for today</p></div>';
                return;
            }

            let html = `
                <table class="appointments-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Patient</th>
                            <th>Doctor</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.appointments.forEach(apt => {
                const time = apt.appointment_time || 'Not set';
                const patient = apt.patient_name || 'Unknown';
                const doctor = apt.doctor_name || 'Unknown';

                html += `
                    <tr>
                        <td><strong>${time}</strong></td>
                        <td>${patient}</td>
                        <td>${doctor}</td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
                <div class="appointments-footer">
                    <span>Total: ${data.total} appointment${data.total !== 1 ? 's' : ''}</span>
                </div>
            `;

            widget.innerHTML = html;
        })
        .catch(err => {
            console.error('Error loading upcoming appointments:', err);
            document.getElementById('appointments-widget').innerHTML =
                '<div class="error-state"><p>Error loading appointments</p></div>';
        });
}

// Refresh dashboard
function refreshDashboard() {
    loadDashboardStats();
    loadDashboardActivity();
    loadUpcomingAppointments();
}

// Animate number counting
function animateValue(elementId, start, end, duration, isCurrency = false) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }

        if (isCurrency) {
            element.textContent = `₹${Math.floor(current).toLocaleString('en-IN')}`;
        } else {
            element.textContent = Math.floor(current).toLocaleString('en-IN');
        }
    }, 16);
}

// Update trend indicator
function updateTrend(elementId, trendValue, label) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const isPositive = trendValue >= 0;
    const arrow = isPositive ? '↑' : '↓';
    const colorClass = isPositive ? 'trend-positive' : 'trend-negative';

    element.innerHTML = `
        <span class="trend-indicator ${colorClass}">
            ${arrow} ${Math.abs(trendValue)}% ${label}
        </span>
    `;
}

// Get activity icon
function getActivityIcon(type) {
    const icons = {
        'patient_registration': '👤',
        'appointment': '📅',
        'payment': '💰',
        'prescription': '💊',
        'case': '📋'
    };
    return icons[type] || '📌';
}

// Get time ago string
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return past.toLocaleDateString();
}

// Make functions globally available
window.loadDashboard = loadDashboard;
window.refreshDashboard = refreshDashboard;
