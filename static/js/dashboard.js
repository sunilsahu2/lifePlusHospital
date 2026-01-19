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
                
                <div class="stat-card stat-card-collections">
                    <div class="stat-icon">📥</div>
                    <div class="stat-content">
                        <div class="stat-label">Today's Collections</div>
                        <div class="stat-value" id="stat-collections">-</div>
                        <div class="stat-trend" id="trend-collections">
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
            
            <!-- Financial Overview Section -->
            <div class="dashboard-section financial-section" style="margin-top: 20px; margin-bottom: 20px;">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3>Financial Overview</h3>
                    <div class="financial-filters" style="display: flex; gap: 10px; align-items: center;">
                        <input type="date" id="fin-start-date" class="form-control" style="width: auto;">
                        <span style="color: #666;">to</span>
                        <input type="date" id="fin-end-date" class="form-control" style="width: auto;">
                        <button class="btn btn-sm btn-secondary" onclick="loadFinancialGrid()">View</button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="setLast10Days()">Last 10 Days</button>
                    </div>
                </div>
                <div class="financial-grid-container" style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <table class="table table-hover" id="financial-grid-table" style="width: 100%; margin-bottom: 0;">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th style="text-align: right;">Collections</th>
                                <th style="text-align: right;">Payouts</th>
                                <th style="text-align: right;">Net</th>
                            </tr>
                        </thead>
                        <tbody id="financial-grid-body">
                            <tr><td colspan="4" style="text-align: center;">Loading...</td></tr>
                        </tbody>
                        <tfoot id="financial-grid-foot" style="font-weight: bold; background: #f8f9fa;">
                            <!-- Totals will go here -->
                        </tfoot>
                    </table>
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

    // Initialize default dates (Last 10 Days)
    setLast10Days(false); // false = don't load yet, will load below

    // Load dashboard data
    loadDashboardStats();
    loadDashboardActivity();
    loadUpcomingAppointments();
    loadFinancialGrid();

    // Auto-refresh every 5 minutes
    if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
    }
    window.dashboardRefreshInterval = setInterval(() => {
        loadDashboardStats();
        loadDashboardActivity();
        loadUpcomingAppointments();
        loadFinancialGrid();
    }, 300000); // 5 minutes
}

// Set dates to last 10 days
function setLast10Days(shouldLoad = true) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 9); // 10 days including today

    document.getElementById('fin-end-date').valueAsDate = end;
    document.getElementById('fin-start-date').valueAsDate = start;

    if (shouldLoad) {
        loadFinancialGrid();
    }
}

