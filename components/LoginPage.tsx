import React, { useState } from 'react';
import AILogo from './AILogo';
import { supabase, supabaseUrl } from '../services/supabaseClient'; // Import Supabase client and URL

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between login and signup

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Prevent auth attempt if Supabase is not configured
    if (supabaseUrl.includes('placeholder.supabase.co')) {
      setError("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      setIsLoading(false);
      return;
    }

    try {
      let authResponse;
      if (isLoginMode) {
        authResponse = await supabase.auth.signInWithPassword({ email, password });
      } else {
        authResponse = await supabase.auth.signUp({ email, password });
      }

      const { data, error: authError } = authResponse;

      if (authError) {
        throw authError;
      }

      if (data.user && data.session) {
        onLogin(); // App.tsx will handle the page transition via onAuthStateChange
      } else if (data.user && !data.session) {
        setError("Please check your email to confirm your account before logging in.");
      }

    } catch (err: any) {
      console.error(`${isLoginMode ? 'Login' : 'Sign Up'} failed:`, err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      {/* TORID_AI Logo */}
      <div className="mb-12 will-animate animate-fadeInUp" style={{ animationDelay: '0ms' }}>
        <AILogo />
      </div>

      {/* Welcome to TORID_AI text with bouncy animation */}
      <h2 className="text-2xl md:text-3xl font-display font-semibold text-text-primary mb-8 will-animate animate-bouncy-text" style={{ animationDelay: '400ms' }}>
        Welcome to TORID<span className="font-bold text-accent">_AI</span> your personal ai assistant
      </h2>

      <div className="w-full max-w-sm will-animate animate-fadeInUp relative z-10" style={{ animationDelay: '800ms' }}>
        <form className="space-y-6 flex flex-col items-center" onSubmit={handleAuth}>
          <div className="w-full max-w-[240px] mx-auto">
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none w-full px-4 py-2 sm:px-5 sm:py-4 border placeholder-text-secondary text-text-primary bg-bubble-ai rounded-full focus:outline-none text-sm md:text-base animate-rgb-glow"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="w-full max-w-[240px] mx-auto">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLoginMode ? "current-password" : "new-password"}
              required
              className="appearance-none w-full px-4 py-2 sm:px-5 sm:py-4 border placeholder-text-secondary text-text-primary bg-bubble-ai rounded-full focus:outline-none text-sm md:text-base animate-rgb-glow"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center max-w-[240px]">{error}</p>
          )}

          <button
            type="submit"
            className="max-w-[120px] mx-auto px-10 py-4 border border-transparent text-sm font-bold rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-hover transition-all duration-300 transform hover:scale-105 active:scale-100 animate-gradient-button"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : (isLoginMode ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <button
            onClick={() => setIsLoginMode(prev => !prev)}
            className="mt-6 text-sm text-text-secondary hover:underline transition-colors"
            disabled={isLoading}
        >
            {isLoginMode ? "Need an account? Sign Up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;