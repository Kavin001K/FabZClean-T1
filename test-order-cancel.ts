import { config } from "dotenv";
config();
import { db } from "./server/db";
async function test() {
  const orders = await db.listOrders();
  const order = orders[0];
  if (!order) {
    console.log("No orders found");
    return;
  }
  console.log("Found order:", order.id, "Current status:", order.status);
  try {
    await db.updateOrder(order.id, { status: "cancelled" } as any);
    console.log("Update success!");
  } catch (err: any) {
    console.error("Update failed:", err.message);
  }
}
test().then(() => process.exit(0));
