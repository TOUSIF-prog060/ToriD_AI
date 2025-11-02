// FIX: Corrected import syntax for React hooks.
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import useLocalStorage from './hooks/useLocalStorage';
import CursorTrail from './components/CursorTrail';
import SplashScreen from './components/SplashScreen';
import { supabase } from './services/supabaseClient'; // Import Supabase client
import { Session } from '@supabase/supabase-js'; // Import Session type

export type Theme = 'light' | 'dark';
export type Page = 'splash' | 'login' | 'chat'; // 'splash' is initial, 'login' or 'chat' determined by auth

export const ThemeContext = React.createContext<{ theme: Theme; toggleTheme: () => void; }>({
  theme: 'dark',
  toggleTheme: () => {},
});

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('splash');
  const [session, setSession] = useState<Session | null>(null); // Supabase session state
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [loadingSession, setLoadingSession] = useState(true); // New state to manage initial session loading

  // Effect for theme management
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  // Effect for initial splash screen and Supabase session check
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setCurrentPage('login'); // Move to login after splash, then auth takes over
    }, 2500); // Show splash for 2.5 seconds

    // Supabase auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setLoadingSession(false); // Session loaded
        clearTimeout(splashTimer); // Clear splash timer if auth state changes before it fires
        if (currentSession) {
            setCurrentPage('chat');
        } else {
            setCurrentPage('login');
        }
      }
    );

    // Initial check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoadingSession(false);
        if (session) {
            setCurrentPage('chat');
        }
    });

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(splashTimer);
    };
  }, []); // Run only once on mount

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = () => {
    // This function will be called by LoginPage on successful login/signup,
    // but the onAuthStateChange listener will ultimately update the session state.
    // For now, it just ensures the currentPage transitions if needed.
    setCurrentPage('chat');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will handle setting session to null and currentPage to 'login'
  };

  const renderPage = () => {
    if (currentPage === 'splash' || loadingSession) {
      return <SplashScreen />;
    } else if (session) {
      return <ChatPage session={session} onLogout={handleLogout} />;
    } else {
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
    </ThemeContext.Provider>
  );
}

export default App;