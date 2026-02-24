import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tolipckjbtxqjpeqekqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbGlwY2tqYnR4cWpwZXFla3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzE5NjAsImV4cCI6MjA4NzMwNzk2MH0.rNsneZ8T2iBnyrHHF4ORn4mUER7s9R-vAoVksoTOp9Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('vendors').select('id').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
