// --- Configuration ---
// Define the endpoints for your locally running services
const OLLAMA_URL = "http://localhost:11434/api/generate";
const QDRANT_URL = "http://localhost:6333/collections/uob_info/points/search";
const VECTORIZER_URL = "http://localhost:5000/vectorize"; // Local server for sentence-transformer
const OLLAMA_MODEL_NAME = "qwen:0.5B"; // This is now the FALLBACK model

// --- NEW: Gemini API Configuration ---
// !! IMPORTANT !! Replace "YOUR_GEMINI_API_KEY_HERE" with your actual Google AI Studio API key
const GEMINI_API_KEY = "AIzaSyDRaTW5TnWi3yJBYuE8Du37uFMf1M100lw";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// --- NEW: Chat History Configuration ---
const MAX_CHAT_HISTORY = 8; // Max number of *past* messages to include as context

// Global state management
const AppState = {
    currentUser: null,
    systemStatus: 'online',
    chatHistory: [], // This array will be used for memory
    isProcessing: false,
    visitorRequests: [],
    aiConfig: {
        temperature: 0.5, // Adjusted for more factual RAG responses
    }
};

// University of Balamand Koura Campus Data (used for fallback and initial DB seeding)
const UOBData = {
    university: {
        name: "University of Balamand",
        campus: "Koura Campus",
        location: "North Lebanon",
        founded: 1988,
        type: "Private Orthodox Christian university"
    },
    faculties: [
        "Faculty of Arts and Sciences", "Faculty of Engineering", "Faculty of Business and Management",
        "Faculty of Health Sciences", "Faculty of Medicine and Medical Sciences", "Faculty of Law and Political Science", "Faculty of Theology"
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
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    startParticleAnimation();
    updateTime();
    loadVisitorRequests();
    
    setInterval(updateTime, 1000);
    setInterval(updateSystemStats, 5000);
});

function initializeApp() {
    new Typed('#typed-welcome', {
        strings: ['University of Balamand', 'Koura Campus Access', 'AI Assistant Ready'],
        typeSpeed: 50, backSpeed: 30, backDelay: 2000, loop: true, showCursor: true, cursorChar: '|'
    });
    Splitting();
    anime({ targets: '.chat-bubble', translateY: [20, 0], opacity: [0, 1], duration: 600, delay: anime.stagger(100), easing: 'easeOutQuart' });
    anime({ targets: '.quick-btn', scale: [0.9, 1], opacity: [0, 1], duration: 400, delay: anime.stagger(50, {start: 300}), easing: 'easeOutBack' });
}

function setupEventListeners() {
    document.getElementById('visitor-form').addEventListener('submit', handleVisitorSubmission);
    document.getElementById('chat-form').addEventListener('submit', handleUserMessage);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeVisitorModal(); });
    
    // Listen for changes in localStorage to get real-time updates from the security dashboard
    window.addEventListener('storage', (event) => {
        if (event.key === 'uob-visitor-requests' && event.newValue) {
            const oldRequests = AppState.visitorRequests;
            const newRequests = JSON.parse(event.newValue);
            
            // Find which request was updated
            const updatedRequest = newRequests.find((newReq, index) => {
                const oldReq = oldRequests[index];
                return oldReq && oldReq.status !== newReq.status;
            });

            if (updatedRequest) {
                const message = `Update on your visitor request ${updatedRequest.ticketId}: The status has been changed to ${updatedRequest.status.toUpperCase()}.`;
                addChatMessage(message, 'system');
            }
            AppState.visitorRequests = newRequests; // Update the state
        }
    });
}

async function handleUserMessage(e) {
    e.preventDefault();
    if (AppState.isProcessing) return;

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (message) {
        addChatMessage(message, 'user');
        input.value = '';
        AppState.isProcessing = true;
        showTypingIndicator();

        // --- UPDATED ---
        // Call the new RAG function (which tries Gemini first, then Qwen)
        const aiResponse = await getRAGResponse(message);
        
        removeTypingIndicator();
        addChatMessage(aiResponse, 'system');
        AppState.isProcessing = false;
    }
}

