// Main Application Controller
class MainApp {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Initialize core systems
            this.setupEventListeners();
            this.initializeUI();
            this.startPeriodicUpdates();
            
            // Load existing data
            appState.loadVisitorRequests();
            visitorSystem.generateSampleData();
            
            // Test AI connectivity
            await this.testAIServices();
            
            this.isInitialized = true;
            console.log('University Access System initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }

    setupEventListeners() {
        // Chat form submission
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', this.handleUserMessage.bind(this));
        }

        // Visitor form submission
        const visitorForm = document.getElementById('visitor-form');
        if (visitorForm) {
            visitorForm.addEventListener('submit', visitorSystem.handleVisitorSubmission.bind(visitorSystem));
        }

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                visitorSystem.closeVisitorModal();
            }
        });

        // Window resize handler for responsive components
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    initializeUI() {
        // Initialize typed animation
        uiComponents.initializeTypedAnimation();
        
        // Initialize particle system
        uiComponents.startParticleAnimation();
        
        // Initialize page animations
        uiComponents.initializeAnimations();
        
        // Set initial time
        uiComponents.updateTime();
    }

    async handleUserMessage(event) {
        event.preventDefault();
        
        if (appState.isProcessing) return;

        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to chat
        uiComponents.addChatMessage(message, 'user');
        input.value = '';
        
        // Set processing state
        appState.setProcessing(true);
        
        // Show typing indicator
        uiComponents.showTypingIndicator();

        try {
            // Get AI response
            const aiResponse = await aiService.getRAGResponse(message);
            
            // Remove typing indicator and add response
            uiComponents.removeTypingIndicator();
            uiComponents.addChatMessage(aiResponse, 'system');
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            uiComponents.removeTypingIndicator();
            uiComponents.addChatMessage('I apologize, but I encountered an error processing your request. Please try again.', 'system');
        } finally {
            appState.setProcessing(false);
        }
    }

    startPeriodicUpdates() {
        // Update time every second
        setInterval(() => {
            uiComponents.updateTime();
        }, CONFIG.SYSTEM.TIME_UPDATE_INTERVAL);

        // Update system stats every 5 seconds
        setInterval(() => {
            uiComponents.updateSystemStats();
        }, CONFIG.SYSTEM.UPDATE_INTERVAL);

        // Update visitor status periodically
        setInterval(() => {
            this.updateVisitorDisplay();
        }, CONFIG.SYSTEM.UPDATE_INTERVAL);
    }

    updateVisitorDisplay() {
        // Update visitor count in campus info
        const visitorCountElement = document.getElementById('visitor-count');
        if (visitorCountElement) {
            const stats = visitorSystem.getStatistics();
            visitorCountElement.textContent = stats.today;
        }
    }

    async testAIServices() {
        try {
            const connectivity = await aiService.testConnectivity();
            console.log('AI Services Connectivity:', connectivity);
            
            // Update UI based on connectivity
            if (!connectivity.gemini && !connectivity.qwen) {
                console.warn('No AI services available. Chat functionality will be limited.');
            } else if (!connectivity.gemini) {
                console.warn('Gemini API not available. Using Qwen fallback.');
            }
            
        } catch (error) {
            console.error('Error testing AI services:', error);
        }
    }

    handleResize() {
        // Handle responsive adjustments
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    // Public API methods for global access
    startVisitorRequest() {
        visitorSystem.startVisitorRequest();
    }

    closeVisitorModal() {
        visitorSystem.closeVisitorModal();
    }

    handleEmergency() {
        uiComponents.handleEmergency();
    }

    getCampusMap() {
        uiComponents.getCampusMap();
    }

    checkVisitorStatus() {
        visitorSystem.showVisitorStatus();
    }

    confirmEmergency() {
        uiComponents.confirmEmergency();
    }

    closeEmergencyModal() {
        uiComponents.closeEmergencyModal();
    }
}

// Create global main app instance
const mainApp = new MainApp();

// Global function exports for HTML onclick handlers
window.startVisitorRequest = () => mainApp.startVisitorRequest();
window.closeVisitorModal = () => mainApp.closeVisitorModal();
window.handleEmergency = () => mainApp.handleEmergency();
window.getCampusMap = () => mainApp.getCampusMap();
window.checkVisitorStatus = () => mainApp.checkVisitorStatus();
window.confirmEmergency = () => mainApp.confirmEmergency();
window.closeEmergencyModal = () => mainApp.closeEmergencyModal();

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    mainApp.initialize();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MainApp, mainApp };
}