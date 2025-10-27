// Global Application State Management
class AppState {
    constructor() {
        this.currentUser = null;
        this.systemStatus = 'online';
        this.chatHistory = [];
        this.isProcessing = false;
        this.visitorRequests = [];
        this.aiConfig = {
            temperature: CONFIG.AI.TEMPERATURE
        };
    }

    // Chat history management
    addChatMessage(message, sender) {
        this.chatHistory.push({
            message,
            sender,
            timestamp: new Date()
        });
        
        // Keep only the last N messages for memory
        if (this.chatHistory.length > CONFIG.AI.MAX_CHAT_HISTORY * 2) {
            this.chatHistory = this.chatHistory.slice(-CONFIG.AI.MAX_CHAT_HISTORY * 2);
        }
    }

    // Visitor request management
    addVisitorRequest(requestData) {
        this.visitorRequests.push(requestData);
        this.saveVisitorRequests();
    }

    updateVisitorRequestStatus(ticketId, status) {
        const request = this.visitorRequests.find(r => r.ticketId === ticketId);
        if (request) {
            request.status = status;
            this.saveVisitorRequests();
            return true;
        }
        return false;
    }

    saveVisitorRequests() {
        try {
            localStorage.setItem(CONFIG.SYSTEM.STORAGE_KEY, JSON.stringify(this.visitorRequests));
        } catch (error) {
            console.error('Error saving visitor requests:', error);
        }
    }

    loadVisitorRequests() {
        try {
            const saved = localStorage.getItem(CONFIG.SYSTEM.STORAGE_KEY);
            if (saved) {
                this.visitorRequests = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading visitor requests:', error);
            this.visitorRequests = [];
        }
    }

    // System status management
    setSystemStatus(status) {
        this.systemStatus = status;
    }

    // Processing state management
    setProcessing(isProcessing) {
        this.isProcessing = isProcessing;
    }

    // Get recent chat history for AI context
    getRecentChatHistory() {
        return this.chatHistory.slice(-CONFIG.AI.MAX_CHAT_HISTORY);
    }

    // Get pending visitor requests
    getPendingRequests() {
        return this.visitorRequests.filter(r => r.status === 'pending');
    }

    // Get latest visitor request for current user
    getLatestRequest() {
        return this.visitorRequests.length > 0 
            ? this.visitorRequests[this.visitorRequests.length - 1]
            : null;
    }
}

// Create global app state instance
const appState = new AppState();

// Listen for storage events to sync between tabs/windows
window.addEventListener('storage', (event) => {
    if (event.key === CONFIG.SYSTEM.STORAGE_KEY && event.newValue) {
        const oldRequests = appState.visitorRequests;
        const newRequests = JSON.parse(event.newValue);
        
        // Find which request was updated
        const updatedRequest = newRequests.find((newReq, index) => {
            const oldReq = oldRequests[index];
            return oldReq && oldReq.status !== newReq.status;
        });

        if (updatedRequest) {
            const message = `Update on your visitor request ${updatedRequest.ticketId}: The status has been changed to ${updatedRequest.status.toUpperCase()}.`;
            if (typeof addChatMessage === 'function') {
                addChatMessage(message, 'system');
            }
        }
        
        appState.visitorRequests = newRequests;
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppState, appState };
}