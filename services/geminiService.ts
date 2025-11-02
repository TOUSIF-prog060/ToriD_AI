
import { GoogleGenAI, Chat } from "@google/genai";

// Ensure you have your API_KEY set up in your environment variables.
// This will be automatically picked up by the execution environment.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// In-memory cache for chat sessions. A more robust solution might use sessionStorage or a server-side store.
const chatSessions = new Map<string, Chat>();

// In-memory cache for attachment base64 data to avoid localStorage quota issues.
// This data will not persist across page reloads.
export const attachmentCache = new Map<string, { base64: string; mimeType: string; }>();

// Utility function to convert a File object to a base64 string
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                // Extract base64 part (remove data:image/png;base64,)
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            } else {
                reject(new Error("Failed to convert file to base64."));
            }
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

const getChatSession = (chatId: string): Chat => {
    if (chatSessions.has(chatId)) {
        return chatSessions.get(chatId)!;
    }

    // Create a new chat session with a specified model
    const newChat = ai.chats.create({
        model: 'gemini-2.5-flash', // Use gemini-2.5-flash for multi-modal capabilities
        // Optional: Add a system instruction if needed
        config: {
            systemInstruction: "You are TORID_AI, a helpful and friendly AI assistant. Provide clear, concise, and informative answers.",
        },
    });

    chatSessions.set(chatId, newChat);
    return newChat;
};

export const generateChatResponse = async (text: string, file: File | null, chatId: string): Promise<string> => {
    try {
        const chat = getChatSession(chatId);
        
        // Use 'any' for parts for flexibility in content structure.
        // The actual types are Part and InlineData from @google/genai.
        const contentsParts: any[] = []; 

        if (text.trim()) {
            contentsParts.push({ text: text });
        }

        if (file) {
            const base64Data = await fileToBase64(file);
            contentsParts.push({
                inlineData: {
                    mimeType: file.type,
                    data: base64Data,
                },
            });
        }

        if (contentsParts.length === 0) {
            return "Please provide some text or an image.";
        }
        
        // FIX: All content for chat.sendMessage must be wrapped in a 'message' property.
        // If it's a single text part and no file, send as { message: "text" }.
        // Otherwise, send as { message: { parts: [...] } }.
        const messagePayload = contentsParts.length === 1 && 'text' in contentsParts[0] && !file
            ? { message: contentsParts[0].text }
            : { message: { parts: contentsParts } };

        const response = await chat.sendMessage(messagePayload);
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
            } else if (error.message.includes('media parsing failed')) {
                errorMessage = "Sorry, I had trouble processing the image. Please try another one or a different format.";
            }
        }
        return errorMessage;
    }
};
