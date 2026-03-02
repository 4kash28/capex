import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tolipckjbtxqjpeqekqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbGlwY2tqYnR4cWpwZXFla3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzE5NjAsImV4cCI6MjA4NzMwNzk2MH0.rNsneZ8T2iBnyrHHF4ORn4mUER7s9R-vAoVksoTOp9Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const tables = ['vendors', 'departments', 'capex_entries', 'billing_records', 'settings'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table} error:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Table ${table} keys:`, Object.keys(data[0]));
    } else {
      console.log(`Table ${table} is empty`);
    }
  }
}

check();
