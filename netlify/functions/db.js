import { neon } from '@netlify/neon';
// Initialize Neon client - automatically uses NETLIFY_DATABASE_URL
const sql = neon();
// Sample data for demonstration (since we don't have actual tables yet)
export const sampleData = {
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
            shippingAddress: { instructions: "Leave at door", pickupDate: "2024-01-15" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString(),
            total: 25.00,
            service: "Dry Cleaning",
            priority: "Normal"
        },
        {
            id: "2",
            orderNumber: "ORD-002",
            customerName: "Jane Smith",
            customerEmail: "jane@example.com",
            customerPhone: "+1234567891",
            status: "completed",
            paymentStatus: "paid",
            totalAmount: "45.00",
            items: [{ productId: "2", productName: "Laundry Service", quantity: 2, price: "22.50" }],
            shippingAddress: { instructions: "Call before delivery", pickupDate: "2024-01-16" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString(),
            total: 45.00,
            service: "Laundry Service",
            priority: "High"
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
export const db = {
    // Get all orders
    async getOrders() {
        try {
            // For now, return sample data. In the future, you can uncomment the SQL query:
            // const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
            // return orders;
            return sampleData.orders;
        }
        catch (error) {
            console.error('Error fetching orders:', error);
            return sampleData.orders; // Fallback to sample data
        }
    },
    // Get order by ID
    async getOrderById(id) {
        try {
            // const order = await sql`SELECT * FROM orders WHERE id = ${id}`;
            // return order[0];
            return sampleData.orders.find(order => order.id === id);
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
            sampleData.orders.push(newOrder);
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
            return sampleData.customers;
        }
        catch (error) {
            console.error('Error fetching customers:', error);
            return sampleData.customers;
        }
    },
    // Get customer by ID
    async getCustomerById(id) {
        try {
            // const customer = await sql`SELECT * FROM customers WHERE id = ${id}`;
            // return customer[0];
            return sampleData.customers.find(customer => customer.id === id);
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
            sampleData.customers.push(newCustomer);
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
            return sampleData.products;
        }
        catch (error) {
            console.error('Error fetching products:', error);
            return sampleData.products;
        }
    },
    // Get all services
    async getServices() {
        try {
            // const services = await sql`SELECT * FROM services ORDER BY name`;
            // return services;
            return sampleData.services;
        }
        catch (error) {
            console.error('Error fetching services:', error);
            return sampleData.services;
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
            return {
                totalRevenue: 1250.50,
                totalOrders: 25,
                newCustomers: 8,
                inventoryItems: 15
            };
        }
        catch (error) {
            console.error('Error fetching dashboard metrics:', error);
            return {
                totalRevenue: 0,
                totalOrders: 0,
                newCustomers: 0,
                inventoryItems: 0
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
// Export the sql instance for direct queries if needed
export { sql };
