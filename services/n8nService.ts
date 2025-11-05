import { N8nWorkflow } from '../types';

const getN8nCredentials = (): { url: string; apiKey: string } => {
    const url = localStorage.getItem('n8nUrl');
    const apiKey = localStorage.getItem('n8nApiKey');
    
    // Local storage stores values as strings, including "null"
    if (!url || url === 'null' || !apiKey || apiKey === 'null') {
        throw new Error('n8n URL or API Key is not configured. Please configure it in the Agent Settings.');
    }
    
    // Values are JSON strings with quotes, so parse them
    return { url: JSON.parse(url), apiKey: JSON.parse(apiKey) };
};

const makeN8nRequest = async (endpoint: string, method: 'GET' | 'POST' = 'GET') => {
    const { url, apiKey } = getN8nCredentials();
    const fullUrl = `${url.replace(/\/$/, '')}/api/v1${endpoint}`;
    
    const headers = {
        'Accept': 'application/json',
        'X-N8N-API-KEY': apiKey
    };

    try {
        const response = await fetch(fullUrl, { method, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from n8n.' }));
            throw new Error(`n8n API Error (${response.status}): ${errorData.message || 'Unknown error'}`);
        }
        return response.json();
    } catch (error: any) {
        if (error.message.includes('Failed to fetch')) {
            throw new Error(`Network error: Could not connect to n8n at ${url}. Check the URL and your network connection.`);
        }
        throw error; // Re-throw other errors
    }
};

export const testConnection = async (url: string, apiKey: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const fullUrl = `${url.replace(/\/$/, '')}/api/v1/workflows`;
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'X-N8N-API-KEY': apiKey }
        });

        if (response.ok) {
            return { success: true };
        } else {
            const errorData = await response.json().catch(() => null);
            return { success: false, message: `Connection failed with status ${response.status}. ${errorData?.message || ''}`.trim() };
        }
    } catch (error: any) {
        return { success: false, message: `Network error: ${error.message}` };
    }
};

export const searchWorkflows = async (query: string): Promise<N8nWorkflow[]> => {
    const data = await makeN8nRequest('/workflows');
    const lowerCaseQuery = query.toLowerCase();

    // Filter workflows: active, not tagged with 'agent_ignore', and name matches query
    const matchingWorkflows = data.data
        .filter((wf: any) => 
            wf.active &&
            (!wf.tags || !wf.tags.some((tag: any) => tag.name === 'agent_ignore')) &&
            wf.name.toLowerCase().includes(lowerCaseQuery)
        )
        .map((wf: any) => ({
            id: wf.id,
            name: wf.name,
        }));

    return matchingWorkflows;
};

export const executeWorkflow = async (workflowId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        await makeN8nRequest(`/workflows/${workflowId}/executions`, 'POST');
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};
