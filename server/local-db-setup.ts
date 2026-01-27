/**
 * ============================================================================
 * FABZCLEAN LOCAL DATABASE SETUP - UNIFIED & OPTIMIZED
 * ============================================================================
 * 
 * This file sets up the complete local SQLite database with:
 * - All core tables (franchises, orders, customers, employees, services)
 * - Business Intelligence (BI) Suite tables (daily_summaries)
 * - Credit management tables (credit_transactions, vehicles)
 * - Transit management tables (transit_orders, transit_items, status_history)
 * - Performance indexes for fast queries
 * - Sample data with proper franchise isolation
 * 
 * Run: npx tsx server/local-db-setup.ts
 * 
 * @version 3.0.0 - Enterprise BI Integration
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import path from "path";
import { DATABASE_PATH, ensureDatabaseDirectory, getDatabaseInfo } from "./db-path";

// ============================================================================
// DATABASE PATH CONFIGURATION - USES UNIFIED db-path.ts
// ============================================================================

const DB_PATH = DATABASE_PATH;

// Ensure directory exists
ensureDatabaseDirectory();

// Log database info
const dbInfo = getDatabaseInfo();

);


+ "\n");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL"); // Better concurrent performance
db.pragma("synchronous = NORMAL"); // Faster writes with reasonable safety

// ============================================================================
// PART 1: DROP EXISTING TABLES (Clean Slate)
// ============================================================================
const tablesToDrop = [
  "daily_summaries",
  "credit_transactions",
  "vehicles",
  "transit_status_history",
  "transit_order_items",
  "transit_orders",
  "employee_performance",
  "employee_tasks",
  "employee_attendance",
  "barcodes",
  "shipments",
  "order_transactions",
  "posTransactions",
  "documents",
  "gst_config",
  "audit_logs",
  "deliveries",
  "orders",
  "order_sequences",
  "services",
  "customers",
  "products",
  "drivers",
  "employees",
  "users",
  "settings",
  "franchises"
];

for (const table of tablesToDrop) {
  try {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  } catch {
    // Ignore errors
  }
}
// ============================================================================
// PART 2: CREATE ALL TABLES
// ============================================================================
// --- FRANCHISES TABLE ---
db.exec(`
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
    logoUrl TEXT,
    primaryColor TEXT DEFAULT '#4CAF50',
    secondaryColor TEXT DEFAULT '#2196F3',
    managerName TEXT,
    managerPhone TEXT,
    managerEmail TEXT,
    status TEXT DEFAULT 'active',
    autoGenerateOrderNumber INTEGER DEFAULT 1,
    orderNumberPrefix TEXT,
    enableDelivery INTEGER DEFAULT 1,
    defaultDeliveryCharge TEXT DEFAULT '0',
    enableExpressService INTEGER DEFAULT 1,
    expressServiceMultiplier TEXT DEFAULT '1.50',
    documents TEXT,
    agreementStartDate TEXT,
    agreementEndDate TEXT,
    royaltyPercentage TEXT DEFAULT '0',
    tradeLicenseNumber TEXT,
    msmeRegistration TEXT,
    onboardingStatus TEXT DEFAULT 'verified',
    onboardingChecklist TEXT,
    serviceRadiusKm TEXT DEFAULT '5.00',
    latitude TEXT,
    longitude TEXT,
    securityDeposit TEXT DEFAULT '0',
    billingCycle TEXT DEFAULT 'monthly',
    pinCode TEXT,
    googleMapsPlaceId TEXT,
    socialHandles TEXT,
    adminAlertEmail TEXT,
    customerSupportEmail TEXT,
    defaultCreditLimit TEXT DEFAULT '5000',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
// --- USERS TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    franchiseId TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  )
`);
// --- EMPLOYEES TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    employeeId TEXT UNIQUE,
    username TEXT,
    password TEXT,
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
    role TEXT DEFAULT 'staff',
    managerId TEXT,
    address TEXT,
    emergencyContact TEXT,
    skills TEXT,
    performanceRating TEXT DEFAULT '0.00',
    lastReviewDate TEXT,
    profileImage TEXT,
    orderLetter TEXT,
    settings TEXT,
    factoryId TEXT,
    franchiseCode TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  )
`);
// --- CUSTOMERS TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    totalOrders INTEGER DEFAULT 0,
    totalSpent TEXT DEFAULT '0',
    creditBalance TEXT DEFAULT '0',
    loyaltyTier TEXT DEFAULT 'bronze',
    loyaltyPoints INTEGER DEFAULT 0,
    marketingOptIn INTEGER DEFAULT 1,
    customerPreferences TEXT DEFAULT '{"starch":"none","packaging":"fold","fragrance":"standard"}',
    walletBalance TEXT DEFAULT '0',
    creditLimit TEXT DEFAULT '5000',
    totalLifetimeSpent TEXT DEFAULT '0',
    tier TEXT DEFAULT 'Bronze',
    preferences TEXT,
    status TEXT DEFAULT 'active',
    lastOrderAt TEXT,
    lastOrder TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  )
`);
// --- SERVICES TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    pricingModel TEXT DEFAULT 'per_piece',
    hsnSacCode TEXT,
    duration TEXT,
    leadTimeHours INTEGER DEFAULT 24,
    requiredInventory TEXT,
    technicianNotes TEXT,
    thumbnailUrl TEXT,
    parentServiceId TEXT,
    isAddOn INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  )
`);
// --- PRODUCTS TABLE (Inventory) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    stockQuantity INTEGER DEFAULT 0,
    reorderLevel INTEGER DEFAULT 10,
    supplier TEXT,
    batchNumber TEXT,
    expiryDate TEXT,
    costPerUnit TEXT,
    unitType TEXT DEFAULT 'piece',
    conversionFactor TEXT DEFAULT '1',
    lastStockUpdate TEXT,
    lastStockUpdateBy TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  )
`);
// --- ORDERS TABLE (Core) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    orderNumber TEXT NOT NULL,
    customerId TEXT,
    employeeId TEXT,
    createdBy TEXT,
    customerName TEXT NOT NULL,
    customerEmail TEXT,
    customerPhone TEXT,
    status TEXT NOT NULL,
    paymentStatus TEXT DEFAULT 'pending',
    totalAmount TEXT NOT NULL,
    items TEXT NOT NULL,
    shippingAddress TEXT,
    pickupDate TEXT,
    advancePaid TEXT DEFAULT '0',
    amountPaid TEXT DEFAULT '0',
    paymentMethod TEXT DEFAULT 'cash',
    lastPaymentMethod TEXT,
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
    isExpress INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'normal',
    garmentCount INTEGER DEFAULT 0,
    rackLocation TEXT,
    handoverOtp TEXT,
    itemVerificationStatus TEXT DEFAULT 'unverified',
    orderNotes TEXT,
    customerInstructions TEXT,
    photoUrls TEXT,
    lastWhatsappStatus TEXT,
    lastWhatsappSentAt TEXT,
    whatsappMessageCount INTEGER DEFAULT 0,
    completedAt TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (customerId) REFERENCES customers(id),
    FOREIGN KEY (employeeId) REFERENCES employees(id),
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  )
`);
// --- ORDER SEQUENCES TABLE (Auto-increment order numbers) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS order_sequences (
    id TEXT PRIMARY KEY,
    branchCode TEXT NOT NULL,
    year INTEGER NOT NULL,
    currentSequence INTEGER DEFAULT 0,
    letterSuffix TEXT DEFAULT 'A',
    createdAt TEXT,
    updatedAt TEXT,
    UNIQUE(branchCode, year)
  )
`);
// --- VEHICLES TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    licensePlate TEXT UNIQUE NOT NULL,
    makeModel TEXT NOT NULL,
    type TEXT DEFAULT 'van',
    capacityKg TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    gpsDeviceId TEXT,
    insuranceExpiry TEXT,
    fitnessExpiry TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  )
`);
// --- DELIVERIES TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    orderId TEXT,
    driverId TEXT,
    driverName TEXT NOT NULL,
    vehicleId TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    scheduledDate TEXT,
    statusUpdatedAt TEXT,
    estimatedDelivery TEXT,
    actualDelivery TEXT,
    location TEXT,
    route TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  )
`);
// --- DRIVERS TABLE ---
db.exec(`
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
  )
`);
// --- TRANSIT ORDERS TABLE ---
db.exec(`
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
    orders TEXT,
    storeDetails TEXT,
    factoryDetails TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    completedAt TEXT,
    dispatchedAt TEXT,
    receivedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id),
    FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
    FOREIGN KEY (driverId) REFERENCES employees(id)
  )
`);
// --- TRANSIT ORDER ITEMS TABLE ---
db.exec(`
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
  )
`);
// --- TRANSIT STATUS HISTORY TABLE ---
db.exec(`
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
  )
`);
// --- CREDIT TRANSACTIONS TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    customerId TEXT NOT NULL,
    orderId TEXT,
    type TEXT NOT NULL,
    amount TEXT NOT NULL,
    balanceAfter TEXT NOT NULL,
    paymentMethod TEXT,
    referenceNumber TEXT,
    notes TEXT,
    reason TEXT,
    recordedBy TEXT,
    recordedByName TEXT,
    transactionDate TEXT,
    createdAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id),
    FOREIGN KEY (customerId) REFERENCES customers(id),
    FOREIGN KEY (orderId) REFERENCES orders(id)
  )
`);
// --- AUDIT LOGS TABLE ---
db.exec(`
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
  )
`);
// --- DOCUMENTS TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    type TEXT DEFAULT 'invoice',
    category TEXT,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT,
    fileUrl TEXT,
    fileData TEXT,
    status TEXT DEFAULT 'draft',
    versionNumber INTEGER DEFAULT 1,
    expiryDate TEXT,
    isVerified INTEGER DEFAULT 0,
    verifiedAt TEXT,
    verifiedBy TEXT,
    verificationStatus TEXT DEFAULT 'unverified',
    rejectionReason TEXT,
    amount TEXT,
    customerName TEXT,
    orderNumber TEXT,
    orderId TEXT,
    metadata TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id),
    FOREIGN KEY (orderId) REFERENCES orders(id)
  )
`);
// --- GST CONFIG TABLE ---
db.exec(`
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
  )
`);
// --- SETTINGS TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    updatedAt TEXT,
    updatedBy TEXT
  )
`);
// --- ORDER TRANSACTIONS TABLE ---
db.exec(`
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
  )
`);
// --- SHIPMENTS TABLE ---
db.exec(`
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
  )
`);
// --- BARCODES TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS barcodes (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    data TEXT,
    imagePath TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (franchiseId) REFERENCES franchises(id)
  )
`);
// --- EMPLOYEE ATTENDANCE TABLE ---
db.exec(`
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
  )
`);
// --- EMPLOYEE TASKS TABLE ---
db.exec(`
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
  )
`);
// --- EMPLOYEE PERFORMANCE TABLE ---
db.exec(`
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
  )
`);
// ============================================================================
// PART 3: DAILY SUMMARIES TABLE (Enterprise BI Data Warehouse)
// ============================================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_summaries (
    id TEXT PRIMARY KEY,
    franchiseId TEXT,
    date TEXT NOT NULL,

    -- REVENUE METRICS
    totalRevenue REAL DEFAULT 0,
    orderCount INTEGER DEFAULT 0,
    avgOrderValue REAL DEFAULT 0,
    revenueGrowthDaily REAL,
    revenueGrowthWeekly REAL,
    revenueGrowthMom REAL,
    revenueGrowthYoy REAL,

    -- PREDICTIVE METRICS
    projectedMonthEndRevenue REAL,
    revenueVelocity REAL,
    revenueVelocityTrend TEXT,
    atRiskRevenue REAL DEFAULT 0,
    regressionSlope REAL,
    regressionIntercept REAL,
    regressionR2 REAL,
    forecastNext7Days TEXT,

    -- CUSTOMER METRICS
    customerCount INTEGER DEFAULT 0,
    newCustomerCount INTEGER DEFAULT 0,
    returningCustomerCount INTEGER DEFAULT 0,
    avgCustomerClv REAL,
    totalPlatinumCustomers INTEGER DEFAULT 0,
    totalGoldCustomers INTEGER DEFAULT 0,
    totalSilverCustomers INTEGER DEFAULT 0,
    totalBronzeCustomers INTEGER DEFAULT 0,
    customerChurnRate REAL,
    avgRetentionRate REAL,
    cohortData TEXT,

    -- SERVICE METRICS (Contribution Analysis)
    topServiceId TEXT,
    topServiceName TEXT,
    topServiceRevenue REAL,
    serviceMixVariance REAL,
    heroServicesCount INTEGER DEFAULT 0,
    lossLeaderServicesCount INTEGER DEFAULT 0,
    serviceMix TEXT,
    serviceCorrelationTop5 TEXT,

    -- OPERATIONAL METRICS (Little's Law: L = λ × W)
    avgTurnaroundHours REAL,
    turnaroundStdDev REAL,
    turnaroundConsistencyScore INTEGER,
    percentWithinTarget REAL,
    ordersArrivalRate REAL,
    avgWaitTime REAL,
    itemsInProcess REAL,
    bottleneckType TEXT,
    bottleneckRecommendation TEXT,
    readyOnTimeCount INTEGER DEFAULT 0,
    delayedOrderCount INTEGER DEFAULT 0,
    pendingOrdersCount INTEGER DEFAULT 0,
    completedOrdersCount INTEGER DEFAULT 0,

    -- STAFF PRODUCTIVITY (Weighted Z-Scores)
    avgStaffZScore REAL,
    topPerformerEmployeeId TEXT,
    topPerformerName TEXT,
    topPerformerZScore REAL,
    totalStaffProductivity REAL,
    staffPerformance TEXT,

    -- TAX METRICS (GST Breakout Model)
    totalTaxCollected REAL DEFAULT 0,
    cgstAmount REAL DEFAULT 0,
    sgstAmount REAL DEFAULT 0,
    igstAmount REAL DEFAULT 0,
    taxableAmount REAL DEFAULT 0,
    taxByHsnCode TEXT,

    -- FINANCIAL METRICS
    totalCost REAL DEFAULT 0,
    contributionMargin REAL,
    grossProfit REAL,
    paymentMethodMix TEXT,
    creditSalesAmount REAL DEFAULT 0,
    creditCollectedAmount REAL DEFAULT 0,

    -- ANOMALY DETECTION (Fraud Audit)
    anomalyCount INTEGER DEFAULT 0,
    anomalyDetails TEXT,
    suspiciousOrderIds TEXT,

    -- STATISTICAL AGGREGATES
    orderValueMean REAL,
    orderValueMedian REAL,
    orderValueMode REAL,
    orderValueStdDev REAL,
    orderValueVariance REAL,
    orderValueP25 REAL,
    orderValueP75 REAL,
    orderValueP85 REAL,
    orderValueP95 REAL,

    -- PEAK DEMAND HEATMAP
    peakDemandHour INTEGER,
    peakDemandDayOfWeek INTEGER,
    peakDemandScore REAL,
    demandHeatmapTop10 TEXT,

    -- MOVING AVERAGES (Seasonality)
    sma7DayRevenue REAL,
    sma14DayRevenue REAL,
    sma30DayRevenue REAL,
    ema7DayRevenue REAL,

    -- METADATA
    calculationDurationMs INTEGER,
    dataQualityScore INTEGER,
    lastRecalculatedAt TEXT,
    version INTEGER DEFAULT 1,
    createdAt TEXT,
    updatedAt TEXT,

    FOREIGN KEY (franchiseId) REFERENCES franchises(id),
    UNIQUE(franchiseId, date)
  )
`);
");

// ============================================================================
// PART 4: CREATE PERFORMANCE INDEXES
// ============================================================================
const indexes = [
  // Core table indexes
  ["idx_orders_franchise", "orders", "franchiseId"],
  ["idx_orders_customer", "orders", "customerId"],
  ["idx_orders_status", "orders", "status"],
  ["idx_orders_date", "orders", "createdAt"],
  ["idx_orders_number", "orders", "orderNumber"],
  ["idx_orders_payment_status", "orders", "paymentStatus"],

  ["idx_customers_franchise", "customers", "franchiseId"],
  ["idx_customers_phone", "customers", "phone"],
  ["idx_customers_email", "customers", "email"],

  ["idx_employees_franchise", "employees", "franchiseId"],
  ["idx_employees_email", "employees", "email"],
  ["idx_employees_employeeId", "employees", "employeeId"],
  ["idx_employees_role", "employees", "role"],
  ["idx_employees_factory", "employees", "factoryId"],

  ["idx_services_franchise", "services", "franchiseId"],
  ["idx_services_category", "services", "category"],

  ["idx_products_franchise", "products", "franchiseId"],
  ["idx_products_sku", "products", "sku"],

  ["idx_drivers_franchise", "drivers", "franchiseId"],
  ["idx_drivers_status", "drivers", "status"],

  ["idx_audit_logs_franchise", "audit_logs", "franchiseId"],
  ["idx_audit_logs_action", "audit_logs", "action"],
  ["idx_audit_logs_date", "audit_logs", "createdAt"],

  ["idx_documents_franchise", "documents", "franchiseId"],
  ["idx_documents_type", "documents", "type"],

  ["idx_transit_orders_status", "transit_orders", "status"],
  ["idx_transit_orders_franchise", "transit_orders", "franchiseId"],
  ["idx_transit_orders_date", "transit_orders", "createdAt"],

  ["idx_credit_trans_customer", "credit_transactions", "customerId"],
  ["idx_credit_trans_franchise", "credit_transactions", "franchiseId"],
  ["idx_credit_trans_date", "credit_transactions", "transactionDate"],

  // BI indexes for fast analytics
  ["idx_daily_summaries_franchise_date", "daily_summaries", "franchiseId, date"],
  ["idx_daily_summaries_date", "daily_summaries", "date"],
  ["idx_daily_summaries_revenue", "daily_summaries", "totalRevenue"],

  ["idx_settings_key", "settings", "key"],
  ["idx_order_seq_lookup", "order_sequences", "branchCode, year"]
];

for (const [name, table, columns] of indexes) {
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS ${name} ON ${table}(${columns})`);
  } catch {
    // Index might already exist with different structure
  }
}
// ============================================================================
// PART 5: SEED FRANCHISES
// ============================================================================
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
    legalEntityName: "Fab Clean Laundry Services",
    taxId: "AITPD3522F",
    gstNumber: "33AITPD3522F1ZK",
    gstEnabled: 1,
    gstRate: "18.00",
    sacCode: "9971",
    bankName: "State Bank of India",
    bankAccountNumber: "39876543210",
    bankIfsc: "SBIN0001234",
    bankAccountName: "Fab Clean Laundry Services",
    bankBranch: "Pollachi Branch",
    upiId: "9886788858@pz",
    upiDisplayName: "Fab Clean Pollachi",
    openingTime: "09:00",
    closingTime: "21:00",
    workingDays: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
    primaryColor: "#4CAF50",
    secondaryColor: "#2196F3",
    managerName: "Senthil Kumar",
    managerPhone: "9876543210",
    managerEmail: "manager.pollachi@fabzclean.com",
    status: "active",
    autoGenerateOrderNumber: 1,
    enableDelivery: 1,
    defaultDeliveryCharge: "50.00",
    enableExpressService: 1,
    expressServiceMultiplier: "1.50",
    onboardingStatus: "verified"
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
    legalEntityName: "Fab Clean Laundry Services",
    taxId: "AITPD3522F",
    gstNumber: "33AITPD3522F1ZK",
    gstEnabled: 1,
    gstRate: "18.00",
    sacCode: "9971",
    bankName: "State Bank of India",
    bankAccountNumber: "39876543210",
    bankIfsc: "SBIN0001234",
    bankAccountName: "Fab Clean Laundry Services",
    bankBranch: "Kinathukadavu Branch",
    upiId: "9886788858@pz",
    upiDisplayName: "Fab Clean Kinathukadavu",
    openingTime: "09:00",
    closingTime: "21:00",
    workingDays: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
    primaryColor: "#4CAF50",
    secondaryColor: "#2196F3",
    managerName: "Rajesh Kannan",
    managerPhone: "9876543220",
    managerEmail: "manager.kin@fabzclean.com",
    status: "active",
    autoGenerateOrderNumber: 1,
    enableDelivery: 1,
    defaultDeliveryCharge: "50.00",
    enableExpressService: 1,
    expressServiceMultiplier: "1.50",
    onboardingStatus: "verified"
  }
];

const insertFranchise = db.prepare(`
  INSERT INTO franchises (
    id, name, franchiseId, branchCode, ownerName, email, phone, whatsappNumber, address,
    legalEntityName, taxId, gstNumber, gstEnabled, gstRate, sacCode,
    bankName, bankAccountNumber, bankIfsc, bankAccountName, bankBranch,
    upiId, upiDisplayName, openingTime, closingTime, workingDays,
    primaryColor, secondaryColor, managerName, managerPhone, managerEmail,
    status, autoGenerateOrderNumber, enableDelivery, defaultDeliveryCharge,
    enableExpressService, expressServiceMultiplier, onboardingStatus, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const f of franchises) {
  insertFranchise.run(
    f.id, f.name, f.franchiseId, f.branchCode, f.ownerName, f.email, f.phone, f.whatsappNumber, f.address,
    f.legalEntityName, f.taxId, f.gstNumber, f.gstEnabled, f.gstRate, f.sacCode,
    f.bankName, f.bankAccountNumber, f.bankIfsc, f.bankAccountName, f.bankBranch,
    f.upiId, f.upiDisplayName, f.openingTime, f.closingTime, f.workingDays,
    f.primaryColor, f.secondaryColor, f.managerName, f.managerPhone, f.managerEmail,
    f.status, f.autoGenerateOrderNumber, f.enableDelivery, f.defaultDeliveryCharge,
    f.enableExpressService, f.expressServiceMultiplier, f.onboardingStatus, now, now
  );
`);
}

// ============================================================================
// PART 6: SEED EMPLOYEES WITH ROLES
// ============================================================================
const adminPasswordHash = bcrypt.hashSync("Durai@2025", 10);
const defaultPasswordHash = bcrypt.hashSync("password123", 10);

const employees = [
  {
    id: "admin-user-id",
    franchiseId: null,
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
  INSERT INTO employees 
  (id, franchiseId, employeeId, firstName, lastName, email, phone, position, department, salary, role, password, status, hireDate, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const e of employees) {
  insertEmployee.run(
    e.id, e.franchiseId, e.employeeId, e.firstName, e.lastName,
    e.email, e.phone, e.position, e.department, e.salary,
    e.role, e.password, e.status, now, now, now
  );
- Login: ${e.employeeId}`);
}

// ============================================================================
// PART 7: SEED SERVICES
// ============================================================================
const servicesList = [
  // Ironing Services
  { name: "Shirt", category: "Ironing", price: "20.00", duration: "24 hours", leadTime: 24 },
  { name: "T-Shirt", category: "Ironing", price: "20.00", duration: "24 hours", leadTime: 24 },
  { name: "Pant", category: "Ironing", price: "20.00", duration: "24 hours", leadTime: 24 },
  { name: "Jeans", category: "Ironing", price: "20.00", duration: "24 hours", leadTime: 24 },
  { name: "Shorts", category: "Ironing", price: "15.00", duration: "24 hours", leadTime: 24 },
  { name: "Dhoti", category: "Ironing", price: "40.00", duration: "24 hours", leadTime: 24 },
  { name: "Saree (Cotton)", category: "Ironing", price: "50.00", duration: "24 hours", leadTime: 24 },
  { name: "Saree (Silk)", category: "Ironing", price: "80.00", duration: "24 hours", leadTime: 24 },
  { name: "Coat", category: "Ironing", price: "60.00", duration: "24 hours", leadTime: 24 },
  // Laundry Services
  { name: "Shirt", category: "Laundry", price: "30.00", duration: "48 hours", leadTime: 48 },
  { name: "T-Shirt", category: "Laundry", price: "30.00", duration: "48 hours", leadTime: 48 },
  { name: "Pant", category: "Laundry", price: "30.00", duration: "48 hours", leadTime: 48 },
  { name: "Jeans", category: "Laundry", price: "40.00", duration: "48 hours", leadTime: 48 },
  { name: "Shorts", category: "Laundry", price: "25.00", duration: "48 hours", leadTime: 48 },
  { name: "Towel", category: "Laundry", price: "30.00", duration: "48 hours", leadTime: 48 },
  { name: "Bed Sheet (Single)", category: "Laundry", price: "80.00", duration: "48 hours", leadTime: 48 },
  { name: "Bed Sheet (Double)", category: "Laundry", price: "100.00", duration: "48 hours", leadTime: 48 },
  { name: "Blanket (Single)", category: "Laundry", price: "150.00", duration: "48 hours", leadTime: 48 },
  { name: "Blanket (Double)", category: "Laundry", price: "200.00", duration: "48 hours", leadTime: 48 },
  // Dry Cleaning Services
  { name: "Shirt", category: "Dry Cleaning", price: "60.00", duration: "72 hours", leadTime: 72 },
  { name: "Pant", category: "Dry Cleaning", price: "70.00", duration: "72 hours", leadTime: 72 },
  { name: "Jeans", category: "Dry Cleaning", price: "80.00", duration: "72 hours", leadTime: 72 },
  { name: "Coat", category: "Dry Cleaning", price: "200.00", duration: "72 hours", leadTime: 72 },
  { name: "Suit (2pc)", category: "Dry Cleaning", price: "350.00", duration: "72 hours", leadTime: 72 },
  { name: "Suit (3pc)", category: "Dry Cleaning", price: "450.00", duration: "72 hours", leadTime: 72 },
  { name: "Saree (Cotton)", category: "Dry Cleaning", price: "250.00", duration: "72 hours", leadTime: 72 },
  { name: "Saree (Silk)", category: "Dry Cleaning", price: "350.00", duration: "72 hours", leadTime: 72 },
  { name: "Wedding Dress", category: "Dry Cleaning", price: "800.00", duration: "96 hours", leadTime: 96 },
  { name: "Carpet (Small)", category: "Dry Cleaning", price: "150.00", duration: "72 hours", leadTime: 72 },
  { name: "Carpet (Medium)", category: "Dry Cleaning", price: "250.00", duration: "72 hours", leadTime: 72 },
  { name: "Carpet (Large)", category: "Dry Cleaning", price: "350.00", duration: "72 hours", leadTime: 72 },
];

const insertService = db.prepare(`
  INSERT INTO services (id, franchiseId, name, category, description, price, duration, leadTimeHours, hsnSacCode, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let serviceCount = 0;
for (const franchise of franchises) {
  for (const svc of servicesList) {
    insertService.run(
      randomUUID(),
      franchise.id,
      svc.name,
      svc.category,
      `${svc.category} service for ${svc.name}`,
      svc.price,
      svc.duration,
      svc.leadTime,
      "9971",  // SAC code for laundry services
      "Active",
      now,
      now
    );
    serviceCount++;
  }
}
// ============================================================================
// PART 8: SEED CUSTOMERS
// ============================================================================
const customers = [
  {
    id: `cust-walkin-pol-${randomUUID().slice(0, 8)}`,
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
    franchiseId: "franchise-pollachi",
    name: "Lakshmi Narayanan",
    email: "lakshmi.n@gmail.com",
    phone: "9876012346",
    address: JSON.stringify({ street: "45, Temple Street", city: "Pollachi", state: "Tamil Nadu" })
  },
  {
    id: `cust-walkin-kin-${randomUUID().slice(0, 8)}`,
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
  },
  {
    id: randomUUID(),
    franchiseId: "franchise-kinathukadavu",
    name: "Muthu Raja",
    email: "muthu.raja@gmail.com",
    phone: "9876054322",
    address: JSON.stringify({ street: "78, Gandhi Road", city: "Kinathukadavu", state: "Tamil Nadu" })
  }
];

const insertCustomer = db.prepare(`
  INSERT INTO customers (id, franchiseId, name, email, phone, address, totalOrders, totalSpent, loyaltyTier, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, 0, '0', 'bronze', 'active', ?, ?)
`);

for (const c of customers) {
  insertCustomer.run(c.id, c.franchiseId, c.name, c.email, c.phone, c.address, now, now);
}
// ============================================================================
// PART 9: SEED VEHICLES & DRIVERS
// ============================================================================
const vehiclesData = [
  {
    id: randomUUID(),
    franchiseId: "franchise-pollachi",
    licensePlate: "TN-39-AB-1234",
    makeModel: "TVS XL100",
    type: "bike",
    capacityKg: "20"
  },
  {
    id: randomUUID(),
    franchiseId: "franchise-kinathukadavu",
    licensePlate: "TN-39-CD-5678",
    makeModel: "Hero Splendor",
    type: "bike",
    capacityKg: "25"
  }
];

const insertVehicle = db.prepare(`
  INSERT INTO vehicles (id, franchiseId, licensePlate, makeModel, type, capacityKg, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
`);

for (const v of vehiclesData) {
  insertVehicle.run(v.id, v.franchiseId, v.licensePlate, v.makeModel, v.type, v.capacityKg, now, now);
`);
}

const driversData = [
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
  INSERT INTO drivers (id, franchiseId, name, phone, email, licenseNumber, vehicleNumber, vehicleType, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const d of driversData) {
  insertDriver.run(d.id, d.franchiseId, d.name, d.phone, d.email, d.licenseNumber, d.vehicleNumber, d.vehicleType, d.status, now, now);
}

// ============================================================================
// PART 10: SEED SETTINGS
// ============================================================================
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
  { key: "bi_calculation_hour", value: "0", category: "bi" },  // Midnight
  { key: "anomaly_threshold", value: "3", category: "bi" },  // 3 std devs
];

const insertSetting = db.prepare(`
  INSERT INTO settings (id, key, value, category, updatedAt)
  VALUES (?, ?, ?, ?, ?)
`);

for (const s of settings) {
  insertSetting.run(randomUUID(), s.key, s.value, s.category, now);
}
// ============================================================================
// PART 11: SEED ORDER SEQUENCES
// ============================================================================
const currentYear = new Date().getFullYear();

const insertSequence = db.prepare(`
  INSERT INTO order_sequences (id, branchCode, year, currentSequence, letterSuffix, createdAt, updatedAt)
  VALUES (?, ?, ?, 0, 'A', ?, ?)
`);

for (const f of franchises) {
  insertSequence.run(randomUUID(), f.branchCode, currentYear, now, now);
}

// ============================================================================
// DONE!
// ============================================================================
);

);


│");


│");


│");


db.close();
