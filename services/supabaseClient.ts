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

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and/or Anon Key environment variables not set. For Vite projects, please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);