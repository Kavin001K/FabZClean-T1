import { SupabaseStorage } from "./server/SupabaseStorage";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const storage = new SupabaseStorage();
    const orderId = "048ad634-928e-43f9-be83-5d214df7df60";
    
    // Check initial state
    const order = await storage.getOrder(orderId);
    console.log("Initial paymentStatus:", (order as any)?.paymentStatus);
    
    // Try to update
    const updated = await storage.updateOrder(orderId, {
        paymentStatus: 'paid' as any
    });
    console.log("Updated paymentStatus:", (updated as any)?.paymentStatus);
    
    // Check state again
    const finalOrder = await storage.getOrder(orderId);
    console.log("Final paymentStatus:", (finalOrder as any)?.paymentStatus);
}

main().catch(console.error);
