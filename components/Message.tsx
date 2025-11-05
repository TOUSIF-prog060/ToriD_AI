


import React, { useState } from 'react';
import { MessageWithAttachmentData } from '../types';
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

const formatTimestamp = (timestamp: string) => { // Expects ISO string
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

const PlayIcon = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface MessageProps {
  message: MessageWithAttachmentData;
  onExecuteWorkflow: (workflowId: string, workflowName: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onExecuteWorkflow }) => {
  const isUser = message.sender === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const [executingWorkflowId, setExecutingWorkflowId] = useState<string | null>(null);


  const handleCopy = async () => {
    if (isCopied) return;
    try {
      await navigator.clipboard.writeText(message.text_content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  const handleRunWorkflow = (workflowId: string, workflowName: string) => {
    setExecutingWorkflowId(workflowId);
    onExecuteWorkflow(workflowId, workflowName);
    // The loading state is temporary for visual feedback on the button.
    // The ChatPage will handle adding chat messages about execution status.
  };

  const attachmentData = message.attachment_base64 
    ? { base64: message.attachment_base64, mimeType: message.attachment_mime_type || '' } 
    : (message.attachment_mime_type ? attachmentCache.get(message.id) : undefined);
  
  return (
    <div className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-message-in`}>
      {!isUser && <AIIcon />}
      
      <div className={`group flex items-center gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`max-w-md md:max-w-lg rounded-2xl ${isUser ? 'bg-bubble-user text-text-on-user-bubble' : 'bg-bubble-ai text-text-on-ai-bubble'}`}>
            <div className="px-5 py-4">
              {attachmentData && (
                  <div className="mb-2">
                      {attachmentData.mimeType.startsWith('image/') ? (
                          <img src={`data:${attachmentData.mimeType};base64,${attachmentData.base64}`} alt={message.attachment_file_name || "Uploaded attachment"} className="max-w-full h-auto rounded-lg shadow-md" style={{ maxHeight: '200px' }} />
                      ) : attachmentData.mimeType === 'application/pdf' ? (
                          <a href={`data:${attachmentData.mimeType};base64,${attachmentData.base64}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-text-primary hover:underline">
                              <PdfIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                              <span>View {message.attachment_file_name || 'PDF'}</span>
                          </a>
                      ) : (
                          <div className="flex items-center space-x-2 text-text-primary"><span className="text-sm">Attached File ({message.attachment_file_name || attachmentData.mimeType})</span></div>
                      )}
                  </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text_content}</p>
            </div>
            
            {message.is_workflow_suggestion && message.workflows && message.workflows.length > 0 && (
              <div className="border-t border-border-color/50 pt-3 pb-2 px-2">
                <div className="flex space-x-2 overflow-x-auto pb-2 -mb-2">
                  {message.workflows.map(workflow => (
                    <div key={workflow.id} className="bg-bubble-user/10 dark:bg-bubble-user/20 rounded-lg p-3 w-48 flex-shrink-0 flex flex-col justify-between">
                      <p className="text-xs font-semibold text-text-primary truncate">{workflow.name}</p>
                      <button 
                        onClick={() => handleRunWorkflow(workflow.id, workflow.name)}
                        disabled={!!executingWorkflowId}
                        className="mt-2 flex items-center justify-center w-full px-3 py-1.5 text-xs font-bold rounded-full text-white focus:outline-none transition-all duration-300 transform hover:scale-105 active:scale-100 animate-gradient-button disabled:opacity-50 disabled:animate-none disabled:bg-bubble-user"
                      >
                        <PlayIcon className="w-4 h-4 mr-1" />
                        {executingWorkflowId === workflow.id ? 'Starting...' : 'Run'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className="text-xs text-text-secondary mt-2 px-1">
            {formatTimestamp(message.created_at)}
          </span>
        </div>
        
        <div className="self-center flex-shrink-0">
          <button onClick={handleCopy} className={`p-1.5 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent ${isCopied ? 'bg-green-500/20 text-green-500 opacity-100' : 'text-text-secondary bg-bubble-ai hover:bg-bubble-user/50 dark:bg-bubble-user/20 dark:hover:bg-bubble-user/40 opacity-0 group-hover:opacity-100'}`} aria-label={isCopied ? "Copied to clipboard" : "Copy message"} disabled={isCopied}>
            {isCopied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
       {isUser && <UserIcon />}
    </div>
  );
};

export default Message;
