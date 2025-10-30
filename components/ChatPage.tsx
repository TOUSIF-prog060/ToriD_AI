import React from 'react';
import ChatArea from './ChatArea';
import Sidebar from './Sidebar';
import { Chat, Message } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { generateChatResponse } from '../services/geminiService';

const MenuIcon = ({ className, onClick }: { className: string, onClick: () => void }) => (
    <button onClick={onClick} className={className} aria-label="Open sidebar">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
);

const ChatPage: React.FC = () => {
  const [chats, setChats] = useLocalStorage<Chat[]>('chats', []);
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>('activeChatId', null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
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
    if (!isInitial) setIsSidebarOpen(false);
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

  const handleSendMessage = async (text: string) => {
    if (!activeChatId || !activeChat || isTyping) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: Date.now(),
    };
    
    // Update chat title with the first user message
    const shouldUpdateTitle = activeChat.messages.length === 0;

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

    const aiResponseText = await generateChatResponse(text, activeChatId);
    
    const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
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
      />
      <main className="flex-1 flex flex-col relative">
        <div className="absolute top-4 left-4 z-40 md:hidden">
            <MenuIcon className="w-8 h-8 text-text-primary p-1 rounded-md bg-bubble-user/50 hover:bg-bubble-user/70" onClick={() => setIsSidebarOpen(true)} />
        </div>
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