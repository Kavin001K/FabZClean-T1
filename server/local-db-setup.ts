/**
 * LOCAL DATABASE SETUP
 * This file sets up the local SQLite database with:
 * - Franchises
 * - Admin and staff users
 * - Services with proper pricing
 * - Data isolation by franchise
 * - User-based access control
 * 
 * Run: npx tsx server/local-db-setup.ts
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import path from "path";

// Logic to match server/db.ts for consistency
let DB_PATH: string;
if (process.env.DATABASE_PATH) {
  DB_PATH = process.env.DATABASE_PATH;
} else {
  const SECURE_DATA_PATH = process.env.DATA_STORAGE_PATH
    ? process.env.DATA_STORAGE_PATH
    : path.join(process.cwd(), "server", "secure_data");
  DB_PATH = path.join(SECURE_DATA_PATH, "fabzclean.db");
}

// Ensure directory exists
const dir = dirname(DB_PATH);
if (dir !== "." && !existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

console.log(`🗄️  Setting up local FabZClean database at: ${DB_PATH}\n`);

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

// ============================================
// PART 1: CREATE ALL TABLES
// ============================================
console.log("📋 Creating tables...");

db.exec(`
  -- Franchises Table (Root of all franchise-scoped data)
  CREATE TABLE IF NOT EXISTS franchises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    franchiseId TEXT UNIQUE NOT NULL,
    branchCode TEXT,
    ownerName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsappNumber TEXT,
    address TEXT NOT NULL,
    legalEntityName TEXT,
    taxId TEXT,
    gstNumber TEXT,
    gstEnabled INTEGER DEFAULT 1,
    gstRate TEXT DEFAULT '18.00',
    sacCode TEXT DEFAULT '9971',
    bankName TEXT,
    bankAccountNumber TEXT,
    bankIfsc TEXT,
    bankAccountName TEXT,
    bankBranch TEXT,
    upiId TEXT,
    upiDisplayName TEXT,
    openingTime TEXT DEFAULT '09:00',
    closingTime TEXT DEFAULT '21:00',
    workingDays TEXT,
    primaryColor TEXT,
    secondaryColor TEXT,
    managerName TEXT,
    managerPhone TEXT,
    managerEmail TEXT,
    status TEXT DEFAULT 'active',
    autoGenerateOrderNumber INTEGER DEFAULT 1,
    enableDelivery INTEGER DEFAULT 1,
    defaultDeliveryCharge TEXT DEFAULT '0',
    enableExpressService INTEGER DEFAULT 1,
    expressServiceMultiplier TEXT DEFAULT '1.50',
    documents TEXT,
    agreementStartDate TEXT,
    agreementEndDate TEXT,
    royaltyPercentage TEXT DEFAULT '0',
    -- New Fields
    tradeLicenseNumber TEXT,
    msmeRegistration TEXT,
    onboardingStatus TEXT DEFAULT 'pending',
    onboardingChecklist TEXT,
    serviceRadiusKm TEXT DEFAULT '5.00',
    latitude TEXT,
    longitude TEXT,
    securityDeposit TEXT DEFAULT '0',
    billingCycle TEXT DEFAULT 'monthly',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Users Table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    franchiseId TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Customers Table
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    totalOrders INTEGER DEFAULT 0,
    totalSpent TEXT DEFAULT '0',
    creditBalance TEXT DEFAULT '0',
    -- New CRM Fields
    loyaltyTier TEXT DEFAULT 'bronze',
    loyaltyPoints INTEGER DEFAULT 0,
    marketingOptIn INTEGER DEFAULT 1,
    customerPreferences TEXT,
    walletBalance TEXT DEFAULT '0',
    creditLimit TEXT DEFAULT '5000',
    totalLifetimeSpent TEXT DEFAULT '0',
    lastOrderAt TEXT,
    lastOrder TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Services Table
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    name TEXT,
    description TEXT,
    price TEXT,
    category TEXT,
    duration TEXT,
    status TEXT DEFAULT 'Active',
    
    -- New Industry Standard Fields
    pricingModel TEXT DEFAULT 'per_piece',
    hsnSacCode TEXT,
    leadTimeHours INTEGER DEFAULT 24,
    requiredInventory TEXT,
    technicianNotes TEXT,
    thumbnailUrl TEXT,
    parentServiceId TEXT,
    isAddOn INTEGER DEFAULT 0,
    
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Orders Table
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
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
    lastWhatsappStatus TEXT,
    lastWhatsappSentAt TEXT,
    whatsappMessageCount INTEGER DEFAULT 0,
    -- New Fields
    isExpress INTEGER DEFAULT 0,
    garmentCount INTEGER DEFAULT 0,
    rackLocation TEXT,
    handoverOtp TEXT,
    itemVerificationStatus TEXT DEFAULT 'unverified',
    orderNotes TEXT,
    customerInstructions TEXT,
    photoUrls TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (customerId) REFERENCES customers(id),
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Employees Table (CRITICAL: Franchise Isolation)
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
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
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Products Table
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    name TEXT,
    sku TEXT,
    category TEXT,
    description TEXT,
    price TEXT,
    stockQuantity INTEGER DEFAULT 0,
    reorderLevel INTEGER DEFAULT 10,
    supplier TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Deliveries Table
  CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    orderId TEXT,
    driverName TEXT,
    vehicleId TEXT,
    status TEXT DEFAULT 'pending',
    estimatedDelivery TEXT,
    actualDelivery TEXT,
    location TEXT,
    route TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (orderId) REFERENCES orders(id)
  );

  -- Drivers Table
  CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    licenseNumber TEXT NOT NULL,
    vehicleNumber TEXT NOT NULL,
    vehicleType TEXT NOT NULL,
    vehicleModel TEXT,
    status TEXT DEFAULT 'available',
    rating REAL DEFAULT 5.0,
    totalDeliveries INTEGER DEFAULT 0,
    totalEarnings REAL DEFAULT 0,
    currentLatitude REAL,
    currentLongitude REAL,
    lastActive TEXT,
    experience INTEGER DEFAULT 0,
    specialties TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Audit Logs Table
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    employeeId TEXT,
    employeeUsername TEXT,
    action TEXT NOT NULL,
    entityType TEXT,
    entityId TEXT,
    details TEXT,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
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

  -- GST Config Table
  CREATE TABLE IF NOT EXISTS gst_config (
    id TEXT PRIMARY KEY,
    businessName TEXT NOT NULL,
    gstin TEXT UNIQUE NOT NULL,
    pan TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    stateCode TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    bankName TEXT,
    bankAccountNumber TEXT,
    bankIfsc TEXT,
    sacCode TEXT,
    logoPath TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT,
    updatedAt TEXT
  );

  -- Documents Table
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
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
    FOREIGN KEY (franchiseId) REFERENCES franchises(id),
    FOREIGN KEY (orderId) REFERENCES orders(id)
  );

  -- Transit Orders Table
  CREATE TABLE IF NOT EXISTS transit_orders (
    id TEXT PRIMARY KEY,
    transitId TEXT UNIQUE NOT NULL,
    franchiseId TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    origin TEXT,
    destination TEXT,
    createdBy TEXT,
    vehicleNumber TEXT,
    vehicleType TEXT,
    driverName TEXT,
    driverPhone TEXT,
    driverLicense TEXT,
    employeeName TEXT,
    employeeId TEXT,
    designation TEXT,
    employeePhone TEXT,
    totalOrders INTEGER DEFAULT 0,
    totalItems INTEGER DEFAULT 0,
    totalWeight REAL DEFAULT 0,
    orders TEXT,
    storeDetails TEXT,
    factoryDetails TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    completedAt TEXT,
    dispatchedAt TEXT,
    receivedAt TEXT,
    -- New Fields
    totalWeightKg REAL,
    vehicleCapacityUtilization REAL,
    dispatchVerifiedBy TEXT,
    receiptVerifiedBy TEXT,
    dispatchSignature TEXT,
    receiptSignature TEXT,
    originCoords TEXT,
    destinationCoords TEXT,
    verificationOtp TEXT,
    isVerified INTEGER DEFAULT 0,
    verifiedAt TEXT,
    vehicleId TEXT,
    driverId TEXT,
    securityFlags TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Transit Order Items Table
  CREATE TABLE IF NOT EXISTS transit_order_items (
    id TEXT PRIMARY KEY,
    transitOrderId TEXT NOT NULL,
    orderId TEXT NOT NULL,
    orderNumber TEXT,
    customerId TEXT,
    customerName TEXT,
    itemCount INTEGER DEFAULT 0,
    weight REAL DEFAULT 0,
    serviceType TEXT,
    status TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (transitOrderId) REFERENCES transit_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (orderId) REFERENCES orders(id)
  );

  -- Transit Status History Table
  CREATE TABLE IF NOT EXISTS transit_status_history (
    id TEXT PRIMARY KEY,
    transitOrderId TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    location TEXT,
    updatedBy TEXT,
    latitude REAL,
    longitude REAL,
    createdAt TEXT,
    FOREIGN KEY (transitOrderId) REFERENCES transit_orders(id) ON DELETE CASCADE
  );

  -- POS Transactions Table
  CREATE TABLE IF NOT EXISTS posTransactions (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    orderId TEXT,
    amount TEXT,
    paymentMethod TEXT,
    transactionNumber TEXT,
    items TEXT,
    cashierId TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Order Transactions Table
  CREATE TABLE IF NOT EXISTS order_transactions (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    transactionNumber TEXT NOT NULL,
    items TEXT NOT NULL,
    totalAmount TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    cashierId TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Shipments Table
  CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    shipmentNumber TEXT NOT NULL,
    orderIds TEXT NOT NULL,
    carrier TEXT NOT NULL,
    trackingNumber TEXT,
    status TEXT DEFAULT 'pending',
    estimatedDelivery TEXT,
    actualDelivery TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Barcodes Table
  CREATE TABLE IF NOT EXISTS barcodes (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    code TEXT UNIQUE,
    productId TEXT,
    type TEXT,
    entityType TEXT,
    entityId TEXT,
    data TEXT,
    imageData TEXT,
    imageUrl TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Employee Attendance Table
  CREATE TABLE IF NOT EXISTS employee_attendance (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    employeeId TEXT NOT NULL,
    date TEXT NOT NULL,
    clockIn TEXT,
    clockOut TEXT,
    breakStart TEXT,
    breakEnd TEXT,
    totalHours REAL,
    status TEXT DEFAULT 'present',
    notes TEXT,
    locationCheckIn TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id),
    FOREIGN KEY (franchiseId) REFERENCES franchises(id),
    UNIQUE(employeeId, date)
  );

  -- Employee Tasks Table
  CREATE TABLE IF NOT EXISTS employee_tasks (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    employeeId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    estimatedHours REAL,
    actualHours REAL,
    dueDate TEXT,
    completedDate TEXT,
    assignedBy TEXT,
    metrics TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id),
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Employee Performance Table
  CREATE TABLE IF NOT EXISTS employee_performance (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    employeeId TEXT NOT NULL,
    reviewPeriod TEXT NOT NULL,
    rating REAL NOT NULL,
    goals TEXT,
    feedback TEXT,
    reviewedBy TEXT,
    reviewDate TEXT NOT NULL,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id),
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  );

  -- Create Indexes for Performance and Data Isolation
  CREATE INDEX IF NOT EXISTS idx_orders_franchise ON orders(franchiseId);
  CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_customers_franchise ON customers(franchiseId);
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  CREATE INDEX IF NOT EXISTS idx_products_franchise ON products(franchiseId);
  CREATE INDEX IF NOT EXISTS idx_employees_franchise ON employees(franchiseId);
  CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
  CREATE INDEX IF NOT EXISTS idx_employees_employeeId ON employees(employeeId);
  CREATE INDEX IF NOT EXISTS idx_services_franchise ON services(franchiseId);
  CREATE INDEX IF NOT EXISTS idx_drivers_franchise ON drivers(franchiseId);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_franchise ON audit_logs(franchiseId);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  CREATE INDEX IF NOT EXISTS idx_documents_franchise ON documents(franchiseId);
  CREATE INDEX IF NOT EXISTS idx_transit_orders_status ON transit_orders(status);
  CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
`);

console.log("✅ Tables created successfully!\n");

// ============================================
// PART 2: SEED FRANCHISES
// ============================================
console.log("🏢 Creating franchises...");

const now = new Date().toISOString();
const franchises = [
  {
    id: "franchise-pollachi",
    name: "Fab Clean Pollachi",
    franchiseId: "FAB-POLLACHI",
    branchCode: "POL",
    ownerName: "Manager Pollachi",
    email: "pollachi@fabzclean.com",
    phone: "9363059595",
    whatsappNumber: "919363059595",
    address: JSON.stringify({
      street: "#16, Venkatramana Round Road, Opp: Naturals/HDFC Bank, Mahalingapuram",
      city: "Pollachi",
      state: "Tamil Nadu",
      pincode: "642002"
    }),
    // Legal & Tax
    legalEntityName: "Fab Clean Laundry Services",
    taxId: "AITPD3522F",
    gstNumber: "33AITPD3522F1ZK",
    gstEnabled: 1,
    gstRate: "18.00",
    sacCode: "9971",
    // Banking
    bankName: "State Bank of India",
    bankAccountNumber: "39876543210",
    bankIfsc: "SBIN0001234",
    bankAccountName: "Fab Clean Laundry Services",
    bankBranch: "Pollachi Branch",
    // UPI
    upiId: "9886788858@pz",
    upiDisplayName: "Fab Clean Pollachi",
    // Operating Hours
    openingTime: "09:00",
    closingTime: "21:00",
    workingDays: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
    // Branding
    primaryColor: "#4CAF50",
    secondaryColor: "#2196F3",
    // Manager
    managerName: "Senthil Kumar",
    managerPhone: "9876543210",
    managerEmail: "manager.pollachi@fabzclean.com",
    // Operational
    status: "active",
    autoGenerateOrderNumber: 1,
    enableDelivery: 1,
    defaultDeliveryCharge: "50.00",
    enableExpressService: 1,
    expressServiceMultiplier: "1.50"
  },
  {
    id: "franchise-kinathukadavu",
    name: "Fab Clean Kinathukadavu",
    franchiseId: "FAB-KIN",
    branchCode: "KIN",
    ownerName: "Manager Kinathukadavu",
    email: "kinathukadavu@fabzclean.com",
    phone: "9363719595",
    whatsappNumber: "919363719595",
    address: JSON.stringify({
      street: "#442/11, Opp MLA Office, Krishnasamypuram",
      city: "Kinathukadavu",
      state: "Tamil Nadu",
      pincode: "642109"
    }),
    // Legal & Tax
    legalEntityName: "Fab Clean Laundry Services",
    taxId: "AITPD3522F",
    gstNumber: "33AITPD3522F1ZK",
    gstEnabled: 1,
    gstRate: "18.00",
    sacCode: "9971",
    // Banking
    bankName: "State Bank of India",
    bankAccountNumber: "39876543210",
    bankIfsc: "SBIN0001234",
    bankAccountName: "Fab Clean Laundry Services",
    bankBranch: "Kinathukadavu Branch",
    // UPI
    upiId: "9886788858@pz",
    upiDisplayName: "Fab Clean Kinathukadavu",
    // Operating Hours
    openingTime: "09:00",
    closingTime: "21:00",
    workingDays: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
    // Branding
    primaryColor: "#4CAF50",
    secondaryColor: "#2196F3",
    // Manager
    managerName: "Rajesh Kannan",
    managerPhone: "9876543220",
    managerEmail: "manager.kin@fabzclean.com",
    // Operational
    status: "active",
    autoGenerateOrderNumber: 1,
    enableDelivery: 1,
    defaultDeliveryCharge: "50.00",
    enableExpressService: 1,
    expressServiceMultiplier: "1.50"
  }
];

const insertFranchise = db.prepare(`
  INSERT OR REPLACE INTO franchises (
    id, name, franchiseId, branchCode, ownerName, email, phone, whatsappNumber, address,
    legalEntityName, taxId, gstNumber, gstEnabled, gstRate, sacCode,
    bankName, bankAccountNumber, bankIfsc, bankAccountName, bankBranch,
    upiId, upiDisplayName,
    openingTime, closingTime, workingDays,
    primaryColor, secondaryColor,
    managerName, managerPhone, managerEmail,
    status, autoGenerateOrderNumber, enableDelivery, defaultDeliveryCharge, enableExpressService, expressServiceMultiplier,
    createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const f of franchises) {
  insertFranchise.run(
    f.id, f.name, f.franchiseId, f.branchCode, f.ownerName, f.email, f.phone, f.whatsappNumber, f.address,
    f.legalEntityName, f.taxId, f.gstNumber, f.gstEnabled, f.gstRate, f.sacCode,
    f.bankName, f.bankAccountNumber, f.bankIfsc, f.bankAccountName, f.bankBranch,
    f.upiId, f.upiDisplayName,
    f.openingTime, f.closingTime, f.workingDays,
    f.primaryColor, f.secondaryColor,
    f.managerName, f.managerPhone, f.managerEmail,
    f.status, f.autoGenerateOrderNumber, f.enableDelivery, f.defaultDeliveryCharge, f.enableExpressService, f.expressServiceMultiplier,
    now, now
  );
  console.log(`  ✓ Created franchise: ${f.name} (${f.branchCode})`);
}

// ============================================
// PART 3: SEED EMPLOYEES WITH ROLES
// ============================================
console.log("\n👥 Creating employees with user-based access...");

// Hash password: Durai@2025
const adminPasswordHash = bcrypt.hashSync("Durai@2025", 10);
const defaultPasswordHash = bcrypt.hashSync("password123", 10);

const employees = [
  // System Admin (has access to ALL franchises)
  {
    id: "admin-user-id",
    franchiseId: null, // Admin sees all
    employeeId: "myfabclean",
    firstName: "System",
    lastName: "Admin",
    email: "admin@myfabclean.com",
    phone: "9999999999",
    position: "Administrator",
    department: "Management",
    salary: "100000.00",
    role: "admin",
    password: adminPasswordHash,
    status: "active"
  },
  // Pollachi Franchise Manager
  {
    id: randomUUID(),
    franchiseId: "franchise-pollachi",
    employeeId: "mgr-pollachi",
    firstName: "Senthil",
    lastName: "Kumar",
    email: "manager.pollachi@fabzclean.com",
    phone: "9876543210",
    position: "Store Manager",
    department: "Operations",
    salary: "25000.00",
    role: "franchise_manager",
    password: defaultPasswordHash,
    status: "active"
  },
  // Pollachi Staff
  {
    id: randomUUID(),
    franchiseId: "franchise-pollachi",
    employeeId: "staff-pol-01",
    firstName: "Priya",
    lastName: "Devi",
    email: "staff1.pollachi@fabzclean.com",
    phone: "9876543211",
    position: "Counter Staff",
    department: "Operations",
    salary: "18000.00",
    role: "staff",
    password: defaultPasswordHash,
    status: "active"
  },
  // Pollachi Driver
  {
    id: randomUUID(),
    franchiseId: "franchise-pollachi",
    employeeId: "drv-pol-01",
    firstName: "Ramesh",
    lastName: "Kumar",
    email: "driver1.pollachi@fabzclean.com",
    phone: "9876543212",
    position: "Delivery Driver",
    department: "Logistics",
    salary: "15000.00",
    role: "driver",
    password: defaultPasswordHash,
    status: "active"
  },
  // Kinathukadavu Franchise Manager
  {
    id: randomUUID(),
    franchiseId: "franchise-kinathukadavu",
    employeeId: "mgr-kin",
    firstName: "Rajesh",
    lastName: "Kannan",
    email: "manager.kin@fabzclean.com",
    phone: "9876543220",
    position: "Store Manager",
    department: "Operations",
    salary: "25000.00",
    role: "franchise_manager",
    password: defaultPasswordHash,
    status: "active"
  },
  // Kinathukadavu Staff
  {
    id: randomUUID(),
    franchiseId: "franchise-kinathukadavu",
    employeeId: "staff-kin-01",
    firstName: "Karthik",
    lastName: "Raja",
    email: "staff1.kin@fabzclean.com",
    phone: "9876543221",
    position: "Counter Staff",
    department: "Operations",
    salary: "18000.00",
    role: "staff",
    password: defaultPasswordHash,
    status: "active"
  },
  // Kinathukadavu Driver
  {
    id: randomUUID(),
    franchiseId: "franchise-kinathukadavu",
    employeeId: "drv-kin-01",
    firstName: "Suresh",
    lastName: "Babu",
    email: "driver1.kin@fabzclean.com",
    phone: "9876543222",
    position: "Delivery Driver",
    department: "Logistics",
    salary: "15000.00",
    role: "driver",
    password: defaultPasswordHash,
    status: "active"
  }
];

const insertEmployee = db.prepare(`
  INSERT OR REPLACE INTO employees 
  (id, franchiseId, employeeId, firstName, lastName, email, phone, position, department, salary, role, password, status, hireDate, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const e of employees) {
  insertEmployee.run(
    e.id, e.franchiseId, e.employeeId, e.firstName, e.lastName,
    e.email, e.phone, e.position, e.department, e.salary,
    e.role, e.password, e.status, now, now, now
  );
  console.log(`  ✓ Created employee: ${e.firstName} ${e.lastName} (${e.role}) - Login: ${e.employeeId}`);
}

// ============================================
// PART 4: SEED SERVICES (Both Franchises)
// ============================================
console.log("\n🧹 Creating services...");

const servicesList = [
  // Ironing Services
  { name: "Shirt", category: "Ironing", price: "20.00", duration: "24 hours" },
  { name: "T-Shirt", category: "Ironing", price: "20.00", duration: "24 hours" },
  { name: "Pant", category: "Ironing", price: "20.00", duration: "24 hours" },
  { name: "Jeans", category: "Ironing", price: "20.00", duration: "24 hours" },
  { name: "Shorts", category: "Ironing", price: "15.00", duration: "24 hours" },
  { name: "Dhoti", category: "Ironing", price: "40.00", duration: "24 hours" },
  { name: "Saree (Cotton)", category: "Ironing", price: "50.00", duration: "24 hours" },
  { name: "Saree (Silk)", category: "Ironing", price: "80.00", duration: "24 hours" },
  { name: "Coat", category: "Ironing", price: "60.00", duration: "24 hours" },
  // Laundry Services
  { name: "Shirt", category: "Laundry", price: "30.00", duration: "48 hours" },
  { name: "T-Shirt", category: "Laundry", price: "30.00", duration: "48 hours" },
  { name: "Pant", category: "Laundry", price: "30.00", duration: "48 hours" },
  { name: "Jeans", category: "Laundry", price: "40.00", duration: "48 hours" },
  { name: "Shorts", category: "Laundry", price: "25.00", duration: "48 hours" },
  { name: "Towel", category: "Laundry", price: "30.00", duration: "48 hours" },
  { name: "Bed Sheet (Single)", category: "Laundry", price: "80.00", duration: "48 hours" },
  { name: "Bed Sheet (Double)", category: "Laundry", price: "100.00", duration: "48 hours" },
  { name: "Blanket (Single)", category: "Laundry", price: "150.00", duration: "48 hours" },
  { name: "Blanket (Double)", category: "Laundry", price: "200.00", duration: "48 hours" },
  // Dry Cleaning Services
  { name: "Shirt", category: "Dry Cleaning", price: "60.00", duration: "72 hours" },
  { name: "Pant", category: "Dry Cleaning", price: "70.00", duration: "72 hours" },
  { name: "Jeans", category: "Dry Cleaning", price: "80.00", duration: "72 hours" },
  { name: "Coat", category: "Dry Cleaning", price: "200.00", duration: "72 hours" },
  { name: "Saree (Cotton)", category: "Dry Cleaning", price: "250.00", duration: "72 hours" },
  { name: "Saree (Silk)", category: "Dry Cleaning", price: "250.00", duration: "72 hours" },
  { name: "Carpet (Small)", category: "Dry Cleaning", price: "150.00", duration: "72 hours" },
  { name: "Carpet (Medium)", category: "Dry Cleaning", price: "250.00", duration: "72 hours" },
  { name: "Carpet (Big)", category: "Dry Cleaning", price: "350.00", duration: "72 hours" },
];

const insertService = db.prepare(`
  INSERT OR IGNORE INTO services (id, franchiseId, name, category, description, price, duration, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let serviceCount = 0;
for (const franchise of franchises) {
  for (const svc of servicesList) {
    insertService.run(
      randomUUID(),
      franchise.id,
      svc.name,
      svc.category,
      `${svc.category} for ${svc.name}`,
      svc.price,
      svc.duration,
      "Active",
      now,
      now
    );
    serviceCount++;
  }
}
console.log(`  ✓ Created ${serviceCount} services across ${franchises.length} franchises`);

// ============================================
// PART 5: SEED DEFAULT SETTINGS
// ============================================
console.log("\n⚙️ Creating default settings...");

const settings = [
  { key: "company_name", value: "FabZ Clean", category: "general" },
  { key: "company_phone", value: "9363059595", category: "general" },
  { key: "company_email", value: "info@fabzclean.com", category: "general" },
  { key: "gst_enabled", value: "true", category: "billing" },
  { key: "gst_rate", value: "18", category: "billing" },
  { key: "currency", value: "INR", category: "billing" },
  { key: "whatsapp_enabled", value: "true", category: "notifications" },
  { key: "sms_enabled", value: "false", category: "notifications" },
  { key: "order_prefix", value: "FZC", category: "orders" },
  { key: "transit_prefix", value: "TRN", category: "transit" },
];

const insertSetting = db.prepare(`
  INSERT OR REPLACE INTO settings (id, key, value, category, updatedAt)
  VALUES (?, ?, ?, ?, ?)
`);

for (const s of settings) {
  insertSetting.run(randomUUID(), s.key, s.value, s.category, now);
}
console.log(`  ✓ Created ${settings.length} default settings`);

// ============================================
// PART 6: SEED DEFAULT DRIVER
// ============================================
console.log("\n🚗 Creating sample drivers...");

const drivers = [
  {
    id: randomUUID(),
    franchiseId: "franchise-pollachi",
    name: "Ramesh Kumar",
    phone: "9876543212",
    email: "driver1.pollachi@fabzclean.com",
    licenseNumber: "TN01-2020-0012345",
    vehicleNumber: "TN-39-AB-1234",
    vehicleType: "bike",
    status: "available"
  },
  {
    id: randomUUID(),
    franchiseId: "franchise-kinathukadavu",
    name: "Suresh Babu",
    phone: "9876543222",
    email: "driver1.kin@fabzclean.com",
    licenseNumber: "TN01-2019-0054321",
    vehicleNumber: "TN-39-CD-5678",
    vehicleType: "bike",
    status: "available"
  }
];

const insertDriver = db.prepare(`
  INSERT OR REPLACE INTO drivers (id, franchiseId, name, phone, email, licenseNumber, vehicleNumber, vehicleType, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const d of drivers) {
  insertDriver.run(d.id, d.franchiseId, d.name, d.phone, d.email, d.licenseNumber, d.vehicleNumber, d.vehicleType, d.status, now, now);
  console.log(`  ✓ Created driver: ${d.name} (${d.vehicleNumber})`);
}

// ============================================
// PART 7: SEED SAMPLE CUSTOMERS
// ============================================
console.log("\n👤 Creating sample customers...");

const customers = [
  {
    id: randomUUID(),
    franchiseId: "franchise-pollachi",
    name: "Walk-in Customer",
    email: "walkin@example.com",
    phone: "0000000000",
    address: JSON.stringify({ street: "Local", city: "Pollachi" })
  },
  {
    id: randomUUID(),
    franchiseId: "franchise-pollachi",
    name: "Arun Kumar",
    email: "arun.kumar@gmail.com",
    phone: "9876012345",
    address: JSON.stringify({ street: "123, Main Road", city: "Pollachi", state: "Tamil Nadu" })
  },
  {
    id: randomUUID(),
    franchiseId: "franchise-kinathukadavu",
    name: "Walk-in Customer",
    email: "walkin.kin@example.com",
    phone: "0000000001",
    address: JSON.stringify({ street: "Local", city: "Kinathukadavu" })
  },
  {
    id: randomUUID(),
    franchiseId: "franchise-kinathukadavu",
    name: "Lakshmi Devi",
    email: "lakshmi.devi@gmail.com",
    phone: "9876054321",
    address: JSON.stringify({ street: "456, Temple Street", city: "Kinathukadavu", state: "Tamil Nadu" })
  }
];

const insertCustomer = db.prepare(`
  INSERT OR REPLACE INTO customers (id, franchiseId, name, email, phone, address, totalOrders, totalSpent, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, 0, '0', ?, ?)
`);

for (const c of customers) {
  insertCustomer.run(c.id, c.franchiseId, c.name, c.email, c.phone, c.address, now, now);
  console.log(`  ✓ Created customer: ${c.name} (${c.franchiseId.replace('franchise-', '')})`);
}

// ============================================
// DONE!
// ============================================
console.log("\n" + "=".repeat(60));
console.log("✅ LOCAL DATABASE SETUP COMPLETE!");
console.log("=".repeat(60));
console.log("\n📊 Summary:");
console.log(`   • Franchises: ${franchises.length}`);
console.log(`   • Employees: ${employees.length}`);
console.log(`   • Services: ${serviceCount}`);
console.log(`   • Drivers: ${drivers.length}`);
console.log(`   • Customers: ${customers.length}`);
console.log(`   • Settings: ${settings.length}`);

console.log("\n🔐 LOGIN CREDENTIALS:");
console.log("   ┌───────────────────────────────────────────────────────────┐");
console.log("   │ ADMIN (Full Access)                                       │");
console.log("   │   Employee ID: myfabclean                                 │");
console.log("   │   Password: Durai@2025                                    │");
console.log("   ├───────────────────────────────────────────────────────────┤");
console.log("   │ POLLACHI MANAGER (Pollachi Franchise Only)                │");
console.log("   │   Employee ID: mgr-pollachi                               │");
console.log("   │   Password: password123                                   │");
console.log("   ├───────────────────────────────────────────────────────────┤");
console.log("   │ KINATHUKADAVU MANAGER (Kinathukadavu Franchise Only)      │");
console.log("   │   Employee ID: mgr-kin                                    │");
console.log("   │   Password: password123                                   │");
console.log("   └───────────────────────────────────────────────────────────┘");

console.log("\n🔒 DATA ISOLATION:");
console.log("   • Admin users see ALL franchise data");
console.log("   • Franchise Managers see ONLY their franchise data");
console.log("   • Staff/Drivers see ONLY their franchise data");

console.log("\n🚀 Start your server with: npm run dev");
console.log("");

db.close();
