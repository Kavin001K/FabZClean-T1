import { storage } from './server/storage';

async function main() {
  const orders = await storage.listOrders();
  
  // Sort them by createdAt descending using Javascript Date comparison
  const sortedByDate = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 15);
    
  console.log("Top 15 orders sorted by Date (newest first):");
  for (const o of sortedByDate) {
    console.log(`Order: ${o.orderNumber} | CreatedAt: ${o.createdAt} | ID: ${o.id}`);
  }
  
  // Sort by orderNumber descending (assuming standard string comparison)
  const sortedByNumber = orders
    .slice()
    .sort((a, b) => (b.orderNumber || '').localeCompare(a.orderNumber || ''))
    .slice(0, 15);
    
  console.log("\nTop 15 orders sorted by Order Number Descending:");
  for (const o of sortedByNumber) {
    console.log(`Order: ${o.orderNumber} | CreatedAt: ${o.createdAt}`);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
