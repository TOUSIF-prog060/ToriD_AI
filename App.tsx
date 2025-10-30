// FIX: Corrected import syntax for React hooks.
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import useLocalStorage from './hooks/useLocalStorage';
import CursorTrail from './components/CursorTrail';

export type Theme = 'light' | 'dark';
export type Page = 'login' | 'chat';

export const ThemeContext = React.createContext<{ theme: Theme; toggleTheme: () => void; }>({
  theme: 'dark',
  toggleTheme: () => {},
});

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = () => {
    setCurrentPage('chat');
  };

  const renderPage = () => {
    switch(currentPage) {
        case 'login':
            return <LoginPage onLogin={handleLogin} />;
        case 'chat':
            return <ChatPage />;
        default:
            return <LoginPage onLogin={handleLogin} />;
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="font-sans bg-background text-text-primary min-h-screen">
        <CursorTrail />
        <div key={currentPage} className="animate-fadeIn">
          {renderPage()}
        </div>
      </div>
    {/* FIX: Corrected closing tag. 'Theme' is a type, but the context object is 'ThemeContext'. */}
    </ThemeContext.Provider>
  );
}

export default App;