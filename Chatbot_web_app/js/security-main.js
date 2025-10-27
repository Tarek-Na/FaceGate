// Security Dashboard Main Controller
class SecurityDashboard {
    constructor() {
        this.currentVisitorRequest = null;
        this.isAuthenticated = false;
        this.updateTimers = [];
    }

    initialize() {
        this.setupLoginHandlers();
        this.checkExistingSession();
        this.setupPeriodicUpdates();
    }

    setupLoginHandlers() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    checkExistingSession() {
        if (SecurityUtils.isSessionValid()) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Validate credentials
        const user = SECURITY_CONFIG.AUTH.VALID_USERS.find(u => 
            u.username === username && u.password === password
        );
        
        if (user) {
            // Successful login
            SecurityUtils.saveSession(user.username, user.role);
            this.showDashboard();
            this.loadDashboardData();
        } else {
            // Failed login
            this.showLoginError();
        }
    }

    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('dashboard-screen').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
        this.isAuthenticated = true;
        
        // Initialize dashboard components
        this.initializeAccessChart();
        this.loadVisitorRequests();
        this.updateMetrics();
    }

    showLoginError() {
        const errorElement = document.getElementById('login-error');
        errorElement.classList.remove('hidden');
        
        // Animate error message
        if (typeof anime !== 'undefined') {
            anime({
                targets: errorElement,
                scale: [0.9, 1],
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutBack'
            });
        }
        
        // Clear error after 5 seconds
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }

    logout() {
        SecurityUtils.clearSession();
        this.isAuthenticated = false;
        this.clearUpdateTimers();
        this.showLogin();
        
        // Clear form
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.reset();
    }

    loadDashboardData() {
        // Initialize dashboard with current data
        this.updateSecurityMetrics();
        this.loadVisitorRequests();
        this.initializeAccessChart();
    }

    setupPeriodicUpdates() {
        // Update time every second
        setInterval(() => {
            if (this.isAuthenticated) {
                this.updateTime();
            }
        }, 1000);

        // Update metrics every 5 seconds
        setInterval(() => {
            if (this.isAuthenticated) {
                this.updateSecurityMetrics();
            }
        }, SECURITY_CONFIG.DASHBOARD.METRICS_UPDATE_INTERVAL);

        // Refresh visitor requests every 10 seconds
        setInterval(() => {
            if (this.isAuthenticated) {
                this.loadVisitorRequests();
            }
        }, SECURITY_CONFIG.DASHBOARD.REFRESH_INTERVAL);
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        const currentTimeElement = document.getElementById('current-time');
        const cameraTimeElement = document.getElementById('camera-time');
        
        if (currentTimeElement) currentTimeElement.textContent = timeString;
        if (cameraTimeElement) cameraTimeElement.textContent = timeString;
    }

    updateSecurityMetrics() {
        // Simulate real-time metric updates
        const activeVisitors = 23 + Math.floor(Math.random() * 5);
        const pendingRequests = 7 + Math.floor(Math.random() * 3) - 1;
        const recognitionRate = (99.2 + (Math.random() - 0.5) * 0.4).toFixed(1);
        const detectedFaces = 2 + Math.floor(Math.random() * 2);
        const confidence = (94 + Math.floor(Math.random() * 8)) + '%';
        
        // Update DOM elements
        const elements = {
            'active-visitors': activeVisitors,
            'pending-requests': Math.max(0, pendingRequests),
            'pending-count': Math.max(0, pendingRequests),
            'recognition-rate': recognitionRate + '%',
            'detected-faces': detectedFaces,
            'recognition-confidence': confidence
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (typeof anime !== 'undefined') {
                    anime({
                        targets: element,
                        innerHTML: [element.textContent, value],
                        duration: 1000,
                        easing: 'easeOutQuart'
                    });
                } else {
                    element.textContent = value;
                }
            }
        });
    }

    loadVisitorRequests() {
        // Load from localStorage (in real system, this would be from API)
        const saved = localStorage.getItem('uob-visitor-requests');
        let requests = [];
        
        if (saved) {
            requests = JSON.parse(saved);
        } else {
            // Generate sample data for demo
            requests = this.generateSampleVisitorRequests();
            localStorage.setItem('uob-visitor-requests', JSON.stringify(requests));
        }
        
        this.displayVisitorRequests(requests);
    }

    generateSampleVisitorRequests() {
        return [
            {
                ticketId: 'VST-123456',
                name: 'Dr. Sarah Johnson',
                idNumber: 'P123456789',
                phone: '+961 3 123 456',
                purpose: 'academic-meeting',
                person: 'Dean of Engineering',
                building: 'engineering',
                duration: 'half-day',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                status: 'pending'
            },
            {
                ticketId: 'VST-234567',
                name: 'Mohammed Al-Hassan',
                idNumber: 'L987654321',
                phone: '+961 3 987 654',
                purpose: 'administrative',
                person: 'Admissions Office',
                building: 'main-building',
                duration: '1-2',
                timestamp: new Date(Date.now() - 600000).toISOString(),
                status: 'pending'
            },
            {
                ticketId: 'VST-345678',
                name: 'Maria Gonzalez',
                idNumber: 'P555555555',
                phone: '+961 3 555 555',
                purpose: 'student-visit',
                person: 'Student Affairs',
                building: 'main-building',
                duration: 'full-day',
                timestamp: new Date(Date.now() - 900000).toISOString(),
                status: 'approved'
            }
        ];
    }

    displayVisitorRequests(requests) {
        const container = document.getElementById('visitor-requests-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        const pendingRequests = requests.filter(r => r.status === 'pending');
        const approvedRequests = requests.filter(r => r.status === 'approved');
        
        // Show pending requests first
        [...pendingRequests, ...approvedRequests].forEach((request, index) => {
            const requestElement = document.createElement('div');
            requestElement.className = `visitor-card ${request.status} bg-white rounded-lg p-4 cursor-pointer`;
            
            const statusColor = request.status === 'pending' ? 'text-amber-600' : 'text-green-600';
            const statusIcon = request.status === 'pending' ? '⏳' : '✅';
            const timeAgo = this.getTimeAgo(new Date(request.timestamp));
            
            requestElement.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${request.name}</h4>
                        <p class="text-sm text-gray-600">${request.ticketId}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-sm ${statusColor} font-semibold">${statusIcon}</span>
                        <span class="text-xs text-gray-500">${timeAgo}</span>
                    </div>
                </div>
                <div class="text-sm text-gray-600 mb-2">
                    <span class="capitalize">${request.purpose.replace('-', ' ')}</span> • ${request.building ? request.building.replace('-', ' ') : 'Not specified'}
                </div>
                <div class="text-xs text-gray-500">
                    Visiting: ${request.person || 'Not specified'} • Duration: ${request.duration.replace('-', ' to ')} hours
                </div>
            `;
            
            requestElement.addEventListener('click', () => this.showVisitorDetails(request));
            container.appendChild(requestElement);
            
            // Animate entry
            if (typeof anime !== 'undefined') {
                anime({
                    targets: requestElement,
                    translateX: [-50, 0],
                    opacity: [0, 1],
                    duration: 400,
                    delay: index * 100,
                    easing: 'easeOutQuart'
                });
            }
        });
        
        if (requests.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-8">No visitor requests at this time.</div>';
        }
    }

    showVisitorDetails(request) {
        this.currentVisitorRequest = request;
        
        const modal = document.getElementById('visitor-details-modal');
        const content = document.getElementById('visitor-details-content');
        
        content.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Visitor Information</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">Name:</span>
                            <span class="font-medium ml-2">${request.name}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">ID Number:</span>
                            <span class="font-medium ml-2">${request.idNumber}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Phone:</span>
                            <span class="font-medium ml-2">${request.phone}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Ticket ID:</span>
                            <span class="font-medium ml-2">${request.ticketId}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Visit Details</h4>
                    <div class="grid grid-cols-1 gap-2 text-sm">
                        <div>
                            <span class="text-gray-600">Purpose:</span>
                            <span class="font-medium ml-2 capitalize">${request.purpose.replace('-', ' ')}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Person/Department:</span>
                            <span class="font-medium ml-2">${request.person || 'Not specified'}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Building:</span>
                            <span class="font-medium ml-2">${request.building ? request.building.replace('-', ' ') : 'Not specified'}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Duration:</span>
                            <span class="font-medium ml-2">${request.duration.replace('-', ' to ')} hours</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Submitted:</span>
                            <span class="font-medium ml-2">${new Date(request.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Status</h4>
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 rounded-full ${request.status === 'pending' ? 'bg-amber-500' : 'bg-green-500'}"></div>
                        <span class="font-medium capitalize">${request.status}</span>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        if (typeof anime !== 'undefined') {
            anime({
                targets: modal,
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutQuart'
            });
            
            anime({
                targets: modal.querySelector('div'),
                scale: [0.8, 1],
                duration: 400,
                easing: 'easeOutBack'
            });
        }
    }

    closeVisitorDetailsModal() {
        const modal = document.getElementById('visitor-details-modal');
        if (!modal) return;
        
        if (typeof anime !== 'undefined') {
            anime({
                targets: modal,
                opacity: [1, 0],
                duration: 200,
                complete: () => {
                    modal.classList.add('hidden');
                    this.currentVisitorRequest = null;
                }
            });
        } else {
            modal.classList.add('hidden');
            this.currentVisitorRequest = null;
        }
    }

    approveVisitorRequest() {
        if (this.currentVisitorRequest) {
            this.updateVisitorRequestStatus(this.currentVisitorRequest.ticketId, 'approved');
            
            // Simulate sending approval notification
            setTimeout(() => {
                alert(`Visitor request ${this.currentVisitorRequest.ticketId} has been approved. Notification sent to visitor.`);
            }, 500);
            
            this.closeVisitorDetailsModal();
        }
    }

    denyVisitorRequest() {
        if (this.currentVisitorRequest) {
            this.updateVisitorRequestStatus(this.currentVisitorRequest.ticketId, 'denied');
            
            // Simulate sending denial notification
            setTimeout(() => {
                alert(`Visitor request ${this.currentVisitorRequest.ticketId} has been denied. Notification sent to visitor.`);
            }, 500);
            
            this.closeVisitorDetailsModal();
        }
    }

    updateVisitorRequestStatus(ticketId, status) {
        const saved = localStorage.getItem('uob-visitor-requests');
        if (saved) {
            const requests = JSON.parse(saved);
            const request = requests.find(r => r.ticketId === ticketId);
            if (request) {
                request.status = status;
                localStorage.setItem('uob-visitor-requests', JSON.stringify(requests));
                this.loadVisitorRequests();
            }
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }

    initializeAccessChart() {
        const chartElement = document.getElementById('access-chart');
        if (!chartElement || typeof echarts === 'undefined') return;

        const accessChart = echarts.init(chartElement);
        const accessOption = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            legend: {
                data: ['Students', 'Staff', 'Visitors', 'Denied']
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
                axisLine: { lineStyle: { color: '#e2e8f0' } }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#e2e8f0' } }
            },
            series: [
                {
                    name: 'Students',
                    type: 'line',
                    data: [25, 12, 89, 156, 134, 98, 45],
                    smooth: true,
                    lineStyle: { color: '#059669', width: 3 },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(5, 150, 105, 0.3)' },
                                { offset: 1, color: 'rgba(5, 150, 105, 0.05)' }
                            ]
                        }
                    }
                },
                {
                    name: 'Staff',
                    type: 'line',
                    data: [15, 8, 45, 67, 56, 43, 22],
                    smooth: true,
                    lineStyle: { color: '#1e3a8a', width: 2 }
                },
                {
                    name: 'Visitors',
                    type: 'line',
                    data: [5, 3, 22, 34, 28, 19, 8],
                    smooth: true,
                    lineStyle: { color: '#f59e0b', width: 2 }
                },
                {
                    name: 'Denied',
                    type: 'line',
                    data: [2, 1, 5, 8, 6, 4, 2],
                    smooth: true,
                    lineStyle: { color: '#dc2626', width: 2 }
                }
            ]
        };
        
        accessChart.setOption(accessOption);
        
        // Make chart responsive
        window.addEventListener('resize', () => accessChart.resize());
    }

    clearUpdateTimers() {
        this.updateTimers.forEach(timer => clearInterval(timer));
        this.updateTimers = [];
    }

    // Quick action handlers
    refreshVisitorRequests() {
        this.loadVisitorRequests();
        
        // Show feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Refreshed!';
        button.style.color = '#059669';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.color = '';
        }, 2000);
    }

    generateDailyReport() {
        alert('Daily security report generated successfully. Report includes visitor statistics, access logs, and system performance metrics. File saved to security_reports/daily_report_' + new Date().toISOString().split('T')[0] + '.pdf');
    }

    exportVisitorLogs() {
        alert('Visitor logs exported successfully. CSV file saved to exports/visitor_logs_' + new Date().toISOString().split('T')[0] + '.csv');
    }

    systemMaintenance() {
        if (confirm('Are you sure you want to initiate system maintenance mode? This will temporarily disable access control.')) {
            alert('System maintenance mode activated. All access points are now in manual override mode. Maintenance team has been notified.');
        }
    }

    viewSystemLogs() {
        alert('Opening system logs viewer. This will show detailed logs of all access attempts, security events, and system activities.');
    }

    handleEmergencyAlert() {
        if (confirm('Are you sure you want to activate emergency alert? This will notify all security personnel and emergency services.')) {
            alert('Emergency alert activated! All security personnel have been notified. Emergency services are being contacted.');
            
            // Update security alerts counter
            const alertsElement = document.getElementById('security-alerts');
            const currentAlerts = parseInt(alertsElement.textContent);
            alertsElement.textContent = currentAlerts + 1;
        }
    }
}

// Create global security dashboard instance
const securityDashboard = new SecurityDashboard();

// Global function exports for HTML onclick handlers
window.refreshVisitorRequests = () => securityDashboard.refreshVisitorRequests();
window.generateDailyReport = () => securityDashboard.generateDailyReport();
window.exportVisitorLogs = () => securityDashboard.exportVisitorLogs();
window.systemMaintenance = () => securityDashboard.systemMaintenance();
window.viewSystemLogs = () => securityDashboard.viewSystemLogs();
window.handleEmergencyAlert = () => securityDashboard.handleEmergencyAlert();
window.showVisitorDetails = (request) => securityDashboard.showVisitorDetails(request);
window.closeVisitorDetailsModal = () => securityDashboard.closeVisitorDetailsModal();
window.approveVisitorRequest = () => securityDashboard.approveVisitorRequest();
window.denyVisitorRequest = () => securityDashboard.denyVisitorRequest();
window.logout = () => securityDashboard.logout();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    securityDashboard.initialize();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityDashboard, securityDashboard };
}