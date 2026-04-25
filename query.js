import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase.from('orders').select('*').ilike('order_number', '%128%');
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}
main().then(() => process.exit(0));
