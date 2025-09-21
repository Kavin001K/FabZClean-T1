import { randomUUID } from "crypto";
import { SQLiteStorage } from "./SQLiteStorage";

export class MemStorage {
  private sqliteStorage: SQLiteStorage;

  constructor() {
    this.sqliteStorage = new SQLiteStorage("./fabzclean.db");
    this.initializeData();
  }

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

      // Sample Customers
      const sampleCustomers = [
        {
          name: "Sarah Johnson",
          email: "sarah.johnson@email.com",
          phone: "+1-555-0123",
          address: "123 Main St, Springfield, IL 62701",
          totalOrders: 15,
          totalSpent: "1247.89",
        },
        {
          name: "Mike Chen",
          email: "mike.chen@email.com",
          phone: "+1-555-0124",
          address: "456 Oak Ave, Springfield, IL 62702",
          totalOrders: 8,
          totalSpent: "756.32",
        },
        {
          name: "Emily Rodriguez",
          email: "emily.rodriguez@email.com",
          phone: "+1-555-0125",
          address: "789 Pine St, Springfield, IL 62703",
          totalOrders: 22,
          totalSpent: "1893.45",
        },
        {
          name: "David Thompson",
          email: "david.thompson@email.com",
          phone: "+1-555-0126",
          address: "321 Elm St, Springfield, IL 62704",
          totalOrders: 5,
          totalSpent: "423.78",
        },
        {
          name: "Lisa Wang",
          email: "lisa.wang@email.com",
          phone: "+1-555-0127",
          address: "654 Maple Ave, Springfield, IL 62705",
          totalOrders: 31,
          totalSpent: "2156.90",
        },
        {
          name: "Robert Brown",
          email: "robert.brown@email.com",
          phone: "+1-555-0128",
          address: "987 Cedar Blvd, Springfield, IL 62706",
          totalOrders: 12,
          totalSpent: "892.34",
        },
        {
          name: "Jennifer Davis",
          email: "jennifer.davis@email.com",
          phone: "+1-555-0129",
          address: "147 Birch St, Springfield, IL 62707",
          totalOrders: 18,
          totalSpent: "1345.67",
        },
        {
          name: "Michael Wilson",
          email: "michael.wilson@email.com",
          phone: "+1-555-0130",
          address: "258 Spruce Dr, Springfield, IL 62708",
          totalOrders: 7,
          totalSpent: "567.89",
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
        {
          name: "Dry Cleaning",
          description: "Professional dry cleaning service for delicate fabrics",
          price: "15.00",
        },
        {
          name: "Premium Laundry",
          description: "High-quality laundry service with premium detergents",
          price: "8.00",
        },
        {
          name: "Leather Care",
          description:
            "Specialized cleaning and conditioning for leather items",
          price: "25.00",
        },
        {
          name: "Stain Removal",
          description: "Professional stain removal for tough stains",
          price: "12.00",
        },
        {
          name: "Express Service",
          description: "Same-day cleaning service for urgent needs",
          price: "20.00",
        },
        {
          name: "Wedding Dress Cleaning",
          description:
            "Specialized cleaning for wedding dresses and formal wear",
          price: "50.00",
        },
        {
          name: "Rug Cleaning",
          description: "Professional rug and carpet cleaning service",
          price: "30.00",
        },
        {
          name: "Alterations",
          description: "Basic alterations and repairs",
          price: "10.00",
        },
      ];

      // Insert services
      for (const serviceData of sampleServices) {
        await this.sqliteStorage.createService(serviceData);
      }

      // Sample Orders
      const sampleOrders = [
        {
          customerId: customerIds[0],
          status: "processing",
          totalAmount: "156.00",
          items: [{ productId: productIds[0], quantity: 2, price: "89.99" }],
        },
        {
          customerId: customerIds[1],
          status: "completed",
          totalAmount: "89.50",
          items: [{ productId: productIds[0], quantity: 1, price: "89.99" }],
        },
        {
          customerId: customerIds[2],
          status: "pending",
          totalAmount: "234.97",
          items: [
            { productId: productIds[1], quantity: 5, price: "12.99" },
            { productId: productIds[3], quantity: 2, price: "34.99" },
            { productId: productIds[4], quantity: 3, price: "18.99" },
          ],
        },
        {
          customerId: customerIds[4],
          status: "ready",
          totalAmount: "178.95",
          items: [
            { productId: productIds[5], quantity: 1, price: "67.99" },
            { productId: productIds[6], quantity: 2, price: "28.99" },
            { productId: productIds[7], quantity: 3, price: "15.99" },
          ],
        },
        {
          customerId: customerIds[5],
          status: "completed",
          totalAmount: "45.98",
          items: [{ productId: productIds[8], quantity: 2, price: "22.99" }],
        },
        {
          customerId: customerIds[6],
          status: "processing",
          totalAmount: "127.97",
          items: [
            { productId: productIds[9], quantity: 1, price: "39.99" },
            { productId: productIds[1], quantity: 3, price: "12.99" },
            { productId: productIds[4], quantity: 2, price: "18.99" },
          ],
        },
        {
          customerId: customerIds[3],
          status: "cancelled",
          totalAmount: "89.99",
          items: [{ productId: productIds[0], quantity: 1, price: "89.99" }],
        },
        {
          customerId: customerIds[7],
          status: "completed",
          totalAmount: "67.99",
          items: [{ productId: productIds[5], quantity: 1, price: "67.99" }],
        },
      ];

      // Insert orders and store their IDs
      const orderIds: string[] = [];
      for (const orderData of sampleOrders) {
        const order = await this.sqliteStorage.createOrder(orderData);
        orderIds.push(order.id);
      }

      // Sample Employees
      const sampleEmployees = [
        {
          name: "John Manager",
          role: "Manager",
          email: "john.manager@fabzclean.com",
          password: "hashedpassword1",
        },
        {
          name: "Jane Cashier",
          role: "Cashier",
          email: "jane.cashier@fabzclean.com",
          password: "hashedpassword2",
        },
        {
          name: "Bob Driver",
          role: "Driver",
          email: "bob.driver@fabzclean.com",
          password: "hashedpassword3",
        },
      ];

      // Insert employees
      for (const employeeData of sampleEmployees) {
        await this.sqliteStorage.createEmployee(employeeData);
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
        await this.sqliteStorage.createPosTransaction(transactionData);
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
        await this.sqliteStorage.createDelivery(deliveryData);
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

  // Close database connection
  close() {
    this.sqliteStorage.close();
  }
}

export const storage = new MemStorage();
