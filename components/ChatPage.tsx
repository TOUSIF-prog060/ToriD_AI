


import React from 'react';
import ChatArea from './ChatArea';
import Sidebar from './Sidebar';
import { Chat, Message } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { generateChatResponse, fileToBase64, attachmentCache } from '../services/geminiService';

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


const ChatPage: React.FC = () => {
  const [chats, setChats] = useLocalStorage<Chat[]>('chats', []);
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>('activeChatId', null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage<boolean>('sidebarCollapsed', false);
  const [isTyping, setIsTyping] = React.useState(false);

  const handleNewChat = (isInitial = false) => {
    const newChat: Chat = {
        id: `chat-${Date.now()}`,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
    };
    if (isInitial) {
        setChats([newChat]);
    } else {
        setChats(prevChats => [newChat, ...prevChats]);
    }
    setActiveChatId(newChat.id);
    if (!isInitial) {
      setIsSidebarOpen(false);
      setIsSidebarCollapsed(false);
    }
  };

  React.useEffect(() => {
    if (chats.length === 0) {
      handleNewChat(true);
    } else if (!activeChatId || !chats.find(c => c.id === activeChatId)) {
      const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);
      setActiveChatId(sortedChats[0]?.id || null);
    }
  }, []);

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = (id: string) => {
    setChats(prevChats => {
        const newChats = prevChats.filter(chat => chat.id !== id);
        if (activeChatId === id) {
            if (newChats.length > 0) {
                const sortedChats = [...newChats].sort((a, b) => b.createdAt - a.createdAt);
                setActiveChatId(sortedChats[0].id);
            } else {
                handleNewChat(true);
                return [];
            }
        }
        return newChats;
    });
  };

  const activeChat = chats.find(chat => chat.id === activeChatId);

  const handleSendMessage = async (text: string, file: File | null) => {
    if (!activeChatId || !activeChat || isTyping) return;
    if (!text.trim() && !file) return; // Ensure there's content to send

    const userMessageId = `msg-${Date.now()}`; // Generate a unique ID for the user message once

    let attachmentPayload: { mimeType: string; hasData: boolean; } | undefined = undefined;
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        // Store base64 data in in-memory cache using the consistent userMessageId
        attachmentCache.set(userMessageId, { base64, mimeType: file.type });
        attachmentPayload = { mimeType: file.type, hasData: true };
      } catch (error) {
        console.error("Error converting file to base64:", error);
        // Optionally, display an error message to the user
        return; 
      }
    }

    const userMessage: Message = {
      id: userMessageId, // Use the consistent ID
      text,
      sender: 'user',
      timestamp: Date.now(),
      attachment: attachmentPayload, 
    };
    
    // Update chat title with the first user message
    const shouldUpdateTitle = activeChat.messages.length === 0 && text.trim() !== '';

    setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
            const updatedChat = { ...c, messages: [...c.messages, userMessage] };
            if (shouldUpdateTitle) {
                updatedChat.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
            }
            return updatedChat;
        }
        return c;
    }));
    
    setIsTyping(true);

    const aiResponseText = await generateChatResponse(text, file, activeChatId);
    
    const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`, // Ensure AI message has a unique ID, slightly after user's
        sender: 'ai',
        text: aiResponseText,
        timestamp: Date.now(),
    };

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
          // Make sure we are updating the chat with the user message already in it
          const currentMessages = (chats.find(chat => chat.id === activeChatId) || c).messages;
          const messagesWithUser = currentMessages.some(m => m.id === userMessage.id) 
            ? currentMessages 
            : [...currentMessages, userMessage];
          return { ...c, messages: [...messagesWithUser, aiMessage] };
      }
      return c;
    }));

    setIsTyping(false);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar 
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={() => handleNewChat()}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <main className="flex-1 flex flex-col relative">
        {/* Mobile menu button */}
        <div className="absolute top-4 left-4 z-40 md:hidden">
            <MenuIcon className="w-8 h-8 text-text-primary p-1 rounded-md bg-bubble-user/50 hover:bg-bubble-user/70" onClick={() => setIsSidebarOpen(true)} />
        </div>
        {/* Desktop reopen button */}
        {isSidebarCollapsed && (
          <div className="absolute top-4 left-4 z-40 hidden md:block">
            {/* FIX: Changed setIsCollapsed to setIsSidebarCollapsed to match the state variable name. */}
            <button onClick={() => setIsSidebarCollapsed(false)} className="w-8 h-8 flex items-center justify-center text-text-primary p-1 rounded-md bg-bubble-user/50 hover:bg-bubble-user/70" aria-label="Open sidebar">
                <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        )}

        {activeChat ? (
            <ChatArea chat={activeChat} onSendMessage={handleSendMessage} isTyping={isTyping} />
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