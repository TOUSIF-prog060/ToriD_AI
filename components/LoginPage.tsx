import React from 'react';
import AILogo from './AILogo';

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="mb-12 will-animate animate-fadeInUp">
        <AILogo />
      </div>
      <div className="w-full max-w-sm will-animate animate-fadeInUp" style={{ animationDelay: '300ms' }}>
        <h2 className="text-center text-3xl font-bold font-display text-text-primary mb-2">
          Welcome to TORID_AI
        </h2>
        <p className="text-center text-text-secondary mb-8">
            Your personal AI assistant.
        </p>
        <form className="space-y-6 flex flex-col items-center" onSubmit={handleSubmit}>
          {/* Dummy inputs for visual consistency */}
          <div className="w-full">
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              className="appearance-none w-full px-5 py-4 border placeholder-text-secondary text-text-primary bg-bubble-ai rounded-full focus:outline-none sm:text-sm animate-rgb-glow"
              placeholder="Email Address"
              disabled
            />
          </div>
          <div className="w-full">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="appearance-none w-full px-5 py-4 border placeholder-text-secondary text-text-primary bg-bubble-ai rounded-full focus:outline-none sm:text-sm animate-rgb-glow"
              placeholder="Password"
              disabled
            />
          </div>
          
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-4 border border-transparent text-sm font-bold rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-hover transition-all duration-300 transform hover:scale-105 active:scale-100 animate-gradient-button"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;