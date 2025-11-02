

import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';

const SendIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const AttachmentIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13.5" />
    </svg>
);

const XIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// New Icons for upload options
const ImageIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const PdfUploadIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


interface MessageInputProps {
  onSend: (text: string, file: File | null) => void;
  disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false); // New state for menu visibility

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null); // Ref for the attachment button itself
  const uploadOptionsRef = useRef<HTMLDivElement>(null); // Ref for the options dropdown

  // Effect to handle clicks outside the upload options menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploadOptionsRef.current && !uploadOptionsRef.current.contains(event.target as Node) &&
          attachmentButtonRef.current && !attachmentButtonRef.current.contains(event.target as Node)) {
        setShowUploadOptions(false);
      }
    };

    if (showUploadOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUploadOptions]);


  const handleSend = () => {
    if (text.trim() || selectedFile) {
      onSend(text, selectedFile);
      setText('');
      setSelectedFile(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear the file input
          fileInputRef.current.removeAttribute('accept'); // Clear accept attribute
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Modified: This now toggles the upload options menu
  const handleToggleUploadOptions = () => {
    setShowUploadOptions(prev => !prev);
  };

  const triggerFileUpload = (acceptType: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('accept', acceptType);
      fileInputRef.current.click();
    }
    setShowUploadOptions(false); // Close menu after selection
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
    // No need to clear accept here, it will be cleared on send.
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
        fileInputRef.current.removeAttribute('accept'); // Clear accept attribute
    }
  };

  const placeholderText = disabled 
    ? "AI is thinking..." 
    : (selectedFile ? `Sending ${selectedFile.name}...` : "Send a message...");

  return (
    <div className="relative">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            // `accept` attribute will be set dynamically before clicking
            className="hidden"
            disabled={disabled}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            {!selectedFile ? (
                <button
                    ref={attachmentButtonRef} // Attach ref here
                    onClick={handleToggleUploadOptions} // Toggle menu
                    disabled={disabled}
                    className="w-10 h-10 flex items-center justify-center bg-bubble-ai rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-100 text-text-secondary hover:text-accent hover:bg-accent/20 dark:hover:bg-accent/10"
                    aria-label="Attach file"
                >
                    <AttachmentIcon className="w-5 h-5" />
                </button>
            ) : (
                <button
                    onClick={handleClearFile}
                    disabled={disabled}
                    className="w-10 h-10 flex items-center justify-center bg-red-500/20 text-red-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-100"
                    aria-label="Clear selected file"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            )}

            {/* Upload Options Dropdown */}
            {showUploadOptions && (
              <div
                ref={uploadOptionsRef}
                className="absolute bottom-full mb-2 left-0 w-48 bg-glass backdrop-blur-md border border-border-color rounded-lg shadow-lg overflow-hidden will-animate animate-fadeInUp"
                style={{ animationDelay: '0ms' }}
              >
                <button
                  onClick={() => triggerFileUpload('image/*')}
                  className="w-full flex items-center p-3 text-sm text-text-primary hover:bg-bubble-ai/50 transition-colors"
                  aria-label="Upload Photo"
                >
                  <ImageIcon className="w-5 h-5 mr-2 text-accent" />
                  Upload Photo
                </button>
                <button
                  onClick={() => triggerFileUpload('application/pdf')}
                  className="w-full flex items-center p-3 text-sm text-text-primary hover:bg-bubble-ai/50 transition-colors border-t border-border-color"
                  aria-label="Upload PDF"
                >
                  <PdfUploadIcon className="w-5 h-5 mr-2 text-red-500" />
                  Upload PDF
                </button>
              </div>
            )}
        </div>
        <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholderText}
            className="w-full bg-bubble-ai pl-16 pr-14 py-4 rounded-xl border border-border-color text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/80 disabled:opacity-50"
            disabled={disabled}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <button
                onClick={handleSend}
                disabled={disabled || (!text.trim() && !selectedFile)}
                className="w-10 h-10 flex items-center justify-center text-accent-text bg-accent rounded-full disabled:bg-bubble-user disabled:text-text-secondary disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-100"
                aria-label="Send message"
            >
                <SendIcon className="w-5 h-5 -ml-px" />
            </button>
        </div>
    </div>
  );
};

export default MessageInput;