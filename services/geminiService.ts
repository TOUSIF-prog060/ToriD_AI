import { GoogleGenAI, Chat as GenAIChat, Part, Content, FunctionDeclaration, Type } from "@google/genai";
import { supabase } from "./supabaseClient"; // Import Supabase client
import { Message, MessageWithAttachmentData, N8nWorkflow, Chat } from "../types";
import { searchWorkflows } from './n8nService';

// Ensure you have your API_KEY set up in your environment variables.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// In-memory cache for attachment base64 data to avoid localStorage quota issues.
export const attachmentCache = new Map<string, { base64: string; mimeType: string; }>();

// Utility function to convert a File object to a base64 string
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
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

const activeGeminiChats = new Map<string, GenAIChat>();

const n8nTool: FunctionDeclaration = {
  name: 'search_n8n_workflows',
  description: 'Search for available n8n automation workflows based on a user query. Use this to find automations for tasks like sending emails, managing CRM, creating documents, etc.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'A search query describing the desired automation task, e.g., "send an email" or "add a new lead".'
      }
    },
    required: ['query']
  }
};

export const getOrCreateGeminiChatSession = (chatId: string, initialHistory: Content[] = []): GenAIChat => {
    if (activeGeminiChats.has(chatId)) {
        return activeGeminiChats.get(chatId)!;
    }

    const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: initialHistory,
        config: {
            systemInstruction: "You are TORID_AI, a helpful and friendly AI assistant that can also trigger automations. When a user asks to perform a task that could be automated, use the search_n8n_workflows tool to find relevant workflows.",
            tools: [{ functionDeclarations: [n8nTool] }]
        },
    });

    activeGeminiChats.set(chatId, newChat);
    return newChat;
};

export const loadChatHistoryIntoGemini = async (chatId: string, userId: string): Promise<Content[]> => {
    const { data: messages, error } = await supabase
        .from('messages')
        .select('id, sender, text_content, attachment_mime_type')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error loading chat history from Supabase:", error);
        return [];
    }

    const history: Content[] = messages.map(msg => {
        const parts: Part[] = [{ text: msg.text_content }];
        return {
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: parts,
        };
    });
    return history;
};

// Returns the AI message object after saving everything to the DB
export const generateChatResponse = async (text: string, file: File | null, chatId: string, userId: string): Promise<MessageWithAttachmentData> => {
    try {
        // 1. Save user message to Supabase
        const contentsParts: Part[] = [];
        if (text.trim()) {
            contentsParts.push({ text: text });
        }

        let attachmentMimeType: string | undefined;
        let attachmentFileName: string | undefined;
        let attachmentBase64Data: string | undefined;

        if (file) {
            attachmentBase64Data = await fileToBase64(file);
            contentsParts.push({ inlineData: { mimeType: file.type, data: attachmentBase64Data } });
            attachmentMimeType = file.type;
            attachmentFileName = file.name;
        }

        if (contentsParts.length === 0) {
            throw new Error("No content to send.");
        }
        
        const userMessageToSave: Omit<Message, 'id' | 'created_at'> = {
            chat_id: chatId,
            user_id: userId,
            sender: 'user',
            text_content: text,
            attachment_mime_type: attachmentMimeType,
            attachment_file_name: attachmentFileName,
        };
        const { data: userMessageData, error: userMessageError } = await supabase.from('messages').insert(userMessageToSave).select().single();
        if (userMessageError) throw userMessageError;

        if (attachmentBase64Data && userMessageData) {
            attachmentCache.set(userMessageData.id, { base64: attachmentBase64Data, mimeType: attachmentMimeType! });
        }

        // 2. Send to Gemini and handle response
        const geminiChat = getOrCreateGeminiChatSession(chatId);
        const geminiMessageContent: string | Part[] = contentsParts.length === 1 && 'text' in contentsParts[0] && !file ? contentsParts[0].text : contentsParts;
        const result = await geminiChat.sendMessage({ message: geminiMessageContent });
        
        const functionCalls = result.functionCalls;
        
        // Handle Function Calling for n8n
        if (functionCalls && functionCalls.length > 0 && functionCalls[0].name === 'search_n8n_workflows') {
            const query = functionCalls[0].args.query as string;
            const workflows = await searchWorkflows(query);

            let aiMessageText: string;
            let isWorkflowSuggestion = false;

            if (workflows.length > 0) {
                aiMessageText = `I found a few workflows related to "${query}". You can run them directly from here:`;
                isWorkflowSuggestion = true;
            } else {
                aiMessageText = `I couldn't find any n8n workflows for "${query}". I can still help with other tasks, though.`;
            }
            
            const aiMessageToSave: Omit<Message, 'id' | 'created_at'> = {
                chat_id: chatId, user_id: userId, sender: 'ai', text_content: aiMessageText, is_workflow_suggestion: isWorkflowSuggestion,
            };
            const { data: aiMessageData, error: aiMessageError } = await supabase.from('messages').insert(aiMessageToSave).select().single();
            if (aiMessageError) throw aiMessageError;

            return { ...aiMessageData, workflows: workflows.length > 0 ? workflows : undefined };
        }
        
        // Handle standard text response
        const aiResponseText = result.text;
        const aiMessageToSave: Omit<Message, 'id' | 'created_at'> = {
            chat_id: chatId, user_id: userId, sender: 'ai', text_content: aiResponseText,
        };
        const { data: aiMessageData, error: aiMessageError } = await supabase.from('messages').insert(aiMessageToSave).select().single();
        if (aiMessageError) throw aiMessageError;

        return aiMessageData;

    } catch (error) {
        console.error("Error in generateChatResponse:", error);
        
        let errorMessage = "Sorry, something went wrong.";
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) errorMessage = "The Gemini API key is not valid.";
            else if (error.message.includes('n8n')) errorMessage = error.message; // Pass n8n errors through
            else if (error.message.includes('fetch failed')) errorMessage = "I couldn't connect to the AI service or Supabase. Please check your network.";
            else if (error.message.includes('media parsing failed')) errorMessage = "Sorry, I had trouble processing the image.";
            else if (error.message.includes('Supabase') || error.message.includes('Postgres')) errorMessage = "There was a database issue.";
        }

        const errorMsgData: MessageWithAttachmentData = {
          id: `error-${Date.now()}`,
          chat_id: chatId,
          user_id: userId,
          sender: 'ai',
          text_content: errorMessage,
          created_at: new Date().toISOString()
        };
        
        // Don't save this temporary error message to the DB
        return errorMsgData;
    }
};
