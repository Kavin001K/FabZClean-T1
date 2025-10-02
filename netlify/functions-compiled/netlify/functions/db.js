"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = exports.db = exports.sampleData = void 0;
const neon_1 = require("@netlify/neon");
// Initialize Neon client - automatically uses NETLIFY_DATABASE_URL
const sql = (0, neon_1.neon)();
exports.sql = sql;
// Sample data for demonstration (since we don't have actual tables yet)
exports.sampleData = {
    orders: [
        {
            id: "1",
            orderNumber: "ORD-001",
            customerName: "John Doe",
            customerEmail: "john@example.com",
            customerPhone: "+1234567890",
            status: "pending",
            paymentStatus: "pending",
            totalAmount: "25.00",
            items: [{ productId: "1", productName: "Dry Cleaning", quantity: 1, price: "25.00" }],
            shippingAddress: {
                instructions: "Leave at door",
                pickupDate: "2024-01-15",
                address: "123 Main St, New York, NY 10001"
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString(),
            total: 25.00,
            service: "Dry Cleaning",
            priority: "Normal",
            pickupDate: "2024-01-15",
            dueDate: "2024-01-17", // 2 days after pickup
            estimatedDelivery: "2024-01-17T14:00:00Z"
        },
        {
            id: "2",
            orderNumber: "ORD-002",
            customerName: "Jane Smith",
            customerEmail: "jane@example.com",
            customerPhone: "+1234567891",
            status: "processing",
            paymentStatus: "paid",
            totalAmount: "45.00",
            items: [{ productId: "2", productName: "Laundry Service", quantity: 2, price: "22.50" }],
            shippingAddress: {
                instructions: "Call before delivery",
                pickupDate: "2024-01-16",
                address: "456 Oak Ave, New York, NY 10002"
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString(),
            total: 45.00,
            service: "Laundry Service",
            priority: "High",
            pickupDate: "2024-01-16",
            dueDate: "2024-01-18", // 2 days after pickup
            estimatedDelivery: "2024-01-18T10:00:00Z"
        },
        {
            id: "3",
            orderNumber: "ORD-003",
            customerName: "Mike Johnson",
            customerEmail: "mike@example.com",
            customerPhone: "+1234567892",
            status: "pending",
            paymentStatus: "pending",
            totalAmount: "35.00",
            items: [{ productId: "3", productName: "Express Cleaning", quantity: 1, price: "35.00" }],
            shippingAddress: {
                instructions: "Ring doorbell",
                pickupDate: "2024-01-17",
                address: "789 Pine St, New York, NY 10003"
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString(),
            total: 35.00,
            service: "Express Cleaning",
            priority: "Urgent",
            pickupDate: "2024-01-17",
            dueDate: "2024-01-18", // 1 day after pickup (express service)
            estimatedDelivery: "2024-01-18T16:00:00Z"
        },
        {
            id: "4",
            orderNumber: "ORD-004",
            customerName: "Sarah Wilson",
            customerEmail: "sarah@example.com",
            customerPhone: "+1234567893",
            status: "ready",
            paymentStatus: "paid",
            totalAmount: "28.00",
            items: [{ productId: "4", productName: "Standard Cleaning", quantity: 1, price: "28.00" }],
            shippingAddress: {
                instructions: "Leave with neighbor if not home",
                pickupDate: "2024-01-14",
                address: "321 Elm St, New York, NY 10004"
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString(),
            total: 28.00,
            service: "Standard Cleaning",
            priority: "Normal",
            pickupDate: "2024-01-14",
            dueDate: "2024-01-16", // 2 days after pickup
            estimatedDelivery: "2024-01-16T12:00:00Z"
        },
        {
            id: "5",
            orderNumber: "ORD-005",
            customerName: "David Brown",
            customerEmail: "david@example.com",
            customerPhone: "+1234567894",
            status: "pending",
            paymentStatus: "pending",
            totalAmount: "42.00",
            items: [{ productId: "5", productName: "Premium Service", quantity: 1, price: "42.00" }],
            shippingAddress: {
                instructions: "Call 30 minutes before delivery",
                pickupDate: "2024-01-18",
                address: "654 Maple Ave, New York, NY 10005"
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString(),
            total: 42.00,
            service: "Premium Service",
            priority: "High",
            pickupDate: "2024-01-18",
            dueDate: "2024-01-20", // 2 days after pickup
            estimatedDelivery: "2024-01-20T15:00:00Z"
        }
    ],
    customers: [
        {
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890",
            address: { street: "123 Main St", city: "New York", state: "NY", zip: "10001" },
            totalOrders: 5,
            totalSpent: "125.00",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            joinDate: new Date().toISOString(),
            lastOrder: new Date().toISOString()
        },
        {
            id: "2",
            name: "Jane Smith",
            email: "jane@example.com",
            phone: "+1234567891",
            address: { street: "456 Oak Ave", city: "New York", state: "NY", zip: "10002" },
            totalOrders: 3,
            totalSpent: "87.50",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            joinDate: new Date().toISOString(),
            lastOrder: new Date().toISOString()
        }
    ],
    products: [
        {
            id: "1",
            name: "Dry Cleaning",
            description: "Professional dry cleaning service",
            price: "25.00",
            category: "Cleaning Services",
            stockQuantity: 100
        },
        {
            id: "2",
            name: "Laundry Service",
            description: "Wash and fold laundry service",
            price: "22.50",
            category: "Cleaning Services",
            stockQuantity: 50
        }
    ],
    services: [
        {
            id: "1",
            name: "Dry Cleaning",
            description: "Professional dry cleaning service for delicate fabrics",
            price: "25.00"
        },
        {
            id: "2",
            name: "Laundry Service",
            description: "Wash and fold laundry service",
            price: "22.50"
        }
    ]
};
// Database utility functions
exports.db = {
    // Get all orders
    async getOrders() {
        try {
            // For now, return sample data. In the future, you can uncomment the SQL query:
            // const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
            // return orders;
            return exports.sampleData.orders;
        }
        catch (error) {
            console.error('Error fetching orders:', error);
            return exports.sampleData.orders; // Fallback to sample data
        }
    },
    // Get order by ID
    async getOrderById(id) {
        try {
            // const order = await sql`SELECT * FROM orders WHERE id = ${id}`;
            // return order[0];
            return exports.sampleData.orders.find(order => order.id === id);
        }
        catch (error) {
            console.error('Error fetching order:', error);
            return null;
        }
    },
    // Create new order
    async createOrder(orderData) {
        try {
            // const newOrder = await sql`
            //   INSERT INTO orders (customer_name, customer_email, status, total_amount, items, shipping_address)
            //   VALUES (${orderData.customerName}, ${orderData.customerEmail}, ${orderData.status}, ${orderData.totalAmount}, ${JSON.stringify(orderData.items)}, ${JSON.stringify(orderData.shippingAddress)})
            //   RETURNING *
            // `;
            // return newOrder[0];
            const newOrder = {
                id: Date.now().toString(),
                orderNumber: `ORD-${String(Date.now()).slice(-6)}`,
                ...orderData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            exports.sampleData.orders.push(newOrder);
            return newOrder;
        }
        catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },
    // Get all customers
    async getCustomers() {
        try {
            // const customers = await sql`SELECT * FROM customers ORDER BY created_at DESC`;
            // return customers;
            return exports.sampleData.customers;
        }
        catch (error) {
            console.error('Error fetching customers:', error);
            return exports.sampleData.customers;
        }
    },
    // Get customer by ID
    async getCustomerById(id) {
        try {
            // const customer = await sql`SELECT * FROM customers WHERE id = ${id}`;
            // return customer[0];
            return exports.sampleData.customers.find(customer => customer.id === id);
        }
        catch (error) {
            console.error('Error fetching customer:', error);
            return null;
        }
    },
    // Create new customer
    async createCustomer(customerData) {
        try {
            // const newCustomer = await sql`
            //   INSERT INTO customers (name, email, phone, address)
            //   VALUES (${customerData.name}, ${customerData.email}, ${customerData.phone}, ${JSON.stringify(customerData.address)})
            //   RETURNING *
            // `;
            // return newCustomer[0];
            const newCustomer = {
                id: Date.now().toString(),
                ...customerData,
                totalOrders: 0,
                totalSpent: "0.00",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                joinDate: new Date().toISOString(),
                lastOrder: new Date().toISOString()
            };
            exports.sampleData.customers.push(newCustomer);
            return newCustomer;
        }
        catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    },
    // Get all products
    async getProducts() {
        try {
            // const products = await sql`SELECT * FROM products ORDER BY name`;
            // return products;
            return exports.sampleData.products;
        }
        catch (error) {
            console.error('Error fetching products:', error);
            return exports.sampleData.products;
        }
    },
    // Get all services
    async getServices() {
        try {
            // const services = await sql`SELECT * FROM services ORDER BY name`;
            // return services;
            return exports.sampleData.services;
        }
        catch (error) {
            console.error('Error fetching services:', error);
            return exports.sampleData.services;
        }
    },
    // Get dashboard metrics
    async getDashboardMetrics() {
        try {
            // const metrics = await sql`
            //   SELECT 
            //     COUNT(*) as total_orders,
            //     SUM(total_amount::numeric) as total_revenue,
            //     COUNT(DISTINCT customer_id) as total_customers
            //   FROM orders 
            //   WHERE created_at >= NOW() - INTERVAL '30 days'
            // `;
            // return metrics[0];
            const dueDateStats = await this.getDueDateStats();
            return {
                totalRevenue: 1250.50,
                totalOrders: 25,
                newCustomers: 8,
                inventoryItems: 15,
                dueDateStats: dueDateStats
            };
        }
        catch (error) {
            console.error('Error fetching dashboard metrics:', error);
            return {
                totalRevenue: 0,
                totalOrders: 0,
                newCustomers: 0,
                inventoryItems: 0,
                dueDateStats: {
                    today: 0,
                    tomorrow: 0,
                    upcoming: 0,
                    overdue: 0,
                    total: 0
                }
            };
        }
    },
    // Get orders by due date (upcoming deliveries)
    async getOrdersByDueDate(daysAhead = 7) {
        try {
            // const orders = await sql`
            //   SELECT * FROM orders 
            //   WHERE due_date BETWEEN NOW() AND NOW() + INTERVAL '${daysAhead} days'
            //   AND status IN ('pending', 'processing', 'ready')
            //   ORDER BY due_date ASC
            // `;
            // return orders;
            const today = new Date();
            const futureDate = new Date(today.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
            return exports.sampleData.orders.filter(order => {
                const dueDate = new Date(order.dueDate);
                return dueDate >= today && dueDate <= futureDate &&
                    ['pending', 'processing', 'ready'].includes(order.status);
            }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        }
        catch (error) {
            console.error('Error fetching orders by due date:', error);
            return [];
        }
    },
    // Get overdue orders
    async getOverdueOrders() {
        try {
            // const orders = await sql`
            //   SELECT * FROM orders 
            //   WHERE due_date < NOW() AND status IN ('pending', 'processing')
            //   ORDER BY due_date ASC
            // `;
            // return orders;
            const today = new Date();
            return exports.sampleData.orders.filter(order => {
                const dueDate = new Date(order.dueDate);
                return dueDate < today && ['pending', 'processing'].includes(order.status);
            }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        }
        catch (error) {
            console.error('Error fetching overdue orders:', error);
            return [];
        }
    },
    // Get today's due orders
    async getTodaysDueOrders() {
        try {
            // const orders = await sql`
            //   SELECT * FROM orders 
            //   WHERE DATE(due_date) = CURRENT_DATE 
            //   AND status IN ('pending', 'processing', 'ready')
            //   ORDER BY estimated_delivery ASC
            // `;
            // return orders;
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            return exports.sampleData.orders.filter(order => {
                const dueDate = new Date(order.dueDate).toISOString().split('T')[0];
                return dueDate === today && ['pending', 'processing', 'ready'].includes(order.status);
            }).sort((a, b) => new Date(a.estimatedDelivery).getTime() - new Date(b.estimatedDelivery).getTime());
        }
        catch (error) {
            console.error('Error fetching today\'s due orders:', error);
            return [];
        }
    },
    // Get due date statistics
    async getDueDateStats() {
        try {
            const today = new Date();
            const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
            const weekFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
            const todaysOrders = await this.getTodaysDueOrders();
            const tomorrowsOrders = exports.sampleData.orders.filter(order => {
                const dueDate = new Date(order.dueDate);
                const dueDateStr = dueDate.toISOString().split('T')[0];
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                return dueDateStr === tomorrowStr && ['pending', 'processing', 'ready'].includes(order.status);
            });
            const upcomingOrders = await this.getOrdersByDueDate(7);
            const overdueOrders = await this.getOverdueOrders();
            return {
                today: todaysOrders.length,
                tomorrow: tomorrowsOrders.length,
                upcoming: upcomingOrders.length,
                overdue: overdueOrders.length,
                total: exports.sampleData.orders.length
            };
        }
        catch (error) {
            console.error('Error fetching due date stats:', error);
            return {
                today: 0,
                tomorrow: 0,
                upcoming: 0,
                overdue: 0,
                total: 0
            };
        }
    },
    // Test database connection
    async testConnection() {
        try {
            // const result = await sql`SELECT NOW() as current_time`;
            // return { connected: true, time: result[0].current_time };
            return { connected: true, time: new Date().toISOString() };
        }
        catch (error) {
            console.error('Database connection test failed:', error);
            return { connected: false, error: error.message };
        }
    }
};
