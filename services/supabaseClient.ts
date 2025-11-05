import { createClient } from '@supabase/supabase-js';

// Helper function to safely get environment variables, prioritizing Vite's pattern
const getEnv = (key: string): string | undefined => {
  // Check import.meta.env (standard for Vite projects, must be prefixed with VITE_)
  // Cast `import.meta` to `any` to allow access to the `env` property,
  // which is typically added by bundlers like Vite but might not be in default TypeScript `ImportMeta` types.
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) { 
    const viteKey = `VITE_${key}`; // e.g., 'VITE_SUPABASE_URL'
    const env = (import.meta as any).env;
    if (env[viteKey]) {
      return env[viteKey];
    }
  }
  return undefined;
};

// Use placeholder values if environment variables are not set.
// This allows the app to render without crashing, though Supabase functionality will not work
// until valid credentials are provided in a .env file for local development.
export const supabaseUrl = getEnv('SUPABASE_URL') || 'https://placeholder.supabase.co';
export const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'placeholder-anon-key';

if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-anon-key') {
  console.warn(
    'Supabase environment variables are not set. Using placeholder values. ' +
    'The app will render, but authentication and database features will not work. ' +
    'For local development, please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);