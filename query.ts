import { db } from './server/db';
import { orders } from './shared/schema';
import { ilike } from 'drizzle-orm';

async function main() {
  const result = await db.select().from(orders).where(ilike(orders.orderNumber, '%128%'));
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
main();
