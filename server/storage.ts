import { randomUUID } from "crypto";
import { SQLiteStorage, type Driver, type InsertDriver } from "./SQLiteStorage";
import { type InsertAuditLog, type AuditLog } from "../shared/schema";
import bcrypt from 'bcryptjs';

export interface IStorage {
  // Driver methods
  createDriver(data: InsertDriver): Promise<Driver>;
  getDriver(id: string): Promise<Driver | null>;
  listDrivers(): Promise<Driver[]>;
  updateDriver(id: string, data: Partial<InsertDriver>): Promise<Driver | null>;
  deleteDriver(id: string): Promise<boolean>;
  getDriversByStatus(status: string): Promise<Driver[]>;
  updateDriverLocation(id: string, latitude: number, longitude: number): Promise<Driver | null>;

  // Franchise methods
  createFranchise(data: any): Promise<any>;
  listFranchises(): Promise<any[]>;
  getFranchise(id: string): Promise<any | undefined>;
  updateFranchise(id: string, data: any): Promise<any | undefined>;

  // Task methods
  createTask(data: any): Promise<any>;
  listTasks(franchiseId?: string, employeeId?: string): Promise<any[]>;
  updateTask(id: string, data: any): Promise<any | undefined>;

  // Attendance methods
  createAttendance(data: any): Promise<any>;
  listAttendance(franchiseId?: string, employeeId?: string, date?: Date): Promise<any[]>;
  updateAttendance(id: string, data: any): Promise<any>;

  // Order methods
  // Order methods
  listOrders(): Promise<any[]>;
  getActiveOrders(): Promise<any[]>;
  getAnalyticsSummary(): Promise<any>;
  searchGlobal(query: string): Promise<any>;

  // Transit methods
  createTransitOrder(data: any): Promise<any>;
  getNextTransitId(franchiseId?: string, type?: string): Promise<string>;
  listTransitOrders(franchiseId?: string): Promise<any[]>;
  getTransitOrdersByStatus(status: string, franchiseId?: string): Promise<any[]>;
  updateTransitStatus(id: string, status: string, notes?: string, location?: string, updatedBy?: string): Promise<any>;

  // Audit Log methods
  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(params: any): Promise<{ data: AuditLog[]; count: number }>;
}

export class MemStorage implements IStorage {
  private sqliteStorage: SQLiteStorage;

  constructor() {
    this.sqliteStorage = new SQLiteStorage("./fabzclean.db");
    this.initializeData();
  }

  // Franchise methods
  async createFranchise(data: any): Promise<any> { return null; }
  async listFranchises(): Promise<any[]> { return []; }
  async getFranchise(id: string): Promise<any | undefined> { return undefined; }
  async updateFranchise(id: string, data: any): Promise<any | undefined> { return undefined; }

  // Task methods
  async createTask(data: any): Promise<any> { return null; }
  async listTasks(franchiseId?: string, employeeId?: string): Promise<any[]> { return []; }
  async updateTask(id: string, data: any): Promise<any | undefined> { return undefined; }

  // Attendance methods
  async createAttendance(data: any): Promise<any> { return null; }
  async listAttendance(franchiseId?: string, employeeId?: string, date?: Date): Promise<any[]> { return []; }
  async updateAttendance(id: string, data: any): Promise<any> { return null; }

  // Transit methods
  async createTransitOrder(data: any): Promise<any> { return null; }
  async getNextTransitId(franchiseId?: string, type?: string): Promise<string> { return `TRN-${Date.now()}`; }
  async listTransitOrders(franchiseId?: string): Promise<any[]> { return []; }
  async getTransitOrdersByStatus(status: string, franchiseId?: string): Promise<any[]> { return []; }
  async updateTransitStatus(id: string, status: string, notes?: string, location?: string, updatedBy?: string): Promise<any> { return null; }

  private async initializeData() {
    // Check if database already has data to avoid duplicating
    const existingProducts = await this.sqliteStorage.listProducts();
    if (existingProducts.length > 0) {
      console.log("Database already has data, skipping initialization");
      return;
    }

    console.log("Initializing database with sample data...");
    await this.seedSampleData();
  }

