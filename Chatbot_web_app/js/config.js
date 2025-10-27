// Configuration constants for the University of Balamand Access System
const CONFIG = {
    // AI Service Configuration
    AI: {
        GEMINI_API_KEY: "AIzaSyDRaTW5TnWi3yJBYuE8Du37uFMf1M100lw",
        GEMINI_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        OLLAMA_URL: "http://localhost:11434/api/generate",
        OLLAMA_MODEL_NAME: "qwen:0.5B",
        QDRANT_URL: "http://localhost:6333/collections/uob_info/points/search",
        VECTORIZER_URL: "http://localhost:5000/vectorize",
        MAX_CHAT_HISTORY: 8,
        TEMPERATURE: 0.5
    },

    // University Data
    UOB_DATA: {
        university: {
            name: "University of Balamand",
            campus: "Koura Campus",
            location: "North Lebanon",
            founded: 1988,
            type: "Private Orthodox Christian university"
        },
        faculties: [
            "Faculty of Arts and Sciences", 
            "Faculty of Engineering", 
            "Faculty of Business and Management",
            "Faculty of Health Sciences", 
            "Faculty of Medicine and Medical Sciences", 
            "Faculty of Law and Political Science", 
            "Faculty of Theology"
        ],
        buildings: {
            "main-building": "Main Administrative Building - Houses most administrative offices",
            "library": "Dr. Georges A. Kfoury Library - Multi-story modern library with study areas",
            "engineering": "Engineering Building - Labs and classrooms for engineering programs",
            "business": "Business Building - Faculty of Business and Management",
            "sciences": "Sciences Building - Laboratories and research facilities",
            "dorms": "Student Dormitories - On-campus housing for students",
            "sports": "Sports Complex - Gymnasium and sports facilities",
            "medical": "Medical Center - Student health services",
            "zakhem-building": "Zakhem Building - Houses the Issam M. Fares Faculty of Technology, part of the Faculty of Engineering."
        },
        services: {
            "library": "Open 8:00 AM - 10:00 PM on weekdays, 9:00 AM - 5:00 PM on weekends",
            "cafeteria": "Main cafeteria open 7:00 AM - 8:00 PM, multiple coffee shops available",
            "parking": "Free parking available with visitor permits",
            "wifi": "Free WiFi available throughout campus",
            "medical": "Student health center open 8:00 AM - 4:00 PM",
            "security": "24/7 security personnel and surveillance systems"
        },
        contact: {
            main: "+961 6 930 250",
            security: "+961 6 930 255",
            admissions: "+961 6 930 260",
            email: "info@balamand.edu.lb",
            address: "El-Koura, North Lebanon"
        },
        directions: {
            "beirut": "Take highway north, exit at Amioun, follow signs to Balamand",
            "tripoli": "Take coastal highway south, exit at Balamand interchange",
            "amioun": "5 minutes from Amioun city center, follow university signs",
            "airport": "Approximately 1.5 hours from Beirut Rafic Hariri International Airport"
        }
    },

    // System Configuration
    SYSTEM: {
        STORAGE_KEY: 'uob-visitor-requests',
        UPDATE_INTERVAL: 5000,
        TIME_UPDATE_INTERVAL: 1000
    }
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}