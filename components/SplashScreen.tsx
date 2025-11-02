import React from 'react';
import AILogo from './AILogo';

const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background animate-grid-shift">
      <div className="mb-12 will-animate animate-fadeInUp">
        <AILogo />
      </div>
      <div className="text-text-secondary text-xl md:text-2xl font-mono will-animate animate-fadeInUp" style={{ animationDelay: '500ms' }}>
        <span className="typing-text">Booting up TORID<span className="accent-fill">_AI</span>...</span>
      </div>
    </div>
  );
};

export default SplashScreen;