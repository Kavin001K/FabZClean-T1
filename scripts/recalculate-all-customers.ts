import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function recalculateAll() {
  try {
    console.log('Fetching all customers from database...');
    const { data: customers, error: cErr } = await supabase
      .from('customers')
      .select('id, name, total_orders, total_spent');

    if (cErr) throw cErr;
    console.log(`Loaded ${customers?.length || 0} customers.`);

    console.log('Fetching all orders from database to perform local mapping...');
    const { data: orders, error: oErr } = await supabase
      .from('orders')
      .select('id, customer_id, total_amount, status');

    if (oErr) throw oErr;
    console.log(`Loaded ${orders?.length || 0} orders.`);

    // Group orders by customer_id
    const ordersByCustomer: Record<string, any[]> = {};
    orders?.forEach(o => {
      if (o.customer_id) {
        if (!ordersByCustomer[o.customer_id]) {
          ordersByCustomer[o.customer_id] = [];
        }
        ordersByCustomer[o.customer_id].push(o);
      }
    });

    let updatedCount = 0;

    for (const c of customers || []) {
      const custOrders = ordersByCustomer[c.id] || [];
      const validOrders = custOrders.filter(o => 
        o.status !== 'cancelled' && 
        String(o.status) !== 'refunded'
      );

      const totalOrders = validOrders.length;
      const totalSpent = validOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);

      const currentOrders = parseInt(String(c.total_orders || '0'));
      const currentSpent = parseFloat(String(c.total_spent || '0'));

      // Check if out of sync (with minor tolerance for float comparison)
      if (currentOrders !== totalOrders || Math.abs(currentSpent - totalSpent) > 0.01) {
        console.log(`Syncing customer ${c.id} (${c.name}):`);
        console.log(`  Current: orders=${currentOrders}, spent=${currentSpent}`);
        console.log(`  Actual:  orders=${totalOrders}, spent=${totalSpent}`);

        const { error: updateErr } = await supabase
          .from('customers')
          .update({
            total_orders: totalOrders,
            total_spent: totalSpent.toFixed(2)
          })
          .eq('id', c.id);

        if (updateErr) {
          console.error(`  Failed to update customer ${c.id}:`, updateErr.message);
        } else {
          updatedCount++;
        }
      }
    }

    console.log(`Successfully recalculated stats for ${updatedCount} out-of-sync customers.`);
  } catch (err: any) {
    console.error('Error running recalculation:', err.message || err);
  }
}

recalculateAll();
