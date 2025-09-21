"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteStorage = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const crypto_1 = require("crypto");
class SQLiteStorage {
    constructor(dbPath = "./fabzclean.db") {
        this.db = new better_sqlite3_1.default(dbPath);
        this.createTables();
    }
    createTables() {
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
    `);
    }
    // ======= USERS =======
    async createUser(data) {
        const id = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        this.db
            .prepare(`
        INSERT INTO users (id, username, password, email, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
            .run(id, data.username, data.password, data.email, now, now);
        return {
            id,
            ...data,
            createdAt: new Date(now),
            updatedAt: new Date(now),
        };
    }
    async getUser(id) {
        const row = this.db
            .prepare("SELECT * FROM users WHERE id = ?")
            .get(id);
        return row
            ? {
                ...row,
                createdAt: new Date(row.createdAt),
                updatedAt: new Date(row.updatedAt),
            }
            : undefined;
    }
    async getUserByUsername(username) {
        const row = this.db
            .prepare("SELECT * FROM users WHERE username = ?")
            .get(username);
        return row
            ? {
                ...row,
                createdAt: new Date(row.createdAt),
                updatedAt: new Date(row.updatedAt),
            }
            : undefined;
    }
    // ======= GENERIC CRUD HELPERS =======
    insertRecord(table, data) {
        const id = data.id ?? (0, crypto_1.randomUUID)();
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
            .prepare(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`)
            .run(...values);
        return id;
    }
    getRecord(table, id) {
        const row = this.db
            .prepare(`SELECT * FROM ${table} WHERE id = ?`)
            .get(id);
        if (!row)
            return undefined;
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
            }
            catch (e) {
                console.warn("Failed to parse order items:", e);
            }
        }
        if (table === "orders" &&
            row.shippingAddress &&
            typeof row.shippingAddress === "string") {
            try {
                row.shippingAddress = JSON.parse(row.shippingAddress);
            }
            catch (e) {
                console.warn("Failed to parse shipping address:", e);
            }
        }
        if (table === "deliveries" &&
            row.location &&
            typeof row.location === "string") {
            try {
                row.location = JSON.parse(row.location);
            }
            catch (e) {
                console.warn("Failed to parse delivery location:", e);
            }
        }
        if (table === "deliveries" && row.route && typeof row.route === "string") {
            try {
                row.route = JSON.parse(row.route);
            }
            catch (e) {
                console.warn("Failed to parse delivery route:", e);
            }
        }
        if (table === "posTransactions" &&
            row.items &&
            typeof row.items === "string") {
            try {
                row.items = JSON.parse(row.items);
            }
            catch (e) {
                console.warn("Failed to parse transaction items:", e);
            }
        }
        return row;
    }
    updateRecord(table, id, data) {
        const now = new Date().toISOString();
        const keys = Object.keys(data);
        if (!keys.length)
            return;
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
        const setStmt = Object.keys(processedData)
            .map((k) => `${k} = ?`)
            .join(", ") + ", updatedAt = ?";
        const values = [...Object.values(processedData), now, id];
        this.db
            .prepare(`UPDATE ${table} SET ${setStmt} WHERE id = ?`)
            .run(...values);
    }
    deleteRecord(table, id) {
        this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    }
    listAllRecords(table) {
        const rows = this.db.prepare(`SELECT * FROM ${table}`).all();
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
                }
                catch (e) {
                    console.warn("Failed to parse order items:", e);
                }
            }
            if (table === "orders" &&
                row.shippingAddress &&
                typeof row.shippingAddress === "string") {
                try {
                    row.shippingAddress = JSON.parse(row.shippingAddress);
                }
                catch (e) {
                    console.warn("Failed to parse shipping address:", e);
                }
            }
            if (table === "deliveries" &&
                row.location &&
                typeof row.location === "string") {
                try {
                    row.location = JSON.parse(row.location);
                }
                catch (e) {
                    console.warn("Failed to parse delivery location:", e);
                }
            }
            if (table === "deliveries" &&
                row.route &&
                typeof row.route === "string") {
                try {
                    row.route = JSON.parse(row.route);
                }
                catch (e) {
                    console.warn("Failed to parse delivery route:", e);
                }
            }
            if (table === "posTransactions" &&
                row.items &&
                typeof row.items === "string") {
                try {
                    row.items = JSON.parse(row.items);
                }
                catch (e) {
                    console.warn("Failed to parse transaction items:", e);
                }
            }
        });
        return rows;
    }
    // ======= PRODUCTS =======
    async createProduct(data) {
        const id = this.insertRecord("products", data);
        return this.getRecord("products", id);
    }
    async getProduct(id) {
        return this.getRecord("products", id);
    }
    async updateProduct(id, data) {
        this.updateRecord("products", id, data);
        return this.getProduct(id);
    }
    async deleteProduct(id) {
        try {
            this.deleteRecord("products", id);
            return true;
        }
        catch {
            return false;
        }
    }
    async listProducts() {
        return this.listAllRecords("products");
    }
    // Alias for compatibility with existing routes
    async getProducts() {
        return this.listProducts();
    }
    // ======= CUSTOMERS =======
    async createCustomer(data) {
        const id = this.insertRecord("customers", data);
        return this.getRecord("customers", id);
    }
    async getCustomer(id) {
        return this.getRecord("customers", id);
    }
    async updateCustomer(id, data) {
        this.updateRecord("customers", id, data);
        return this.getCustomer(id);
    }
    async deleteCustomer(id) {
        try {
            this.deleteRecord("customers", id);
            return true;
        }
        catch {
            return false;
        }
    }
    async listCustomers() {
        return this.listAllRecords("customers");
    }
    // Alias for compatibility with existing routes
    async getCustomers() {
        return this.listCustomers();
    }
    // ======= ORDERS =======
    async createOrder(data) {
        const id = this.insertRecord("orders", data);
        return this.getRecord("orders", id);
    }
    async getOrder(id) {
        return this.getRecord("orders", id);
    }
    async updateOrder(id, data) {
        this.updateRecord("orders", id, data);
        return this.getOrder(id);
    }
    async deleteOrder(id) {
        try {
            this.deleteRecord("orders", id);
            return true;
        }
        catch {
            return false;
        }
    }
    async listOrders() {
        return this.listAllRecords("orders");
    }
    // Alias for compatibility with existing routes
    async getOrders() {
        return this.listOrders();
    }
    // ======= DELIVERIES =======
    async createDelivery(data) {
        const id = this.insertRecord("deliveries", data);
        return this.getRecord("deliveries", id);
    }
    async getDelivery(id) {
        return this.getRecord("deliveries", id);
    }
    async updateDelivery(id, data) {
        this.updateRecord("deliveries", id, data);
        return this.getDelivery(id);
    }
    async deleteDelivery(id) {
        try {
            this.deleteRecord("deliveries", id);
            return true;
        }
        catch {
            return false;
        }
    }
    async listDeliveries() {
        return this.listAllRecords("deliveries");
    }
    // Alias for compatibility
    async getDeliveries() {
        return this.listDeliveries();
    }
    // ======= POS TRANSACTIONS =======
    async createPosTransaction(data) {
        const id = this.insertRecord("posTransactions", data);
        return this.getRecord("posTransactions", id);
    }
    async getPosTransaction(id) {
        return this.getRecord("posTransactions", id);
    }
    async updatePosTransaction(id, data) {
        this.updateRecord("posTransactions", id, data);
        return this.getPosTransaction(id);
    }
    async deletePosTransaction(id) {
        try {
            this.deleteRecord("posTransactions", id);
            return true;
        }
        catch {
            return false;
        }
    }
    async listPosTransactions() {
        return this.listAllRecords("posTransactions");
    }
    // Alias for compatibility
    async getPosTransactions() {
        return this.listPosTransactions();
    }
    // ======= SERVICES =======
    async createService(data) {
        const id = this.insertRecord("services", data);
        return this.getRecord("services", id);
    }
    async getService(id) {
        return this.getRecord("services", id);
    }
    async updateService(id, data) {
        this.updateRecord("services", id, data);
        return this.getService(id);
    }
    async deleteService(id) {
        try {
            this.deleteRecord("services", id);
            return true;
        }
        catch {
            return false;
        }
    }
    async listServices() {
        return this.listAllRecords("services");
    }
    // Alias for compatibility
    async getServices() {
        return this.listServices();
    }
    // ======= SHIPMENTS =======
    async createShipment(data) {
        const id = this.insertRecord("shipments", data);
        return this.getRecord("shipments", id);
    }
    async getShipment(id) {
        return this.getRecord("shipments", id);
    }
    async updateShipment(id, data) {
        this.updateRecord("shipments", id, data);
        return this.getShipment(id);
    }
    async deleteShipment(id) {
        try {
            this.deleteRecord("shipments", id);
            return true;
        }
        catch {
            return false;
        }
    }
    async listShipments() {
        return this.listAllRecords("shipments");
    }
    // Alias for compatibility
    async getShipments() {
        return this.listShipments();
    }
    // ======= BARCODES =======
    async createBarcode(data) {
        const id = this.insertRecord("barcodes", data);
        return this.getRecord("barcodes", id);
    }
    async getBarcode(id) {
        return this.getRecord("barcodes", id);
    }
    async updateBarcode(id, data) {
        this.updateRecord("barcodes", id, data);
        return this.getBarcode(id);
    }
    async deleteBarcode(id) {
        try {
            this.deleteRecord("barcodes", id);
            return true;
        }
        catch {
            return false;
        }
    }
    async listBarcodes() {
        return this.listAllRecords("barcodes");
    }
    // Alias for compatibility
    async getBarcodes() {
        return this.listBarcodes();
    }
    // ======= EMPLOYEES =======
    async createEmployee(data) {
        const id = this.insertRecord("employees", data);
        return this.getRecord("employees", id);
    }
    async getEmployee(id) {
        return this.getRecord("employees", id);
    }
    async updateEmployee(id, data) {
        this.updateRecord("employees", id, data);
        return this.getEmployee(id);
    }
    async deleteEmployee(id) {
        try {
            this.deleteRecord("employees", id);
            return true;
        }
        catch {
            return false;
        }
    }
    async listEmployees() {
        return this.listAllRecords("employees");
    }
    // Alias for compatibility
    async getEmployees() {
        return this.listEmployees();
    }
    // ======= USERS =======
    async updateUser(id, data) {
        this.updateRecord("users", id, data);
        return this.getUser(id);
    }
    async deleteUser(id) {
        this.deleteRecord("users", id);
    }
    async listUsers() {
        return this.listAllRecords("users");
    }
    // ======= ADDITIONAL QUERY METHODS =======
    async getUsersByEmail(email) {
        const rows = this.db
            .prepare("SELECT * FROM users WHERE email = ?")
            .all(email);
        return rows.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        }));
    }
    async getOrdersByCustomer(customerId) {
        const rows = this.db
            .prepare("SELECT * FROM orders WHERE customerId = ?")
            .all(customerId);
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
    async getBarcodeByCode(code) {
        const row = this.db
            .prepare("SELECT * FROM barcodes WHERE code = ?")
            .get(code);
        return row
            ? {
                ...row,
                createdAt: new Date(row.createdAt),
                updatedAt: new Date(row.updatedAt),
            }
            : undefined;
    }
    async getEmployeeByEmail(email) {
        const row = this.db
            .prepare("SELECT * FROM employees WHERE email = ?")
            .get(email);
        return row
            ? {
                ...row,
                createdAt: new Date(row.createdAt),
                updatedAt: new Date(row.updatedAt),
            }
            : undefined;
    }
    async getDeliveriesByOrder(orderId) {
        const rows = this.db
            .prepare("SELECT * FROM deliveries WHERE orderId = ?")
            .all(orderId);
        return rows.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            location: row.location ? JSON.parse(row.location) : null,
            route: row.route ? JSON.parse(row.route) : [],
        }));
    }
    async getShipmentsByOrder(orderId) {
        const rows = this.db
            .prepare("SELECT * FROM shipments WHERE orderId = ?")
            .all(orderId);
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
        const ordersToday = orders.filter((order) => order.createdAt && new Date(order.createdAt) >= today).length;
        const posTransactionsToday = posTransactions.filter((transaction) => transaction.createdAt && new Date(transaction.createdAt) >= today).length;
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0);
        const dailyRevenue = orders
            .filter((order) => order.createdAt && new Date(order.createdAt) >= today)
            .reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0);
        const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
        const completedDeliveries = deliveries.filter((delivery) => delivery.status === "delivered");
        const onTimeDeliveries = completedDeliveries.filter((delivery) => {
            if (!delivery.deliveredAt || !delivery.createdAt)
                return false;
            // Assume 24 hours is the standard delivery time
            const expectedDelivery = new Date(delivery.createdAt);
            expectedDelivery.setHours(expectedDelivery.getHours() + 24);
            return new Date(delivery.deliveredAt) <= expectedDelivery;
        });
        const onTimeDelivery = completedDeliveries.length > 0
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
    async getBarcodesByEntity(entityType, entityId) {
        const rows = this.db
            .prepare("SELECT * FROM barcodes WHERE entityType = ? AND entityId = ?")
            .all(entityType, entityId);
        return rows.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        }));
    }
    // Close database connection
    close() {
        this.db.close();
    }
}
exports.SQLiteStorage = SQLiteStorage;
//# sourceMappingURL=SQLiteStorage.js.map