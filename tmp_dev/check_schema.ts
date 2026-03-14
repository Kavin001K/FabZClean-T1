import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function check() {
  const { data, error } = await supabase.rpc('get_column_types', { table_name: 'orders' });
  if (error) {
    // try querying information_schema
    const { data: cols, error: err2 } = await supabase.from('orders').select('*').limit(1);
    console.log(cols, err2);
  } else {
    console.log(data);
  }
}
check();
