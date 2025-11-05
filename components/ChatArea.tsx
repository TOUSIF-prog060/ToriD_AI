


import React, { useEffect, useRef } from 'react';
import { Chat, MessageWithAttachmentData, N8nWorkflow } from '../types';
import MessageInput from './MessageInput';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

interface ChatAreaProps {
  chat: Chat;
  messages: MessageWithAttachmentData[]; // Accept messages from parent
  onSendMessage: (text: string, file: File | null) => void;
  isTyping: boolean;
  onExecuteWorkflow: (workflowId: string, workflowName: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chat, messages, onSendMessage, isTyping, onExecuteWorkflow }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(scrollToBottom, [messages, isTyping]); // Scroll on message or typing change
  
  const handleSend = async (text: string, file: File | null) => {
    if ((text.trim() === '' && !file) || isTyping) return;
    await onSendMessage(text, file);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 h-full bg-transparent p-4 md:p-6 lg:p-8">
      <div className="flex-1 flex flex-col overflow-hidden bg-glass backdrop-blur-lg border border-border-color rounded-3xl">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {isEmpty && !isTyping ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary animate-fadeIn">
              <h1 className="text-4xl font-display font-semibold text-text-primary tracking-widest mb-8 animate-rgb-text-glow">
                TORID<span className="font-bold text-accent">_AI</span>
              </h1>
              <p className="text-xl">How can I help you today?</p>
            </div>
          ) : (
            <div className="max-w-4xl w-full mx-auto space-y-8">
              {messages.map((msg) => (
                <Message key={msg.id} message={msg} onExecuteWorkflow={onExecuteWorkflow} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
              <MessageInput onSend={handleSend} disabled={isTyping} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