// --- MODIFIED FUNCTION: RAG pipeline with Gemini primary and Qwen fallback ---
async function getRAGResponse(prompt) {
    
    let context_chunks;
    
    // --- Define the AI's "persona" or system prompt ---
    // This is used by both Gemini and Qwen
    const systemPrompt = `You are the University of Balamand (UOB) Koura Campus AI Assistant, a helpful and knowledgeable guide for students, visitors, and staff. Your sole purpose is to provide clear, accurate, and concise information about the university.

You will receive context structured as:

PREVIOUS CONVERSATION: The complete chat history with the user.

CONTEXT: Retrieved factual documents about UOB.

Core Operating Directives
Context is King: For all UOB-related inquiries, ONLY use the facts provided in the 'CONTEXT' section.

No Speculation: NEVER guess, infer, or use external/general knowledge (e.g., current president's name, general facts about Lebanon) if the 'CONTEXT' does not explicitly contain the answer.

Handle Gaps Directly: If the 'CONTEXT' does not provide the answer, you MUST state: "I'm sorry, but I don't have that specific information in my knowledge base."

Conflict Resolution: If the retrieved 'CONTEXT' documents contain conflicting or ambiguous information, state the ambiguity rather than choosing one fact. If a contradiction arises between the 'PREVIOUS CONVERSATION' and the 'CONTEXT', always prioritize the factual data in the current 'CONTEXT'.

Maintain Flow: Use the 'PREVIOUS CONVERSATION' to track the conversation's flow and accurately answer meta-questions about the chat history.

Communication and Style Guidelines
Be Concise: Structure your response into 2-4 short, meaningful sentences. Prioritize clarity and readability.

Visitor Protocol: If a user expresses interest in visiting the campus, ONLY guide them to use the 'Submit Visitor Request' form.

Stay Focused: If a user asks an out-of-scope question (not about UOB or the conversation), politely decline by stating your expertise is strictly limited to UOB matters.

Tone: Maintain a friendly, professional, and respectful demeanor throughout the conversation.`;

    try {
        // --- Step 1: Vectorize the user's prompt (Common for both) ---
        console.log("Step 1: Vectorizing prompt...");
        const vectorizeResponse = await fetch(VECTORIZER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: prompt })
        });
        if (!vectorizeResponse.ok) throw new Error(`Vectorizer server error: ${vectorizeResponse.statusText}`);
        const { vector } = await vectorizeResponse.json();
        console.log("Vectorization successful.");

        // --- Step 2: Search Qdrant for relevant context (Common for both) ---
        console.log("Step 2: Searching Qdrant...");
        const searchResponse = await fetch(QDRANT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vector: vector,
                limit: 5, // Get top 5 results
                with_payload: true
            })
        });
        if (!searchResponse.ok) throw new Error(`Qdrant server error: ${searchResponse.statusText}`);
        const searchData = await searchResponse.json();
        context_chunks = searchData.result.map(item => item.payload.text).join("\n\n---\n\n");
        console.log("Qdrant search successful. Context found:", context_chunks);
        
    } catch (ragError) {
        console.error('Offline RAG pipeline (Vector/Qdrant) error:', ragError.message);
        return `I'm having trouble accessing my local knowledge base. Please ensure the vectorizer and Qdrant servers are running correctly.`;
    }

    // --- Step 3: Try PRIMARY LLM (Gemini Flash) ---
    try {
        console.log("Step 3: Querying Primary (Gemini Flash)...");

        if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
            throw new Error("Gemini API key is not set. Please update main.js.");
        }

        // --- NEW: Build chat history for Gemini API ---
        const geminiHistory = AppState.chatHistory
            .slice(-MAX_CHAT_HISTORY) // Get last 8 messages
            .map(entry => {
                return {
                    // Map our 'system' sender to Gemini's 'model' role
                    role: entry.sender === 'user' ? 'user' : 'model', 
                    parts: [{ text: entry.message }]
                };
            });

        // --- NEW: Define the final prompt for this turn ---
        // This includes the system prompt, the RAG context, and the new user question
        const finalUserPromptForGemini = `
${systemPrompt}

CONTEXT:
${context_chunks}

USER QUESTION:
${prompt}
`;

        // --- NEW: Add the final prompt as the last "user" message ---
        geminiHistory.push({
            role: "user",
            parts: [{ text: finalUserPromptForGemini }]
        });
        
        const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // --- NEW: Send the entire history array ---
                contents: geminiHistory,
                generationConfig: {
                    temperature: AppState.aiConfig.temperature,
                }
            })
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            throw new Error(`Gemini API error: ${geminiResponse.statusText} - ${errorBody}`);
        }

        const geminiData = await geminiResponse.json();
        
        if (!geminiData.candidates || geminiData.candidates.length === 0 || !geminiData.candidates[0].content) {
            // Check for safety blocks
            if (geminiData.promptFeedback && geminiData.promptFeedback.blockReason) {
                console.warn(`Gemini block reason: ${geminiData.promptFeedback.blockReason}`);
                throw new Error(`Gemini API blocked the prompt. Reason: ${geminiData.promptFeedback.blockReason}`);
            }
            throw new Error("Invalid response structure from Gemini API.");
        }

        console.log("Gemini response received.");
        return geminiData.candidates[0].content.parts[0].text.trim();

    } catch (geminiError) {
        console.error('Primary LLM (Gemini) failed:', geminiError.message);
        
        // --- Step 4: FALLBACK to Backup LLM (Qwen) ---
        try {
            console.log("Step 4: Querying Backup (Qwen) with RAG prompt...");
            
            // --- NEW: Format chat history as a string for Ollama ---
            const historyString = AppState.chatHistory
                .slice(-MAX_CHAT_HISTORY)
                .map(entry => {
                    const prefix = entry.sender === 'user' ? 'User' : 'AI';
                    return `${prefix}: ${entry.message}`;
                })
                .join('\n');

            // --- NEW: Construct the exact prompt format for Qwen, now including history ---
            const finalPrompt = `
${systemPrompt}

PREVIOUS CONVERSATION:
${historyString.length > 0 ? historyString : "No previous conversation history."}

---
CONTEXT:
${context_chunks}

USER QUESTION:
${prompt}
`;

            const ollamaResponse = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: OLLAMA_MODEL_NAME,
                    prompt: finalPrompt, // Send the new prompt with history
                    stream: false, 
                    options: {
                        temperature: AppState.aiConfig.temperature
                    }
                })
            });
            if (!ollamaResponse.ok) throw new Error(`Ollama server error: ${ollamaResponse.statusText}`);
            
            const ollamaData = await ollamaResponse.json();
            console.log("Qwen (fallback) response received.");
            
            return ollamaData.response.trim();

        } catch (ollamaError) {
            console.error('Fallback LLM (Qwen) also failed:', ollamaError.message);
            
            return `Chatbot under maintenance`;
        }
    }
}


