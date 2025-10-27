// AI Service Module - Handles Gemini API and Qwen fallback
class AIService {
    constructor() {
        this.isGeminiAvailable = this.checkGeminiAvailability();
    }

    checkGeminiAvailability() {
        return CONFIG.AI.GEMINI_API_KEY && CONFIG.AI.GEMINI_API_KEY !== "GEMINI_API_KEY";
    }

    async getRAGResponse(prompt) {
        let context_chunks;
        
        try {
            // Step 1: Vectorize the user's prompt
            console.log("Step 1: Vectorizing prompt...");
            const vector = await this.vectorizeText(prompt);
            console.log("Vectorization successful.");

            // Step 2: Search Qdrant for relevant context
            console.log("Step 2: Searching Qdrant...");
            context_chunks = await this.searchQdrant(vector);
            console.log("Qdrant search successful. Context found:", context_chunks);
            
        } catch (ragError) {
            console.error('Offline RAG pipeline (Vector/Qdrant) error:', ragError.message);
            return `I'm having trouble accessing my local knowledge base. Please ensure the vectorizer and Qdrant servers are running correctly.`;
        }

        // Step 3: Try PRIMARY LLM (Gemini Flash)
        if (this.isGeminiAvailable) {
            try {
                console.log("Step 3: Querying Primary (Gemini Flash)...");
                return await this.queryGemini(prompt, context_chunks);
            } catch (geminiError) {
                console.error('Primary LLM (Gemini) failed:', geminiError.message);
            }
        }

        // Step 4: FALLBACK to Backup LLM (Qwen)
        try {
            console.log("Step 4: Querying Backup (Qwen) with RAG prompt...");
            return await this.queryQwen(prompt, context_chunks);
        } catch (ollamaError) {
            console.error('Fallback LLM (Qwen) also failed:', ollamaError.message);
            return `Chatbot under maintenance`;
        }
    }

    async vectorizeText(text) {
        const response = await fetch(CONFIG.AI.VECTORIZER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) throw new Error(`Vectorizer server error: ${response.statusText}`);
        
        const data = await response.json();
        return data.vector;
    }

    async searchQdrant(vector) {
        const response = await fetch(CONFIG.AI.QDRANT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vector: vector,
                limit: 5,
                with_payload: true
            })
        });
        
        if (!response.ok) throw new Error(`Qdrant server error: ${response.statusText}`);
        
        const data = await response.json();
        return data.result.map(item => item.payload.text).join("\n\n---\n\n");
    }

    async queryGemini(prompt, context) {
        const geminiHistory = this.buildGeminiHistory();
        const finalUserPromptForGemini = this.buildFinalPrompt(prompt, context);
        
        geminiHistory.push({
            role: "user",
            parts: [{ text: finalUserPromptForGemini }]
        });
        
        const response = await fetch(`${CONFIG.AI.GEMINI_URL}?key=${CONFIG.AI.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: geminiHistory,
                generationConfig: {
                    temperature: appState.aiConfig.temperature,
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini API error: ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            if (data.promptFeedback && data.promptFeedback.blockReason) {
                throw new Error(`Gemini API blocked the prompt. Reason: ${data.promptFeedback.blockReason}`);
            }
            throw new Error("Invalid response structure from Gemini API.");
        }

        console.log("Gemini response received.");
        return data.candidates[0].content.parts[0].text.trim();
    }

    async queryQwen(prompt, context) {
        const historyString = this.buildHistoryString();
        const finalPrompt = this.buildFinalPrompt(prompt, context, historyString);

        const response = await fetch(CONFIG.AI.OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.AI.OLLAMA_MODEL_NAME,
                prompt: finalPrompt,
                stream: false,
                options: {
                    temperature: appState.aiConfig.temperature
                }
            })
        });

        if (!response.ok) throw new Error(`Ollama server error: ${response.statusText}`);
        
        const data = await response.json();
        console.log("Qwen (fallback) response received.");
        return data.response.trim();
    }

    buildGeminiHistory() {
        return appState.getRecentChatHistory().map(entry => ({
            role: entry.sender === 'user' ? 'user' : 'model',
            parts: [{ text: entry.message }]
        }));
    }

    buildHistoryString() {
        const history = appState.getRecentChatHistory();
        return history.map(entry => {
            const prefix = entry.sender === 'user' ? 'User' : 'AI';
            return `${prefix}: ${entry.message}`;
        }).join('\n');
    }

    buildFinalPrompt(userPrompt, context, historyString = '') {
        const systemPrompt = this.getSystemPrompt();
        
        let prompt = `${systemPrompt}\n\n`;
        
        if (historyString) {
            prompt += `PREVIOUS CONVERSATION:\n${historyString}\n\n---\n\n`;
        }
        
        prompt += `CONTEXT:\n${context}\n\nUSER QUESTION:\n${userPrompt}`;
        
        return prompt;
    }

    getSystemPrompt() {
        return `You are the University of Balamand (UOB) Koura Campus AI Assistant, a helpful and knowledgeable guide for students, visitors, and staff. Your sole purpose is to provide clear, accurate, and concise information about the university.

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
    }

    // Utility method to test AI connectivity
    async testConnectivity() {
        const results = {
            gemini: false,
            qwen: false,
            vectorizer: false,
            qdrant: false
        };

        // Test Gemini
        if (this.isGeminiAvailable) {
            try {
                const response = await fetch(`${CONFIG.AI.GEMINI_URL}?key=${CONFIG.AI.GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: "test" }] }]
                    })
                });
                results.gemini = response.ok;
            } catch (e) {
                results.gemini = false;
            }
        }

        // Test Qwen
        try {
            const response = await fetch(CONFIG.AI.OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: CONFIG.AI.OLLAMA_MODEL_NAME,
                    prompt: "test",
                    stream: false
                })
            });
            results.qwen = response.ok;
        } catch (e) {
            results.qwen = false;
        }

        // Test Vectorizer
        try {
            const response = await fetch(CONFIG.AI.VECTORIZER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: "test" })
            });
            results.vectorizer = response.ok;
        } catch (e) {
            results.vectorizer = false;
        }

        // Test Qdrant
        try {
            const response = await fetch(CONFIG.AI.QDRANT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vector: new Array(384).fill(0.1), // dummy vector
                    limit: 1
                })
            });
            results.qdrant = response.ok;
        } catch (e) {
            results.qdrant = false;
        }

        return results;
    }
}

// Create global AI service instance
const aiService = new AIService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIService, aiService };
}