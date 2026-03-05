/**
 * Migration script: Replace old services with the new FabZClean service catalog.
 *
 * Run with:  npx tsx scripts/update-services.ts
 *
 * This will:
 *  1. Delete ALL existing services in the database
 *  2. Insert the 18 new service items across 4 categories
 */

import Database from "better-sqlite3";
import { randomUUID } from "crypto";

const DB_PATH = process.env.DB_PATH || "./fabzclean.db";

const NEW_SERVICES = [
    // ── Wash Service ──
    { name: "Shirt (Wash + Starch)", description: "WS001 | White/Color | Wash + Starch", price: "45.00", category: "Wash Service", duration: "2 hours", status: "active" },
    { name: "Pant (Wash + Starch)", description: "WS002 | White/Color | Wash + Starch", price: "50.00", category: "Wash Service", duration: "2 hours", status: "active" },
    { name: "Dhoti (Wash + Starch)", description: "WS003 | White/Color | Wash + Starch", price: "50.00", category: "Wash Service", duration: "2 hours", status: "active" },
    { name: "Shirt (Wash + Iron)", description: "WS004 | Wash + Iron", price: "45.00", category: "Wash Service", duration: "2 hours", status: "active" },
    { name: "Pant (Wash + Iron)", description: "WS005 | Wash + Iron", price: "45.00", category: "Wash Service", duration: "2 hours", status: "active" },
    { name: "Jeans (Wash + Iron)", description: "WS006 | Wash + Iron", price: "45.00", category: "Wash Service", duration: "2 hours", status: "active" },
    // ── Premium Clothing ──
    { name: "Shirt / T-Shirt (Premium)", description: "PC001 | Premium dry clean", price: "90.00", category: "Premium Clothing", duration: "2 hours", status: "active" },
    { name: "Dhoti (Premium)", description: "PC002 | Premium dry clean", price: "90.00", category: "Premium Clothing", duration: "2 hours", status: "active" },
    { name: "Silk Shirt / Silk Dhoti", description: "PC003 | Premium silk care", price: "120.00", category: "Premium Clothing", duration: "2 hours", status: "active" },
    { name: "Coat / Blazer", description: "PC004 | Premium dry clean", price: "255.00", category: "Premium Clothing", duration: "2 hours", status: "active" },
    { name: "Sherwani", description: "PC005 | Premium dry clean", price: "400.00", category: "Premium Clothing", duration: "2 hours", status: "active" },
    // ── Regular Clothing ──
    { name: "Shirt / T-Shirt (Regular)", description: "RC001 | Regular dry clean", price: "75.00", category: "Regular Clothing", duration: "2 hours", status: "active" },
    { name: "Pant / Shorts", description: "RC002 | Regular dry clean", price: "75.00", category: "Regular Clothing", duration: "2 hours", status: "active" },
    { name: "Dhoti (Regular)", description: "RC003 | Regular dry clean", price: "75.00", category: "Regular Clothing", duration: "2 hours", status: "active" },
    // ── Household Items ──
    { name: "Bed Sheet (Single)", description: "HH001 | Household cleaning", price: "90.00", category: "Household Items", duration: "2 hours", status: "active" },
    { name: "Bed Sheet (Double)", description: "HH002 | Household cleaning", price: "140.00", category: "Household Items", duration: "2 hours", status: "active" },
    { name: "Sports Shoes / Sneakers", description: "HH003 | Shoe cleaning", price: "300.00", category: "Household Items", duration: "2 hours", status: "active" },
    { name: "Leather Shoe", description: "HH004 | Premium shoe cleaning", price: "400.00", category: "Household Items", duration: "2 hours", status: "active" },
];

function run() {
    console.log(`🗄️  Opening database: ${DB_PATH}`);
    const db = new Database(DB_PATH);

    // 1. Count and delete old services
    const oldCount = (db.prepare("SELECT COUNT(*) as cnt FROM services").get() as any).cnt;
    console.log(`🗑️  Deleting ${oldCount} old service(s)…`);
    db.prepare("DELETE FROM services").run();

    // 2. Insert new services
    const insert = db.prepare(`
    INSERT INTO services (id, name, description, price, category, duration, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

    const insertAll = db.transaction(() => {
        for (const s of NEW_SERVICES) {
            insert.run(randomUUID(), s.name, s.description, s.price, s.category, s.duration, s.status);
        }
    });

    insertAll();

    const newCount = (db.prepare("SELECT COUNT(*) as cnt FROM services").get() as any).cnt;
    console.log(`✅ Inserted ${newCount} new services.`);
    console.log("");

    // 3. Verify — list them
    const all = db.prepare("SELECT id, name, category, price FROM services ORDER BY category, price").all() as any[];
    console.log("📋 Current service catalog:");
    let lastCat = "";
    for (const s of all) {
        if (s.category !== lastCat) {
            lastCat = s.category;
            console.log(`\n  ── ${lastCat} ──`);
        }
        console.log(`    ₹${s.price.padStart(7)}  ${s.name}`);
    }

    db.close();
    console.log("\n🎉 Done!");
}

run();