async function handleVisitorSubmission(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('visitor-name').value,
        idNumber: document.getElementById('visitor-id').value,
        phone: document.getElementById('visitor-phone').value,
        purpose: document.getElementById('visit-purpose').value,
        person: document.getElementById('visit-person').value,
        building: document.getElementById('visit-building').value,
        duration: document.getElementById('visit-duration').value,
        timestamp: new Date().toISOString(),
        status: 'pending',
        ticketId: 'VST-' + Date.now().toString().slice(-6)
    };
    
    AppState.visitorRequests.push(formData);
    saveVisitorRequests();
    
    closeVisitorModal();
    
    // Updated confirmation message
    const confirmationMessage = `Thank you! Your visitor request has been submitted to the security office with Ticket ID: ${formData.ticketId}. You will receive a notification here once the status is updated.`;
    addChatMessage(confirmationMessage, 'system');
}

function saveVisitorRequests() {
    localStorage.setItem('uob-visitor-requests', JSON.stringify(AppState.visitorRequests));
}

function loadVisitorRequests() {
    const saved = localStorage.getItem('uob-visitor-requests');
    if (saved) {
        AppState.visitorRequests = JSON.parse(saved);
    }
}

function checkVisitorStatus() {
    if (AppState.visitorRequests.length === 0) {
        addChatMessage('You don\'t have any visitor requests yet. Would you like to submit one?', 'system');
        return;
    }
    const latestRequest = AppState.visitorRequests[AppState.visitorRequests.length - 1];
    const statusMessage = `Your latest visitor request (${latestRequest.ticketId}) for ${latestRequest.name} is currently: ${latestRequest.status.toUpperCase()}.`;
    addChatMessage(statusMessage, 'system');
}

