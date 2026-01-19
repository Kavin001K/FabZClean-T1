import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import {
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Delivery,
  type InsertDelivery,
  type OrderTransaction,
  type InsertOrderTransaction,
  type Customer,
  type InsertCustomer,
  type Service,
  type InsertService,
  type Shipment,
  type InsertShipment,
  type Barcode,
  type InsertBarcode,
  type Employee,
  type InsertEmployee,
  type AuditLog,
  type InsertAuditLog,
} from "../shared/schema";

// Driver types (not in shared schema yet)
export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: 'bike' | 'car' | 'truck' | 'van';
  vehicleModel?: string;
  status: 'available' | 'busy' | 'offline' | 'on_break';
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastActive?: string;
  experience: number;
  specialties?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InsertDriver {
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: 'bike' | 'car' | 'truck' | 'van';
  vehicleModel?: string;
  status?: 'available' | 'busy' | 'offline' | 'on_break';
  rating?: number;
  totalDeliveries?: number;
  totalEarnings?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastActive?: string;
  experience?: number;
  specialties?: string[];
}
import { IStorage } from "./storage";

export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor(dbPath = "./fabzclean.db") {
    // Ensure the directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      console.log(`📁 Creating database directory: ${dir}`);
      mkdirSync(dir, { recursive: true });
    }

    console.log(`🗄️  Initializing SQLite database at: ${dbPath}`);
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
    this.createTables();
    this.migrateTables();
  }

  private createTables() {
    // Self-healing: Check if 'orders' table exists but is missing 'customerId' (corrupt from previous bad schema)
    try {
      const checkOrders = this.db.prepare("PRAGMA table_info(orders)").all() as any[];
      if (checkOrders.length > 0) {
        const hasCustomerId = checkOrders.some((col: any) => col.name === 'customerId');
        // Also check if it has customer-like fields incorrectly (like 'creditBalance')
        const hasCreditBalance = checkOrders.some((col: any) => col.name === 'creditBalance');

        if (!hasCustomerId && hasCreditBalance) {
          console.warn("⚠️  Corrupt 'orders' table detected (bad schema). Dropping table to allow recreation...");
          this.db.exec("DROP TABLE IF EXISTS orders");
        }
      }
    } catch (err) {
      console.warn("⚠️  Error checking table schema:", err);
    }

    this.db.exec(`
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
        
        -- Legal & Tax
        legalEntityName TEXT,
        taxId TEXT,
        gstNumber TEXT,
        gstEnabled INTEGER DEFAULT 1,
        gstRate TEXT DEFAULT '18.00',
        sacCode TEXT DEFAULT '9971',
        
        -- Banking
        bankName TEXT,
        bankAccountNumber TEXT,
        bankIfsc TEXT,
        bankAccountName TEXT,
        bankBranch TEXT,
        
        -- UPI
        upiId TEXT,
        upiDisplayName TEXT,
        
        -- Operating Hours
        openingTime TEXT DEFAULT '09:00',
        closingTime TEXT DEFAULT '21:00',
        workingDays TEXT,
        
        -- Branding
        logoUrl TEXT,
        primaryColor TEXT DEFAULT '#4CAF50',
        secondaryColor TEXT DEFAULT '#2196F3',
        
        -- Manager
        managerName TEXT,
        managerPhone TEXT,
        managerEmail TEXT,
        
        -- Status & Agreement
        status TEXT DEFAULT 'active',
        documents TEXT,
        agreementStartDate TEXT,
        agreementEndDate TEXT,
        royaltyPercentage TEXT DEFAULT '0',
        
        -- Operational Settings
        autoGenerateOrderNumber INTEGER DEFAULT 1,
        orderNumberPrefix TEXT,
        enableDelivery INTEGER DEFAULT 1,
        defaultDeliveryCharge TEXT DEFAULT '0',
        enableExpressService INTEGER DEFAULT 1,
        expressServiceMultiplier TEXT DEFAULT '1.50',
        
        -- Timestamps
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        employeeId TEXT,
        action TEXT NOT NULL,
        entityType TEXT,
        entityId TEXT,
        details TEXT,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (franchiseId) REFERENCES franchises(id),
        FOREIGN KEY (employeeId) REFERENCES employees(id)
      );

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

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        name TEXT,
        sku TEXT,
        category TEXT,
        description TEXT,
        price TEXT,
        stockQuantity INTEGER,
        reorderLevel INTEGER,
        supplier TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        totalOrders INTEGER,
        totalSpent TEXT,
        creditBalance TEXT DEFAULT '0',
        lastOrder TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

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
        transactionDate TEXT DEFAULT CURRENT_TIMESTAMP,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        customerId TEXT,
        status TEXT DEFAULT 'pending',
        totalAmount TEXT,
        items TEXT,
        orderNumber TEXT,
        customerName TEXT,
        customerEmail TEXT,
        customerPhone TEXT,
        paymentStatus TEXT DEFAULT 'pending',
        shippingAddress TEXT,
        pickupDate TEXT,
        baseAmount TEXT,
        cgst TEXT,
        sgst TEXT,
        igst TEXT,
        totalGst TEXT,
        gstNumber TEXT,
        isInterState INTEGER DEFAULT 0,
        invoiceNumber TEXT,
        invoiceDate TEXT,
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
        specialInstructions TEXT,
        
        -- Fulfillment and delivery fields
        fulfillmentType TEXT DEFAULT 'pickup',
        deliveryCharges TEXT DEFAULT '0',
        deliveryAddress TEXT,
        
        -- Service fields
        service TEXT,
        serviceId TEXT,
        
        -- Express and priority
        isExpressOrder INTEGER DEFAULT 0,
        expressService INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'normal',
        expectedDeliveryDate TEXT,
        notes TEXT,
        
        -- WhatsApp notification tracking
        lastWhatsappStatus TEXT,
        lastWhatsappSentAt TEXT,
        whatsappMessageCount INTEGER DEFAULT 0,
        
        createdBy TEXT,
        employeeId TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );


      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        orderId TEXT,
        driverName TEXT,
        driverId TEXT,
        vehicleId TEXT,
        status TEXT,
        estimatedDelivery TEXT,
        actualDelivery TEXT,
        deliveredAt TEXT,
        location TEXT,
        route TEXT,
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (orderId) REFERENCES orders(id)
      );

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

      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        name TEXT,
        description TEXT,
        price TEXT,
        category TEXT,
        duration TEXT,
        status TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        orderIds TEXT,
        trackingNumber TEXT,
        carrier TEXT,
        status TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE TABLE IF NOT EXISTS barcodes (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        code TEXT UNIQUE,
        productId TEXT,
        type TEXT,
        entityType TEXT,
        entityId TEXT,
        data TEXT,
        imagePath TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (productId) REFERENCES products(id),
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        factoryId TEXT,
        name TEXT,
        role TEXT,
        email TEXT,
        password TEXT,
        employeeId TEXT,
        firstName TEXT,
        lastName TEXT,
        phone TEXT,
        position TEXT,
        department TEXT,
        hireDate TEXT,
        salary TEXT,
        salaryType TEXT DEFAULT 'monthly',
        hourlyRate TEXT,
        workingHours TEXT DEFAULT '8',
        status TEXT,
        managerId TEXT,
        address TEXT,
        emergencyContact TEXT,
        skills TEXT,
        qualifications TEXT,
        notes TEXT,
        dateOfBirth TEXT,
        gender TEXT,
        bloodGroup TEXT,
        bankAccountNumber TEXT,
        bankIfsc TEXT,
        bankName TEXT,
        panNumber TEXT,
        aadharNumber TEXT,
        performanceRating TEXT,
        lastReviewDate TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

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
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

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

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        type TEXT DEFAULT 'invoice',
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        fileUrl TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        amount TEXT,
        customerName TEXT,
        orderNumber TEXT,
        metadata TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        category TEXT NOT NULL,
        updatedAt TEXT,
        updatedBy TEXT
      );

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
        receivedAt TEXT
      );

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

      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        licenseNumber TEXT NOT NULL,
        vehicleNumber TEXT NOT NULL,
        vehicleType TEXT NOT NULL,
        vehicleModel TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        rating REAL DEFAULT 5.0,
        totalDeliveries INTEGER DEFAULT 0,
        totalEarnings REAL DEFAULT 0,
        currentLatitude REAL,
        currentLongitude REAL,
        lastActive TEXT,
        experience INTEGER DEFAULT 0,
        specialties TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);
      CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(orderId);
      -- CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(orderId);
      CREATE INDEX IF NOT EXISTS idx_barcodes_product ON barcodes(productId);
      CREATE INDEX IF NOT EXISTS idx_barcodes_code ON barcodes(code);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
      CREATE INDEX IF NOT EXISTS idx_barcodes_entity ON barcodes(entityType, entityId);
      CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
      CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
      CREATE INDEX IF NOT EXISTS idx_transit_orders_transitId ON transit_orders(transitId);
      CREATE INDEX IF NOT EXISTS idx_transit_orders_status ON transit_orders(status);
      CREATE INDEX IF NOT EXISTS idx_transit_orders_type ON transit_orders(type);
      CREATE INDEX IF NOT EXISTS idx_transit_order_items_transitOrderId ON transit_order_items(transitOrderId);
      CREATE INDEX IF NOT EXISTS idx_transit_order_items_orderId ON transit_order_items(orderId);
      CREATE INDEX IF NOT EXISTS idx_transit_status_history_transitOrderId ON transit_status_history(transitOrderId);
      CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
      CREATE INDEX IF NOT EXISTS idx_drivers_vehicleNumber ON drivers(vehicleNumber);
      CREATE INDEX IF NOT EXISTS idx_drivers_licenseNumber ON drivers(licenseNumber);
      
      -- Indexes for franchise isolation
      CREATE INDEX IF NOT EXISTS idx_orders_franchise ON orders(franchiseId);
      CREATE INDEX IF NOT EXISTS idx_products_franchise ON products(franchiseId);
      CREATE INDEX IF NOT EXISTS idx_customers_franchise ON customers(franchiseId);
      CREATE INDEX IF NOT EXISTS idx_employees_franchise ON employees(franchiseId);
      CREATE INDEX IF NOT EXISTS idx_employee_attendance_franchise ON employee_attendance(franchiseId);
      CREATE INDEX IF NOT EXISTS idx_employee_tasks_franchise ON employee_tasks(franchiseId);

      -- Authentication tables
      CREATE TABLE IF NOT EXISTS auth_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        name TEXT,
        is_active INTEGER DEFAULT 1,
        last_login TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        refresh_token TEXT UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_token ON auth_sessions(refresh_token);

      -- ======= PAYMENT TRANSACTIONS =======
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        orderId TEXT,
        orderNumber TEXT,
        customerId TEXT,
        paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'card', 'upi', 'netbanking', 'wallet', 'credit', 'other')) NOT NULL,
        amount TEXT NOT NULL,
        currency TEXT DEFAULT 'INR',
        status TEXT CHECK(status IN ('initiated', 'pending', 'completed', 'failed', 'refunded', 'partial_refund')) DEFAULT 'pending',
        paymentGateway TEXT,
        gatewayTransactionId TEXT,
        gatewayOrderId TEXT,
        gatewayResponse TEXT,
        refundAmount TEXT,
        refundReason TEXT,
        employeeId TEXT,
        notes TEXT,
        metadata TEXT,
        completedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(orderId);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer ON payment_transactions(customerId);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_franchise ON payment_transactions(franchiseId);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway ON payment_transactions(gatewayTransactionId);

      -- ======= FILE STORAGE RECORDS =======
      CREATE TABLE IF NOT EXISTS file_storage (
        id TEXT PRIMARY KEY,
        fileId TEXT UNIQUE NOT NULL,
        franchiseId TEXT,
        originalName TEXT NOT NULL,
        storedName TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        url TEXT,
        category TEXT CHECK(category IN ('invoice', 'bill', 'receipt', 'document', 'image', 'barcode', 'signature', 'report', 'other')) DEFAULT 'other',
        entityType TEXT,
        entityId TEXT,
        orderId TEXT,
        orderNumber TEXT,
        customerId TEXT,
        employeeId TEXT,
        description TEXT,
        tags TEXT,
        isArchived INTEGER DEFAULT 0,
        checksum TEXT,
        metadata TEXT,
        createdBy TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (franchiseId) REFERENCES franchises(id),
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (customerId) REFERENCES customers(id)
      );

      CREATE INDEX IF NOT EXISTS idx_file_storage_fileId ON file_storage(fileId);
      CREATE INDEX IF NOT EXISTS idx_file_storage_category ON file_storage(category);
      CREATE INDEX IF NOT EXISTS idx_file_storage_entity ON file_storage(entityType, entityId);
      CREATE INDEX IF NOT EXISTS idx_file_storage_order ON file_storage(orderId);
      CREATE INDEX IF NOT EXISTS idx_file_storage_customer ON file_storage(customerId);
      CREATE INDEX IF NOT EXISTS idx_file_storage_franchise ON file_storage(franchiseId);

      -- ======= ORDER STATUS HISTORY =======
      CREATE TABLE IF NOT EXISTS order_history (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        orderNumber TEXT,
        franchiseId TEXT,
        previousStatus TEXT,
        newStatus TEXT NOT NULL,
        action TEXT NOT NULL,
        notes TEXT,
        employeeId TEXT,
        employeeName TEXT,
        metadata TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_history(orderId);
      CREATE INDEX IF NOT EXISTS idx_order_history_franchise ON order_history(franchiseId);
      CREATE INDEX IF NOT EXISTS idx_order_history_created ON order_history(createdAt);

      -- ======= COUPONS & PROMOTIONS =======
      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        discountType TEXT CHECK(discountType IN ('percentage', 'fixed', 'free_service')) NOT NULL,
        discountValue TEXT NOT NULL,
        minOrderAmount TEXT DEFAULT '0',
        maxDiscountAmount TEXT,
        validFrom TEXT,
        validUntil TEXT,
        usageLimit INTEGER,
        usedCount INTEGER DEFAULT 0,
        perCustomerLimit INTEGER DEFAULT 1,
        applicableServices TEXT,
        applicableCategories TEXT,
        isActive INTEGER DEFAULT 1,
        createdBy TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
      CREATE INDEX IF NOT EXISTS idx_coupons_franchise ON coupons(franchiseId);
      CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(isActive);

      -- ======= COUPON USAGE TRACKING =======
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id TEXT PRIMARY KEY,
        couponId TEXT NOT NULL,
        customerId TEXT NOT NULL,
        orderId TEXT NOT NULL,
        discountApplied TEXT NOT NULL,
        usedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (couponId) REFERENCES coupons(id),
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (orderId) REFERENCES orders(id)
      );

      CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(couponId);
      CREATE INDEX IF NOT EXISTS idx_coupon_usage_customer ON coupon_usage(customerId);

      -- ======= INVENTORY MOVEMENTS =======
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        productId TEXT NOT NULL,
        movementType TEXT CHECK(movementType IN ('in', 'out', 'adjustment', 'transfer', 'damage', 'return')) NOT NULL,
        quantity INTEGER NOT NULL,
        previousStock INTEGER,
        newStock INTEGER,
        reason TEXT,
        referenceType TEXT,
        referenceId TEXT,
        notes TEXT,
        employeeId TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (productId) REFERENCES products(id),
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(productId);
      CREATE INDEX IF NOT EXISTS idx_inventory_movements_franchise ON inventory_movements(franchiseId);
      CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movementType);

      -- ======= NOTIFICATION QUEUE =======
      CREATE TABLE IF NOT EXISTS notification_queue (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        type TEXT CHECK(type IN ('whatsapp', 'sms', 'email', 'push')) NOT NULL,
        recipient TEXT NOT NULL,
        templateName TEXT,
        templateId TEXT,
        templateParams TEXT,
        messageContent TEXT,
        status TEXT CHECK(status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')) DEFAULT 'pending',
        priority INTEGER DEFAULT 5,
        scheduledAt TEXT,
        sentAt TEXT,
        deliveredAt TEXT,
        provider TEXT,
        providerMessageId TEXT,
        providerResponse TEXT,
        errorCode TEXT,
        errorMessage TEXT,
        retryCount INTEGER DEFAULT 0,
        maxRetries INTEGER DEFAULT 3,
        orderId TEXT,
        customerId TEXT,
        employeeId TEXT,
        metadata TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (franchiseId) REFERENCES franchises(id),
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (customerId) REFERENCES customers(id)
      );

      CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
      CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON notification_queue(type);
      CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduledAt);
      CREATE INDEX IF NOT EXISTS idx_notification_queue_franchise ON notification_queue(franchiseId);

      -- ======= DAILY REPORTS CACHE =======
      CREATE TABLE IF NOT EXISTS daily_reports (
        id TEXT PRIMARY KEY,
        franchiseId TEXT,
        reportDate TEXT NOT NULL,
        totalOrders INTEGER DEFAULT 0,
        completedOrders INTEGER DEFAULT 0,
        pendingOrders INTEGER DEFAULT 0,
        cancelledOrders INTEGER DEFAULT 0,
        totalRevenue TEXT DEFAULT '0',
        cashRevenue TEXT DEFAULT '0',
        cardRevenue TEXT DEFAULT '0',
        upiRevenue TEXT DEFAULT '0',
        creditRevenue TEXT DEFAULT '0',
        averageOrderValue TEXT DEFAULT '0',
        newCustomers INTEGER DEFAULT 0,
        repeatCustomers INTEGER DEFAULT 0,
        totalItems INTEGER DEFAULT 0,
        topServices TEXT,
        employeeStats TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (franchiseId) REFERENCES franchises(id),
        UNIQUE(franchiseId, reportDate)
      );

      CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(reportDate);
      CREATE INDEX IF NOT EXISTS idx_daily_reports_franchise ON daily_reports(franchiseId);

      -- ======= LOYALTY POINTS =======
      CREATE TABLE IF NOT EXISTS loyalty_points (
        id TEXT PRIMARY KEY,
        customerId TEXT NOT NULL,
        franchiseId TEXT,
        points INTEGER NOT NULL,
        type TEXT CHECK(type IN ('earned', 'redeemed', 'expired', 'bonus', 'adjustment')) NOT NULL,
        orderId TEXT,
        description TEXT,
        expiresAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (franchiseId) REFERENCES franchises(id)
      );

      CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer ON loyalty_points(customerId);
      CREATE INDEX IF NOT EXISTS idx_loyalty_points_franchise ON loyalty_points(franchiseId);

      -- ======= CUSTOMER PREFERENCES =======
      CREATE TABLE IF NOT EXISTS customer_preferences (
        id TEXT PRIMARY KEY,
        customerId TEXT UNIQUE NOT NULL,
        preferredServices TEXT,
        allergies TEXT,
        fabricPreferences TEXT,
        deliveryPreferences TEXT,
        communicationPreference TEXT CHECK(communicationPreference IN ('whatsapp', 'sms', 'email', 'none')) DEFAULT 'whatsapp',
        specialInstructions TEXT,
        metadata TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id)
      );

      CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer ON customer_preferences(customerId);
    `);
  }

  private migrateTables() {
    try {
      // Check if orders table exists
      const tableExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'").get();

      if (tableExists) {
        // Get current columns for orders
        const columns = this.db.prepare("PRAGMA table_info(orders)").all() as any[];
        const columnNames = columns.map(c => c.name);

        // Columns to add if missing
        const newColumns = [
          { name: 'advancePaid', type: 'TEXT' },
          { name: 'paymentMethod', type: 'TEXT' },
          { name: 'discountType', type: 'TEXT' },
          { name: 'discountValue', type: 'TEXT' },
          { name: 'couponCode', type: 'TEXT' },
          { name: 'extraCharges', type: 'TEXT' },
          { name: 'gstEnabled', type: 'INTEGER DEFAULT 0' },
          { name: 'gstRate', type: 'TEXT DEFAULT "18.00"' },
          { name: 'gstAmount', type: 'TEXT DEFAULT "0.00"' },
          { name: 'panNumber', type: 'TEXT' },
          { name: 'gstNumber', type: 'TEXT' },
          { name: 'specialInstructions', type: 'TEXT' },
          { name: 'createdBy', type: 'TEXT' },
          { name: 'employeeId', type: 'TEXT' },
          // Fulfillment and delivery columns
          { name: 'fulfillmentType', type: 'TEXT DEFAULT "pickup"' },
          { name: 'deliveryCharges', type: 'TEXT DEFAULT "0"' },
          { name: 'deliveryAddress', type: 'TEXT' },
          // Express and priority columns
          { name: 'isExpressOrder', type: 'INTEGER DEFAULT 0' },
          { name: 'expressService', type: 'INTEGER DEFAULT 0' },
          { name: 'priority', type: 'TEXT DEFAULT "normal"' },
          { name: 'expectedDeliveryDate', type: 'TEXT' },
          { name: 'notes', type: 'TEXT' },
          // WhatsApp notification tracking
          { name: 'lastWhatsappStatus', type: 'TEXT' },
          { name: 'lastWhatsappSentAt', type: 'TEXT' },
          { name: 'whatsappMessageCount', type: 'INTEGER DEFAULT 0' },
          // Service fields
          { name: 'service', type: 'TEXT' },
          { name: 'serviceId', type: 'TEXT' },
        ];

        for (const col of newColumns) {
          if (!columnNames.includes(col.name)) {
            console.log(`🔄 Migrating orders table: Adding column ${col.name}`);
            this.db.exec(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
          }
        }
      }

      // Check settings table migration
      const settingsTableExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get();
      if (settingsTableExists) {
        const columns = this.db.prepare("PRAGMA table_info(settings)").all() as any[];
        const columnNames = columns.map(c => c.name);

        if (!columnNames.includes('category')) {
          console.log('🔄 Migrating settings table: Adding column category');
          this.db.exec("ALTER TABLE settings ADD COLUMN category TEXT DEFAULT 'general'");
        }
        if (!columnNames.includes('updatedBy')) {
          console.log('🔄 Migrating settings table: Adding column updatedBy');
          this.db.exec("ALTER TABLE settings ADD COLUMN updatedBy TEXT");
        }
      }

      // Check transit_orders table migration
      const transitOrdersTableExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transit_orders'").get();
      if (transitOrdersTableExists) {
        const columns = this.db.prepare("PRAGMA table_info(transit_orders)").all() as any[];
        const columnNames = columns.map(c => c.name);

        if (!columnNames.includes('franchiseId')) {
          console.log('🔄 Migrating transit_orders table: Adding column franchiseId');
          this.db.exec("ALTER TABLE transit_orders ADD COLUMN franchiseId TEXT");
        }
      }

      // Check customers table migration
      const customersTableExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'").get();
      if (customersTableExists) {
        const columns = this.db.prepare("PRAGMA table_info(customers)").all() as any[];
        const columnNames = columns.map(c => c.name);

        const customerColumns = [
          { name: 'creditBalance', type: "TEXT DEFAULT '0'" },
          { name: 'loyaltyPoints', type: 'INTEGER DEFAULT 0' },
          { name: 'loyaltyTier', type: "TEXT DEFAULT 'bronze'" },
          { name: 'tags', type: 'TEXT' },
          { name: 'notes', type: 'TEXT' },
          { name: 'preferredPaymentMethod', type: 'TEXT' },
          { name: 'communicationPreference', type: "TEXT DEFAULT 'whatsapp'" },
          { name: 'referredBy', type: 'TEXT' },
          { name: 'dateOfBirth', type: 'TEXT' },
          { name: 'anniversary', type: 'TEXT' },
          { name: 'gender', type: 'TEXT' },
          { name: 'alternatePhone', type: 'TEXT' },
          { name: 'gstNumber', type: 'TEXT' },
          { name: 'companyName', type: 'TEXT' },
          { name: 'source', type: "TEXT DEFAULT 'walk-in'" },
          { name: 'isVip', type: 'INTEGER DEFAULT 0' },
        ];

        for (const col of customerColumns) {
          if (!columnNames.includes(col.name)) {
            console.log(`🔄 Migrating customers table: Adding column ${col.name}`);
            this.db.exec(`ALTER TABLE customers ADD COLUMN ${col.name} ${col.type}`);
          }
        }
      }

      // Check franchises table migration for code column
      const franchisesTableExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='franchises'").get();
      if (franchisesTableExists) {
        const columns = this.db.prepare("PRAGMA table_info(franchises)").all() as any[];
        const columnNames = columns.map(c => c.name);

        if (!columnNames.includes('code')) {
          console.log('🔄 Migrating franchises table: Adding column code (3-letter franchise code)');
          this.db.exec("ALTER TABLE franchises ADD COLUMN code TEXT");
        }
      }

      // Check employees table migration for all required columns
      const employeesTableExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'").get();
      if (employeesTableExists) {
        const columns = this.db.prepare("PRAGMA table_info(employees)").all() as any[];
        const columnNames = columns.map(c => c.name);

        // Define all columns that should exist
        const employeeColumns = [
          { name: 'factoryId', type: 'TEXT' },
          { name: 'salaryType', type: "TEXT DEFAULT 'monthly'" },
          { name: 'workingHours', type: "TEXT DEFAULT '8'" },
          { name: 'qualifications', type: 'TEXT' },
          { name: 'notes', type: 'TEXT' },
          { name: 'dateOfBirth', type: 'TEXT' },
          { name: 'gender', type: 'TEXT' },
          { name: 'bloodGroup', type: 'TEXT' },
          { name: 'bankAccountNumber', type: 'TEXT' },
          { name: 'bankIfsc', type: 'TEXT' },
          { name: 'bankName', type: 'TEXT' },
          { name: 'panNumber', type: 'TEXT' },
          { name: 'aadharNumber', type: 'TEXT' },
          { name: 'profileImage', type: 'TEXT' }, // Base64 or URL for profile photo
          { name: 'orderLetter', type: 'TEXT' }, // Unique letter (A-Z) for order numbers within franchise
        ];

        for (const col of employeeColumns) {
          if (!columnNames.includes(col.name)) {
            console.log(`🔄 Migrating employees table: Adding column ${col.name}`);
            this.db.exec(`ALTER TABLE employees ADD COLUMN ${col.name} ${col.type}`);
          }
        }

        // Backfill order letters for existing employees
        try {
          const employeesWithoutLetter = this.db.prepare("SELECT * FROM employees WHERE orderLetter IS NULL OR orderLetter = ''").all() as any[];
          if (employeesWithoutLetter.length > 0) {
            console.log(`🔄 Backfilling order letters for ${employeesWithoutLetter.length} employees...`);
            for (const emp of employeesWithoutLetter) {
              const letter = this.getNextOrderLetter(emp.franchiseId);
              this.db.prepare("UPDATE employees SET orderLetter = ? WHERE id = ?").run(letter, emp.id);
              console.log(`  - Assigned letter '${letter}' to ${emp.name} (${emp.franchiseId || 'HQ'})`);
            }
          }
        } catch (err) {
          console.error('Failed to backfill order letters:', err);
        }
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }

  // ======= AUDIT LOGGING & SURVEILLANCE =======

  /**
   * Valid action types for audit logging
   * Categorized for analysis and filtering
   */
  static readonly ACTION_TYPES = {
    // Authentication
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    PASSWORD_CHANGE: 'password_change',
    PROFILE_UPDATE: 'profile_update',

    // Orders
    ORDER_CREATE: 'order_create',
    ORDER_VIEW: 'order_view',
    ORDER_UPDATE: 'order_update',
    ORDER_DELETE: 'order_delete',
    ORDER_STATUS_CHANGE: 'status_change',
    ORDER_LIST_VIEW: 'order_list_view',

    // Financials
    PAYMENT_COLLECTED: 'payment_collected',
    REFUND_PROCESSED: 'refund_processed',
    DISCOUNT_APPLIED: 'discount_applied',
    CREDIT_ADDED: 'credit_added',
    CREDIT_PAYMENT: 'credit_payment',
    INVOICE_PRINTED: 'invoice_printed',

    // Inventory
    STOCK_ADJUSTMENT: 'stock_adjustment',
    PRODUCT_CREATE: 'product_create',
    PRODUCT_UPDATE: 'product_update',
    PRODUCT_DELETE: 'product_delete',

    // Workforce
    EMPLOYEE_CREATE: 'employee_create',
    EMPLOYEE_UPDATE: 'employee_update',
    EMPLOYEE_TERMINATED: 'employee_terminated',
    ATTENDANCE_MODIFIED: 'attendance_modified',
    TASK_ASSIGNED: 'task_assigned',

    // System
    SETTINGS_CHANGE: 'settings_change',
    DB_BACKUP: 'db_backup',
    DB_OPTIMIZE: 'db_optimize',
    EXPORT_DATA: 'export_data',

    // HTTP Actions (auto-logged by surveillance middleware)
    HTTP_GET: 'HTTP_GET',
    HTTP_POST: 'HTTP_POST',
    HTTP_PUT: 'HTTP_PUT',
    HTTP_PATCH: 'HTTP_PATCH',
    HTTP_DELETE: 'HTTP_DELETE',
  } as const;

  /**
   * Log an action for complete audit trail
   * This is the core surveillance method that tracks ALL operations
   * 
   * @param actorId - The ID of the user performing the action
   * @param action - The type of action being performed
   * @param entityType - The type of entity being acted upon (order, customer, etc.)
   * @param entityId - The ID of the specific entity
   * @param details - Additional context about the action
   * @param ip - The IP address of the request
   * @param userAgent - The user agent string
   */
  async logAction(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: any,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO audit_logs (
          id, franchiseId, employeeId, action, entityType, entityId, details, ipAddress, userAgent, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Fetch franchiseId for the actor to ensure the log is scoped
      // Use NULL instead of string placeholders to avoid FK constraint failures
      let franchiseId: string | null = null;
      let employeeId: string | null = null;

      if (actorId && actorId !== 'SYSTEM' && actorId !== 'ANONYMOUS') {
        try {
          const actor = await this.getEmployee(actorId);
          if (actor) {
            employeeId = actor.id;
            if (actor.franchiseId) {
              franchiseId = actor.franchiseId as string;
            }
          }
        } catch {
          // Actor not found, keep as null
        }
      }

      stmt.run(
        randomUUID(),
        franchiseId,  // NULL if no franchise
        employeeId,   // NULL if no employee
        action,
        entityType || null,
        entityId || null,
        JSON.stringify(details),
        ip || null,
        userAgent || null,
        new Date().toISOString()
      );
    } catch (error) {
      // Log to console but don't throw - logging should never break the app
      console.error('[AUDIT LOG ERROR]', error);
    }
  }

  /**
   * Convenience method to log with requesting user context
   * Includes automatic RLS validation logging
   */
  async logWithContext(
    requestingUser: { id: string; role: string; franchiseId?: string },
    action: string,
    entityType: string,
    entityId: string,
    details: any,
    ip?: string
  ): Promise<void> {
    await this.logAction(
      requestingUser.id,
      action,
      entityType,
      entityId,
      {
        ...details,
        _context: {
          role: requestingUser.role,
          franchiseId: requestingUser.franchiseId || 'NONE',
        }
      },
      ip
    );
  }

  /**
   * Check if a user has access to a specific franchise's data
   * This is the core RLS enforcement logic
   */
  private hasAccessToFranchise(
    requestingUser: { role: string; franchiseId?: string } | undefined,
    targetFranchiseId: string | null | undefined
  ): boolean {
    // No user context = system operation, allow
    if (!requestingUser) return true;

    // Admin can access everything
    if (requestingUser.role === 'admin') return true;

    // Factory manager can access all franchises (for processing)
    if (requestingUser.role === 'factory_manager') return true;

    // If target has no franchise, allow (global data)
    if (!targetFranchiseId) return true;

    // Otherwise, must match requesting user's franchise
    return requestingUser.franchiseId === targetFranchiseId;
  }

  // ======= USERS =======
  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const userData = data as any; // Cast to any for property access

    this.db
      .prepare(
        `
        INSERT INTO users (id, username, password, email, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .run(id, userData.username, userData.password, userData.email, now, now);

    return {
      id,
      username: userData.username,
      password: userData.password,
      email: userData.email ?? null,
      franchiseId: userData.franchiseId ?? null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    } as User;
  }

  async getUser(id: string): Promise<User | undefined> {
    const row = this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id) as any;
    return row
      ? {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }
      : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const row = this.db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as any;
    return row
      ? {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }
      : undefined;
  }

  // ======= JSON PARSING HELPER =======
  /**
   * Safely parse a JSON string. Returns the original value if not valid JSON.
   * This prevents errors when a field contains a plain string instead of JSON.
   */
  private safeJsonParse(value: any): any {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    // Only attempt JSON parse if it looks like JSON (starts with { or [)
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return value; // Return plain string as-is
    }
    try {
      return JSON.parse(value);
    } catch {
      return value; // Return original on parse failure
    }
  }

  // ======= GENERIC CRUD HELPERS =======
  private insertRecord<T extends Record<string, any>>(
    table: string,
    data: T & { id?: string },
  ): string {
    const id = data.id ?? randomUUID();
    const now = new Date().toISOString();

    const dataWithTimestamps = { ...data, id, createdAt: now, updatedAt: now };

    // Handle JSON fields for certain tables
    const anyData = dataWithTimestamps as any;
    if (table === "orders" && anyData.items) {
      anyData.items =
        typeof anyData.items === "string"
          ? anyData.items
          : JSON.stringify(anyData.items);
    }
    if (table === "orders" && anyData.shippingAddress) {
      anyData.shippingAddress =
        typeof anyData.shippingAddress === "string"
          ? anyData.shippingAddress
          : JSON.stringify(anyData.shippingAddress);
    }
    if (table === "orders" && anyData.deliveryAddress) {
      anyData.deliveryAddress =
        typeof anyData.deliveryAddress === "string"
          ? anyData.deliveryAddress
          : JSON.stringify(anyData.deliveryAddress);
    }
    if (table === "deliveries" && anyData.location) {
      anyData.location =
        typeof anyData.location === "string"
          ? anyData.location
          : JSON.stringify(anyData.location);
    }
    if (table === "deliveries" && anyData.route) {
      anyData.route =
        typeof anyData.route === "string"
          ? anyData.route
          : JSON.stringify(anyData.route);
    }
    if (table === "posTransactions" && anyData.items) {
      anyData.items =
        typeof anyData.items === "string"
          ? anyData.items
          : JSON.stringify(anyData.items);
    }
    // Handle customers table JSON fields
    if (table === "customers" && anyData.address) {
      anyData.address =
        typeof anyData.address === "string"
          ? anyData.address
          : JSON.stringify(anyData.address);
    }
    if (table === "customers" && anyData.segments) {
      anyData.segments =
        typeof anyData.segments === "string"
          ? anyData.segments
          : JSON.stringify(anyData.segments);
    }
    // Handle franchises table JSON fields
    if (table === "franchises") {
      if (anyData.address) {
        anyData.address =
          typeof anyData.address === "string"
            ? anyData.address
            : JSON.stringify(anyData.address);
      }
      if (anyData.documents) {
        anyData.documents =
          typeof anyData.documents === "string"
            ? anyData.documents
            : JSON.stringify(anyData.documents);
      }
    }

    // Sanitize foreign key fields - convert empty strings to null
    // This prevents FOREIGN KEY constraint failures
    const foreignKeyFields = ['franchiseId', 'factoryId', 'managerId', 'customerId', 'orderId', 'employeeId', 'productId', 'couponId', 'driverId'];
    for (const fkField of foreignKeyFields) {
      if (anyData[fkField] !== undefined && anyData[fkField] !== null) {
        if (typeof anyData[fkField] === 'string' && anyData[fkField].trim() === '') {
          anyData[fkField] = null;
        }
      }
    }

    const keys = Object.keys(dataWithTimestamps);
    const values = Object.values(dataWithTimestamps).map(value => {
      if (value === undefined) return null;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'boolean') return value ? 1 : 0;
      return value;
    });
    const placeholders = keys.map(() => "?").join(",");

    this.db
      .prepare(
        `INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`,
      )
      .run(...values);

    return id;
  }

  private getRecord<T>(table: string, id: string): T | undefined {
    const row = this.db
      .prepare(`SELECT * FROM ${table} WHERE id = ?`)
      .get(id) as any;
    if (!row) return undefined;

    // Convert date strings back to Date objects
    Object.keys(row).forEach((key) => {
      if (key.includes("At") && typeof row[key] === "string") {
        row[key] = new Date(row[key]);
      }
    });

    // Parse JSON fields for certain tables
    if (table === "orders" && row.items && typeof row.items === "string") {
      try {
        row.items = JSON.parse(row.items);
      } catch (e) {
        console.warn("Failed to parse order items:", e);
      }
    }
    if (table === "orders" && row.shippingAddress) {
      row.shippingAddress = this.safeJsonParse(row.shippingAddress);
    }
    if (
      table === "deliveries" &&
      row.location &&
      typeof row.location === "string"
    ) {
      try {
        row.location = JSON.parse(row.location);
      } catch (e) {
        console.warn("Failed to parse delivery location:", e);
      }
    }
    if (table === "deliveries" && row.route && typeof row.route === "string") {
      try {
        row.route = JSON.parse(row.route);
      } catch (e) {
        console.warn("Failed to parse delivery route:", e);
      }
    }
    if (
      table === "posTransactions" &&
      row.items &&
      typeof row.items === "string"
    ) {
      try {
        row.items = JSON.parse(row.items);
      } catch (e) {
        console.warn("Failed to parse transaction items:", e);
      }
    }
    if (
      table === "customers" &&
      row.segments &&
      typeof row.segments === "string"
    ) {
      try {
        row.segments = JSON.parse(row.segments);
      } catch (e) {
        console.warn("Failed to parse customer segments:", e);
      }
    }
    // Parse franchises JSON fields
    if (table === "franchises") {
      if (row.address && typeof row.address === "string") {
        try {
          row.address = JSON.parse(row.address);
        } catch (e) {
          console.warn("Failed to parse franchise address:", e);
        }
      }
      if (row.documents && typeof row.documents === "string") {
        try {
          row.documents = JSON.parse(row.documents);
        } catch (e) {
          console.warn("Failed to parse franchise documents:", e);
        }
      }
      if (row.workingDays && typeof row.workingDays === "string") {
        try {
          row.workingDays = JSON.parse(row.workingDays);
        } catch (e) {
          console.warn("Failed to parse franchise workingDays:", e);
        }
      }
      // Convert SQLite integers to booleans
      if (row.gstEnabled !== undefined) row.gstEnabled = !!row.gstEnabled;
      if (row.autoGenerateOrderNumber !== undefined) row.autoGenerateOrderNumber = !!row.autoGenerateOrderNumber;
      if (row.enableDelivery !== undefined) row.enableDelivery = !!row.enableDelivery;
      if (row.enableExpressService !== undefined) row.enableExpressService = !!row.enableExpressService;
    }

    return row as T;
  }

  private updateRecord<T extends Record<string, any>>(
    table: string,
    id: string,
    data: Partial<T>,
  ): void {
    const now = new Date().toISOString();
    const keys = Object.keys(data);
    if (!keys.length) return;

    // Handle JSON fields
    const processedData = { ...data } as any;
    if (table === "orders" && processedData.items) {
      processedData.items =
        typeof processedData.items === "string"
          ? processedData.items
          : JSON.stringify(processedData.items);
    }
    if (table === "orders" && processedData.shippingAddress) {
      processedData.shippingAddress =
        typeof processedData.shippingAddress === "string"
          ? processedData.shippingAddress
          : JSON.stringify(processedData.shippingAddress);
    }
    if (table === "orders" && processedData.deliveryAddress) {
      processedData.deliveryAddress =
        typeof processedData.deliveryAddress === "string"
          ? processedData.deliveryAddress
          : JSON.stringify(processedData.deliveryAddress);
    }
    if (table === "deliveries" && processedData.location) {
      processedData.location =
        typeof processedData.location === "string"
          ? processedData.location
          : JSON.stringify(processedData.location);
    }
    if (table === "deliveries" && processedData.route) {
      processedData.route =
        typeof processedData.route === "string"
          ? processedData.route
          : JSON.stringify(processedData.route);
    }
    if (table === "posTransactions" && processedData.items) {
      processedData.items =
        typeof processedData.items === "string"
          ? processedData.items
          : JSON.stringify(processedData.items);
    }
    // Handle franchises table JSON fields
    if (table === "franchises") {
      if (processedData.address) {
        processedData.address =
          typeof processedData.address === "string"
            ? processedData.address
            : JSON.stringify(processedData.address);
      }
      if (processedData.documents) {
        processedData.documents =
          typeof processedData.documents === "string"
            ? processedData.documents
            : JSON.stringify(processedData.documents);
      }
    }

    // Sanitize foreign key fields - convert empty strings to null
    // This prevents FOREIGN KEY constraint failures
    const foreignKeyFields = ['franchiseId', 'factoryId', 'managerId', 'customerId', 'orderId', 'employeeId', 'productId', 'couponId', 'driverId'];
    for (const fkField of foreignKeyFields) {
      if (processedData[fkField] !== undefined && processedData[fkField] !== null) {
        if (typeof processedData[fkField] === 'string' && processedData[fkField].trim() === '') {
          processedData[fkField] = null;
        }
      }
    }

    const setStmt =
      Object.keys(processedData)
        .map((k) => `${k} = ?`)
        .join(", ") + ", updatedAt = ?";
    const values = [...Object.values(processedData).map(v => v === undefined ? null : v), now, id];

    this.db
      .prepare(`UPDATE ${table} SET ${setStmt} WHERE id = ?`)
      .run(...values);
  }

  private deleteRecord(table: string, id: string): void {
    this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  }

  private listAllRecords<T>(table: string): T[] {
    try {
      const rows = this.db.prepare(`SELECT * FROM ${table}`).all() as any[];

      rows.forEach((row) => {
        Object.keys(row).forEach((key) => {
          if (key.includes("At") && typeof row[key] === "string") {
            row[key] = new Date(row[key]);
          }
        });

        // Parse JSON fields
        if (table === "orders" && row.items && typeof row.items === "string") {
          try {
            row.items = JSON.parse(row.items);
          } catch (e) {
            console.warn("Failed to parse order items:", e);
          }
        }
        if (table === "orders" && row.shippingAddress) {
          row.shippingAddress = this.safeJsonParse(row.shippingAddress);
        }
        if (
          table === "deliveries" &&
          row.location &&
          typeof row.location === "string"
        ) {
          try {
            row.location = JSON.parse(row.location);
          } catch (e) {
            console.warn("Failed to parse delivery location:", e);
          }
        }
        if (
          table === "deliveries" &&
          row.route &&
          typeof row.route === "string"
        ) {
          try {
            row.route = JSON.parse(row.route);
          } catch (e) {
            console.warn("Failed to parse delivery route:", e);
          }
        }
        if (
          table === "posTransactions" &&
          row.items &&
          typeof row.items === "string"
        ) {
          try {
            row.items = JSON.parse(row.items);
          } catch (e) {
            console.warn("Failed to parse transaction items:", e);
          }
        }
      });

      return rows as T[];
    } catch (error) {
      console.error(`Error listing records from table ${table}:`, error);
      return [];
    }
  }

  // ======= PRODUCTS =======
  async createProduct(data: InsertProduct): Promise<Product> {
    const id = this.insertRecord("products", data);
    return this.getRecord<Product>("products", id)!;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.getRecord<Product>("products", id);
  }

  async updateProduct(
    id: string,
    data: Partial<InsertProduct>,
  ): Promise<Product | undefined> {
    this.updateRecord("products", id, data);
    return this.getProduct(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      this.deleteRecord("products", id);
      return true;
    } catch {
      return false;
    }
  }

  async listProducts(): Promise<Product[]> {
    return this.listAllRecords<Product>("products");
  }

  // Alias for compatibility with existing routes
  async getProducts(): Promise<Product[]> {
    return this.listProducts();
  }

  // ======= CUSTOMERS =======
  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const id = this.insertRecord("customers", data);
    return this.getRecord<Customer>("customers", id)!;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.getRecord<Customer>("customers", id);
  }

  async updateCustomer(
    id: string,
    data: Partial<InsertCustomer>,
  ): Promise<Customer | undefined> {
    this.updateRecord("customers", id, data);
    return this.getCustomer(id);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      this.deleteRecord("customers", id);
      return true;
    } catch {
      return false;
    }
  }

  async listCustomers(franchiseId?: string): Promise<Customer[]> {
    if (franchiseId) {
      return this.db.prepare("SELECT * FROM customers WHERE franchiseId = ?").all(franchiseId) as Customer[];
    }
    return this.listAllRecords<Customer>("customers");
  }

  async getCustomersWithOutstandingCredit(franchiseId?: string): Promise<Customer[]> {
    let sql = "SELECT * FROM customers WHERE CAST(creditBalance AS REAL) > 0";
    const params: any[] = [];
    if (franchiseId) {
      sql += " AND franchiseId = ?";
      params.push(franchiseId);
    }
    return this.db.prepare(sql).all(params) as Customer[];
  }

  // Alias for compatibility with existing routes
  async getCustomers(): Promise<Customer[]> {
    return this.listCustomers();
  }

  // ======= CUSTOMER CREDIT =======
  async addCustomerCredit(customerId: string, amount: number, type: string, description: string, referenceId?: string, createdBy?: string): Promise<any> {
    const customer = await this.getCustomer(customerId);
    if (!customer) throw new Error("Customer not found");

    const currentBalance = parseFloat(customer.creditBalance || '0');
    const newBalance = currentBalance + amount;

    // Update customer balance
    this.updateCustomer(customerId, { creditBalance: String(newBalance) });

    // Record transaction
    const transaction = {
      customerId,
      amount: String(amount),
      type,
      description,
      referenceId,
      balanceAfter: String(newBalance),
      createdBy
    };

    return this.insertRecord("customer_credit_history", transaction);
  }

  async getCustomerCreditHistory(customerId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM customer_credit_history WHERE customerId = ? ORDER BY createdAt DESC').all(customerId) as any[];
  }





  // ======= ORDER NUMBER GENERATION =======
  /**
   * Generate next sequential order number
   * Format: PREFIXYYFRCESEQ
   * Example: FZC26POLA0001
   * - FZC = Company/Franchise prefix (3 chars)
   * - 26 = Year (last 2 digits)
   * - POL = Franchise location code (3 chars)
   * - A = Employee code (single letter based on employee)
   * - 0001 = Daily sequence number (4 digits)
   *
   * This format enables efficient isolation:
   * - By franchise: Filter by FZC26POL*
   * - By employee: Filter by FZC26POL[A]*
   * - By date: Check sequence + createdAt
   */
  getNextOrderNumber(franchiseId?: string | null, employeeId?: string | null): string {
    const now = new Date();
    const yearStr = String(now.getFullYear()).slice(-2); // Last 2 digits of year (26 from 2026)

    // Get prefix and franchise code from franchise settings
    let prefix = 'FZC';
    let franchiseCode = 'HQ'; // Default for headquarters/no franchise

    if (franchiseId) {
      try {
        const franchise = this.db.prepare(
          'SELECT orderNumberPrefix, code, name FROM franchises WHERE id = ?'
        ).get(franchiseId) as any;

        if (franchise) {
          if (franchise.orderNumberPrefix) {
            prefix = franchise.orderNumberPrefix.slice(0, 3).toUpperCase();
          }
          // Use franchise code if available, otherwise generate from name
          if (franchise.code) {
            franchiseCode = franchise.code.slice(0, 3).toUpperCase();
          } else if (franchise.name) {
            // Generate 3-letter code from franchise name
            franchiseCode = franchise.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'FRC';
          }
        }
      } catch (err) {
        // Use defaults if franchise not found
      }
    }

    // Generate the base pattern for this year: PREFIX + YEAR + FRANCHISE
    // Format: FZC26POL (without employee letter for cleaner numbers)
    const basePattern = `${prefix}${yearStr}${franchiseCode}`;

    // Count existing orders with this pattern for the entire year
    const yearStart = `${now.getFullYear()}-01-01`;
    const existingOrders = this.db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE orderNumber LIKE ?
    `).get(`${basePattern}%`) as any;

    const sequenceNumber = (existingOrders?.count || 0) + 1;
    const paddedSequence = String(sequenceNumber).padStart(4, '0');

    // Final format: FZC26POL0001
    return `${basePattern}${paddedSequence}`;
  }

  // ======= ORDERS =======
  async createOrder(data: InsertOrder): Promise<Order> {
    // Auto-generate orderNumber if not provided
    if (!data.orderNumber) {
      data.orderNumber = this.getNextOrderNumber(
        (data as any).franchiseId,
        (data as any).createdBy || (data as any).employeeId
      );
    }

    // Ensure status has a default
    if (!data.status) {
      data.status = 'pending';
    }

    const id = this.insertRecord("orders", data);

    // Check for Credit Payment
    // If paymentMethod is credit, we deduct the unpaid amount from customer balance (creating debt)
    if ((data as any).paymentMethod === 'credit' && data.customerId && data.totalAmount) {
      const total = parseFloat(String(data.totalAmount));
      const advance = parseFloat(String((data as any).advancePaid || 0));
      const creditAmount = total - advance;

      if (creditAmount > 0) {
        const createdBy = (data as any).employeeId || (data as any).createdBy || 'system';
        // Record usage (Debit -> Negative amount)
        this.addCustomerCredit(
          data.customerId,
          -creditAmount,
          'usage',
          `Order ${data.orderNumber} (Credit)`,
          id, // referenceId is order ID
          createdBy
        ).catch(e => console.error("Failed to record credit transaction:", e));
      }
    }

    return this.getRecord<Order>("orders", id)!;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.getRecord<Order>("orders", id);
  }

  async updateOrder(
    id: string,
    data: Partial<InsertOrder>,
  ): Promise<Order | undefined> {
    this.updateRecord("orders", id, data);
    return this.getOrder(id);
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      this.deleteRecord("orders", id);
      return true;
    } catch {
      return false;
    }
  }

  async listOrders(franchiseId?: string): Promise<Order[]> {
    if (franchiseId) {
      const rows = this.db.prepare("SELECT * FROM orders WHERE franchiseId = ?").all(franchiseId) as any[];
      return rows.map(row => {
        // Parse JSON fields
        if (row.items && typeof row.items === "string") {
          try { row.items = JSON.parse(row.items); } catch (e) { }
        }
        if (row.shippingAddress) {
          row.shippingAddress = this.safeJsonParse(row.shippingAddress);
        }
        // Parse timestamps
        Object.keys(row).forEach((key) => {
          if (key.includes("At") && typeof row[key] === "string") {
            row[key] = new Date(row[key]);
          }
        });
        return row;
      });
    }
    return this.listAllRecords<Order>("orders");
  }

  // Alias for compatibility with existing routes
  async getOrders(): Promise<Order[]> {
    return this.listOrders();
  }

  async getActiveOrders(): Promise<Order[]> {
    const rows = this.db.prepare(`
      SELECT * FROM orders 
      WHERE status IN ('in_progress', 'shipped', 'out_for_delivery', 'in_transit', 'assigned')
    `).all() as any[];

    return rows.map(row => {
      // Parse JSON fields
      if (row.items && typeof row.items === "string") {
        try { row.items = JSON.parse(row.items); } catch (e) { }
      }
      if (row.shippingAddress) {
        row.shippingAddress = this.safeJsonParse(row.shippingAddress);
      }
      // Parse dates
      Object.keys(row).forEach((key) => {
        if (key.includes("At") && typeof row[key] === "string") {
          row[key] = new Date(row[key]);
        }
      });
      return row;
    });
  }

  async getAnalyticsSummary(): Promise<any> {
    const totalRevenue = this.db.prepare('SELECT SUM(CAST(totalAmount AS REAL)) as total FROM orders').get() as any;
    const totalOrders = this.db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const totalCustomers = this.db.prepare('SELECT COUNT(*) as count FROM customers').get() as any;
    const completedOrders = this.db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get() as any;

    // Status counts
    const statusCounts = this.db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all() as any[];
    const statusMap = statusCounts.reduce((acc: any, curr: any) => {
      acc[curr.status] = curr.count;
      return acc;
    }, {});

    // Recent activity (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentOrders = this.db.prepare('SELECT * FROM orders WHERE createdAt > ? ORDER BY createdAt DESC LIMIT 10').all(fiveMinutesAgo) as any[];
    const recentCustomers = this.db.prepare('SELECT * FROM customers WHERE createdAt > ? ORDER BY createdAt DESC LIMIT 10').all(fiveMinutesAgo) as any[];

    return {
      kpis: {
        totalRevenue: totalRevenue?.total || 0,
        totalOrders: totalOrders?.count || 0,
        totalCustomers: totalCustomers?.count || 0,
        completionRate: totalOrders?.count > 0 ? (completedOrders?.count / totalOrders.count) * 100 : 0,
        avgOrderValue: totalOrders?.count > 0 ? (totalRevenue?.total / totalOrders.count) : 0,
      },
      recentActivity: {
        newOrders: recentOrders.length,
        newCustomers: recentCustomers.length,
        orders: recentOrders.map(o => ({ ...o, createdAt: new Date(o.createdAt) })),
        customers: recentCustomers.map(c => ({ ...c, createdAt: new Date(c.createdAt) }))
      },
      statusCounts: statusMap
    };
  }

  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const logData = data as any; // Cast to any for property access
    const auditLog = {
      id,
      franchiseId: logData.franchiseId || null,
      employeeId: logData.employeeId || null,
      action: logData.action,
      entityType: logData.entityType || null,
      entityId: logData.entityId || null,
      ipAddress: logData.ipAddress || null,
      userAgent: logData.userAgent || null,
      createdAt: now,
      details: logData.details ? JSON.stringify(logData.details) : null
    };

    this.db.prepare(`
      INSERT INTO audit_logs (id, franchiseId, employeeId, action, entityType, entityId, details, ipAddress, userAgent, createdAt)
      VALUES (@id, @franchiseId, @employeeId, @action, @entityType, @entityId, @details, @ipAddress, @userAgent, @createdAt)
    `).run(auditLog);

    return {
      ...auditLog,
      createdAt: new Date(now),
      details: logData.details
    } as AuditLog;
  }

  async getAuditLogs(params: any): Promise<{ data: AuditLog[]; count: number }> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const queryParams: any[] = [];

    if (params.employeeId) {
      query += ' AND employeeId = ?';
      queryParams.push(params.employeeId);
    }
    if (params.franchiseId) {
      // Filter by franchise if provided
      query += ' AND franchiseId = ?';
      queryParams.push(params.franchiseId);
    }
    if (params.action) {
      // Support partial matching for action categories (e.g., 'order' matches 'create_order', 'update_order')
      query += ' AND action LIKE ?';
      queryParams.push(`%${params.action}%`);
    }
    if (params.entityType) {
      query += ' AND entityType = ?';
      queryParams.push(params.entityType);
    }
    if (params.startDate) {
      query += ' AND createdAt >= ?';
      queryParams.push(params.startDate);
    }
    if (params.endDate) {
      query += ' AND createdAt <= ?';
      queryParams.push(params.endDate);
    }

    const countQuery = `SELECT COUNT(*) as count FROM (${query})`;
    const total = this.db.prepare(countQuery).get(queryParams) as any;

    // Sorting
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination - calculate offset from page number
    const limit = params.limit || 20;
    const page = params.page || 1;
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const rows = this.db.prepare(query).all(queryParams) as any[];

    const data = rows.map(row => ({
      ...row,
      createdAt: row.createdAt,
      details: row.details ? this.safeJsonParse(row.details) : null
    }));

    return {
      data,
      count: total.count
    };
  }

  async searchGlobal(query: string): Promise<any> {
    const searchQuery = `%${query}%`;

    const orders = this.db.prepare(`
      SELECT id, orderNumber as title, 'order' as type, status as subtitle 
      FROM orders 
      WHERE orderNumber LIKE ? OR customerName LIKE ?
      LIMIT 5
    `).all(searchQuery, searchQuery);

    const customers = this.db.prepare(`
      SELECT id, name as title, 'customer' as type, phone as subtitle 
      FROM customers 
      WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
      LIMIT 5
    `).all(searchQuery, searchQuery, searchQuery);

    const products = this.db.prepare(`
      SELECT id, name as title, 'product' as type, sku as subtitle 
      FROM products 
      WHERE name LIKE ? OR sku LIKE ?
      LIMIT 5
    `).all(searchQuery, searchQuery);

    return [...orders, ...customers, ...products];
  }

  // ======= DELIVERIES =======
  async createDelivery(data: InsertDelivery): Promise<Delivery> {
    const id = this.insertRecord("deliveries", data);
    return this.getRecord<Delivery>("deliveries", id)!;
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    return this.getRecord<Delivery>("deliveries", id);
  }

  async updateDelivery(
    id: string,
    data: Partial<InsertDelivery>,
  ): Promise<Delivery | undefined> {
    this.updateRecord("deliveries", id, data);
    return this.getDelivery(id);
  }

  async deleteDelivery(id: string): Promise<boolean> {
    try {
      this.deleteRecord("deliveries", id);
      return true;
    } catch {
      return false;
    }
  }

  async listDeliveries(): Promise<Delivery[]> {
    return this.listAllRecords<Delivery>("deliveries");
  }

  // Alias for compatibility
  async getDeliveries(): Promise<Delivery[]> {
    return this.listDeliveries();
  }

  // ======= POS TRANSACTIONS =======
  async createPosTransaction(
    data: InsertOrderTransaction,
  ): Promise<OrderTransaction> {
    const id = this.insertRecord("posTransactions", data);
    return this.getRecord<OrderTransaction>("posTransactions", id)!;
  }

  async getPosTransaction(id: string): Promise<OrderTransaction | undefined> {
    return this.getRecord<OrderTransaction>("posTransactions", id);
  }

  async updatePosTransaction(
    id: string,
    data: Partial<InsertOrderTransaction>,
  ): Promise<OrderTransaction | undefined> {
    this.updateRecord("posTransactions", id, data);
    return this.getPosTransaction(id);
  }

  async deletePosTransaction(id: string): Promise<boolean> {
    try {
      this.deleteRecord("posTransactions", id);
      return true;
    } catch {
      return false;
    }
  }

  async listPosTransactions(): Promise<OrderTransaction[]> {
    return this.listAllRecords<OrderTransaction>("posTransactions");
  }

  // Alias for compatibility
  async getPosTransactions(): Promise<OrderTransaction[]> {
    return this.listPosTransactions();
  }

  // ======= SERVICES =======
  async createService(data: InsertService): Promise<Service> {
    const id = this.insertRecord("services", data);
    return this.getRecord<Service>("services", id)!;
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.getRecord<Service>("services", id);
  }

  async updateService(
    id: string,
    data: Partial<InsertService>,
  ): Promise<Service | undefined> {
    this.updateRecord("services", id, data);
    return this.getService(id);
  }

  async deleteService(id: string): Promise<boolean> {
    try {
      this.deleteRecord("services", id);
      return true;
    } catch {
      return false;
    }
  }

  async listServices(): Promise<Service[]> {
    return this.listAllRecords<Service>("services");
  }

  // Alias for compatibility
  async getServices(): Promise<Service[]> {
    return this.listServices();
  }

  // ======= SHIPMENTS =======
  async createShipment(data: InsertShipment): Promise<Shipment> {
    const id = this.insertRecord("shipments", data);
    return this.getRecord<Shipment>("shipments", id)!;
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    return this.getRecord<Shipment>("shipments", id);
  }

  async updateShipment(
    id: string,
    data: Partial<InsertShipment>,
  ): Promise<Shipment | undefined> {
    this.updateRecord("shipments", id, data);
    return this.getShipment(id);
  }

  async deleteShipment(id: string): Promise<boolean> {
    try {
      this.deleteRecord("shipments", id);
      return true;
    } catch {
      return false;
    }
  }

  async listShipments(): Promise<Shipment[]> {
    return this.listAllRecords<Shipment>("shipments");
  }

  // Alias for compatibility
  async getShipments(): Promise<Shipment[]> {
    return this.listShipments();
  }

  // ======= BARCODES =======
  async createBarcode(data: InsertBarcode): Promise<Barcode> {
    const id = this.insertRecord("barcodes", data);
    return this.getRecord<Barcode>("barcodes", id)!;
  }

  async getBarcode(id: string): Promise<Barcode | undefined> {
    return this.getRecord<Barcode>("barcodes", id);
  }

  async updateBarcode(
    id: string,
    data: Partial<InsertBarcode>,
  ): Promise<Barcode | undefined> {
    this.updateRecord("barcodes", id, data);
    return this.getBarcode(id);
  }

  async deleteBarcode(id: string): Promise<boolean> {
    try {
      this.deleteRecord("barcodes", id);
      return true;
    } catch {
      return false;
    }
  }

  async listBarcodes(): Promise<Barcode[]> {
    return this.listAllRecords<Barcode>("barcodes");
  }

  // Alias for compatibility
  async getBarcodes(): Promise<Barcode[]> {
    return this.listBarcodes();
  }

  // ======= EMPLOYEES =======

  /**
   * Get the next available order letter (A-Z) for a franchise
   * Each franchise can have up to 26 employees with unique letters
   */
  getNextOrderLetter(franchiseId: string | null | undefined): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Get all employees in this franchise with assigned letters
    let query = 'SELECT orderLetter FROM employees WHERE orderLetter IS NOT NULL';
    const params: any[] = [];

    if (franchiseId) {
      query += ' AND franchiseId = ?';
      params.push(franchiseId);
    } else {
      query += " AND (franchiseId IS NULL OR franchiseId = '')";
    }

    const rows = this.db.prepare(query).all(...params) as any[];
    const usedLetters = new Set(rows.map(r => r.orderLetter?.toUpperCase()));

    // Find the first unused letter
    for (const letter of letters) {
      if (!usedLetters.has(letter)) {
        return letter;
      }
    }

    // If all 26 letters are used, generate a two-character code (AA, AB, etc.)
    // This supports up to 676 employees per franchise
    const usedCount = usedLetters.size;
    const firstChar = letters[Math.floor(usedCount / 26) % 26];
    const secondChar = letters[usedCount % 26];
    return `${firstChar}${secondChar}`;
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    // Sanitize foreign key fields - convert empty strings to null
    const sanitizedData = { ...data } as any;
    if (sanitizedData.franchiseId === '' || sanitizedData.franchiseId === undefined) {
      sanitizedData.franchiseId = null;
    }
    if (sanitizedData.factoryId === '' || sanitizedData.factoryId === undefined) {
      sanitizedData.factoryId = null;
    }
    if (sanitizedData.managerId === '' || sanitizedData.managerId === undefined) {
      sanitizedData.managerId = null;
    }

    // Auto-assign order letter if not provided
    if (!sanitizedData.orderLetter) {
      sanitizedData.orderLetter = this.getNextOrderLetter(sanitizedData.franchiseId);
    }

    const id = this.insertRecord("employees", sanitizedData);
    return this.getRecord<Employee>("employees", id)!;
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.getRecord<Employee>("employees", id);
  }

  async updateEmployee(
    id: string,
    data: Partial<InsertEmployee>,
  ): Promise<Employee | undefined> {
    // If changing franchiseId, may need to reassign order letter
    if ((data as any).franchiseId !== undefined) {
      const existing = await this.getEmployee(id);
      if (existing && (existing as any).franchiseId !== (data as any).franchiseId) {
        // Assign a new letter for the new franchise
        (data as any).orderLetter = this.getNextOrderLetter((data as any).franchiseId);
      }
    }

    this.updateRecord("employees", id, data);
    return this.getEmployee(id);
  }

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      this.deleteRecord("employees", id);
      return true;
    } catch {
      return false;
    }
  }

  async listEmployees(): Promise<Employee[]> {
    return this.listAllRecords<Employee>("employees");
  }

  // Alias for compatibility
  async getEmployees(): Promise<Employee[]> {
    return this.listEmployees();
  }

  // ======= USERS =======
  async updateUser(
    id: string,
    data: Partial<InsertUser>,
  ): Promise<User | undefined> {
    this.updateRecord("users", id, data);
    return this.getUser(id);
  }

  async deleteUser(id: string): Promise<void> {
    this.deleteRecord("users", id);
  }

  async listUsers(): Promise<User[]> {
    return this.listAllRecords<User>("users");
  }

  // ======= ADDITIONAL QUERY METHODS =======
  async getUsersByEmail(email: string): Promise<User[]> {
    const rows = this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .all(email) as any[];

    return rows.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const rows = this.db
      .prepare("SELECT * FROM orders WHERE customerId = ?")
      .all(customerId) as any[];

    return rows.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      items: row.items ? JSON.parse(row.items) : [],
      shippingAddress: row.shippingAddress
        ? JSON.parse(row.shippingAddress)
        : null,
    }));
  }

  // ======= UTILITY METHODS =======
  async getBarcodeByCode(code: string): Promise<Barcode | undefined> {
    const row = this.db
      .prepare("SELECT * FROM barcodes WHERE code = ?")
      .get(code) as any;

    return row
      ? {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }
      : undefined;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    // Search by email OR employeeId so users can log in with either
    const row = this.db
      .prepare("SELECT * FROM employees WHERE email = ? OR employeeId = ?")
      .get(email, email) as any;

    return row
      ? {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }
      : undefined;
  }

  async getDeliveriesByOrder(orderId: string): Promise<Delivery[]> {
    const rows = this.db
      .prepare("SELECT * FROM deliveries WHERE orderId = ?")
      .all(orderId) as any[];

    return rows.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      location: row.location ? JSON.parse(row.location) : null,
      route: row.route ? JSON.parse(row.route) : [],
    }));
  }

  async getShipmentsByOrder(orderId: string): Promise<Shipment[]> {
    const rows = this.db
      // Since orderIds is a JSON array string like ["abc","def"], use LIKE for simple search
      .prepare("SELECT * FROM shipments WHERE orderIds LIKE '%' || ? || '%'")
      .all(orderId) as any[];

    return rows.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  // Add the dashboard metrics method that MemStorage has
  async getDashboardMetrics() {
    const orders = await this.listOrders();
    const posTransactions = await this.listPosTransactions();
    const deliveries = await this.listDeliveries();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = orders.filter(
      (order) => order.createdAt && new Date(order.createdAt) >= today,
    ).length;

    const posTransactionsToday = posTransactions.filter(
      (transaction) =>
        transaction.createdAt && new Date(transaction.createdAt) >= today,
    ).length;

    const totalRevenue = orders.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount || "0"),
      0,
    );

    const dailyRevenue = orders
      .filter((order) => order.createdAt && new Date(order.createdAt) >= today)
      .reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0);

    const averageOrderValue =
      orders.length > 0 ? totalRevenue / orders.length : 0;

    const completedDeliveries = deliveries.filter(
      (delivery) => delivery.status === "delivered",
    );

    const onTimeDeliveries = completedDeliveries.filter((delivery) => {
      if (!delivery.actualDelivery || !delivery.createdAt) return false;

      // Assume 24 hours is the standard delivery time
      const expectedDelivery = new Date(delivery.createdAt);
      expectedDelivery.setHours(expectedDelivery.getHours() + 24);

      return new Date(delivery.actualDelivery) <= expectedDelivery;
    });

    const onTimeDelivery =
      completedDeliveries.length > 0
        ? (onTimeDeliveries.length / completedDeliveries.length) * 100
        : 98.7;

    return {
      totalRevenue,
      averageOrderValue,
      onTimeDelivery,
      inventoryTurnover: 4.2, // Static value for now
      ordersToday,
      posTransactionsToday,
      dailyRevenue,
    };
  }

  // Add method for barcode queries that routes expect
  async getBarcodesByEntity(
    entityType: string,
    entityId: string,
  ): Promise<Barcode[]> {
    const rows = this.db
      .prepare("SELECT * FROM barcodes WHERE entityType = ? AND entityId = ?")
      .all(entityType, entityId) as any[];

    return rows.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  // ======= SETTINGS =======
  async getAllSettings(): Promise<any[]> {
    const rows = this.db
      .prepare("SELECT * FROM settings ORDER BY category, key")
      .all() as any[];

    return rows.map((row) => {
      let value = row.value;
      try {
        value = JSON.parse(row.value);
      } catch (e) {
        console.warn(`Failed to parse setting value for key ${row.key}:`, e);
        // Fallback to raw string if parsing fails
      }
      return {
        ...row,
        value,
        updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
      };
    });
  }

  async getSettingsByCategory(category: string): Promise<any[]> {
    const rows = this.db
      .prepare("SELECT * FROM settings WHERE category = ? ORDER BY key")
      .all(category) as any[];

    return rows.map((row) => {
      let value = row.value;
      try {
        value = JSON.parse(row.value);
      } catch (e) {
        console.warn(`Failed to parse setting value for key ${row.key}:`, e);
      }
      return {
        ...row,
        value,
        updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
      };
    });
  }

  async getSetting(key: string): Promise<any | null> {
    const row = this.db
      .prepare("SELECT * FROM settings WHERE key = ?")
      .get(key) as any;

    if (!row) return null;

    let value = row.value;
    try {
      value = JSON.parse(row.value);
    } catch (e) {
      console.warn(`Failed to parse setting value for key ${row.key}:`, e);
    }

    return {
      ...row,
      value,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
    };
  }

  async updateSetting(
    key: string,
    value: any,
    category: string,
    updatedBy?: string
  ): Promise<any> {
    const now = new Date().toISOString();
    const existingSetting = await this.getSetting(key);

    if (existingSetting) {
      this.db
        .prepare(
          `UPDATE settings
           SET value = ?, updatedAt = ?, updatedBy = ?
           WHERE key = ?`
        )
        .run(JSON.stringify(value), now, updatedBy || "system", key);
    } else {
      const id = randomUUID();
      this.db
        .prepare(
          `INSERT INTO settings (id, key, value, category, updatedAt, updatedBy)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(id, key, JSON.stringify(value), category, now, updatedBy || "system");
    }

    return this.getSetting(key);
  }

  async updateSettings(settings: Array<{ key: string; value: any; category: string }>, updatedBy?: string): Promise<any[]> {
    const now = new Date().toISOString();

    for (const setting of settings) {
      const existingSetting = await this.getSetting(setting.key);

      if (existingSetting) {
        this.db
          .prepare(
            `UPDATE settings
             SET value = ?, updatedAt = ?, updatedBy = ?
             WHERE key = ?`
          )
          .run(JSON.stringify(setting.value), now, updatedBy || "system", setting.key);
      } else {
        const id = randomUUID();
        this.db
          .prepare(
            `INSERT INTO settings (id, key, value, category, updatedAt, updatedBy)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(id, setting.key, JSON.stringify(setting.value), setting.category, now, updatedBy || "system");
      }
    }

    return this.getAllSettings();
  }

  async deleteSetting(key: string): Promise<void> {
    this.db.prepare("DELETE FROM settings WHERE key = ?").run(key);
  }

  async deleteAllSettings(): Promise<void> {
    this.db.prepare("DELETE FROM settings").run();
  }

  // ======= TRANSIT ORDERS =======
  async createTransitOrder(data: any): Promise<any> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const transitOrder = {
      id,
      ...data,
      orders: typeof data.orders === 'string' ? data.orders : JSON.stringify(data.orders || []),
      storeDetails: typeof data.storeDetails === 'string' ? data.storeDetails : JSON.stringify(data.storeDetails || {}),
      factoryDetails: typeof data.factoryDetails === 'string' ? data.factoryDetails : JSON.stringify(data.factoryDetails || {}),
      createdAt: now,
      updatedAt: now,
    };

    const keys = Object.keys(transitOrder);
    const values = Object.values(transitOrder);
    const placeholders = keys.map(() => '?').join(',');

    this.db
      .prepare(`INSERT INTO transit_orders (${keys.join(',')}) VALUES (${placeholders})`)
      .run(...values);

    // Add status history
    await this.addTransitStatusHistory(id, data.status, 'Transit order created', data.createdBy);

    return this.getTransitOrder(id);
  }

  async getTransitOrder(id: string): Promise<any | undefined> {
    const row = this.db
      .prepare('SELECT * FROM transit_orders WHERE id = ?')
      .get(id) as any;

    if (!row) return undefined;

    return {
      ...row,
      orders: row.orders ? JSON.parse(row.orders) : [],
      storeDetails: row.storeDetails ? JSON.parse(row.storeDetails) : {},
      factoryDetails: row.factoryDetails ? JSON.parse(row.factoryDetails) : {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : null,
      dispatchedAt: row.dispatchedAt ? new Date(row.dispatchedAt) : null,
      receivedAt: row.receivedAt ? new Date(row.receivedAt) : null,
    };
  }

  async getTransitOrderByTransitId(transitId: string): Promise<any | undefined> {
    const row = this.db
      .prepare('SELECT * FROM transit_orders WHERE transitId = ?')
      .get(transitId) as any;

    if (!row) return undefined;

    return {
      ...row,
      orders: row.orders ? JSON.parse(row.orders) : [],
      storeDetails: row.storeDetails ? JSON.parse(row.storeDetails) : {},
      factoryDetails: row.factoryDetails ? JSON.parse(row.factoryDetails) : {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : null,
      dispatchedAt: row.dispatchedAt ? new Date(row.dispatchedAt) : null,
      receivedAt: row.receivedAt ? new Date(row.receivedAt) : null,
    };
  }

  async updateTransitOrder(id: string, data: any): Promise<any | undefined> {
    const now = new Date().toISOString();
    const processedData = { ...data };

    if (processedData.orders) {
      processedData.orders = typeof processedData.orders === 'string'
        ? processedData.orders
        : JSON.stringify(processedData.orders);
    }
    if (processedData.storeDetails) {
      processedData.storeDetails = typeof processedData.storeDetails === 'string'
        ? processedData.storeDetails
        : JSON.stringify(processedData.storeDetails);
    }
    if (processedData.factoryDetails) {
      processedData.factoryDetails = typeof processedData.factoryDetails === 'string'
        ? processedData.factoryDetails
        : JSON.stringify(processedData.factoryDetails);
    }

    const keys = Object.keys(processedData);
    if (!keys.length) return this.getTransitOrder(id);

    const setStmt = keys.map((k) => `${k} = ?`).join(', ') + ', updatedAt = ?';
    const values = [...Object.values(processedData), now, id];

    this.db
      .prepare(`UPDATE transit_orders SET ${setStmt} WHERE id = ?`)
      .run(...values);

    // Add status history if status changed
    if (data.status) {
      await this.addTransitStatusHistory(id, data.status, data.notes || 'Status updated', data.updatedBy);
    }

    return this.getTransitOrder(id);
  }

  async deleteTransitOrder(id: string): Promise<boolean> {
    try {
      this.db.prepare('DELETE FROM transit_orders WHERE id = ?').run(id);
      return true;
    } catch {
      return false;
    }
  }

  async listTransitOrders(): Promise<any[]> {
    const rows = this.db
      .prepare('SELECT * FROM transit_orders ORDER BY createdAt DESC')
      .all() as any[];

    return rows.map((row) => ({
      ...row,
      orders: row.orders ? JSON.parse(row.orders) : [],
      storeDetails: row.storeDetails ? JSON.parse(row.storeDetails) : {},
      factoryDetails: row.factoryDetails ? JSON.parse(row.factoryDetails) : {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : null,
      dispatchedAt: row.dispatchedAt ? new Date(row.dispatchedAt) : null,
      receivedAt: row.receivedAt ? new Date(row.receivedAt) : null,
    }));
  }

  async getTransitOrdersByStatus(status: string): Promise<any[]> {
    const rows = this.db
      .prepare('SELECT * FROM transit_orders WHERE status = ? ORDER BY createdAt DESC')
      .all(status) as any[];

    return rows.map((row) => ({
      ...row,
      orders: row.orders ? JSON.parse(row.orders) : [],
      storeDetails: row.storeDetails ? JSON.parse(row.storeDetails) : {},
      factoryDetails: row.factoryDetails ? JSON.parse(row.factoryDetails) : {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : null,
      dispatchedAt: row.dispatchedAt ? new Date(row.dispatchedAt) : null,
      receivedAt: row.receivedAt ? new Date(row.receivedAt) : null,
    }));
  }

  async getTransitOrdersByType(type: string): Promise<any[]> {
    const rows = this.db
      .prepare('SELECT * FROM transit_orders WHERE type = ? ORDER BY createdAt DESC')
      .all(type) as any[];

    return rows.map((row) => ({
      ...row,
      orders: row.orders ? JSON.parse(row.orders) : [],
      storeDetails: row.storeDetails ? JSON.parse(row.storeDetails) : {},
      factoryDetails: row.factoryDetails ? JSON.parse(row.factoryDetails) : {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : null,
      dispatchedAt: row.dispatchedAt ? new Date(row.dispatchedAt) : null,
      receivedAt: row.receivedAt ? new Date(row.receivedAt) : null,
    }));
  }

  // ======= TRANSIT STATUS HISTORY =======
  async addTransitStatusHistory(
    transitOrderId: string,
    status: string,
    notes?: string,
    updatedBy?: string,
    location?: { latitude?: number; longitude?: number }
  ): Promise<void> {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO transit_status_history
        (id, transitOrderId, status, notes, location, updatedBy, latitude, longitude, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        transitOrderId,
        status,
        notes || null,
        location ? JSON.stringify(location) : null,
        updatedBy || null,
        location?.latitude || null,
        location?.longitude || null,
        now
      );
  }

  async getTransitStatusHistory(transitOrderId: string): Promise<any[]> {
    const rows = this.db
      .prepare('SELECT * FROM transit_status_history WHERE transitOrderId = ? ORDER BY createdAt DESC')
      .all(transitOrderId) as any[];

    return rows.map((row) => ({
      ...row,
      location: row.location ? JSON.parse(row.location) : null,
      createdAt: new Date(row.createdAt),
    }));
  }

  // ======= TRANSIT ORDER ITEMS =======
  async addTransitOrderItem(data: any): Promise<any> {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO transit_order_items
        (id, transitOrderId, orderId, orderNumber, customerId, customerName, itemCount, weight, serviceType, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.transitOrderId,
        data.orderId,
        data.orderNumber,
        data.customerId,
        data.customerName,
        data.itemCount || 0,
        data.weight || 0,
        data.serviceType || null,
        data.status,
        now,
        now
      );

    return this.db.prepare('SELECT * FROM transit_order_items WHERE id = ?').get(id);
  }

  async getTransitOrderItems(transitOrderId: string): Promise<any[]> {
    const rows = this.db
      .prepare('SELECT * FROM transit_order_items WHERE transitOrderId = ?')
      .all(transitOrderId) as any[];

    return rows.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  // ======= GST CONFIGURATION =======
  async createGSTConfig(data: any): Promise<any> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const gstConfig = {
      id,
      ...data,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    };

    const keys = Object.keys(gstConfig);
    const values = Object.values(gstConfig);
    const placeholders = keys.map(() => '?').join(',');

    this.db
      .prepare(`INSERT INTO gst_config (${keys.join(',')}) VALUES (${placeholders})`)
      .run(...values);

    return this.getGSTConfig(id);
  }

  async getGSTConfig(id: string): Promise<any | undefined> {
    const row = this.db
      .prepare('SELECT * FROM gst_config WHERE id = ?')
      .get(id) as any;

    if (!row) return undefined;

    return {
      ...row,
      isActive: row.isActive === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async getActiveGSTConfig(): Promise<any | undefined> {
    const row = this.db
      .prepare('SELECT * FROM gst_config WHERE isActive = 1 ORDER BY createdAt DESC LIMIT 1')
      .get() as any;

    if (!row) return undefined;

    return {
      ...row,
      isActive: row.isActive === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async updateGSTConfig(id: string, data: any): Promise<any | undefined> {
    const now = new Date().toISOString();
    const keys = Object.keys(data);
    if (!keys.length) return this.getGSTConfig(id);

    const setStmt = keys.map((k) => `${k} = ?`).join(', ') + ', updatedAt = ?';
    const values = [...Object.values(data), now, id];

    this.db
      .prepare(`UPDATE gst_config SET ${setStmt} WHERE id = ?`)
      .run(...values);

    return this.getGSTConfig(id);
  }

  async listGSTConfigs(): Promise<any[]> {
    const rows = this.db
      .prepare('SELECT * FROM gst_config ORDER BY createdAt DESC')
      .all() as any[];

    return rows.map((row) => ({
      ...row,
      isActive: row.isActive === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async deleteGSTConfig(id: string): Promise<boolean> {
    try {
      this.db.prepare('DELETE FROM gst_config WHERE id = ?').run(id);
      return true;
    } catch {
      return false;
    }
  }

  // ======= DRIVERS =======
  async createDriver(data: InsertDriver): Promise<Driver> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const driver = {
      id,
      ...data,
      status: data.status || 'available',
      rating: data.rating || 5.0,
      totalDeliveries: data.totalDeliveries || 0,
      totalEarnings: data.totalEarnings || 0,
      experience: data.experience || 0,
      lastActive: data.lastActive || now,
      specialties: data.specialties ? JSON.stringify(data.specialties) : '[]',
      createdAt: now,
      updatedAt: now,
    };

    this.db
      .prepare(
        `
        INSERT INTO drivers (
          id, name, phone, email, licenseNumber, vehicleNumber, vehicleType, 
          vehicleModel, status, rating, totalDeliveries, totalEarnings,
          currentLatitude, currentLongitude, lastActive, experience, 
          specialties, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        driver.id,
        driver.name,
        driver.phone,
        driver.email,
        driver.licenseNumber,
        driver.vehicleNumber,
        driver.vehicleType,
        driver.vehicleModel,
        driver.status,
        driver.rating,
        driver.totalDeliveries,
        driver.totalEarnings,
        driver.currentLatitude,
        driver.currentLongitude,
        driver.lastActive,
        driver.experience,
        driver.specialties,
        driver.createdAt,
        driver.updatedAt,
      );

    const newDriver = await this.getDriver(id);
    return newDriver!;
  }

  async getDriver(id: string): Promise<Driver | null> {
    const row = this.db
      .prepare('SELECT * FROM drivers WHERE id = ?')
      .get(id) as any;

    if (!row) return null;

    return {
      ...row,
      specialties: row.specialties ? JSON.parse(row.specialties) : [],
    };
  }

  async listDrivers(): Promise<Driver[]> {
    const rows = this.db
      .prepare('SELECT * FROM drivers ORDER BY createdAt DESC')
      .all() as any[];

    return rows.map((row) => ({
      ...row,
      specialties: row.specialties ? JSON.parse(row.specialties) : [],
    }));
  }

  async updateDriver(id: string, data: Partial<InsertDriver>): Promise<Driver | null> {
    const existing = this.getDriver(id);
    if (!existing) return null;

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const setStmt = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updateData);

    // Handle specialties serialization
    if (updateData.specialties) {
      const specialtiesIndex = Object.keys(updateData).indexOf('specialties');
      values[specialtiesIndex] = JSON.stringify(updateData.specialties);
    }

    this.db
      .prepare(`UPDATE drivers SET ${setStmt} WHERE id = ?`)
      .run(...values, id);

    return this.getDriver(id);
  }

  async deleteDriver(id: string): Promise<boolean> {
    try {
      this.db.prepare('DELETE FROM drivers WHERE id = ?').run(id);
      return true;
    } catch {
      return false;
    }
  }

  async getDriversByStatus(status: string): Promise<Driver[]> {
    const rows = this.db
      .prepare('SELECT * FROM drivers WHERE status = ? ORDER BY createdAt DESC')
      .all(status) as any[];

    return rows.map((row) => ({
      ...row,
      specialties: row.specialties ? JSON.parse(row.specialties) : [],
    }));
  }

  async updateDriverLocation(id: string, latitude: number, longitude: number): Promise<Driver | null> {
    const now = new Date().toISOString();

    this.db
      .prepare(
        'UPDATE drivers SET currentLatitude = ?, currentLongitude = ?, lastActive = ?, updatedAt = ? WHERE id = ?'
      )
      .run(latitude, longitude, now, now, id);

    return this.getDriver(id);
  }

  // ======= AUTHENTICATION METHODS =======

  async createAuthUser(data: {
    email: string;
    passwordHash: string;
    role?: string;
    name?: string;
  }): Promise<{ id: string; email: string; role: string; name?: string }> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const role = data.role || 'user';

    this.db
      .prepare(
        `INSERT INTO auth_users (id, email, password_hash, role, name, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .run(id, data.email, data.passwordHash, role, data.name || null, now, now);

    return { id, email: data.email, role, name: data.name };
  }

  async getAuthUserByEmail(email: string): Promise<{
    id: string;
    email: string;
    password_hash: string;
    role: string;
    name?: string;
    is_active: number;
  } | null> {
    const row = this.db
      .prepare('SELECT * FROM auth_users WHERE email = ?')
      .get(email) as any;

    return row || null;
  }

  async getAuthUserById(id: string): Promise<{
    id: string;
    email: string;
    role: string;
    name?: string;
    is_active: number;
  } | null> {
    const row = this.db
      .prepare('SELECT id, email, role, name, is_active FROM auth_users WHERE id = ?')
      .get(id) as any;

    return row || null;
  }

  async updateAuthUserLastLogin(userId: string): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare('UPDATE auth_users SET last_login = ?, updated_at = ? WHERE id = ?')
      .run(now, now, userId);
  }

  async createSession(data: {
    userId: string;
    token: string;
    refreshToken: string;
    expiresAt: string;
  }): Promise<void> {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO auth_sessions (id, user_id, token, refresh_token, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, data.userId, data.token, data.refreshToken, data.expiresAt, now);
  }

  async getSessionByToken(token: string): Promise<{
    id: string;
    user_id: string;
    token: string;
    refresh_token: string;
    expires_at: string;
  } | null> {
    const row = this.db
      .prepare('SELECT * FROM auth_sessions WHERE token = ?')
      .get(token) as any;

    return row || null;
  }

  async getSessionByRefreshToken(refreshToken: string): Promise<{
    id: string;
    user_id: string;
    token: string;
    refresh_token: string;
    expires_at: string;
  } | null> {
    const row = this.db
      .prepare('SELECT * FROM auth_sessions WHERE refresh_token = ?')
      .get(refreshToken) as any;

    return row || null;
  }

  async deleteSession(token: string): Promise<void> {
    this.db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
  }

  async deleteSessionByRefreshToken(refreshToken: string): Promise<void> {
    this.db.prepare('DELETE FROM auth_sessions WHERE refresh_token = ?').run(refreshToken);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    this.db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date().toISOString();
    this.db.prepare('DELETE FROM auth_sessions WHERE expires_at < ?').run(now);
  }

  // ======= FRANCHISES =======
  async createFranchise(data: any): Promise<any> {
    const id = this.insertRecord("franchises", data);
    return this.getRecord("franchises", id);
  }

  async listFranchises(): Promise<any[]> {
    return this.listAllRecords("franchises");
  }

  async getFranchise(id: string): Promise<any | undefined> {
    return this.getRecord("franchises", id);
  }

  async updateFranchise(id: string, data: any): Promise<any | undefined> {
    this.updateRecord("franchises", id, data);
    return this.getFranchise(id);
  }

  async deleteFranchise(id: string): Promise<boolean> {
    try {
      this.deleteRecord("franchises", id);
      return true;
    } catch {
      return false;
    }
  }

  // ======= TASKS =======
  async createTask(data: any): Promise<any> {
    const id = this.insertRecord("employee_tasks", data);
    return this.getRecord("employee_tasks", id);
  }

  async listTasks(franchiseId?: string, employeeId?: string): Promise<any[]> {
    let tasks = this.listAllRecords<any>("employee_tasks");
    if (franchiseId) {
      tasks = tasks.filter(t => t.franchiseId === franchiseId);
    }
    if (employeeId) {
      tasks = tasks.filter(t => t.employeeId === employeeId);
    }
    return tasks;
  }

  async updateTask(id: string, data: any): Promise<any | undefined> {
    this.updateRecord("employee_tasks", id, data);
    return this.getRecord("employee_tasks", id);
  }

  // ======= ATTENDANCE =======
  async createAttendance(data: any): Promise<any> {
    const id = this.insertRecord("employee_attendance", data);
    return this.getRecord("employee_attendance", id);
  }

  async listAttendance(franchiseId?: string, employeeId?: string, date?: Date): Promise<any[]> {
    let attendance = this.listAllRecords<any>("employee_attendance");

    if (franchiseId) {
      attendance = attendance.filter(a => a.franchiseId === franchiseId);
    }

    if (employeeId) {
      attendance = attendance.filter(a => a.employeeId === employeeId);
    }

    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      attendance = attendance.filter(a => {
        const aDate = new Date(a.date).toISOString().split('T')[0];
        return aDate === dateStr;
      });
    }

    return attendance;
  }

  async updateAttendance(id: string, data: any): Promise<any> {
    this.updateRecord("employee_attendance", id, data);
    return this.getRecord("employee_attendance", id);
  }

  // Document methods
  async createDocument(data: any) {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO documents (
        id, franchiseId, type, title, filename, filepath, fileUrl, 
        status, amount, customerName, orderNumber, metadata, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      data.franchiseId,
      data.type,
      data.title,
      data.filename,
      data.filepath,
      data.fileUrl,
      data.status,
      data.amount,
      data.customerName,
      data.orderNumber,
      JSON.stringify(data.metadata || {}),
      now,
      now
    );

    return this.getDocument(id);
  }

  async listDocuments(filters: any = {}) {
    let query = "SELECT * FROM documents WHERE 1=1";
    const params: any[] = [];

    if (filters.type) {
      query += " AND type = ?";
      params.push(filters.type);
    }

    if (filters.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    query += " ORDER BY createdAt DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }

    const stmt = this.db.prepare(query);
    const docs = stmt.all(...params);

    return docs.map((doc: any) => ({
      ...doc,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : {}
    }));
  }

  async getDocument(id: string) {
    const stmt = this.db.prepare("SELECT * FROM documents WHERE id = ?");
    const doc = stmt.get(id) as any;

    if (doc) {
      return {
        ...doc,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {}
      };
    }
    return null;
  }

  async deleteDocument(id: string) {
    const stmt = this.db.prepare("DELETE FROM documents WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Close database connection
  close(): void {
    this.db.close();
  }

  /**
   * Generate next transit ID for SQLite
   * Format: TRN-2025POL001A-F
   */
  async getNextTransitId(franchiseId?: string, type: 'To Factory' | 'Return to Store' | string = 'To Factory'): Promise<string> {
    const branchCode = this.getBranchCode(franchiseId);
    const currentYear = new Date().getFullYear();

    // Direction indicator: F (To Factory) or S (To Store)
    const direction = type === 'To Factory' || type === 'store_to_factory' ? 'F' : 'S';

    // Simple unique ID generation for SQLite (using timestamp and sequence fallback)
    // Since we don't have atomic sequences in SQLite easily without extra tables
    const timestamp = Date.now();
    const sequence = (timestamp % 999) + 1;
    const paddedSequence = String(sequence).padStart(3, '0');
    const suffix = 'A';

    return `TRN-${currentYear}${branchCode}${paddedSequence}${suffix}-${direction}`;
  }

  // Helper to get branch code (duplicated helper for SQLite context)
  private getBranchCode(franchiseId?: string): string {
    if (!franchiseId) return 'FAB';

    const branchCodes: Record<string, string> = {
      'pollachi': 'POL',
      'kinathukadavu': 'KIN',
      'coimbatore': 'CBE',
    };

    let normalizedId = franchiseId.toLowerCase().trim();
    if (normalizedId.startsWith('franchise-')) {
      normalizedId = normalizedId.replace('franchise-', '');
    }

    return branchCodes[normalizedId] || normalizedId.substring(0, 3).toUpperCase();
  }

  async updateTransitStatus(id: string, status: string, notes?: string, location?: string, updatedBy?: string): Promise<any> {
    const now = new Date().toISOString();

    // Update main order status
    this.db.prepare(
      "UPDATE transit_orders SET status = ?, updatedAt = ? WHERE id = ?"
    ).run(status, now, id);

    // Add history entry
    const historyId = randomUUID();

    // Check if table exists (it should based on schema)
    try {
      this.db.prepare(`
        INSERT INTO transit_status_history (id, transitOrderId, status, notes, location, updatedBy, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(historyId, id, status, notes || null, location || null, updatedBy || null, now);
    } catch (e) {
      console.warn("Could not write status history for SQLite:", e);
    }

    return this.getRecord('transit_orders', id);
  }

  // ===========================================
  // CREDIT TRANSACTION METHODS (ACID Compliant)
  // ===========================================

  /**
   * Process a credit transaction with full ACID compliance.
   * Steps: Validate -> Update Customer Balance -> Create Transaction Record -> Create Audit Log
   * All within a single SQLite transaction.
   */
  async processCreditTransaction(data: {
    customerId: string;
    amount: number;
    type: 'credit' | 'payment' | 'adjustment';
    reason: string;
    reference?: string;
    franchiseId?: string;
    employeeId?: string;
    employeeName?: string;
    orderId?: string;
    paymentMethod?: string;
  }): Promise<any> {
    const { customerId, amount, type, reason, reference, franchiseId, employeeId, employeeName, orderId, paymentMethod } = data;

    // STEP A: Validate Input
    if (!customerId || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid transaction data: customerId and positive amount are required');
    }
    if (!['credit', 'payment', 'adjustment'].includes(type)) {
      throw new Error('Invalid transaction type');
    }

    // Use SQLite transaction for atomicity
    const txn = this.db.transaction(() => {
      // STEP B: Get current customer balance and update it
      const customer = this.db.prepare("SELECT * FROM customers WHERE id = ?").get(customerId) as any;
      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      const currentBalance = parseFloat(customer.creditBalance || '0');
      let newBalance: number;

      // Calculate new balance based on transaction type
      // Credit/Adjustment ADD to the balance (customer owes more or gets store credit)
      // Payment SUBTRACTS from the balance (customer pays off debt)
      if (type === 'payment') {
        newBalance = currentBalance - amount;
      } else {
        // credit or adjustment
        newBalance = currentBalance + amount;
      }

      // Update customer balance
      this.db.prepare(
        "UPDATE customers SET creditBalance = ?, updatedAt = ? WHERE id = ?"
      ).run(newBalance.toFixed(2), new Date().toISOString(), customerId);

      // STEP C: Create Transaction Record
      const txnId = randomUUID();
      const now = new Date().toISOString();

      this.db.prepare(`
        INSERT INTO credit_transactions 
        (id, franchiseId, customerId, orderId, type, amount, balanceAfter, paymentMethod, referenceNumber, notes, reason, recordedBy, recordedByName, transactionDate, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        txnId,
        franchiseId || null,
        customerId,
        orderId || null,
        type,
        amount.toFixed(2),
        newBalance.toFixed(2),
        paymentMethod || null,
        reference || null,
        reason || null,
        reason || null,
        employeeId || null,
        employeeName || null,
        now,
        now
      );

      // STEP D: Create Audit Log Entry
      const auditId = randomUUID();
      this.db.prepare(`
        INSERT INTO audit_logs (id, franchiseId, employeeId, action, entityType, entityId, details, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        auditId,
        franchiseId || null,
        employeeId || null,
        `credit_${type}`,
        'credit_transaction',
        txnId,
        JSON.stringify({
          customerId,
          customerName: customer.name,
          amount: amount.toFixed(2),
          type,
          previousBalance: currentBalance.toFixed(2),
          newBalance: newBalance.toFixed(2),
          reason,
          reference,
          orderId
        }),
        now
      );

      return {
        id: txnId,
        customerId,
        customerName: customer.name,
        type,
        amount: amount.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        previousBalance: currentBalance.toFixed(2),
        reason,
        reference,
        createdAt: now
      };
    });

    // Execute the transaction - if any step fails, everything rolls back
    return txn();
  }

  /**
   * Get credit transactions with optional filters
   */
  async getCreditTransactions(filters: {
    franchiseId?: string;
    customerId?: string;
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const { franchiseId, customerId, type, search, limit = 100, offset = 0 } = filters;

    let sql = `
      SELECT 
        ct.*,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail
      FROM credit_transactions ct
      LEFT JOIN customers c ON ct.customerId = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (franchiseId) {
      sql += " AND ct.franchiseId = ?";
      params.push(franchiseId);
    }

    if (customerId) {
      sql += " AND ct.customerId = ?";
      params.push(customerId);
    }

    if (type && type !== 'all') {
      sql += " AND ct.type = ?";
      params.push(type);
    }

    if (search) {
      sql += " AND (c.name LIKE ? OR c.phone LIKE ? OR ct.reason LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += " ORDER BY ct.createdAt DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const stmt = this.db.prepare(sql);
    const results = stmt.all(...params) as any[];

    return results.map(row => ({
      ...row,
      amount: parseFloat(row.amount || '0'),
      balanceAfter: parseFloat(row.balanceAfter || '0')
    }));
  }

  /**
   * Get credit statistics for dashboard KPIs
   */
  async getCreditStats(franchiseId?: string): Promise<{
    totalOutstanding: number;
    activeCustomers: number;
    monthlyCreditGiven: number;
    monthlyCreditUsed: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Total outstanding (sum of all positive credit balances)
    let outstandingSql = "SELECT COALESCE(SUM(CAST(creditBalance AS REAL)), 0) as total FROM customers WHERE CAST(creditBalance AS REAL) > 0";
    let activeCustomersSql = "SELECT COUNT(*) as count FROM customers WHERE CAST(creditBalance AS REAL) != 0";
    const outstandingParams: any[] = [];
    const activeParams: any[] = [];

    if (franchiseId) {
      outstandingSql += " AND franchiseId = ?";
      activeCustomersSql += " AND franchiseId = ?";
      outstandingParams.push(franchiseId);
      activeParams.push(franchiseId);
    }

    const outstanding = this.db.prepare(outstandingSql).get(...outstandingParams) as any;
    const activeCustomers = this.db.prepare(activeCustomersSql).get(...activeParams) as any;

    // Monthly credit given (credits added this month)
    let creditGivenSql = `
      SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as total 
      FROM credit_transactions 
      WHERE type = 'credit' AND createdAt >= ?
    `;
    const creditGivenParams: any[] = [startOfMonth];

    if (franchiseId) {
      creditGivenSql += " AND franchiseId = ?";
      creditGivenParams.push(franchiseId);
    }

    const creditGiven = this.db.prepare(creditGivenSql).get(...creditGivenParams) as any;

    // Monthly credit used/payments (payments and usage this month)
    let creditUsedSql = `
      SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as total 
      FROM credit_transactions 
      WHERE type IN ('payment', 'usage') AND createdAt >= ?
    `;
    const creditUsedParams: any[] = [startOfMonth];

    if (franchiseId) {
      creditUsedSql += " AND franchiseId = ?";
      creditUsedParams.push(franchiseId);
    }

    const creditUsed = this.db.prepare(creditUsedSql).get(...creditUsedParams) as any;

    return {
      totalOutstanding: parseFloat(outstanding?.total || '0'),
      activeCustomers: parseInt(activeCustomers?.count || '0'),
      monthlyCreditGiven: parseFloat(creditGiven?.total || '0'),
      monthlyCreditUsed: parseFloat(creditUsed?.total || '0')
    };
  }

  /**
   * Get customers with outstanding credit balances
   */
  async getOutstandingCreditCustomers(franchiseId?: string): Promise<any[]> {
    let sql = `
      SELECT 
        id,
        name,
        phone,
        email,
        CAST(creditBalance AS REAL) as creditBalance,
        totalOrders,
        lastOrder,
        createdAt
      FROM customers 
      WHERE CAST(creditBalance AS REAL) > 0
    `;
    const params: any[] = [];

    if (franchiseId) {
      sql += " AND franchiseId = ?";
      params.push(franchiseId);
    }

    sql += " ORDER BY CAST(creditBalance AS REAL) DESC";

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as any[];
  }
}
