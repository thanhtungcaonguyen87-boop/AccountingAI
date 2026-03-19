import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing connection to Supabase project:', supabaseUrl);
  try {
    const { data, error } = await supabase.from('chi_tiet').select('*').limit(1);
    
    if (error) {
      console.error('Connection failed! Error querying chi_tiet:', error.message, error.details, error.hint);
    } else {
      console.log('Connection successful!');
      console.log('Data from chi_tiet:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
