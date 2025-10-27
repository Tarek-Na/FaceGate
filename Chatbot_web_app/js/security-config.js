// Security System Configuration
const SECURITY_CONFIG = {
    // Authentication
    AUTH: {
        // In a real system, these would be stored securely on the server
        // For demo purposes, using hardcoded credentials
        VALID_USERS: [
            { username: 'admin', password: 'admin123', role: 'administrator' },
            { username: 'security1', password: 'sec123', role: 'security_officer' },
            { username: 'chief', password: 'chief123', role: 'chief_security' }
        ],
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
        STORAGE_KEY: 'uob_security_session'
    },

    // Security Dashboard Settings
    DASHBOARD: {
        REFRESH_INTERVAL: 10000, // 10 seconds
        METRICS_UPDATE_INTERVAL: 5000, // 5 seconds
        CAMERA_SIMULATION: true
    },

    // Alert System
    ALERTS: {
        EMERGENCY_CONTACT: '+961 6 930 255',
        NOTIFICATION_SOUND: true,
        AUTO_REFRESH: true
    }
};

// Security utilities
class SecurityUtils {
    static hashPassword(password) {
        // In a real system, use proper password hashing
        // This is just for demo purposes
        return btoa(password);
    }

    static generateSessionToken() {
        return Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

    static isSessionValid() {
        const session = localStorage.getItem(SECURITY_CONFIG.AUTH.STORAGE_KEY);
        if (!session) return false;

        try {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            return now - sessionData.timestamp < SECURITY_CONFIG.AUTH.SESSION_TIMEOUT;
        } catch (e) {
            return false;
        }
    }

    static saveSession(username, role) {
        const sessionData = {
            username,
            role,
            token: this.generateSessionToken(),
            timestamp: Date.now()
        };
        localStorage.setItem(SECURITY_CONFIG.AUTH.STORAGE_KEY, JSON.stringify(sessionData));
    }

    static clearSession() {
        localStorage.removeItem(SECURITY_CONFIG.AUTH.STORAGE_KEY);
    }

    static getCurrentUser() {
        const session = localStorage.getItem(SECURITY_CONFIG.AUTH.STORAGE_KEY);
        if (!session) return null;

        try {
            return JSON.parse(session);
        } catch (e) {
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SECURITY_CONFIG, SecurityUtils };
}