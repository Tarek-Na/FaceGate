// Visitor Management System
class VisitorSystem {
    constructor() {
        this.currentRequest = null;
    }

    async handleVisitorSubmission(event) {
        event.preventDefault();
        
        const formData = this.collectFormData();
        
        if (!this.validateFormData(formData)) {
            return;
        }

        // Add metadata
        const requestData = {
            ...formData,
            timestamp: new Date().toISOString(),
            status: 'pending',
            ticketId: this.generateTicketId()
        };

        // Save to app state
        appState.addVisitorRequest(requestData);
        
        // Close modal and show confirmation
        this.closeVisitorModal();
        
        const confirmationMessage = 
            `Thank you! Your visitor request has been submitted to the security office with Ticket ID: ${requestData.ticketId}. ` +
            `You will receive a notification here once the status is updated.`;
        
        if (typeof uiComponents.addChatMessage === 'function') {
            uiComponents.addChatMessage(confirmationMessage, 'system');
        }

        return requestData;
    }

    collectFormData() {
        return {
            name: document.getElementById('visitor-name').value,
            idNumber: document.getElementById('visitor-id').value || 'Not provided',
            phone: document.getElementById('visitor-phone').value,
            purpose: document.getElementById('visit-purpose').value,
            person: document.getElementById('visit-person').value,
            building: document.getElementById('visit-building').value,
            duration: document.getElementById('visit-duration').value
        };
    }

    validateFormData(data) {
        const required = ['name', 'phone', 'purpose'];
        const missing = required.filter(field => !data[field] || data[field].trim() === '');
        
        if (missing.length > 0) {
            alert(`Please fill in the required fields: ${missing.join(', ')}`);
            return false;
        }

        // Validate phone number (basic validation)
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
            alert('Please enter a valid phone number.');
            return false;
        }

        return true;
    }

    generateTicketId() {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `VST-${timestamp.slice(-6)}${random}`;
    }

    showVisitorStatus() {
        const latestRequest = appState.getLatestRequest();
        
        if (!latestRequest) {
            const message = 'You don\'t have any visitor requests yet. Would you like to submit one?';
            if (typeof uiComponents.addChatMessage === 'function') {
                uiComponents.addChatMessage(message, 'system');
            }
            return;
        }

        let statusColor = "text-amber-600"; // pending
        if (latestRequest.status === 'approved') {
            statusColor = "text-green-600";
        } else if (latestRequest.status === 'denied') {
            statusColor = "text-red-600";
        }

        const statusMessage = `
            <div class="p-3 bg-gray-100 rounded-lg border border-gray-200">
                <h4 class="font-semibold text-gray-800 mb-2">Latest Request Status</h4>
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Ticket ID:</span>
                        <span class="font-medium text-gray-900">${latestRequest.ticketId}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Visitor:</span>
                        <span class="font-medium text-gray-900">${latestRequest.name}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Purpose:</span>
                        <span class="font-medium text-gray-900 capitalize">${latestRequest.purpose.replace('-', ' ')}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Status:</span>
                        <span class="font-bold ${statusColor} capitalize">${latestRequest.status}</span>
                    </div>
                </div>
            </div>
        `;
        
        if (typeof uiComponents.addChatMessage === 'function') {
            uiComponents.addChatMessage(statusMessage, 'system');
        }
    }

    startVisitorRequest() {
        const modal = document.getElementById('visitor-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // Animate modal appearance
            if (typeof anime !== 'undefined') {
                anime({ 
                    targets: '#visitor-modal', 
                    opacity: [0, 1], 
                    duration: 300, 
                    easing: 'easeOutQuart' 
                });
                anime({ 
                    targets: '#visitor-modal > div', 
                    scale: [0.8, 1], 
                    duration: 400, 
                    easing: 'easeOutBack' 
                });
            }
        }
    }

    closeVisitorModal() {
        const modal = document.getElementById('visitor-modal');
        const form = document.getElementById('visitor-form');
        
        if (modal && typeof anime !== 'undefined') {
            anime({
                targets: '#visitor-modal',
                opacity: [1, 0],
                duration: 200,
                complete: () => {
                    modal.classList.add('hidden');
                    if (form) form.reset();
                }
            });
        } else if (modal) {
            modal.classList.add('hidden');
            if (form) form.reset();
        }
    }

    // Security dashboard methods
    updateVisitorRequestStatus(ticketId, status) {
        const success = appState.updateVisitorRequestStatus(ticketId, status);
        
        if (success) {
            // Show notification to user if they're online
            const message = `Visitor request ${ticketId} has been ${status.toUpperCase()}.`;
            if (typeof addChatMessage === 'function') {
                addChatMessage(message, 'system');
            }
        }
        
        return success;
    }

    generateSampleData() {
        const sampleRequests = [
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

        // Only add sample data if no existing data
        if (appState.visitorRequests.length === 0) {
            appState.visitorRequests = sampleRequests;
            appState.saveVisitorRequests();
        }
    }

    // Utility method to format time ago
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

    // Get statistics for dashboard
    getStatistics() {
        const requests = appState.visitorRequests;
        const pending = requests.filter(r => r.status === 'pending').length;
        const approved = requests.filter(r => r.status === 'approved').length;
        const denied = requests.filter(r => r.status === 'denied').length;
        
        return {
            total: requests.length,
            pending,
            approved,
            denied,
            today: requests.filter(r => {
                const requestDate = new Date(r.timestamp);
                const today = new Date();
                return requestDate.toDateString() === today.toDateString();
            }).length
        };
    }
}

// Create global visitor system instance
const visitorSystem = new VisitorSystem();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VisitorSystem, visitorSystem };
}
