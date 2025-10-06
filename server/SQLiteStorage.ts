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

  // Close database connection
  close(): void {
    this.db.close();
  }
}