// --- UI and Animation Functions (Unchanged) ---

function startParticleAnimation() {
    new p5(function(p) {
        let particles = [];
        const numParticles = 50;
        p.setup = function() {
            const container = document.getElementById('particle-container');
            const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
            canvas.parent('particle-container');
            for (let i = 0; i < numParticles; i++) {
                particles.push({ x: p.random(p.width), y: p.random(p.height), vx: p.random(-0.5, 0.5), vy: p.random(-0.5, 0.5), size: p.random(2, 4), opacity: p.random(0.3, 0.8) });
            }
        };
        p.draw = function() {
            p.clear();
            particles.forEach(particle => {
                particle.x += particle.vx; particle.y += particle.vy;
                if (particle.x < 0) particle.x = p.width; if (particle.x > p.width) particle.x = 0;
                if (particle.y < 0) particle.y = p.height; if (particle.y > p.height) particle.y = 0;
                p.fill(255, 255, 255, particle.opacity * 255); p.noStroke();
                p.circle(particle.x, particle.y, particle.size);
                particles.forEach(other => {
                    const distance = p.dist(particle.x, particle.y, other.x, other.y);
                    if (distance < 100) {
                        p.stroke(255, 255, 255, (1 - distance / 100) * 50); p.strokeWeight(0.5);
                        p.line(particle.x, particle.y, other.x, other.y);
                    }
                });
            });
        };
        p.windowResized = function() {
            const container = document.getElementById('particle-container');
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        };
    });
}

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    document.getElementById('current-time').textContent = timeString;
    document.getElementById('campus-time').textContent = timeString;
}

function updateSystemStats() {
    const stats = {
        aiConfidence: 98 + Math.floor(Math.random() * 3),
        responseTime: (0.8 + (Math.random() - 0.5) * 0.4).toFixed(1),
        queriesToday: 247 + Math.floor(Math.random() * 5),
        visitorCount: 156 + Math.floor(Math.random() * 10)
    };
    animateNumber('ai-confidence', stats.aiConfidence + '%');
    animateNumber('response-time', stats.responseTime + 's');
    animateNumber('queries-today', stats.queriesToday);
    animateNumber('visitor-count', stats.visitorCount);
}

function animateNumber(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (element && element.textContent !== newValue) {
        anime({ targets: element, scale: [1, 1.1, 1], duration: 300, easing: 'easeOutBack', complete: () => element.textContent = newValue });
    }
}

function startVisitorRequest() {
    document.getElementById('visitor-modal').classList.remove('hidden');
    anime({ targets: '#visitor-modal', opacity: [0, 1], duration: 300, easing: 'easeOutQuart' });
    anime({ targets: '#visitor-modal > div', scale: [0.8, 1], duration: 400, easing: 'easeOutBack' });
}