  private async seedSampleData() {
    try {
      // Sample Products
      const sampleProducts = [
        {
          name: "Fab Clean Pro",
          sku: "FCP-001",
          category: "Cleaning Solutions",
          description: "Premium cleaning solution for all surfaces",
          price: "89.99",
          stockQuantity: 847,
          reorderLevel: 50,
          supplier: "CleanTech Industries",
        },
        {
          name: "Microfiber Cloths",
          sku: "MFC-002",
          category: "Cleaning Tools",
          description: "Professional grade microfiber cloths",
          price: "12.99",
          stockQuantity: 23,
          reorderLevel: 100,
          supplier: "Textile Solutions",
        },
        {
          name: "Eco Detergent",
          sku: "ECO-003",
          category: "Cleaning Solutions",
          description: "Biodegradable laundry detergent",
          price: "24.99",
          stockQuantity: 0,
          reorderLevel: 25,
          supplier: "Green Clean Co",
        },
        {
          name: "Stain Remover Plus",
          sku: "SRP-004",
          category: "Cleaning Solutions",
          description: "Heavy-duty stain remover for tough stains",
          price: "34.99",
          stockQuantity: 156,
          reorderLevel: 30,
          supplier: "CleanTech Industries",
        },
        {
          name: "Glass Cleaner",
          sku: "GLC-005",
          category: "Cleaning Solutions",
          description: "Streak-free glass and mirror cleaner",
          price: "18.99",
          stockQuantity: 89,
          reorderLevel: 40,
          supplier: "Crystal Clear Co",
        },
        {
          name: "Floor Mop Set",
          sku: "FMS-006",
          category: "Cleaning Tools",
          description: "Professional floor mopping system",
          price: "67.99",
          stockQuantity: 45,
          reorderLevel: 20,
          supplier: "Floor Care Pro",
        },
        {
          name: "Disinfectant Spray",
          sku: "DSP-007",
          category: "Cleaning Solutions",
          description: "Hospital-grade disinfectant spray",
          price: "28.99",
          stockQuantity: 234,
          reorderLevel: 50,
          supplier: "Health Clean Inc",
        },
        {
          name: "Vacuum Bags",
          sku: "VAB-008",
          category: "Cleaning Tools",
          description: "HEPA filter vacuum bags",
          price: "15.99",
          stockQuantity: 12,
          reorderLevel: 25,
          supplier: "Air Quality Solutions",
        },
        {
          name: "All-Purpose Cleaner",
          sku: "APC-009",
          category: "Cleaning Solutions",
          description: "Versatile cleaner for multiple surfaces",
          price: "22.99",
          stockQuantity: 178,
          reorderLevel: 35,
          supplier: "CleanTech Industries",
        },
        {
          name: "Scrub Brushes Set",
          sku: "SBS-010",
          category: "Cleaning Tools",
          description: "Multi-purpose scrub brush collection",
          price: "39.99",
          stockQuantity: 67,
          reorderLevel: 15,
          supplier: "Textile Solutions",
        },
      ];

      // Insert products and store their IDs
      const productIds: string[] = [];
      for (const productData of sampleProducts) {
        const product = await this.sqliteStorage.createProduct(productData);
        productIds.push(product.id);
      }

      // Sample Customers - Using Indian phone numbers and addresses
      const sampleCustomers = [
        {
          name: "Priya Sharma",
          email: "priya.sharma@email.com",
          phone: "9876543210",
          address: "123 MG Road, Pollachi, Tamil Nadu 642001, India",
          totalOrders: 15,
          totalSpent: "12478.90",
        },
        {
          name: "Rajesh Kumar",
          email: "rajesh.kumar@email.com",
          phone: "9876543211",
          address: "456 Gandhi Street, Coimbatore, Tamil Nadu 641001, India",
          totalOrders: 8,
          totalSpent: "7563.20",
        },
        {
          name: "Anitha Devi",
          email: "anitha.devi@email.com",
          phone: "9876543212",
          address: "789 Nehru Nagar, Kinathukadavu, Tamil Nadu 642109, India",
          totalOrders: 22,
          totalSpent: "18934.50",
        },
        {
          name: "Suresh Babu",
          email: "suresh.babu@email.com",
          phone: "9876543213",
          address: "321 Main Bazaar, Pollachi, Tamil Nadu 642001, India",
          totalOrders: 5,
          totalSpent: "4237.80",
        },
        {
          name: "Lakshmi Venkatesh",
          email: "lakshmi.v@email.com",
          phone: "9876543214",
          address: "654 Temple Street, Coimbatore, Tamil Nadu 641002, India",
          totalOrders: 31,
          totalSpent: "21569.00",
        },
        {
          name: "Arun Prakash",
          email: "arun.prakash@email.com",
          phone: "9876543215",
          address: "987 Market Road, Pollachi, Tamil Nadu 642002, India",
          totalOrders: 12,
          totalSpent: "8923.40",
        },
        {
          name: "Meena Krishnan",
          email: "meena.k@email.com",
          phone: "9876543216",
          address: "147 Lake View, Kinathukadavu, Tamil Nadu 642109, India",
          totalOrders: 18,
          totalSpent: "13456.70",
        },
        {
          name: "Karthik Raja",
          email: "karthik.raja@email.com",
          phone: "9876543217",
          address: "258 Anna Nagar, Coimbatore, Tamil Nadu 641003, India",
          totalOrders: 7,
          totalSpent: "5678.90",
        },
      ];

      // Insert customers and store their IDs
      const customerIds: string[] = [];
      for (const customerData of sampleCustomers) {
        const customer = await this.sqliteStorage.createCustomer(customerData);
        customerIds.push(customer.id);
      }

      // Sample Services
      const sampleServices = [
        // Dry Cleaning - Men
        {
          name: "Shirt (Dry Clean)",
          category: "Dry Cleaning",
          description: "Professional dry cleaning for shirts",
          price: "150.00",
          duration: "2 Days",
          status: "Active"
        },
        {
          name: "Trousers (Dry Clean)",
          category: "Dry Cleaning",
          description: "Professional dry cleaning for trousers",
          price: "180.00",
          duration: "2 Days",
          status: "Active"
        },
        {
          name: "Suit - 2 Piece (Dry Clean)",
          category: "Dry Cleaning",
          description: "Dry cleaning for 2-piece suit (Jacket + Trousers)",
          price: "450.00",
          duration: "3 Days",
          status: "Active"
        },
        {
          name: "Suit - 3 Piece (Dry Clean)",
          category: "Dry Cleaning",
          description: "Dry cleaning for 3-piece suit (Jacket + Vest + Trousers)",
          price: "550.00",
          duration: "3 Days",
          status: "Active"
        },
        {
          name: "Jacket/Blazer (Dry Clean)",
          category: "Dry Cleaning",
          description: "Professional dry cleaning for jackets or blazers",
          price: "250.00",
          duration: "3 Days",
          status: "Active"
        },
        {
          name: "Coat/Overcoat (Dry Clean)",
          category: "Dry Cleaning",
          description: "Professional dry cleaning for heavy coats",
          price: "350.00",
          duration: "4 Days",
          status: "Active"
        },

        // Dry Cleaning - Women
        {
          name: "Saree (Dry Clean)",
          category: "Dry Cleaning",
          description: "Delicate dry cleaning for sarees (Cotton/Silk)",
          price: "250.00",
          duration: "3 Days",
          status: "Active"
        },
        {
          name: "Saree with Blouse (Dry Clean)",
          category: "Dry Cleaning",
          description: "Dry cleaning for saree and matching blouse",
          price: "300.00",
          duration: "3 Days",
          status: "Active"
        },
        {
          name: "Blouse (Dry Clean)",
          category: "Dry Cleaning",
          description: "Professional dry cleaning for blouses",
          price: "100.00",
          duration: "2 Days",
          status: "Active"
        },
        {
          name: "Dress/Gown (Dry Clean)",
          category: "Dry Cleaning",
          description: "Dry cleaning for dresses or gowns",
          price: "350.00",
          duration: "3 Days",
          status: "Active"
        },
        {
          name: "Kurta/Top (Dry Clean)",
          category: "Dry Cleaning",
          description: "Dry cleaning for kurtas or tops",
          price: "150.00",
          duration: "2 Days",
          status: "Active"
        },

        // Laundry (Wash & Fold/Iron)
        {
          name: "Wash & Fold (per kg)",
          category: "Laundry",
          description: "Machine wash and professional folding (min 3kg)",
          price: "60.00",
          duration: "24 Hours",
          status: "Active"
        },
        {
          name: "Wash & Iron (per kg)",
          category: "Laundry",
          description: "Machine wash and steam ironing (min 3kg)",
          price: "90.00",
          duration: "48 Hours",
          status: "Active"
        },
        {
          name: "Shirt (Wash & Iron)",
          category: "Laundry",
          description: "Premium wash and iron for shirts",
          price: "80.00",
          duration: "48 Hours",
          status: "Active"
        },
        {
          name: "Trousers (Wash & Iron)",
          category: "Laundry",
          description: "Premium wash and iron for trousers",
          price: "90.00",
          duration: "48 Hours",
          status: "Active"
        },

        // Household Items
        {
          name: "Bed Sheet (Single)",
          category: "Household",
          description: "Cleaning for single bed sheets",
          price: "120.00",
          duration: "3 Days",
          status: "Active"
        },
        {
          name: "Bed Sheet (Double/King)",
          category: "Household",
          description: "Cleaning for double or king size bed sheets",
          price: "180.00",
          duration: "3 Days",
          status: "Active"
        },
        {
          name: "Pillow Cover",
          category: "Household",
          description: "Cleaning for pillow covers",
          price: "40.00",
          duration: "3 Days",
          status: "Active"
        },
        {
          name: "Blanket (Single)",
          category: "Household",
          description: "Deep cleaning for single blankets",
          price: "300.00",
          duration: "4 Days",
          status: "Active"
        },
        {
          name: "Blanket (Double)",
          category: "Household",
          description: "Deep cleaning for double blankets",
          price: "450.00",
          duration: "4 Days",
          status: "Active"
        },
        {
          name: "Curtains (per panel)",
          category: "Household",
          description: "Professional cleaning for curtains (unlined)",
          price: "200.00",
          duration: "4 Days",
          status: "Active"
        },

        // Steam Ironing
        {
          name: "Steam Ironing (per piece)",
          category: "Ironing",
          description: "Professional steam ironing only",
          price: "30.00",
          duration: "24 Hours",
          status: "Active"
        },

        // Shoe Cleaning
        {
          name: "Sports Shoes",
          category: "Shoe Cleaning",
          description: "Deep cleaning for sports shoes/sneakers",
          price: "350.00",
          duration: "4 Days",
          status: "Active"
        },
        {
          name: "Leather Shoes",
          category: "Shoe Cleaning",
          description: "Cleaning and polishing for leather shoes",
          price: "450.00",
          duration: "4 Days",
          status: "Active"
        }
      ];

      // Insert services
      for (const serviceData of sampleServices) {
        await this.sqliteStorage.createService(serviceData as any);
      }

      // Sample Orders
      const sampleOrders = [
        {
          orderNumber: "ORD-001",
          customerId: customerIds[0],
          customerName: sampleCustomers[0].name,
          customerEmail: sampleCustomers[0].email,
          customerPhone: sampleCustomers[0].phone,
          status: "processing",
          totalAmount: "156.00",
          items: [{ productId: productIds[0], quantity: 2, price: "89.99" }],
        },
        {
          orderNumber: "ORD-002",
          customerId: customerIds[1],
          customerName: sampleCustomers[1].name,
          customerEmail: sampleCustomers[1].email,
          customerPhone: sampleCustomers[1].phone,
          status: "completed",
          totalAmount: "89.50",
          items: [{ productId: productIds[0], quantity: 1, price: "89.99" }],
        },
        {
          orderNumber: "ORD-003",
          customerId: customerIds[2],
          customerName: sampleCustomers[2].name,
          customerEmail: sampleCustomers[2].email,
          customerPhone: sampleCustomers[2].phone,
          status: "pending",
          totalAmount: "234.97",
          items: [
            { productId: productIds[1], quantity: 5, price: "12.99" },
            { productId: productIds[3], quantity: 2, price: "34.99" },
            { productId: productIds[4], quantity: 3, price: "18.99" },
          ],
        },
        {
          orderNumber: "ORD-004",
          customerId: customerIds[4],
          customerName: sampleCustomers[4].name,
          customerEmail: sampleCustomers[4].email,
          customerPhone: sampleCustomers[4].phone,
          status: "ready",
          totalAmount: "178.95",
          items: [
            { productId: productIds[5], quantity: 1, price: "67.99" },
            { productId: productIds[6], quantity: 2, price: "28.99" },
            { productId: productIds[7], quantity: 3, price: "15.99" },
          ],
        },
        {
          orderNumber: "ORD-005",
          customerId: customerIds[5],
          customerName: sampleCustomers[5].name,
          customerEmail: sampleCustomers[5].email,
          customerPhone: sampleCustomers[5].phone,
          status: "completed",
          totalAmount: "45.98",
          items: [{ productId: productIds[8], quantity: 2, price: "22.99" }],
        },
        {
          orderNumber: "ORD-006",
          customerId: customerIds[6],
          customerName: sampleCustomers[6].name,
          customerEmail: sampleCustomers[6].email,
          customerPhone: sampleCustomers[6].phone,
          status: "processing",
          totalAmount: "127.97",
          items: [
            { productId: productIds[9], quantity: 1, price: "39.99" },
            { productId: productIds[1], quantity: 3, price: "12.99" },
            { productId: productIds[4], quantity: 2, price: "18.99" },
          ],
        },
        {
          orderNumber: "ORD-007",
          customerId: customerIds[3],
          customerName: sampleCustomers[3].name,
          customerEmail: sampleCustomers[3].email,
          customerPhone: sampleCustomers[3].phone,
          status: "cancelled",
          totalAmount: "89.99",
          items: [{ productId: productIds[0], quantity: 1, price: "89.99" }],
        },
        {
          orderNumber: "ORD-008",
          customerId: customerIds[7],
          customerName: sampleCustomers[7].name,
          customerEmail: sampleCustomers[7].email,
          customerPhone: sampleCustomers[7].phone,
          status: "completed",
          totalAmount: "67.99",
          items: [{ productId: productIds[5], quantity: 1, price: "67.99" }],
        },
      ];

      // Insert orders and store their IDs
      const orderIds: string[] = [];
      for (const orderData of sampleOrders) {
        const order = await this.sqliteStorage.createOrder(orderData as any);
        orderIds.push(order.id);
      }


      // ... (existing imports)

      // ... inside seedSampleData method ...

      // Sample Employees
      // Create valid hashes for passwords
      const adminHash = bcrypt.hashSync('admin', 10);
      const managerHash = bcrypt.hashSync('manager', 10);
      const cashierHash = bcrypt.hashSync('cashier', 10);
      const driverHash = bcrypt.hashSync('driver', 10);

      const sampleEmployees = [
        {
          name: "System Admin",
          role: "admin",
          email: "admin@myfabclean.com",
          employeeId: "myfabclean",
          password: "$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa", // Durai@2025
        },
        {
          name: "John Manager",
          role: "Manager",
          email: "john.manager@fabzclean.com",
          password: managerHash,
        },
        {
          name: "Jane Cashier",
          role: "Cashier",
          email: "jane.cashier@fabzclean.com",
          password: cashierHash,
        },
        {
          name: "Bob Driver",
          role: "Driver",
          email: "bob.driver@fabzclean.com",
          password: driverHash,
        },
      ];

      // Insert employees
      for (const employeeData of sampleEmployees) {
        await this.sqliteStorage.createEmployee(employeeData as any);
      }

      // Sample POS Transactions
      const sampleTransactions = [
        {
          orderId: orderIds[0],
          amount: "89.99",
          paymentMethod: "credit",
        },
        {
          orderId: orderIds[1],
          amount: "70.95",
          paymentMethod: "cash",
        },
        {
          orderId: orderIds[4],
          amount: "51.98",
          paymentMethod: "debit",
        },
      ];

      // Insert POS transactions
      for (const transactionData of sampleTransactions) {
        await this.sqliteStorage.createPosTransaction(transactionData as any);
      }

      // Sample Deliveries
      const sampleDeliveries = [
        {
          orderId: orderIds[0],
          status: "in_transit",
        },
        {
          orderId: orderIds[2],
          status: "pending",
        },
        {
          orderId: orderIds[3],
          status: "delivered",
          deliveredAt: new Date().toISOString(),
        },
      ];

      // Insert deliveries
      for (const deliveryData of sampleDeliveries) {
        await this.sqliteStorage.createDelivery(deliveryData as any);
      }

      console.log("Sample data seeded successfully!");
    } catch (error) {
      console.error("Error seeding sample data:", error);
    }
  }

