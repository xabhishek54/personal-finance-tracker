import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables or custom local storage settings
export const getSupabaseConfig = () => {
  const customUrl = localStorage.getItem('finance_supabase_url');
  const customKey = localStorage.getItem('finance_supabase_key');

  const url = customUrl || import.meta.env.VITE_SUPABASE_URL || 'https://demo-project.supabase.co';
  const key = customKey || import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key';

  return { url, key, isConfigured: Boolean((customUrl && customKey) || (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)) };
};

const config = getSupabaseConfig();

export const supabase = createClient(config.url, config.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper to create client with runtime settings
export const getSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};
