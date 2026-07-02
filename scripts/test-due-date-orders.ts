import "../server/load-env";
import { db } from "../server/db";

async function main() {
  try {
    console.log("Testing getDueDateOrders query...");
    const targetDate = "2026-06-21";
    const orders = await db.getDueDateOrders(targetDate);
    console.log("✅ Success! Fetched orders count:", orders.length);
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error in getDueDateOrders:", error);
    process.exit(1);
  }
}

main();