  // Delegate all methods to SQLiteStorage
  async getUser(id: string) {
    return this.sqliteStorage.getUser(id);
  }

  async getUserByUsername(username: string) {
    return this.sqliteStorage.getUserByUsername(username);
  }

  async createUser(insertUser: any) {
    return this.sqliteStorage.createUser(insertUser);
  }

  async getProducts() {
    return this.sqliteStorage.getProducts();
  }

  async getProduct(id: string) {
    return this.sqliteStorage.getProduct(id);
  }

  async createProduct(insertProduct: any) {
    return this.sqliteStorage.createProduct(insertProduct);
  }

  async updateProduct(id: string, updates: any) {
    return this.sqliteStorage.updateProduct(id, updates);
  }

  async getOrders() {
    return this.sqliteStorage.getOrders();
  }

  async listOrders() {
    return this.sqliteStorage.getOrders();
  }

  async getActiveOrders() {
    return this.sqliteStorage.getActiveOrders();
  }

  async getAnalyticsSummary() {
    return this.sqliteStorage.getAnalyticsSummary();
  }

  async searchGlobal(query: string) {
    return this.sqliteStorage.searchGlobal(query);
  }

  async createAuditLog(data: InsertAuditLog) {
    return this.sqliteStorage.createAuditLog(data);
  }

