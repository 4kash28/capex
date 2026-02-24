import { createClient } from '@supabase/supabase-js';

// Hardcoding credentials as requested by the user
const supabaseUrl = 'https://tolipckjbtxqjpeqekqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbGlwY2tqYnR4cWpwZXFla3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzE5NjAsImV4cCI6MjA4NzMwNzk2MH0.rNsneZ8T2iBnyrHHF4ORn4mUER7s9R-vAoVksoTOp9Q';

export const isSupabaseConfigured = true;

console.log('Supabase URL being used:', supabaseUrl);
console.log('Supabase Key starts with:', supabaseAnonKey.substring(0, 15) + '...');

// Only create the client if configured, otherwise export null
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
