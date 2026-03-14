const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pxhydxsqtqpewmjfhhoh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4aHlkeHNxdHFwZXdtamZoaG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDY4MDQsImV4cCI6MjA4ODI4MjgwNH0.RGEz01TaqpehmPz2nANWnlY8d_MHPhR8aTgFNAFgLaw');

async function check() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  if (error) console.error(error);
  // Just try to insert a dummy to see the exact error
  const { error: insErr } = await supabase.from('orders').insert({ 
    customer_id: 'FZCMY0004', 
    order_number: 'TEST', 
    customer_name: 'Test', 
    status: 'pending', 
    total_amount: 0, 
    items: [] 
  });
  console.log("Insert Error:", insErr);
}
check();
