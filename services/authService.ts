// This is a dummy authentication service for demonstration purposes.
// In a real application, this would interact with a backend authentication API.

interface AuthResponse {
    success: boolean;
    message?: string;
    token?: string; // In a real app, this would be a JWT or similar
}

export const login = (email: string, password: string): Promise<AuthResponse> => {
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            if (email === 'user@example.com' && password === 'password') {
                resolve({ success: true, message: 'Login successful!', token: 'dummy-jwt-token' });
            } else {
                reject(new Error('Invalid email or password.'));
            }
        }, 1000); // 1 second delay
    });
};
