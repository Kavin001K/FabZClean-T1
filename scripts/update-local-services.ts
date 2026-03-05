import { SQLiteStorage } from "../server/SQLiteStorage.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "server", "secure_data", "fabzclean.db");

console.log(`🔒 Connecting to SQLite Database at: ${DB_PATH}`);
const db = new SQLiteStorage(DB_PATH);

async function run() {
    try {
        console.log('🗑️  Deleting all existing services...');
        const existingServices = await db.getServices();
        for (const service of existingServices) {
            await db.deleteService(service.id);
        }
        console.log(`✅ Deleted ${existingServices.length} old services.`);

        const newServices = [
            { name: "Shirt (Wash + Starch)", category: "Wash Service", description: "WS001 | 890100000001 | White/Color | Tax: 5%", price: 45, duration: "120 mins", status: "Active" },
            { name: "Pant (Wash + Starch)", category: "Wash Service", description: "WS002 | 890100000002 | White/Color | Tax: 5%", price: 50, duration: "120 mins", status: "Active" },
            { name: "Dhoti (Wash + Starch)", category: "Wash Service", description: "WS003 | 890100000003 | White/Color | Tax: 5%", price: 50, duration: "120 mins", status: "Active" },
            { name: "Shirt (Wash + Iron)", category: "Wash Service", description: "WS004 | 890100000004 | Tax: 5%", price: 45, duration: "120 mins", status: "Active" },
            { name: "Pant (Wash + Iron)", category: "Wash Service", description: "WS005 | 890100000005 | Tax: 5%", price: 45, duration: "120 mins", status: "Active" },
            { name: "Jeans (Wash + Iron)", category: "Wash Service", description: "WS006 | 890100000006 | Tax: 5%", price: 45, duration: "120 mins", status: "Active" },
            { name: "Shirt / T-Shirt", category: "Premium Clothing", description: "PC001 | 890100000101 | Tax: 5%", price: 90, duration: "120 mins", status: "Active" },
            { name: "Dhoti", category: "Premium Clothing", description: "PC002 | 890100000102 | Tax: 5%", price: 90, duration: "120 mins", status: "Active" },
            { name: "Silk Shirt / Silk Dhoti", category: "Premium Clothing", description: "PC003 | 890100000103 | Tax: 5%", price: 120, duration: "120 mins", status: "Active" },
            { name: "Coat / Blazer", category: "Premium Clothing", description: "PC004 | 890100000104 | Tax: 5%", price: 255, duration: "120 mins", status: "Active" },
            { name: "Sherwani", category: "Premium Clothing", description: "PC005 | 890100000105 | Tax: 5%", price: 400, duration: "120 mins", status: "Active" },
            { name: "Shirt / T-Shirt", category: "Regular Clothing", description: "RC001 | 890100000201 | Tax: 5%", price: 75, duration: "120 mins", status: "Active" },
            { name: "Pant / Shorts", category: "Regular Clothing", description: "RC002 | 890100000202 | Tax: 5%", price: 75, duration: "120 mins", status: "Active" },
            { name: "Dhoti", category: "Regular Clothing", description: "RC003 | 890100000203 | Tax: 5%", price: 75, duration: "120 mins", status: "Active" },
            { name: "Bed Sheet (Single)", category: "Household Items", description: "HH001 | 890100000301 | Tax: 5%", price: 90, duration: "120 mins", status: "Active" },
            { name: "Bed Sheet (Double)", category: "Household Items", description: "HH002 | 890100000302 | Tax: 5%", price: 140, duration: "120 mins", status: "Active" },
            { name: "Sports Shoes / Sneakers", category: "Household Items", description: "HH003 | 890100000303 | Tax: 12%", price: 300, duration: "120 mins", status: "Active" },
            { name: "Leather Shoe", category: "Household Items", description: "HH004 | 890100000304 | Tax: 12%", price: 400, duration: "120 mins", status: "Active" }
        ];

        console.log(`⏳ Inserting ${newServices.length} new services...`);
        for (const data of newServices) {
            // API expects string prices usually
            await db.createService({
                name: data.name,
                category: data.category,
                description: data.description,
                price: data.price.toString(),
                duration: data.duration,
                status: data.status
            } as any);
        }

        console.log('✨ Services correctly updated in the local database!');
    } catch (error) {
        console.error('❌ Failed to update services:', error);
    }
}

run();