  async getAuditLogs(params: any) {
    return this.sqliteStorage.getAuditLogs(params);
  }

  async getOrder(id: string) {
    return this.sqliteStorage.getOrder(id);
  }

  async createOrder(insertOrder: any) {
    return this.sqliteStorage.createOrder(insertOrder);
  }

  async updateOrder(id: string, updates: any) {
    return this.sqliteStorage.updateOrder(id, updates);
  }

  async deleteOrder(id: string) {
    return this.sqliteStorage.deleteOrder(id);
  }

  async getDeliveries() {
    return this.sqliteStorage.getDeliveries();
  }

  async getDelivery(id: string) {
    return this.sqliteStorage.getDelivery(id);
  }

  async createDelivery(insertDelivery: any) {
    return this.sqliteStorage.createDelivery(insertDelivery);
  }

  async updateDelivery(id: string, updates: any) {
    return this.sqliteStorage.updateDelivery(id, updates);
  }

  async getPosTransactions() {
    return this.sqliteStorage.getPosTransactions();
  }

  async getPosTransaction(id: string) {
    return this.sqliteStorage.getPosTransaction(id);
  }

  async createPosTransaction(insertTransaction: any) {
    return this.sqliteStorage.createPosTransaction(insertTransaction);
  }

  async getCustomers() {
    return this.sqliteStorage.getCustomers();
  }

