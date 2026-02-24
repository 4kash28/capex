import { createClient } from '@supabase/supabase-js';

// Hardcoding credentials as requested by the user
const supabaseUrl = 'https://tolipckjbtxqjpeqekqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbGlwY2tqYnR4cWpwZXFla3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzE5NjAsImV4cCI6MjA4NzMwNzk2MH0.rNsneZ8T2iBnyrHHF4ORn4mUER7s9R-vAoVksoTOp9Q';

export const isSupabaseConfigured = true;

console.log('Supabase URL being used:', supabaseUrl);

// Custom storage adapter using sessionStorage to avoid potential localStorage issues
const customStorage = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  },
};

// Only create the client if configured, otherwise export null
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable to prevent potential URL parsing issues
    // @ts-ignore - Override lock to prevent Navigator LockManager issues
    lock: (name: string, acquireTimeout: number, acquireFn: () => Promise<any>) => {
      return acquireFn();
    },
  },
  global: {
    // Explicitly pass the global fetch to ensure it's used correctly
    fetch: (...args) => fetch(...args),
  },
});
