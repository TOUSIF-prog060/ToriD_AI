import React, { useState } from 'react';
import AILogo from './AILogo';
import { login } from '../services/authService';

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('user@example.com'); // Pre-fill for convenience
  const [password, setPassword] = useState('password'); // Pre-fill for convenience
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      onLogin(); // Proceed to chat page on successful login
    } catch (err) {
      setError((err as Error).message);
      console.error("Login failed:", err);
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
        <form className="space-y-6 flex flex-col items-center" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              required
              className="appearance-none w-full px-4 py-2 sm:px-5 sm:py-4 border placeholder-text-secondary text-text-primary bg-bubble-ai rounded-full focus:outline-none text-sm md:text-base animate-rgb-glow"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="max-w-[120px] mx-auto px-10 py-4 border border-transparent text-sm font-bold rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-hover transition-all duration-300 transform hover:scale-105 active:scale-100 animate-gradient-button"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;