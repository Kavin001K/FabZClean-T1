import { db } from "./db";
import type { InsertCustomer, InsertProduct, InsertService, InsertOrder, InsertEmployee } from "../shared/schema";

export async function seedDatabase() {
  try {
    console.log("🌱 Seeding database with sample data...");

    // Check if data already exists
    const existingCustomers = await db.listCustomers();
    if (existingCustomers.length > 0) {
      console.log("✅ Database already has data, skipping seed");
      return;
    }

    // Seed Customers
    const customerData: InsertCustomer[] = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1-555-0101",
        address: "123 Main St, Anytown, USA 12345",
        totalOrders: 0,
        totalSpent: "0",
        lastOrder: null,
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+1-555-0102",
        address: "456 Oak Ave, Springfield, USA 67890",
        totalOrders: 0,
        totalSpent: "0",
        lastOrder: null,
      },
      {
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        phone: "(741) 854-0759",
        address: "789 Pine Rd, Riverside, USA 54321",
        totalOrders: 0,
        totalSpent: "0",
        lastOrder: null,
      },
      {
        name: "Alice Williams",
        email: "alice.williams@example.com",
        phone: "555-234-5678",
        address: "321 Elm St, Lakeside, USA 98765",
        totalOrders: 0,
        totalSpent: "0",
        lastOrder: null,
      },
      {
        name: "Charlie Brown",
        email: "charlie.brown@example.com",
        phone: "555-876-5432",
        address: "654 Maple Dr, Hilltown, USA 13579",
        totalOrders: 0,
        totalSpent: "0",
        lastOrder: null,
      },
      {
        name: "Emma Davis",
        email: "emma.davis@example.com",
        phone: "555-999-1234",
        address: "890 Cedar Ln, Mountainview, USA 24680",
        totalOrders: 0,
        totalSpent: "0",
        lastOrder: null,
      },
      {
        name: "Michael Chen",
        email: "michael.chen@example.com",
        phone: "555-777-8888",
        address: "147 Birch St, Seaside, USA 36912",
        totalOrders: 0,
        totalSpent: "0",
        lastOrder: null,
      },
    ];

    const customers = [];
    for (const customer of customerData) {
      const created = await db.createCustomer(customer);
      customers.push(created);
      console.log(`  ✓ Created customer: ${created.name}`);
    }

    // Seed Products
    const productData: InsertProduct[] = [
      {
        name: "Laundry Detergent - Premium",
        sku: "DET-001",
        category: "Cleaning Supplies",
        description: "High-quality laundry detergent for all fabric types",
        price: "15.99",
        stockQuantity: 150,
        reorderLevel: 30,
        supplier: "CleanCo Supplies",
      },
      {
        name: "Fabric Softener",
        sku: "SOFT-001",
        category: "Cleaning Supplies",
        description: "Premium fabric softener for soft, fresh clothes",
        price: "12.99",
        stockQuantity: 100,
        reorderLevel: 20,
        supplier: "CleanCo Supplies",
      },
      {
        name: "Stain Remover",
        sku: "STAIN-001",
        category: "Cleaning Supplies",
        description: "Powerful stain remover for tough stains",
        price: "8.99",
        stockQuantity: 75,
        reorderLevel: 15,
        supplier: "CleanCo Supplies",
      },
      {
        name: "Bleach - Industrial",
        sku: "BLE-001",
        category: "Cleaning Supplies",
        description: "Industrial-strength bleach for commercial use",
        price: "18.99",
        stockQuantity: 200,
        reorderLevel: 40,
        supplier: "ChemClean Inc",
      },
      {
        name: "Dry Cleaning Solvent",
        sku: "DCS-001",
        category: "Dry Cleaning",
        description: "Professional dry cleaning solvent",
        price: "45.99",
        stockQuantity: 50,
        reorderLevel: 10,
        supplier: "ProClean Solutions",
      },
    ];

    const products = [];
    for (const product of productData) {
      const created = await db.createProduct(product);
      products.push(created);
      console.log(`  ✓ Created product: ${created.name}`);
    }

    // Seed Services
    const serviceData: InsertService[] = [
      {
        name: "Wash & Fold",
        description: "Professional wash and fold service for everyday laundry",
        price: "2.50",
        category: "Laundry",
        duration: "24 hours",
        status: "active",
      },
      {
        name: "Dry Cleaning - Shirt",
        description: "Professional dry cleaning for dress shirts",
        price: "4.99",
        category: "Dry Cleaning",
        duration: "48 hours",
        status: "active",
      },
      {
        name: "Dry Cleaning - Suit",
        description: "Premium dry cleaning service for suits",
        price: "15.99",
        category: "Dry Cleaning",
        duration: "48 hours",
        status: "active",
      },
      {
        name: "Dry Cleaning - Dress",
        description: "Delicate dry cleaning for dresses and formal wear",
        price: "12.99",
        category: "Dry Cleaning",
        duration: "48 hours",
        status: "active",
      },
      {
        name: "Alterations - Hem",
        description: "Professional hemming and alteration service",
        price: "8.99",
        category: "Alterations",
        duration: "3-5 days",
        status: "active",
      },
      {
        name: "Ironing Service",
        description: "Professional ironing and pressing",
        price: "3.99",
        category: "Pressing",
        duration: "24 hours",
        status: "active",
      },
      {
        name: "Comforter Cleaning",
        description: "Deep cleaning for comforters and duvets",
        price: "25.99",
        category: "Specialty",
        duration: "3-4 days",
        status: "active",
      },
      {
        name: "Wedding Dress Cleaning",
        description: "Specialized cleaning and preservation for wedding dresses",
        price: "89.99",
        category: "Specialty",
        duration: "7-10 days",
        status: "active",
      },
    ];

    const services = [];
    for (const service of serviceData) {
      const created = await db.createService(service);
      services.push(created);
      console.log(`  ✓ Created service: ${created.name}`);
    }

    // Seed Employees
    const employeeData: any[] = [
      {
        firstName: "Sarah",
        lastName: "Manager",
        employeeId: "EMP-001",
        email: "sarah.manager@fabzclean.com",
        position: "Manager",
        department: "Management",
        hireDate: new Date(),
        salary: "50000.00",
        password: "$2a$10$abcdefghijklmnopqrstuvwxyz123456", // Hashed password
      },
      {
        firstName: "Mike",
        lastName: "Cashier",
        employeeId: "EMP-002",
        email: "mike.cashier@fabzclean.com",
        position: "Cashier",
        department: "Sales",
        hireDate: new Date(),
        salary: "30000.00",
        password: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
      },
      {
        firstName: "Lisa",
        lastName: "Driver",
        employeeId: "EMP-003",
        email: "lisa.driver@fabzclean.com",
        position: "Driver",
        department: "Logistics",
        hireDate: new Date(),
        salary: "35000.00",
        password: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
      },
    ];

    const employees = [];
    for (const employee of employeeData) {
      const created = await db.createEmployee(employee);
      employees.push(created);
      console.log(`  ✓ Created employee: ${created.firstName} ${created.lastName}`);
    }

    // Seed Sample Orders
    const orderData: InsertOrder[] = [
      {
        customerId: customers[0].id,
        customerName: customers[0].name,
        customerEmail: customers[0].email,
        customerPhone: customers[0].phone,
        status: "pending",
        paymentStatus: "pending",
        totalAmount: "25.98",
        items: [
          {
            serviceId: services[0].id,
            serviceName: services[0].name,
            quantity: 2,
            price: services[0].price,
            subtotal: "5.00",
          },
          {
            serviceId: services[1].id,
            serviceName: services[1].name,
            quantity: 4,
            price: services[1].price,
            subtotal: "19.96",
          },
        ],
        orderNumber: `ORD-${Date.now()}-001`,
        shippingAddress: customers[0].address,
        pickupDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      },
      {
        customerId: customers[1].id,
        customerName: customers[1].name,
        customerEmail: customers[1].email,
        customerPhone: customers[1].phone,
        status: "processing",
        paymentStatus: "paid",
        totalAmount: "45.97",
        items: [
          {
            serviceId: services[2].id,
            serviceName: services[2].name,
            quantity: 1,
            price: services[2].price,
            subtotal: "15.99",
          },
          {
            serviceId: services[3].id,
            serviceName: services[3].name,
            quantity: 2,
            price: services[3].price,
            subtotal: "25.98",
          },
        ],
        orderNumber: `ORD-${Date.now()}-002`,
        shippingAddress: customers[1].address,
        pickupDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
      },
      {
        customerId: customers[2].id,
        customerName: customers[2].name,
        customerEmail: customers[2].email,
        customerPhone: customers[2].phone,
        status: "completed",
        paymentStatus: "paid",
        totalAmount: "89.99",
        items: [
          {
            serviceId: services[7].id,
            serviceName: services[7].name,
            quantity: 1,
            price: services[7].price,
            subtotal: "89.99",
          },
        ],
        orderNumber: `ORD-${Date.now()}-003`,
        shippingAddress: customers[2].address,
        pickupDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      },
    ];

    for (const order of orderData) {
      const created = await db.createOrder(order);
      console.log(`  ✓ Created order: ${created.orderNumber}`);

      // Update customer stats
      const customer = await db.getCustomer(order.customerId);
      if (customer) {
        await db.updateCustomer(customer.id, {
          totalOrders: (customer.totalOrders || 0) + 1,
          totalSpent: (parseFloat(customer.totalSpent || "0") + parseFloat(order.totalAmount)).toFixed(2),
          lastOrder: new Date().toISOString(),
        });
      }
    }

    console.log("✅ Database seeded successfully!");
    console.log(`  📊 Created ${customers.length} customers`);
    console.log(`  📦 Created ${products.length} products`);
    console.log(`  🧹 Created ${services.length} services`);
    console.log(`  👥 Created ${employees.length} employees`);
    console.log(`  📋 Created ${orderData.length} orders`);

    return {
      customers: customers.length,
      products: products.length,
      services: services.length,
      employees: employees.length,
      orders: orderData.length,
    };
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}