function closeVisitorModal() {
    anime({
        targets: '#visitor-modal', opacity: [1, 0], duration: 200,
        complete: () => {
            document.getElementById('visitor-modal').classList.add('hidden');
            document.getElementById('visitor-form').reset();
        }
    });
}

function getCampusMap() {
    const mapInfo = `Our AI can provide details on specific buildings like the Library, Engineering, or Business buildings. Which one are you looking for?`;
    addChatMessage(mapInfo, 'system');
}

function addChatMessage(message, sender = 'user') {
    const chatContainer = document.getElementById('chat-messages');
    const wrapper = document.createElement('div');
    const messageElement = document.createElement('div');
    const isUser = sender === 'user';
    wrapper.className = `w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`;
    messageElement.className = `chat-bubble p-0 rounded-lg message-enter max-w-[85%]`;
    const icon = isUser ? 
        '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>' :
        '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>';
    const bgColor = isUser ? 'bg-blue-600' : 'bg-gray-600';
    messageElement.innerHTML = `
        <div class="flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}">
            <div class="w-8 h-8 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0">${icon}</div>
            <div class="flex-1 ${isUser ? 'bg-blue-50' : 'bg-gray-50'} p-3 rounded-lg"><p class="text-sm text-gray-800">${message}</p></div>
        </div>`;
    wrapper.appendChild(messageElement);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // --- THIS LINE IS KEY ---
    // It saves every message (both user and system) to the state for memory
    AppState.chatHistory.push({ message, sender, timestamp: new Date() });
}

function showTypingIndicator() {
    // Avoid duplicate typing indicators
    if (document.getElementById('typing-indicator')) return;
    
    const chatContainer = document.getElementById('chat-messages');
    const wrapper = document.createElement('div');
    wrapper.id = 'typing-indicator';
    wrapper.className = 'w-full flex justify-start mb-3';
    wrapper.innerHTML = `
        <div class="chat-bubble p-0 rounded-lg message-enter max-w-[85%]">
            <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div>
                <div class="bg-gray-50 p-3 rounded-lg flex items-center">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style="animation-delay: 0.2s;"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style="animation-delay: 0.4s;"></div>
                    </div>
                </div>
            </div>
        </div>`;
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        anime({ targets: typingIndicator, opacity: [1, 0], duration: 200, complete: () => typingIndicator.remove() });
    }
}

function handleEmergency() {
    const emergencyModal = document.createElement('div');
    emergencyModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    emergencyModal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md mx-4">
            <div class="text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg></div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Emergency Contact</h3>
                <p class="text-gray-600 mb-4">This will immediately alert campus security. Only use for genuine emergencies.</p>
                <div class="space-y-3">
                    <button class="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold" onclick="confirmEmergency()">Yes, Contact Security Now</button>
                    <button class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-semibold" onclick="closeEmergencyModal()">Cancel</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(emergencyModal);
    anime({ targets: emergencyModal.querySelector('div'), scale: [0.8, 1], opacity: [0, 1], duration: 300, easing: 'easeOutBack' });
}

function confirmEmergency() {
    addChatMessage('Emergency alert sent! Campus security has been notified and will arrive within 3-5 minutes. Please stay at the gate area.', 'system');
    closeEmergencyModal();
}

function closeEmergencyModal() {
    const emergencyModal = document.querySelector('.fixed.inset-0');
    if (emergencyModal) {
        anime({
            targets: emergencyModal.querySelector('div'), scale: [1, 0.8], opacity: [1, 0], duration: 200,
            complete: () => emergencyModal.remove()
        });
    }
}

// Export functions for global access
window.startVisitorRequest = startVisitorRequest;
window.closeVisitorModal = closeVisitorModal;
window.handleEmergency = handleEmergency;
window.getCampusMap = getCampusMap;
window.checkVisitorStatus = checkVisitorStatus;
window.confirmEmergency = confirmEmergency;
window.closeEmergencyModal = closeEmergencyModal;