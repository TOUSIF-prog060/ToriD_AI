import React, { useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { testConnection } from '../services/n8nService';
import AILogo from './AILogo';

const XIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CheckCircleIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ExclamationCircleIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

const ConfigurationPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [n8nUrl, setN8nUrl] = useLocalStorage('n8nUrl', '');
    const [n8nApiKey, setN8nApiKey] = useLocalStorage('n8nApiKey', '');
    const [status, setStatus] = useState<ConnectionStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Close modal on 'Escape' key press
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleTestConnection = async () => {
        setStatus('testing');
        setErrorMessage('');
        try {
            const result = await testConnection(n8nUrl, n8nApiKey);
            if (result.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(result.message || 'Connection failed for an unknown reason.');
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'An unexpected error occurred.');
        }
    };
    
    // Reset status if user starts typing again
    useEffect(() => {
        setStatus('idle');
    }, [n8nUrl, n8nApiKey]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-glass border border-border-color rounded-3xl shadow-2xl w-full max-w-md p-8 relative will-animate animate-fadeInUp" 
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-bubble-user/20 transition-colors" aria-label="Close settings">
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div className="flex flex-col items-center mb-6">
                    <AILogo />
                    <h2 className="text-xl font-bold font-display text-text-primary mt-4">Agent Configuration</h2>
                    <p className="text-sm text-text-secondary text-center mt-1">Connect to your n8n instance to enable automation workflows.</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="n8n-url" className="text-sm font-medium text-text-secondary ml-2">n8n Instance URL</label>
                        <input
                            id="n8n-url"
                            type="text"
                            value={n8nUrl}
                            onChange={(e) => setN8nUrl(e.target.value)}
                            placeholder="https://your-n8n-instance.com"
                            className="mt-1 w-full bg-bubble-ai px-4 py-3 rounded-xl border border-border-color text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                    </div>
                    <div>
                        <label htmlFor="n8n-api-key" className="text-sm font-medium text-text-secondary ml-2">n8n API Key</label>
                        <input
                            id="n8n-api-key"
                            type="password"
                            value={n8nApiKey}
                            onChange={(e) => setN8nApiKey(e.target.value)}
                            placeholder="Enter your Access Token"
                            className="mt-1 w-full bg-bubble-ai px-4 py-3 rounded-xl border border-border-color text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-col items-center">
                    <button
                        onClick={handleTestConnection}
                        disabled={!n8nUrl || !n8nApiKey || status === 'testing'}
                        className="w-full max-w-xs px-6 py-3 border border-transparent text-sm font-bold rounded-full text-accent-text focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-hover transition-all duration-300 transform hover:scale-105 active:scale-100 animate-gradient-button disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none disabled:bg-bubble-user"
                    >
                        {status === 'testing' ? 'Testing...' : 'Test Connection'}
                    </button>
                    <div className="h-6 mt-3 text-sm flex items-center">
                        {status === 'success' && (
                            <span className="flex items-center text-green-500 animate-fadeIn">
                                <CheckCircleIcon className="w-5 h-5 mr-1.5" /> Connection successful!
                            </span>
                        )}
                        {status === 'error' && (
                             <span className="flex items-center text-red-500 text-center animate-fadeIn">
                                <ExclamationCircleIcon className="w-5 h-5 mr-1.5 flex-shrink-0" /> {errorMessage}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationPage;
