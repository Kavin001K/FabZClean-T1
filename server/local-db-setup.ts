/**
 * LOCAL DATABASE SETUP (Simplified POS Version)
 * This file sets up the local SQLite database with core tables only.
 * Run: npx tsx server/local-db-setup.ts
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const DB_PATH = "./fabzclean.db";

const dir = dirname(DB_PATH);
if (dir !== "." && !existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

console.log("🗄️ Setting up clean local FabZClean database...\n");

const db = new Database(DB_PATH);
db.pragma("foreign_keys = OFF");

console.log("🔥 Dropping old tables to clean data...");
const tablesToDrop = [
  "franchises", "transit_orders", "transit_order_items", "transit_status_history",
  "deliveries", "drivers", "shipments", "employee_attendance", "employee_tasks",
  "employee_performance", "users", "customers", "services", "orders", "employees",
  "products", "barcodes", "documents", "audit_logs", "settings", "gst_config",
  "posTransactions", "order_transactions"
];

for (const table of tablesToDrop) {
  db.exec(`DROP TABLE IF EXISTS ${table};`);
}

db.pragma("foreign_keys = ON");

console.log("📋 Creating simplified core tables...");

db.exec(`
  -- Users (Legacy/General) TABLE
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  -- Employees Table (Used for login now)
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employeeId TEXT UNIQUE,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    phone TEXT,
    position TEXT,
    department TEXT,
    hireDate TEXT,
    salary TEXT,
    hourlyRate TEXT,
    status TEXT DEFAULT 'active',
    managerId TEXT,
    address TEXT,
    emergencyContact TEXT,
    skills TEXT,
    performanceRating TEXT DEFAULT '0',
    lastReviewDate TEXT,
    role TEXT DEFAULT 'staff',
    password TEXT,
    profileImage TEXT,
    orderLetter TEXT,
    settings TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  -- Customers Table
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    totalOrders INTEGER DEFAULT 0,
    totalSpent TEXT DEFAULT '0',
    creditBalance TEXT DEFAULT '0',
    lastOrder TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  -- Services Table
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    price TEXT,
    category TEXT,
    duration TEXT,
    status TEXT DEFAULT 'Active',
    createdAt TEXT,
    updatedAt TEXT
  );

  -- Orders Table
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    status TEXT,
    totalAmount TEXT,
    items TEXT,
    orderNumber TEXT,
    customerName TEXT,
    customerEmail TEXT,
    customerPhone TEXT,
    paymentStatus TEXT DEFAULT 'pending',
    shippingAddress TEXT,
    pickupDate TEXT,
    advancePaid TEXT DEFAULT '0',
    paymentMethod TEXT DEFAULT 'cash',
    discountType TEXT,
    discountValue TEXT,
    couponCode TEXT,
    extraCharges TEXT,
    gstEnabled INTEGER DEFAULT 0,
    gstRate TEXT DEFAULT '18.00',
    gstAmount TEXT DEFAULT '0.00',
    panNumber TEXT,
    gstNumber TEXT,
    specialInstructions TEXT,
    fulfillmentType TEXT DEFAULT 'pickup',
    deliveryCharges TEXT DEFAULT '0',
    deliveryAddress TEXT,
    isExpressOrder INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'normal',
    lastWhatsappStatus TEXT,
    lastWhatsappSentAt TEXT,
    whatsappMessageCount INTEGER DEFAULT 0,
    tagsPrinted INTEGER DEFAULT 0,
    bagCount INTEGER DEFAULT 1,
    coverType TEXT DEFAULT 'bag',
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (customerId) REFERENCES customers(id)
  );

  -- Products Table
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT,
    sku TEXT,
    category TEXT,
    description TEXT,
    price TEXT,
    stockQuantity INTEGER DEFAULT 0,
    reorderLevel INTEGER DEFAULT 10,
    supplier TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  -- Audit Logs Table
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    action TEXT NOT NULL,
    entityType TEXT,
    entityId TEXT,
    details TEXT,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Settings Table
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    updatedAt TEXT,
    updatedBy TEXT
  );

  -- Documents Table
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'invoice',
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT,
    fileUrl TEXT,
    fileData TEXT,
    status TEXT DEFAULT 'draft',
    amount TEXT,
    customerName TEXT,
    orderNumber TEXT,
    orderId TEXT,
    metadata TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (orderId) REFERENCES orders(id)
  );

  -- Order Transactions Table
  CREATE TABLE IF NOT EXISTS order_transactions (
    id TEXT PRIMARY KEY,
    transactionNumber TEXT NOT NULL,
    items TEXT NOT NULL,
    totalAmount TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    cashierId TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  -- Barcodes Table
  CREATE TABLE IF NOT EXISTS barcodes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    type TEXT,
    entityType TEXT,
    entityId TEXT,
    data TEXT,
    imagePath TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT,
    updatedAt TEXT
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
`);

console.log("✅ Tables created successfully!\n");

// ============================================
// PART 2: SEED ADMIN EMPLOYEE
// ============================================
console.log("👥 Creating Admin user...");

const now = new Date().toISOString();
// Hash password: Durai@2025
const adminPasswordHash = bcrypt.hashSync("Durai@2025", 10);

const insertEmployee = db.prepare(`
  INSERT INTO employees 
  (id, employeeId, firstName, lastName, email, phone, position, department, salary, role, password, status, hireDate, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertEmployee.run(
  randomUUID(), "admin", "System", "Admin", "admin@myfabclean.com", "9999999999",
  "Administrator", "Management", "100000.00", "admin", adminPasswordHash, "active",
  now, now, now
);

console.log("  ✓ Created Admin: admin@myfabclean.com \n");

// ============================================
// PART 3: SEED WALKIN CUSTOMER
// ============================================
console.log("👤 Creating Walk-in customer...");

const insertCustomer = db.prepare(`
  INSERT INTO customers (id, name, phone, address, totalOrders, totalSpent, creditBalance, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertCustomer.run(
  "walkin-customer-id", "Walk-in Customer", "0000000000", "{}", 0, "0", "0", now, now
);

console.log("  ✓ Created Walk-in Customer\n");

// ============================================
// PART 4: SEED SERVICES
// ============================================
console.log("🧹 Creating basic services...");

const servicesList = [
  { name: "Shirt", category: "Ironing", price: "20.00", duration: "24 hours" },
  { name: "Pant", category: "Ironing", price: "20.00", duration: "24 hours" },
  { name: "Saree", category: "Ironing", price: "50.00", duration: "24 hours" },
  { name: "Shirt", category: "Dry Cleaning", price: "80.00", duration: "48 hours" },
  { name: "Pant", category: "Dry Cleaning", price: "80.00", duration: "48 hours" },
  { name: "Suit", category: "Dry Cleaning", price: "250.00", duration: "48 hours" }
];

const insertService = db.prepare(`
  INSERT INTO services (id, name, description, price, category, duration, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const s of servicesList) {
  insertService.run(
    randomUUID(), s.name, `${s.category} for ${s.name}`, s.price, s.category, s.duration, "Active", now, now
  );
}

console.log("  ✓ Created basic services\n");

// ============================================
// PART 5: CONFIGURE SETTINGS
// ============================================
console.log("⚙️ Configuring default settings...");

const setupSettings = [
  { key: "companyName", value: "FabZClean", category: "general" },
  { key: "currency", value: "INR", category: "general" },
  { key: "taxRate", value: "18", category: "general" },
  {
    key: "quickActionSlots",
    value: JSON.stringify(['new-order', 'active-orders', 'customer-search', 'services', 'print-queue']),
    category: "general"
  }
];

const insertSetting = db.prepare(`
  INSERT INTO settings (id, key, value, category, updatedAt, updatedBy)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const s of setupSettings) {
  insertSetting.run(randomUUID(), s.key, s.value, s.category, now, "system");
}

console.log("  ✓ Created default settings\n");

console.log("🎉 Database setup complete!");
