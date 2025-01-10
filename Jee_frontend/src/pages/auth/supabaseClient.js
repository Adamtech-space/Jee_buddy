import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token'
  }
});

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    localStorage.setItem('access_token', session.access_token);
    localStorage.setItem('refresh_token', session.refresh_token);
  } else if (event === 'SIGNED_OUT') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
});

export { supabase }; 