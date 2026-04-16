import { db } from "./server/db";

async function test() {
  const { data } = await db.listCustomers(undefined, { limit: 2 });
  console.log("Got customers:", JSON.stringify(data[0], null, 2));
  process.exit(0);
}
test();
