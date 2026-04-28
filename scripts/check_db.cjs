require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  console.log("Checking booking_requests...");
  const { data: bookings, error: bError } = await supabase.from('booking_requests').select('*').limit(5);
  if (bError) console.error("Error fetching booking_requests:", bError);
  else console.log("Bookings:", bookings.length, "rows found");

  console.log("Checking pickups...");
  const { data: pickups, error: pError } = await supabase.from('pickups').select('*').limit(5);
  if (pError) console.error("Error fetching pickups:", pError);
  else console.log("Pickups:", pickups.length, "rows found");

  if (bookings && bookings.length > 0) {
    console.log("Sample booking:", JSON.stringify(bookings[0], null, 2));
  }
}

check();
