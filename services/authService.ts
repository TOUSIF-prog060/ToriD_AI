// This file is no longer needed as authentication logic is handled directly
// by the Supabase client in App.tsx and LoginPage.tsx.
// It is kept empty to avoid breaking existing imports until those files are updated.

// The supabase client itself is now exported from supabaseClient.ts
// import { supabase } from './supabaseClient';

// export const login = async (email: string, password: string) => {
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//   if (error) throw error;
//   return data;
// };

// export const signup = async (email: string, password: string) => {
//   const { data, error } = await supabase.auth.signUp({ email, password });
//   if (error) throw error;
//   return data;
// };

// export const logout = async () => {
//   const { error } = await supabase.auth.signOut();
//   if (error) throw error;
// };