// Load Financial Grid
function loadFinancialGrid() {
    const start = document.getElementById('fin-start-date').value;
    const end = document.getElementById('fin-end-date').value;
    const tbody = document.getElementById('financial-grid-body');
    const tfoot = document.getElementById('financial-grid-foot');

    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading...</td></tr>';

    let url = `${API_BASE}/dashboard/financial-grid`;
    if (start && end) {
        url += `?start_date=${start}&end_date=${end}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No data for selected range</td></tr>';
                tfoot.innerHTML = '';
                return;
            }

            let html = '';
            let totalColl = 0;
            let totalPay = 0;
            let totalNet = 0;

            data.forEach(day => {
                totalColl += day.collections;
                totalPay += day.payouts;
                totalNet += day.net;

                const netColor = day.net >= 0 ? 'text-success' : 'text-danger';

                html += `
                    <tr style="cursor: pointer;" onclick="showFinancialDetails('${day.date}')" title="Click to view details">
                        <td>${new Date(day.date).toLocaleDateString()}</td>
                        <td style="text-align: right;">₹${day.collections.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style="text-align: right;">₹${day.payouts.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style="text-align: right;" class="${netColor}">₹${day.net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;

            const netTotalColor = totalNet >= 0 ? 'text-success' : 'text-danger';
            tfoot.innerHTML = `
                <tr>
                    <td>Total</td>
                    <td style="text-align: right;">₹${totalColl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align: right;">₹${totalPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align: right;" class="${netTotalColor}">₹${totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            `;
        })
        .catch(err => {
            console.error('Error loading financial grid:', err);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading data</td></tr>';
        });
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

            // Update today's collections stat
            animateValue('stat-collections', 0, data.today_collections, 1000, true);
            // Hide trend if not available or needed
            const trendCol = document.getElementById('trend-collections');
            if (trendCol) trendCol.style.display = 'none';
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
    loadFinancialGrid();
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
window.loadFinancialGrid = loadFinancialGrid;
window.setLast10Days = setLast10Days;
window.showFinancialDetails = showFinancialDetails;
window.closeFinancialModal = closeFinancialModal;

// Financial Drill-down Modal
function showFinancialDetails(date) {
    // 1. Create Modal if not exists
    let modal = document.getElementById('financial-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'financial-modal';
        modal.style.cssText = `
            display: none; 
            position: fixed; 
            z-index: 1000; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%; 
            overflow: auto; 
            background-color: rgba(0,0,0,0.4);
        `;
        modal.innerHTML = `
            <div style="background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 900px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 id="fin-modal-title">Details for [Date]</h2>
                    <span style="color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer;" onclick="closeFinancialModal()">&times;</span>
                </div>
                
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 300px;">
                        <h4 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Collections (Payments)</h4>
                        <div style="max-height: 400px; overflow-y: auto;">
                            <table class="table" style="font-size: 0.9em;">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Case</th>
                                        <th>Mode</th>
                                        <th style="text-align: right;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody id="fin-collections-body"></tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div style="flex: 1; min-width: 300px;">
                        <h4 style="color: #dc2626; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Payouts (Doctors)</h4>
                        <div style="max-height: 400px; overflow-y: auto;">
                            <table class="table" style="font-size: 0.9em;">
                                <thead>
                                    <tr>
                                        <th>Doctor</th>
                                        <th>Type</th>
                                        <th style="text-align: right;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody id="fin-payouts-body"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: right; margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="closeFinancialModal()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // 2. Open Modal
    modal.style.display = "block";
    document.getElementById('fin-modal-title').textContent = `Details for ${new Date(date).toLocaleDateString()}`;
    document.getElementById('fin-collections-body').innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    document.getElementById('fin-payouts-body').innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>';

    // 3. Fetch Data
    fetch(`${API_BASE}/dashboard/financial-details?date=${date}`)
        .then(res => res.json())
        .then(data => {
            // Render Collections
            const collBody = document.getElementById('fin-collections-body');
            if (data.collections && data.collections.length > 0) {
                let html = '';
                let total = 0;
                data.collections.forEach(item => {
                    total += item.amount;
                    html += `
                        <tr>
                            <td>${item.patient_name}</td>
                            <td>${item.case_number}</td>
                            <td>${item.mode}</td>
                            <td style="text-align: right;">₹${item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                    `;
                });
                html += `
                    <tr style="font-weight: bold; background: #f9fafb;">
                        <td colspan="3">Total</td>
                        <td style="text-align: right;">₹${total.toLocaleString('en-IN')}</td>
                    </tr>
                `;
                collBody.innerHTML = html;
            } else {
                collBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No records found</td></tr>';
            }

            // Render Payouts
            const payBody = document.getElementById('fin-payouts-body');
            if (data.payouts && data.payouts.length > 0) {
                let html = '';
                let total = 0;
                data.payouts.forEach(item => {
                    total += item.amount;
                    html += `
                        <tr>
                            <td>${item.doctor_name}</td>
                            <td>${item.type}</td>
                            <td style="text-align: right;">₹${item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                    `;
                });
                html += `
                    <tr style="font-weight: bold; background: #f9fafb;">
                        <td colspan="2">Total</td>
                        <td style="text-align: right;">₹${total.toLocaleString('en-IN')}</td>
                    </tr>
                `;
                payBody.innerHTML = html;
            } else {
                payBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No records found</td></tr>';
            }
        })
        .catch(err => {
            console.error('Error details:', err);
            document.getElementById('fin-collections-body').innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;">Error loading data</td></tr>';
            document.getElementById('fin-payouts-body').innerHTML = '<tr><td colspan="3" style="color:red; text-align:center;">Error loading data</td></tr>';
        });
}

function closeFinancialModal() {
    const modal = document.getElementById('financial-modal');
    if (modal) modal.style.display = "none";
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('financial-modal');
    if (event.target == modal) {
        closeFinancialModal();
    }
}
