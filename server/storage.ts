import { 
  type User, 
  type InsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Delivery,
  type InsertDelivery,
  type PosTransaction,
  type InsertPosTransaction,
  type Customer,
  type InsertCustomer
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;

  // Deliveries
  getDeliveries(): Promise<Delivery[]>;
  getDelivery(id: string): Promise<Delivery | undefined>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined>;

  // POS Transactions
  getPosTransactions(): Promise<PosTransaction[]>;
  getPosTransaction(id: string): Promise<PosTransaction | undefined>;
  createPosTransaction(transaction: InsertPosTransaction): Promise<PosTransaction>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Analytics
  getDashboardMetrics(): Promise<{
    totalRevenue: number;
    averageOrderValue: number;
    onTimeDelivery: number;
    inventoryTurnover: number;
    ordersToday: number;
    posTransactionsToday: number;
    dailyRevenue: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private orders: Map<string, Order>;
  private deliveries: Map<string, Delivery>;
  private posTransactions: Map<string, PosTransaction>;
  private customers: Map<string, Customer>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.deliveries = new Map();
    this.posTransactions = new Map();
    this.customers = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample data for demonstration
    // This would normally be seeded from a database
    
    // Sample Products
    const sampleProducts: Product[] = [
      {
        id: randomUUID(),
        name: "Fab Clean Pro",
        sku: "FCP-001",
        category: "Cleaning Solutions",
        description: "Premium cleaning solution for all surfaces",
        price: "89.99",
        stockQuantity: 847,
        reorderLevel: 50,
        supplier: "CleanTech Industries",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Microfiber Cloths",
        sku: "MFC-002",
        category: "Cleaning Tools",
        description: "Professional grade microfiber cloths",
        price: "12.99",
        stockQuantity: 23,
        reorderLevel: 100,
        supplier: "Textile Solutions",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Eco Detergent",
        sku: "ECO-003",
        category: "Cleaning Solutions",
        description: "Biodegradable laundry detergent",
        price: "24.99",
        stockQuantity: 0,
        reorderLevel: 25,
        supplier: "Green Clean Co",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });

    // Sample Customers
    const sampleCustomers: Customer[] = [
      {
        id: randomUUID(),
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        phone: "+1-555-0123",
        address: { street: "123 Main St", city: "Springfield", state: "IL", zip: "62701" },
        totalOrders: 15,
        totalSpent: "1247.89",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Mike Chen",
        email: "mike.chen@email.com",
        phone: "+1-555-0124",
        address: { street: "456 Oak Ave", city: "Springfield", state: "IL", zip: "62702" },
        totalOrders: 8,
        totalSpent: "756.32",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    sampleCustomers.forEach(customer => {
      this.customers.set(customer.id, customer);
    });

    // Sample Orders
    const sampleOrders: Order[] = [
      {
        id: randomUUID(),
        orderNumber: "FC-2024-001",
        customerName: "Sarah Johnson",
        customerEmail: "sarah.johnson@email.com",
        customerPhone: "+1-555-0123",
        status: "processing",
        paymentStatus: "paid",
        totalAmount: "156.00",
        items: [
          { productId: Array.from(this.products.keys())[0], quantity: 2, price: "89.99" }
        ],
        shippingAddress: { street: "123 Main St", city: "Springfield", state: "IL", zip: "62701" },
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        orderNumber: "FC-2024-002",
        customerName: "Mike Chen",
        customerEmail: "mike.chen@email.com",
        customerPhone: "+1-555-0124",
        status: "completed",
        paymentStatus: "paid",
        totalAmount: "89.50",
        items: [
          { productId: Array.from(this.products.keys())[0], quantity: 1, price: "89.99" }
        ],
        shippingAddress: { street: "456 Oak Ave", city: "Springfield", state: "IL", zip: "62702" },
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        updatedAt: new Date(),
      }
    ];

    sampleOrders.forEach(order => {
      this.orders.set(order.id, order);
    });

    // Sample POS Transactions
    const sampleTransactions: PosTransaction[] = [
      {
        id: randomUUID(),
        transactionNumber: "POS-2024-001",
        items: [
          { productId: Array.from(this.products.keys())[0], quantity: 1, price: "89.99" }
        ],
        totalAmount: "89.99",
        paymentMethod: "credit",
        cashierId: "DEMO_CASHIER",
        createdAt: new Date(),
      }
    ];

    sampleTransactions.forEach(transaction => {
      this.posTransactions.set(transaction.id, transaction);
    });

    // Sample Deliveries
    const sampleDeliveries: Delivery[] = [
      {
        id: randomUUID(),
        orderId: Array.from(this.orders.keys())[0],
        driverName: "John Smith",
        vehicleId: "TRUCK-001",
        status: "in_transit",
        estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        actualDelivery: null,
        location: { lat: 39.7817, lng: -89.6501 },
        route: [
          { address: "123 Main St, Springfield, IL", status: "pending" },
          { address: "456 Oak Ave, Springfield, IL", status: "pending" }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    sampleDeliveries.forEach(delivery => {
      this.deliveries.set(delivery.id, delivery);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { 
      ...product, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = { 
      ...insertOrder, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { 
      ...order, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Delivery methods
  async getDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values());
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }

  async createDelivery(insertDelivery: InsertDelivery): Promise<Delivery> {
    const id = randomUUID();
    const delivery: Delivery = { 
      ...insertDelivery, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.deliveries.set(id, delivery);
    return delivery;
  }

  async updateDelivery(id: string, updates: Partial<InsertDelivery>): Promise<Delivery | undefined> {
    const delivery = this.deliveries.get(id);
    if (!delivery) return undefined;
    
    const updatedDelivery = { 
      ...delivery, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.deliveries.set(id, updatedDelivery);
    return updatedDelivery;
  }

  // POS Transaction methods
  async getPosTransactions(): Promise<PosTransaction[]> {
    return Array.from(this.posTransactions.values());
  }

  async getPosTransaction(id: string): Promise<PosTransaction | undefined> {
    return this.posTransactions.get(id);
  }

  async createPosTransaction(insertTransaction: InsertPosTransaction): Promise<PosTransaction> {
    const id = randomUUID();
    const transaction: PosTransaction = { 
      ...insertTransaction, 
      id,
      createdAt: new Date(),
    };
    this.posTransactions.set(id, transaction);
    return transaction;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { 
      ...insertCustomer, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { 
      ...customer, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Analytics methods
  async getDashboardMetrics() {
    const orders = Array.from(this.orders.values());
    const posTransactions = Array.from(this.posTransactions.values());
    const deliveries = Array.from(this.deliveries.values());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = orders.filter(order => 
      order.createdAt && order.createdAt >= today
    ).length;

    const posTransactionsToday = posTransactions.filter(transaction => 
      transaction.createdAt >= today
    ).length;

    const totalRevenue = orders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount), 0
    );

    const dailyRevenue = orders
      .filter(order => order.createdAt && order.createdAt >= today)
      .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const completedDeliveries = deliveries.filter(delivery => 
      delivery.status === "delivered"
    );
    const onTimeDeliveries = completedDeliveries.filter(delivery => 
      delivery.actualDelivery && delivery.estimatedDelivery &&
      delivery.actualDelivery <= delivery.estimatedDelivery
    );
    const onTimeDelivery = completedDeliveries.length > 0 
      ? (onTimeDeliveries.length / completedDeliveries.length) * 100 
      : 98.7;

    return {
      totalRevenue,
      averageOrderValue,
      onTimeDelivery,
      inventoryTurnover: 4.2,
      ordersToday,
      posTransactionsToday,
      dailyRevenue,
    };
  }
}

export const storage = new MemStorage();
