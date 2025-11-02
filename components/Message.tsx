


import React, { useState } from 'react';
import { Message as MessageType } from '../types';
import { attachmentCache } from '../services/geminiService'; // Import the cache

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

const PdfIcon = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Icons for Copy functionality
const ClipboardIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


const Message: React.FC<{ message: MessageType }> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (isCopied) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Retrieve attachment data from in-memory cache if available
  const attachmentData = message.attachment?.hasData ? attachmentCache.get(message.id) : undefined;
  
  return (
    <div className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-message-in`}>
      {!isUser && <AIIcon />}
      
      <div className={`group flex items-center gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`max-w-md md:max-w-lg px-5 py-4 rounded-2xl ${isUser ? 'bg-bubble-user text-text-on-user-bubble' : 'bg-bubble-ai text-text-on-ai-bubble'}`}>
            {attachmentData && ( // Use attachmentData to check if data is available
                <div className="mb-2">
                    {attachmentData.mimeType.startsWith('image/') ? (
                        <img 
                            src={`data:${attachmentData.mimeType};base64,${attachmentData.base64}`} 
                            alt="Uploaded" 
                            className="max-w-full h-auto rounded-lg shadow-md" 
                            style={{ maxHeight: '200px' }} // Limit height for display
                        />
                    ) : attachmentData.mimeType === 'application/pdf' ? (
                        <a 
                            href={`data:${attachmentData.mimeType};base64,${attachmentData.base64}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-text-primary hover:underline"
                        >
                            <PdfIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <span>View PDF</span>
                        </a>
                    ) : (
                        <div className="flex items-center space-x-2 text-text-primary">
                            <span className="text-sm">Attached File ({attachmentData.mimeType})</span>
                        </div>
                    )}
                </div>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          </div>
          <span className="text-xs text-text-secondary mt-2 px-1">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        
        <div className="self-center flex-shrink-0">
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent ${isCopied ? 'bg-green-500/20 text-green-500 opacity-100' : 'text-text-secondary bg-bubble-ai hover:bg-bubble-user/50 dark:bg-bubble-user/20 dark:hover:bg-bubble-user/40 opacity-0 group-hover:opacity-100'}`}
            aria-label={isCopied ? "Copied to clipboard" : "Copy message"}
            disabled={isCopied}
          >
            {isCopied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

       {isUser && <UserIcon />}
    </div>
  );
};

export default Message;