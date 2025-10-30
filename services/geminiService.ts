import { GoogleGenAI, Chat } from "@google/genai";

// Ensure you have your API_KEY set up in your environment variables.
// This will be automatically picked up by the execution environment.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// In-memory cache for chat sessions. A more robust solution might use sessionStorage or a server-side store.
const chatSessions = new Map<string, Chat>();

const getChatSession = (chatId: string): Chat => {
    if (chatSessions.has(chatId)) {
        return chatSessions.get(chatId)!;
    }

    // Create a new chat session with a specified model
    const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        // Optional: Add a system instruction if needed
        config: {
            systemInstruction: "You are TORID_AI, a helpful and friendly AI assistant. Provide clear, concise, and informative answers.",
        },
    });

    chatSessions.set(chatId, newChat);
    return newChat;
};

export const generateChatResponse = async (prompt: string, chatId: string): Promise<string> => {
    try {
        const chat = getChatSession(chatId);
        const response = await chat.sendMessage({ message: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating response from Gemini API:", error);
        
        // Provide a more user-friendly error message
        let errorMessage = "Sorry, something went wrong while trying to get a response.";
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                errorMessage = "The provided API key is not valid. Please check your configuration.";
            } else if (error.message.includes('fetch failed')) {
                 errorMessage = "I couldn't connect to the AI service. Please check your network connection.";
            }
        }
        return errorMessage;
    }
};
