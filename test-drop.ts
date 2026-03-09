import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

async function run() {
  const { data, error } = await supabase.from('wallet_transactions').select('*').limit(5);
  console.log(data);
}
run();
