import { db } from "./db";

async function fixRevenues() {
    console.log("Fetching all customers...");
    const customers = await db.listCustomers();
    console.log(`Found ${customers.length} customers. Processing...`);

    const orders = await db.listOrders();
    console.log(`Found ${orders.length} orders total.`);

    for (const customer of customers) {
        const customerOrders = orders.filter((o: any) => o.customerId === customer.id);
        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || "0"), 0);

        if (customer.totalOrders !== totalOrders || customer.totalSpent !== totalSpent) {
            console.log(`Updating ${customer.name}: orders ${customer.totalOrders} -> ${totalOrders}, spent ${customer.totalSpent} -> ${totalSpent}`);
            await db.updateCustomer(customer.id, {
                totalOrders,
                totalSpent
            } as any);
        }
    }
    console.log("Done updating revenues.");
}

fixRevenues().catch(console.error);
