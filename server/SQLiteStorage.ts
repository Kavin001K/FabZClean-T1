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
    this.createTables();
  }

  private createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        sku TEXT,
        category TEXT,
        description TEXT,
        price TEXT,
        stockQuantity INTEGER,
        reorderLevel INTEGER,
        supplier TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        totalOrders INTEGER,
        totalSpent TEXT,
        lastOrder TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );

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
        paymentStatus TEXT,
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
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (customerId) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        orderId TEXT,
        status TEXT,
        deliveredAt TEXT,
        driverName TEXT,
        vehicleId TEXT,
        estimatedDelivery TEXT,
        actualDelivery TEXT,
        location TEXT,
        route TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (orderId) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS posTransactions (
        id TEXT PRIMARY KEY,
        orderId TEXT,
        amount TEXT,
        paymentMethod TEXT,
        transactionNumber TEXT,
        items TEXT,
        cashierId TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (orderId) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        price TEXT,
        category TEXT,
        duration TEXT,
        status TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY,
        orderId TEXT,
        trackingNumber TEXT,
        carrier TEXT,
        status TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (orderId) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS barcodes (
        id TEXT PRIMARY KEY,
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
        FOREIGN KEY (productId) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT,
        role TEXT,
        email TEXT UNIQUE,
        password TEXT,
        createdAt TEXT,
        updatedAt TEXT
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
      CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(orderId);
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
    `);
  }

  // ======= USERS =======
  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `
        INSERT INTO users (id, username, password, email, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .run(id, data.username, data.password, data.email, now, now);

    return {
      id,
      ...data,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
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

  // ======= GENERIC CRUD HELPERS =======
  private insertRecord<T extends Record<string, any>>(
    table: string,
    data: T & { id?: string },
  ): string {
    const id = data.id ?? randomUUID();
    const now = new Date().toISOString();

    const dataWithTimestamps = { ...data, id, createdAt: now, updatedAt: now };

    // Handle JSON fields for certain tables
    if (table === "orders" && dataWithTimestamps.items) {
      dataWithTimestamps.items =
        typeof dataWithTimestamps.items === "string"
          ? dataWithTimestamps.items
          : JSON.stringify(dataWithTimestamps.items);
    }
    if (table === "orders" && dataWithTimestamps.shippingAddress) {
      dataWithTimestamps.shippingAddress =
        typeof dataWithTimestamps.shippingAddress === "string"
          ? dataWithTimestamps.shippingAddress
          : JSON.stringify(dataWithTimestamps.shippingAddress);
    }
    if (table === "deliveries" && dataWithTimestamps.location) {
      dataWithTimestamps.location =
        typeof dataWithTimestamps.location === "string"
          ? dataWithTimestamps.location
          : JSON.stringify(dataWithTimestamps.location);
    }
    if (table === "deliveries" && dataWithTimestamps.route) {
      dataWithTimestamps.route =
        typeof dataWithTimestamps.route === "string"
          ? dataWithTimestamps.route
          : JSON.stringify(dataWithTimestamps.route);
    }
    if (table === "posTransactions" && dataWithTimestamps.items) {
      dataWithTimestamps.items =
        typeof dataWithTimestamps.items === "string"
          ? dataWithTimestamps.items
          : JSON.stringify(dataWithTimestamps.items);
    }
    // Handle customers table JSON fields
    if (table === "customers" && dataWithTimestamps.address) {
      dataWithTimestamps.address =
        typeof dataWithTimestamps.address === "string"
          ? dataWithTimestamps.address
          : JSON.stringify(dataWithTimestamps.address);
    }
    if (table === "customers" && dataWithTimestamps.segments) {
      dataWithTimestamps.segments =
        typeof dataWithTimestamps.segments === "string"
          ? dataWithTimestamps.segments
          : JSON.stringify(dataWithTimestamps.segments);
    }

    const keys = Object.keys(dataWithTimestamps);
    const values = Object.values(dataWithTimestamps);
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
    if (
      table === "orders" &&
      row.shippingAddress &&
      typeof row.shippingAddress === "string"
    ) {
      try {
        row.shippingAddress = JSON.parse(row.shippingAddress);
      } catch (e) {
        console.warn("Failed to parse shipping address:", e);
      }
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
    const processedData = { ...data };
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

    const setStmt =
      Object.keys(processedData)
        .map((k) => `${k} = ?`)
        .join(", ") + ", updatedAt = ?";
    const values = [...Object.values(processedData), now, id];

    this.db
      .prepare(`UPDATE ${table} SET ${setStmt} WHERE id = ?`)
      .run(...values);
  }

  private deleteRecord(table: string, id: string): void {
    this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  }

  private listAllRecords<T>(table: string): T[] {
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
      if (
        table === "orders" &&
        row.shippingAddress &&
        typeof row.shippingAddress === "string"
      ) {
        try {
          row.shippingAddress = JSON.parse(row.shippingAddress);
        } catch (e) {
          console.warn("Failed to parse shipping address:", e);
        }
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

  async listCustomers(): Promise<Customer[]> {
    return this.listAllRecords<Customer>("customers");
  }

  // Alias for compatibility with existing routes
  async getCustomers(): Promise<Customer[]> {
    return this.listCustomers();
  }

  // ======= ORDERS =======
  async createOrder(data: InsertOrder): Promise<Order> {
    const id = this.insertRecord("orders", data);
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

  async listOrders(): Promise<Order[]> {
    return this.listAllRecords<Order>("orders");
  }

  // Alias for compatibility with existing routes
  async getOrders(): Promise<Order[]> {
    return this.listOrders();
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
  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const id = this.insertRecord("employees", data);
    return this.getRecord<Employee>("employees", id)!;
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.getRecord<Employee>("employees", id);
  }

  async updateEmployee(
    id: string,
    data: Partial<InsertEmployee>,
  ): Promise<Employee | undefined> {
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
    const row = this.db
      .prepare("SELECT * FROM employees WHERE email = ?")
      .get(email) as any;

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
      .prepare("SELECT * FROM shipments WHERE orderId = ?")
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
      if (!delivery.deliveredAt || !delivery.createdAt) return false;

      // Assume 24 hours is the standard delivery time
      const expectedDelivery = new Date(delivery.createdAt);
      expectedDelivery.setHours(expectedDelivery.getHours() + 24);

      return new Date(delivery.deliveredAt) <= expectedDelivery;
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

    return rows.map((row) => ({
      ...row,
      value: JSON.parse(row.value),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
    }));
  }

  async getSettingsByCategory(category: string): Promise<any[]> {
    const rows = this.db
      .prepare("SELECT * FROM settings WHERE category = ? ORDER BY key")
      .all(category) as any[];

    return rows.map((row) => ({
      ...row,
      value: JSON.parse(row.value),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
    }));
  }

  async getSetting(key: string): Promise<any | null> {
    const row = this.db
      .prepare("SELECT * FROM settings WHERE key = ?")
      .get(key) as any;

    if (!row) return null;

    return {
      ...row,
      value: JSON.parse(row.value),
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

    return this.getDriver(id)!;
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

  // Close database connection
  close(): void {
    this.db.close();
  }
}
