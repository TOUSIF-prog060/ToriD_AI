

import React, { useContext } from 'react';
import { Chat } from '../types';
import { ThemeContext } from '../App';

// --- Helper function to group chats by date ---
const groupChatsByDate = (chats: Chat[]): { [key: string]: Chat[] } => {
  const groups: { [key: string]: Chat[] } = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  chats.forEach(chat => {
    const chatDate = new Date(chat.created_at); // Use created_at
    let groupKey = '';

    if (chatDate >= today) {
      groupKey = 'Today';
    } else if (chatDate >= yesterday) {
      groupKey = 'Yesterday';
    } else if (chatDate >= sevenDaysAgo) {
      groupKey = 'Previous 7 Days';
    } else if (chatDate >= thirtyDaysAgo) {
      groupKey = 'Previous 30 Days';
    } else {
      groupKey = chatDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(chat);
  });

  return groups;
};

// --- Predefined order for time-based groups ---
const GROUP_ORDER = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days'];


const SunIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const PlusIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const TrashIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ChevronLeftIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const LogoutIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);


interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  onLogout: () => void; // Added onLogout prop
}

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat, isOpen, setIsOpen, isCollapsed, setIsCollapsed, onLogout }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const groupedChats = groupChatsByDate(chats);

  // --- Sort group keys to ensure a consistent and logical order ---
  const sortedGroupKeys = Object.keys(groupedChats).sort((a, b) => {
    const aIndex = GROUP_ORDER.indexOf(a);
    const bIndex = GROUP_ORDER.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // For month-based keys (e.g., "June 2024"), sort by date descending
    const aDate = new Date(a);
    const bDate = new Date(b);
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return bDate.getTime() - aDate.getTime();
    }
    return 0;
  });

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/30 z-20 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />
      <aside className={`absolute top-0 left-0 bg-background flex flex-col h-full z-30 transform transition-all duration-300 ease-in-out flex-shrink-0 overflow-x-hidden w-64 border-r border-border-color md:relative md:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'md:w-0 md:border-r-0' : 'md:w-64'}`}>
        <div className="w-64 flex flex-col h-full">
            <div className="p-4 flex items-center justify-between border-b border-border-color">
                <h2 className="text-xl font-bold font-display">Chats</h2>
                <div className="flex items-center">
                    <button
                        onClick={onNewChat}
                        className="p-2 rounded-lg text-text-secondary hover:bg-bubble-user hover:text-text-primary transition-all transform hover:scale-110"
                        aria-label="New Chat"
                    >
                        <PlusIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-2 rounded-lg text-text-secondary hover:bg-bubble-user hover:text-text-primary transition-colors hidden md:block"
                        aria-label="Collapse sidebar"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-2">
            {sortedGroupKeys.length > 0 && chats.length > 0 ? sortedGroupKeys.map(groupKey => (
                <div key={groupKey} className="mb-2">
                <h3 className="text-xs font-semibold text-text-secondary uppercase px-3 pt-3 pb-1 tracking-wider">{groupKey}</h3>
                <div className="space-y-1">
                    {groupedChats[groupKey].map(chat => (
                    <div
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group ${activeChatId === chat.id ? 'bg-bubble-user text-text-on-user-bubble' : 'hover:bg-bubble-ai'}`}
                    >
                        <p className="truncate text-sm font-medium">{chat.title}</p>
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                        }}
                        className={`p-1 rounded text-text-secondary opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white transform hover:scale-110 ${activeChatId === chat.id ? 'opacity-100' : ''}`}
                        aria-label="Delete Chat"
                        >
                        <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                    ))}
                </div>
                </div>
            )) : (
                <div className="text-center text-text-secondary text-sm p-4">
                No chats yet.
                </div>
            )}
            </nav>

            <div className="p-4 border-t border-border-color space-y-2">
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center p-2 rounded-lg text-text-secondary hover:bg-bubble-user hover:text-text-primary transition-colors"
                    aria-label="Toggle Theme"
                >
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    <span className="ml-3 text-sm font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center p-2 rounded-lg text-text-secondary hover:bg-red-500/20 hover:text-red-500 transition-colors"
                    aria-label="Logout"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span className="ml-3 text-sm font-medium">Logout</span>
                </button>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;