  async getCustomer(id: string) {
    return this.sqliteStorage.getCustomer(id);
  }

  async createCustomer(insertCustomer: any) {
    return this.sqliteStorage.createCustomer(insertCustomer);
  }

  async updateCustomer(id: string, updates: any) {
    return this.sqliteStorage.updateCustomer(id, updates);
  }

  async deleteCustomer(id: string) {
    return this.sqliteStorage.deleteCustomer(id);
  }

  async getServices() {
    return this.sqliteStorage.getServices();
  }

  async getService(id: string) {
    return this.sqliteStorage.getService(id);
  }

  async createService(insertService: any) {
    return this.sqliteStorage.createService(insertService);
  }

  async updateService(id: string, updates: any) {
    return this.sqliteStorage.updateService(id, updates);
  }

  async deleteService(id: string) {
    return this.sqliteStorage.deleteService(id);
  }

  async getEmployees() {
    return this.sqliteStorage.getEmployees();
  }

  async getEmployee(id: string) {
    return this.sqliteStorage.getEmployee(id);
  }

  async createEmployee(insertEmployee: any) {
    return this.sqliteStorage.createEmployee(insertEmployee);
  }

  async updateEmployee(id: string, updates: any) {
    return this.sqliteStorage.updateEmployee(id, updates);
  }

