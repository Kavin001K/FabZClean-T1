// Direct Supabase test - no tsx needed
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', url);
console.log('Key present:', !!key);
console.log('Key prefix:', key ? key.substring(0, 20) + '...' : 'MISSING');

if (!url || !key) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  console.log('\n--- Testing booking_requests table ---');
  const { data: bookings, error: bErr, count: bCount } = await supabase
    .from('booking_requests')
    .select('*', { count: 'exact' })
    .limit(3);
  
  if (bErr) {
    console.error('booking_requests ERROR:', JSON.stringify(bErr, null, 2));
  } else {
    console.log('booking_requests count:', bCount);
    console.log('booking_requests rows:', bookings?.length);
    if (bookings && bookings.length > 0) {
      console.log('First booking keys:', Object.keys(bookings[0]));
      console.log('First booking:', JSON.stringify(bookings[0], null, 2));
    }
  }

  console.log('\n--- Testing pickups table ---');
  const { data: pickups, error: pErr, count: pCount } = await supabase
    .from('pickups')
    .select('*', { count: 'exact' })
    .limit(3);
  
  if (pErr) {
    console.error('pickups ERROR:', JSON.stringify(pErr, null, 2));
  } else {
    console.log('pickups count:', pCount);
    console.log('pickups rows:', pickups?.length);
    if (pickups && pickups.length > 0) {
      console.log('First pickup keys:', Object.keys(pickups[0]));
    }
  }

  console.log('\n--- Testing customers table (baseline) ---');
  const { data: customers, error: cErr } = await supabase
    .from('customers')
    .select('id')
    .limit(1);
  
  if (cErr) {
    console.error('customers ERROR:', JSON.stringify(cErr, null, 2));
  } else {
    console.log('customers accessible:', customers?.length >= 0 ? 'YES' : 'NO');
  }
}

test().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
