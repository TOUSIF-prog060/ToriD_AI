import React from 'react';
import { Message as MessageType } from '../types';

const UserIcon = () => (
    <div className="w-10 h-10 rounded-full bg-bubble-user flex items-center justify-center text-text-on-user-bubble flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    </div>
);

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

const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const Message: React.FC<{ message: MessageType }> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-message-in`}>
      {!isUser && <AIIcon />}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-md md:max-w-lg px-5 py-4 rounded-2xl ${isUser ? 'bg-bubble-user text-text-on-user-bubble' : 'bg-bubble-ai text-text-on-ai-bubble'}`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        </div>
        <span className="text-xs text-text-secondary mt-2 px-1">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
       {isUser && <UserIcon />}
    </div>
  );
};

export default Message;