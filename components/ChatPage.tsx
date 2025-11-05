

import React, { useState, useEffect, useRef } from 'react';
import ChatArea from './ChatArea';
import Sidebar from './Sidebar';
import ConfigurationPage from './ConfigurationPage';
import { Chat, Message, MessageWithAttachmentData } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { generateChatResponse, fileToBase64, attachmentCache, loadChatHistoryIntoGemini, getOrCreateGeminiChatSession } from '../services/geminiService';
import { executeWorkflow } from '../services/n8nService';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';


const MenuIcon = ({ className, onClick }: { className: string, onClick: () => void }) => (
    <button onClick={onClick} className={className} aria-label="Open sidebar">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);


interface ChatPageProps {
  session: Session;
  onLogout: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ session, onLogout }) => {
  const userId = session.user.id;
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithAttachmentData[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage<boolean>('sidebarCollapsed', false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // --- Initial Chat/Message Loading and Realtime Subscriptions ---
  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      const { data, error } = await supabase.from('chats').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching chats:", error);
      } else {
        setChats(data || []);
        if (data && data.length > 0 && !activeChatId) {
            setActiveChatId(data[0].id);
        } else if (data && data.length === 0) {
            handleNewChat(true);
        }
      }
    };
    fetchChats();

    const chatChannel = supabase.channel('public:chats').on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `user_id=eq.${userId}` }, (payload) => {
        const newChat = payload.new as Chat;
        const oldChat = payload.old as Chat;
        if (payload.eventType === 'INSERT') setChats(prev => [newChat, ...prev]);
        else if (payload.eventType === 'UPDATE') setChats(prev => prev.map(c => c.id === newChat.id ? newChat : c));
        else if (payload.eventType === 'DELETE') {
            setChats(prev => prev.filter(c => c.id !== oldChat.id));
            if (activeChatId === oldChat.id) setActiveChatId(null);
        }
    }).subscribe();

    return () => { supabase.removeChannel(chatChannel); };
  }, [userId, activeChatId]);

  useEffect(() => {
    if (!activeChatId || !userId) {
        setMessages([]);
        return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase.from('messages').select('*').eq('chat_id', activeChatId).eq('user_id', userId).order('created_at', { ascending: true });
      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        const historyForGemini = await loadChatHistoryIntoGemini(activeChatId, userId);
        getOrCreateGeminiChatSession(activeChatId, historyForGemini);
        
        // Augment messages with transient data from cache (for page loads)
        const augmentedMessages = await Promise.all(data?.map(async msg => {
            const augmentedMsg: MessageWithAttachmentData = { ...msg };
            if (msg.attachment_mime_type && attachmentCache.has(msg.id)) {
                augmentedMsg.attachment_base64 = attachmentCache.get(msg.id)!.base64;
            }
            if (msg.is_workflow_suggestion) {
                // For simplicity, we don't re-fetch workflow suggestions from history.
                // A more advanced implementation might cache them.
                augmentedMsg.workflows = []; 
            }
            return augmentedMsg;
        }) || []);
        setMessages(augmentedMessages);
      }
    };
    fetchMessages();

    const messageChannel = supabase.channel(`public:messages:chat_id=eq.${activeChatId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeChatId}` }, (payload) => {
        const newMessage = payload.new as Message;
        if (payload.eventType === 'INSERT') {
            setMessages(prev => {
                if (!prev.some(m => m.id === newMessage.id)) {
                    // This is where we receive the final AI message, including workflow suggestions from geminiService
                    const newMsgWithData: MessageWithAttachmentData = { ...newMessage };
                    if (newMessage.is_workflow_suggestion) {
                      // This message will be updated by the response from `generateChatResponse`
                    }
                    return [...prev, newMsgWithData];
                }
                return prev;
            });
        }
    }).subscribe();
    
    return () => { supabase.removeChannel(messageChannel); };
  }, [activeChatId, userId]);


  const handleNewChat = async (isInitial = false) => {
    if (!userId) return;
    setIsTyping(false);
    const { data, error } = await supabase.from('chats').insert({ user_id: userId, title: 'New Chat' }).select().single();
    if (error) {
      console.error("Error creating new chat:", error);
    } else if (data) {
      setActiveChatId(data.id);
      if (!isInitial) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      }
    }
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from('chats').delete().eq('id', id).eq('user_id', userId);
    if (error) console.error("Error deleting chat:", error);
  };

  useEffect(() => {
    if (chats.length > 0 && (!activeChatId || !chats.find(c => c.id === activeChatId))) {
        setActiveChatId(chats[0].id);
    } else if (chats.length === 0 && activeChatId) {
        setActiveChatId(null);
    }
  }, [chats, activeChatId]);

  const activeChat = chats.find(chat => chat.id === activeChatId);

  const handleSendMessage = async (text: string, file: File | null) => {
    if (!activeChatId || !activeChat || isTyping || !userId) return;
    if (!text.trim() && !file) return;

    let attachmentBase64: string | undefined;
    if (file) {
      try {
        attachmentBase64 = await fileToBase64(file);
      } catch (error) {
        console.error("Error converting file to base64:", error);
        return; 
      }
    }

    const tempUserMessage: MessageWithAttachmentData = {
      id: `temp-${Date.now()}`, chat_id: activeChatId, user_id: userId, text_content: text, sender: 'user', created_at: new Date().toISOString(),
      attachment_mime_type: file?.type, attachment_file_name: file?.name, attachment_base64: attachmentBase64,
    };
    setMessages(prev => [...prev, tempUserMessage]);
    
    if (activeChat.title === 'New Chat' && text.trim() !== '') {
        await supabase.from('chats').update({ title: text.substring(0, 30) + (text.length > 30 ? '...' : '') }).eq('id', activeChatId);
    }
    
    setIsTyping(true);
    const aiResponse = await generateChatResponse(text, file, activeChatId, userId);
    setIsTyping(false);

    // Replace optimistic user message with the one from DB
    // The AI message will come in via the realtime subscription.
    // We update the message list here if the AI response includes workflow data.
    if (aiResponse.is_workflow_suggestion) {
        setMessages(prev => [...prev, aiResponse]);
    }
  };

  const handleExecuteWorkflow = async (workflowId: string, workflowName: string) => {
    if (!activeChatId || !userId) return;
  
    // Add an optimistic message
    const tempMessage: MessageWithAttachmentData = {
      id: `executing-${workflowId}-${Date.now()}`, chat_id: activeChatId, user_id: userId,
      sender: 'ai', text_content: `Please wait, I'm starting the "${workflowName}" workflow...`, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);
  
    try {
      const result = await executeWorkflow(workflowId);
      let resultMessageText = `The "${workflowName}" workflow has been triggered successfully!`;
      if (!result.success && result.message) {
        resultMessageText = `There was an issue starting the "${workflowName}" workflow: ${result.message}`;
      } else if (!result.success) {
        resultMessageText = `An unknown error occurred while trying to start the "${workflowName}" workflow.`;
      }
       await supabase.from('messages').insert({ chat_id: activeChatId, user_id: userId, sender: 'ai', text_content: resultMessageText });
    } catch (error: any) {
        const errorText = `Failed to execute workflow: ${error.message}`;
        await supabase.from('messages').insert({ chat_id: activeChatId, user_id: userId, sender: 'ai', text_content: errorText });
    } finally {
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };


  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {isConfigOpen && <ConfigurationPage onClose={() => setIsConfigOpen(false)} />}
      <Sidebar 
        chats={chats} activeChatId={activeChatId} onNewChat={() => handleNewChat()}
        onSelectChat={handleSelectChat} onDeleteChat={handleDeleteChat}
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed}
        onLogout={onLogout} onOpenSettings={() => setIsConfigOpen(true)}
      />
      <main className="flex-1 flex flex-col relative">
        <div className="absolute top-4 left-4 z-40 md:hidden">
            <MenuIcon className="w-8 h-8 text-text-primary p-1 rounded-md bg-bubble-user/50 hover:bg-bubble-user/70" onClick={() => setIsSidebarOpen(true)} />
        </div>
        {isSidebarCollapsed && (
          <div className="absolute top-4 left-4 z-40 hidden md:block">
            <button onClick={() => setIsSidebarCollapsed(false)} className="w-8 h-8 flex items-center justify-center text-text-primary p-1 rounded-md bg-bubble-user/50 hover:bg-bubble-user/70" aria-label="Open sidebar">
                <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        )}

        {activeChat ? (
            <ChatArea chat={activeChat} messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} onExecuteWorkflow={handleExecuteWorkflow} />
        ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary">
                <h2 className="text-2xl font-bold font-display text-text-primary">Select a chat or start a new one</h2>
            </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