  async deleteEmployee(id: string) {
    return this.sqliteStorage.deleteEmployee(id);
  }

  async getEmployeeByEmail(email: string) {
    return this.sqliteStorage.getEmployeeByEmail(email);
  }

  async getBarcodes() {
    return this.sqliteStorage.getBarcodes();
  }

  async getBarcode(id: string) {
    return this.sqliteStorage.getBarcode(id);
  }

  async createBarcode(insertBarcode: any) {
    return this.sqliteStorage.createBarcode(insertBarcode);
  }

  async getBarcodeByCode(code: string) {
    return this.sqliteStorage.getBarcodeByCode(code);
  }

  async getBarcodesByEntity(entityType: string, entityId: string) {
    return this.sqliteStorage.getBarcodesByEntity(entityType, entityId);
  }

  async getShipments() {
    return this.sqliteStorage.getShipments();
  }

  async getShipment(id: string) {
    return this.sqliteStorage.getShipment(id);
  }

  async createShipment(insertShipment: any) {
    return this.sqliteStorage.createShipment(insertShipment);
  }

  async updateShipment(id: string, updates: any) {
    return this.sqliteStorage.updateShipment(id, updates);
  }

  async getDashboardMetrics() {
    return this.sqliteStorage.getDashboardMetrics();
  }

