import React, { useState, KeyboardEvent } from 'react';

const SendIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "AI is thinking..." : "Send a message..."}
          className="w-full bg-bubble-ai pl-6 pr-16 py-4 rounded-xl border border-border-color text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/80 disabled:opacity-50"
          disabled={disabled}
      />
      <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center text-accent-text bg-accent rounded-full disabled:bg-bubble-user disabled:text-text-secondary disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-100"
          aria-label="Send message"
      >
          <SendIcon className="w-5 h-5 -ml-px" />
      </button>
    </div>
  );
};

export default MessageInput;