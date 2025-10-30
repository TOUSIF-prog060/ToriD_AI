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
    const chatDate = new Date(chat.createdAt);
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

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat, isOpen, setIsOpen }) => {
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
      <aside className={`absolute top-0 left-0 bg-background flex flex-col h-full z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 border-r border-border-color flex-shrink-0`}>
        <div className="p-4 flex items-center justify-between border-b border-border-color">
          <h2 className="text-xl font-bold font-display">Chats</h2>
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg text-text-secondary hover:bg-bubble-user hover:text-text-primary transition-all transform hover:scale-110"
            aria-label="New Chat"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
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
        </div>
      </aside>
    </>
  );
};

export default Sidebar;