import { GoogleGenAI, Chat as GenAIChat, Part, Content } from "@google/genai";
import { supabase } from "./supabaseClient"; // Import Supabase client
import { Message, Chat } from "../types";

// Ensure you have your API_KEY set up in your environment variables.
// This will be automatically picked up by the execution environment.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

// Map to store active Gemini chat sessions by chatId.
// This is to maintain the chat context for the Gemini API, separate from DB persistence.
const activeGeminiChats = new Map<string, GenAIChat>();

// FIX: Updated to accept initialHistory for seeding the chat session
export const getOrCreateGeminiChatSession = (chatId: string, initialHistory: Content[] = []): GenAIChat => {
    if (activeGeminiChats.has(chatId)) {
        return activeGeminiChats.get(chatId)!;
    }

    const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        // FIX: Pass initial history to the chat creation
        history: initialHistory,
        config: {
            systemInstruction: "You are TORID_AI, a helpful and friendly AI assistant. Provide clear, concise, and informative answers.",
        },
    });

    activeGeminiChats.set(chatId, newChat);
    return newChat;
};

// FIX: Modified to return history for Gemini chat creation instead of directly manipulating chat.history
export const loadChatHistoryIntoGemini = async (chatId: string, userId: string): Promise<Content[]> => {
    // Fetch messages from Supabase for the given chat
    const { data: messages, error } = await supabase
        .from('messages')
        .select('id, sender, text_content, attachment_mime_type') // Select ID to potentially use with attachmentCache
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error loading chat history from Supabase:", error);
        return [];
    }

    // Convert Supabase messages to Gemini Content format
    const history: Content[] = messages.map(msg => {
        const parts: Part[] = [{ text: msg.text_content }];
        // Note: Attachment data itself is not loaded here from Supabase storage,
        // as attachmentCache is in-memory and not persistent across reloads.
        // For Gemini to process historical images, they would need to be re-uploaded or fetched from persistent storage.
        // For now, only text content is re-fed to Gemini for historical messages.
        // If attachment_mime_type exists and base64 data was available (e.g., from a persistent cache),
        // one might add:
        // if (msg.attachment_mime_type && attachmentCache.has(msg.id)) {
        //   const cached = attachmentCache.get(msg.id)!;
        //   parts.push({ inlineData: { mimeType: cached.mimeType, data: cached.base64 } });
        // }
        return {
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: parts,
        };
    });
    return history;
};


export const generateChatResponse = async (text: string, file: File | null, chatId: string, userId: string): Promise<string> => {
    try {
        const geminiChat = getOrCreateGeminiChatSession(chatId);
        
        const contentsParts: Part[] = []; 

        if (text.trim()) {
            contentsParts.push({ text: text });
        }

        let attachmentMimeType: string | undefined = undefined;
        let attachmentFileName: string | undefined = undefined;
        let attachmentBase64Data: string | undefined = undefined;

        if (file) {
            attachmentBase64Data = await fileToBase64(file);
            contentsParts.push({
                inlineData: {
                    mimeType: file.type,
                    data: attachmentBase64Data,
                },
            });
            attachmentMimeType = file.type;
            attachmentFileName = file.name;
        }

        if (contentsParts.length === 0) {
            return "Please provide some text or an image.";
        }
        
        // 1. Save user message to Supabase
        const userMessageToSave: Omit<Message, 'id' | 'created_at'> = {
            chat_id: chatId,
            user_id: userId,
            sender: 'user',
            text_content: text,
            attachment_mime_type: attachmentMimeType,
            attachment_file_name: attachmentFileName,
        };

        const { data: userMessageData, error: userMessageError } = await supabase
            .from('messages')
            .insert(userMessageToSave)
            .select()
            .single();

        if (userMessageError) {
            console.error("Error saving user message to Supabase:", userMessageError);
            throw userMessageError;
        }

        // Store attachment in client-side cache for display
        if (attachmentBase64Data && userMessageData) {
            attachmentCache.set(userMessageData.id, { base64: attachmentBase64Data, mimeType: attachmentMimeType! });
        }


        // 2. Send message to Gemini API
        // FIX: Adjust message payload to match SendMessageParameters type directly
        const geminiMessageContent: string | Part[] = contentsParts.length === 1 && 'text' in contentsParts[0] && !file
            ? contentsParts[0].text // If only a single text part and no file, send as string
            : contentsParts;        // Otherwise, send as Part[]

        const response = await geminiChat.sendMessage({ message: geminiMessageContent });
        const aiResponseText = response.text;

        // 3. Save AI response to Supabase
        const aiMessageToSave: Omit<Message, 'id' | 'created_at'> = {
            chat_id: chatId,
            user_id: userId,
            sender: 'ai',
            text_content: aiResponseText,
        };

        const { error: aiMessageError } = await supabase
            .from('messages')
            .insert(aiMessageToSave);

        if (aiMessageError) {
            console.error("Error saving AI message to Supabase:", aiMessageError);
            throw aiMessageError;
        }
        
        return aiResponseText;

    } catch (error) {
        console.error("Error generating response from Gemini API or saving to Supabase:", error);
        
        let errorMessage = "Sorry, something went wrong while trying to get a response.";
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                errorMessage = "The provided API key is not valid. Please check your configuration.";
            } else if (error.message.includes('fetch failed') || error.message.includes('network error')) {
                 errorMessage = "I couldn't connect to the AI service or Supabase. Please check your network connection.";
            } else if (error.message.includes('media parsing failed')) {
                errorMessage = "Sorry, I had trouble processing the image. Please try another one or a different format.";
            } else if (error.message.includes('Supabase') || error.message.includes('Postgres')) {
                errorMessage = "There was a database issue. Please try again or contact support.";
            }
        }
        return errorMessage;
    }
};