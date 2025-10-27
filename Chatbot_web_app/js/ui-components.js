// UI Components and Animation Module
class UIComponents {
    constructor() {
        this.particleSystem = null;
    }

    // Chat message management
    addChatMessage(message, sender = 'user') {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        const wrapper = document.createElement('div');
        const messageElement = document.createElement('div');
        const isUser = sender === 'user';
        
        wrapper.className = `w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`;
        messageElement.className = 'chat-bubble p-0 rounded-lg message-enter max-w-[85%]';
        
        const icon = isUser ? 
            '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>' :
            '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>';
        
        const bgColor = isUser ? 'bg-blue-600' : 'bg-gray-600';
        const messageBg = isUser ? 'bg-blue-50' : 'bg-gray-50';
        
        const isRawHtml = sender === 'system' && message.trim().startsWith('<div');
        
        const messageContent = isRawHtml
            ? message // Render raw HTML
            : `<p class="text-sm text-gray-800">${this.escapeHtml(message)}</p>`;
        
        const paddingClass = isRawHtml ? '' : 'p-3';
        
        messageElement.innerHTML = `
            <div class="flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}">
                <div class="w-8 h-8 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0">${icon}</div>
                <div class="flex-1 ${messageBg} ${paddingClass} rounded-lg">
                    ${messageContent}
                </div>
            </div>
        `;
        
        wrapper.appendChild(messageElement);
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Add to chat history
        appState.addChatMessage(message, sender);
    }

    showTypingIndicator() {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer || document.getElementById('typing-indicator')) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'typing-indicator';
        wrapper.className = 'w-full flex justify-start mb-3';
        wrapper.innerHTML = `
            <div class="chat-bubble p-0 rounded-lg message-enter max-w-[85%]">
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg flex items-center">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style="animation-delay: 0.2s;"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style="animation-delay: 0.4s;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: typingIndicator,
                    opacity: [1, 0],
                    duration: 200,
                    complete: () => typingIndicator.remove()
                });
            } else {
                typingIndicator.remove();
            }
        }
    }

    // Particle animation system
    startParticleAnimation() {
        if (typeof p5 === 'undefined') return;

        new p5((p) => {
            let particles = [];
            const numParticles = 50;
            
            p.setup = () => {
                const container = document.getElementById('particle-container');
                if (!container) return;
                
                const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
                canvas.parent('particle-container');
                
                for (let i = 0; i < numParticles; i++) {
                    particles.push({
                        x: p.random(p.width),
                        y: p.random(p.height),
                        vx: p.random(-0.5, 0.5),
                        vy: p.random(-0.5, 0.5),
                        size: p.random(2, 4),
                        opacity: p.random(0.3, 0.8)
                    });
                }
            };
            
            p.draw = () => {
                p.clear();
                particles.forEach(particle => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    if (particle.x < 0) particle.x = p.width;
                    if (particle.x > p.width) particle.x = 0;
                    if (particle.y < 0) particle.y = p.height;
                    if (particle.y > p.height) particle.y = 0;
                    
                    p.fill(255, 255, 255, particle.opacity * 255);
                    p.noStroke();
                    p.circle(particle.x, particle.y, particle.size);
                    
                    particles.forEach(other => {
                        const distance = p.dist(particle.x, particle.y, other.x, other.y);
                        if (distance < 100) {
                            p.stroke(255, 255, 255, (1 - distance / 100) * 50);
                            p.strokeWeight(0.5);
                            p.line(particle.x, particle.y, other.x, other.y);
                        }
                    });
                });
            };
            
            p.windowResized = () => {
                const container = document.getElementById('particle-container');
                if (container) {
                    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
                }
            };
        });
    }

    // Time update utilities
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        const currentTimeElement = document.getElementById('current-time');
        const campusTimeElement = document.getElementById('campus-time');
        
        if (currentTimeElement) currentTimeElement.textContent = timeString;
        if (campusTimeElement) campusTimeElement.textContent = timeString;
    }

    updateSystemStats() {
        const stats = {
            aiConfidence: 98 + Math.floor(Math.random() * 3),
            responseTime: (0.8 + (Math.random() - 0.5) * 0.4).toFixed(1),
            queriesToday: 247 + Math.floor(Math.random() * 5),
            visitorCount: 156 + Math.floor(Math.random() * 10)
        };
        
        this.animateNumber('ai-confidence', stats.aiConfidence + '%');
        this.animateNumber('response-time', stats.responseTime + 's');
        this.animateNumber('queries-today', stats.queriesToday);
        this.animateNumber('visitor-count', stats.visitorCount);
    }

    animateNumber(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (element && element.textContent !== newValue) {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: element,
                    scale: [1, 1.1, 1],
                    duration: 300,
                    easing: 'easeOutBack',
                    complete: () => element.textContent = newValue
                });
            } else {
                element.textContent = newValue;
            }
        }
    }

    // Emergency modal
    handleEmergency() {
        const emergencyModal = document.createElement('div');
        emergencyModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        emergencyModal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md mx-4">
                <div class="text-center">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Emergency Contact</h3>
                    <p class="text-gray-600 mb-4">This will immediately alert campus security. Only use for genuine emergencies.</p>
                    <div class="space-y-3">
                        <button class="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold" onclick="confirmEmergency()">Yes, Contact Security Now</button>
                        <button class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-semibold" onclick="closeEmergencyModal()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(emergencyModal);
        
        if (typeof anime !== 'undefined') {
            anime({
                targets: emergencyModal.querySelector('div'),
                scale: [0.8, 1],
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutBack'
            });
        }
    }

    confirmEmergency() {
        const message = 'Emergency alert sent! Campus security has been notified and will arrive within 3-5 minutes. Please stay at the gate area.';
        this.addChatMessage(message, 'system');
        this.closeEmergencyModal();
    }

    closeEmergencyModal() {
        const emergencyModal = document.querySelector('.fixed.inset-0');
        if (emergencyModal) {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: emergencyModal.querySelector('div'),
                    scale: [1, 0.8],
                    opacity: [1, 0],
                    duration: 200,
                    complete: () => emergencyModal.remove()
                });
            } else {
                emergencyModal.remove();
            }
        }
    }

    // Campus information helpers
    getCampusMap() {
        const message = 'Our AI can provide details on specific buildings like the Library, Engineering, or Business buildings. Which one are you looking for?';
        this.addChatMessage(message, 'system');
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize typed.js animation
    initializeTypedAnimation() {
        if (typeof Typed !== 'undefined') {
            new Typed('#typed-welcome', {
                strings: ['University of Balamand', 'Koura Campus Access', 'AI Assistant Ready'],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 2000,
                loop: true,
                showCursor: true,
                cursorChar: '|'
            });
        }
    }

    // Initialize page animations
    initializeAnimations() {
        if (typeof anime !== 'undefined') {
            // Animate chat bubbles
            anime({
                targets: '.chat-bubble',
                translateY: [20, 0],
                opacity: [0, 1],
                duration: 600,
                delay: anime.stagger(100),
                easing: 'easeOutQuart'
            });

            // Animate quick action buttons
            anime({
                targets: '.quick-btn',
                scale: [0.9, 1],
                opacity: [0, 1],
                duration: 400,
                delay: anime.stagger(50, { start: 300 }),
                easing: 'easeOutBack'
            });
        }

        if (typeof Splitting !== 'undefined') {
            Splitting();
        }
    }
}

// Create global UI components instance
const uiComponents = new UIComponents();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIComponents, uiComponents };
}
