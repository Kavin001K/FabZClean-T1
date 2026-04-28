import '../server/load-env.js';
import { db } from '../server/db.js';

async function check() {
  console.log("Checking storage.supabase...");
  const supabase = (db as any).supabase;
  if (!supabase) {
    console.error("supabase client is missing on db instance!");
    return;
  }

  console.log("Querying booking_requests...");
  const { data: bookings, error: bError } = await supabase.from('booking_requests').select('*').limit(5);
  if (bError) console.error("Error fetching booking_requests:", bError);
  else console.log("Bookings found:", bookings?.length || 0);

  console.log("Querying pickups...");
  const { data: pickups, error: pError } = await supabase.from('pickups').select('*').limit(5);
  if (pError) console.error("Error fetching pickups:", pError);
  else console.log("Pickups found:", pickups?.length || 0);
}

check().catch(console.error);