  // ======= DRIVER METHODS =======
  async createDriver(data: InsertDriver): Promise<Driver> {
    return this.sqliteStorage.createDriver(data);
  }

  async getDriver(id: string): Promise<Driver | null> {
    return this.sqliteStorage.getDriver(id);
  }

  async listDrivers(): Promise<Driver[]> {
    return this.sqliteStorage.listDrivers();
  }

  async updateDriver(id: string, data: Partial<InsertDriver>): Promise<Driver | null> {
    return this.sqliteStorage.updateDriver(id, data);
  }

  async deleteDriver(id: string): Promise<boolean> {
    return this.sqliteStorage.deleteDriver(id);
  }

  async getDriversByStatus(status: string): Promise<Driver[]> {
    return this.sqliteStorage.getDriversByStatus(status);
  }

  async updateDriverLocation(id: string, latitude: number, longitude: number): Promise<Driver | null> {
    return this.sqliteStorage.updateDriverLocation(id, latitude, longitude);
  }

  // ======= EMPLOYEE METHODS =======
  async listEmployees(): Promise<any[]> {
    return this.sqliteStorage.listEmployees();
  }

  async getEmployee(id: string): Promise<any | undefined> {
    return this.sqliteStorage.getEmployee(id);
  }

  async createEmployee(data: any): Promise<any> {
    return this.sqliteStorage.createEmployee(data);
  }

  async updateEmployee(id: string, data: any): Promise<any | undefined> {
    return this.sqliteStorage.updateEmployee(id, data);
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.sqliteStorage.deleteEmployee(id);
  }

  // Close database connection
  close() {
    this.sqliteStorage.close();
  }
}

import { SupabaseStorage } from "./SupabaseStorage";

export const isSupabaseConfigured = process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_KEY &&
  !process.env.SUPABASE_URL.includes('placeholder');

export const storage = isSupabaseConfigured
  ? new SupabaseStorage()
  : new MemStorage();
