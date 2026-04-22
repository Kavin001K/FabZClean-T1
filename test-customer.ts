import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!);
async function run() {
  const { data, error } = await supabase.from('customers').select('id, name, phone, is_active').or('phone.eq.7010540867,id.eq.FZC26MY1925');
  console.log(data, error);
}
run();
