
import React from 'react';

const AIIcon = () => (
    <div className="w-10 h-10 rounded-full p-0.5 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-bubble-user">
        <div className="w-full h-full bg-bubble-ai rounded-full flex items-center justify-center overflow-hidden text-text-on-ai-bubble">
            <svg viewBox="0 0 120 40" className="w-10 h-auto">
                <text 
                  x="50%" 
                  y="50%" 
                  dominantBaseline="central" 
                  textAnchor="middle" 
                  fontFamily="Poppins, sans-serif"
                  fontSize="24" 
                  fontWeight="600" 
                  fill="currentColor"
                  letterSpacing="1"
                >
                  TORID
                  <tspan className="accent-fill" fontWeight="700">_AI</tspan>
                </text>
            </svg>
        </div>
    </div>
);

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-end gap-3 justify-start animate-message-in">
        <AIIcon />
        <div className="px-5 py-4 rounded-2xl bg-bubble-ai flex items-center space-x-1.5">
            <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
            <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
        </div>
    </div>
  );
};

export default TypingIndicator;