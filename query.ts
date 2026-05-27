import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const { db } = await import('./server/db');
  const result = await db.listOrders();
  console.log(`Total orders in DB: ${result.length}`);
  
  // Log first 10 orders dates
  const activeOrders = result.filter(o => o.status !== 'cancelled' && o.status !== 'refunded' && o.status !== 'deleted');
  console.log(`Active orders count: ${activeOrders.length}`);
  
  const now = new Date("2026-05-27T04:38:05+05:30"); // current local time
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const thisMonthOrders = activeOrders.filter((o: any) => new Date(o.createdAt || now) >= startOfThisMonth);
  console.log(`Active orders this month: ${thisMonthOrders.length}, revenue: ${thisMonthOrders.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0)}`);
  
  const last30DaysOrders = activeOrders.filter((o: any) => new Date(o.createdAt || now) >= last30DaysStart);
  console.log(`Active orders in last 30 days: ${last30DaysOrders.length}, revenue: ${last30DaysOrders.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0)}`);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayOrders = activeOrders.filter((o: any) => new Date(o.createdAt || now) >= todayStart);
  console.log(`Active orders today: ${todayOrders.length}, revenue: ${todayOrders.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0)}`);

  const lastMonthSameDay = new Date(now);
  lastMonthSameDay.setMonth(now.getMonth() - 1);
  const lmsdStart = new Date(lastMonthSameDay.getFullYear(), lastMonthSameDay.getMonth(), lastMonthSameDay.getDate(), 0, 0, 0);
  const lmsdEnd = new Date(lastMonthSameDay.getFullYear(), lastMonthSameDay.getMonth(), lastMonthSameDay.getDate(), 23, 59, 59, 999);
  
  const lmsdOrders = activeOrders.filter((o: any) => {
    const d = new Date(o.createdAt);
    return d >= lmsdStart && d <= lmsdEnd;
  });
  console.log(`Active orders last month same day (${lmsdStart.toISOString()}): ${lmsdOrders.length}, revenue: ${lmsdOrders.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0)}`);
  lmsdOrders.forEach(o => {
    console.log(`  Order: ${o.orderNumber}, createdAt: ${o.createdAt}, parsed: ${new Date(o.createdAt).toString()}`);
  });

  console.log("\nLast 10 orders:");
  const sorted = [...activeOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  sorted.slice(0, 10).forEach(o => {
    console.log(`Order Number: ${o.orderNumber}, createdAt (raw): ${o.createdAt}, parsed: ${new Date(o.createdAt).toString()}`);
  });

  process.exit(0);
}
main();
