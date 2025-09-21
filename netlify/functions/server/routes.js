"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const http_1 = require("http");
const db_1 = require("./db");
const schema_1 = require("../shared/schema");
const zod_1 = require("zod");
const db_utils_1 = require("./db-utils");
const websocket_server_1 = require("./websocket-server");
const loyalty_program_1 = require("./loyalty-program");
async function registerRoutes(app) {
    // Dashboard metrics
    app.get("/api/dashboard/metrics", async (req, res) => {
        try {
            // Since getDashboardMetrics doesn't exist in SQLiteStorage, calculate manually
            const orders = await db_1.db.listOrders();
            const customers = await db_1.db.listCustomers();
            const products = await db_1.db.listProducts();
            const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const ordersToday = orders.filter((order) => new Date(order.createdAt) >= today).length;
            const newCustomersToday = customers.filter((customer) => new Date(customer.createdAt) >= today).length;
            const transformedMetrics = {
                totalRevenue,
                totalOrders: ordersToday,
                newCustomers: newCustomersToday,
                inventoryItems: products.length,
            };
            res.json(transformedMetrics);
        }
        catch (error) {
            console.error("Dashboard metrics error:", error);
            res.status(500).json({ message: "Failed to fetch dashboard metrics" });
        }
    });
    // Database health check endpoints
    app.get("/api/health/database", async (req, res) => {
        try {
            const health = await (0, db_utils_1.getDatabaseHealth)();
            res.json(health);
        }
        catch (error) {
            res.status(500).json({
                status: "unhealthy",
                error: error.message,
            });
        }
    });
    app.get("/api/health/ping", async (req, res) => {
        try {
            const ping = await (0, db_utils_1.pingDatabase)();
            res.json(ping);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });
    app.get("/api/database/info", async (req, res) => {
        try {
            const info = await (0, db_utils_1.getDatabaseInfo)();
            res.json(info);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Employees endpoints - Fixed method names
    app.get("/api/employees", async (req, res) => {
        try {
            const employees = await db_1.db.listEmployees(); // Changed from getEmployees
            res.json(employees);
        }
        catch (error) {
            console.error("Fetch employees error:", error);
            res.status(500).json({ message: "Failed to fetch employees" });
        }
    });
    app.get("/api/employees/:id", async (req, res) => {
        try {
            const employee = await db_1.db.getEmployee(req.params.id);
            if (!employee) {
                return res.status(404).json({ message: "Employee not found" });
            }
            res.json(employee);
        }
        catch (error) {
            console.error("Fetch employee error:", error);
            res.status(500).json({ message: "Failed to fetch employee" });
        }
    });
    app.post("/api/employees", async (req, res) => {
        try {
            const validatedData = schema_1.insertEmployeeSchema.parse(req.body);
            const employee = await db_1.db.createEmployee(validatedData);
            // Trigger real-time update
            websocket_server_1.realtimeServer.broadcast("employee_created", employee);
            res.status(201).json(employee);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Validation error",
                    errors: error.errors,
                });
            }
            console.error("Create employee error:", error);
            res.status(500).json({ message: "Failed to create employee" });
        }
    });
    app.put("/api/employees/:id", async (req, res) => {
        try {
            const validatedData = schema_1.insertEmployeeSchema.partial().parse(req.body);
            const employee = await db_1.db.updateEmployee(req.params.id, validatedData);
            if (!employee) {
                return res.status(404).json({ message: "Employee not found" });
            }
            // Trigger real-time update
            websocket_server_1.realtimeServer.broadcast("employee_updated", employee);
            res.json(employee);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Validation error",
                    errors: error.errors,
                });
            }
            console.error("Update employee error:", error);
            res.status(500).json({ message: "Failed to update employee" });
        }
    });
    app.delete("/api/employees/:id", async (req, res) => {
        try {
            await db_1.db.deleteEmployee(req.params.id);
            // Trigger real-time update
            websocket_server_1.realtimeServer.broadcast("employee_deleted", { id: req.params.id });
            res.json({ message: "Employee deleted successfully" });
        }
        catch (error) {
            console.error("Delete employee error:", error);
            res.status(500).json({ message: "Failed to delete employee" });
        }
    });
    // Products endpoints - Fixed method names
    app.get("/api/products", async (req, res) => {
        try {
            const products = await db_1.db.listProducts(); // Changed from getProducts
            res.json(products);
        }
        catch (error) {
            console.error("Fetch products error:", error);
            res.status(500).json({ message: "Failed to fetch products" });
        }
    });
    app.get("/api/products/:id", async (req, res) => {
        try {
            const product = await db_1.db.getProduct(req.params.id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            res.json(product);
        }
        catch (error) {
            console.error("Fetch product error:", error);
            res.status(500).json({ message: "Failed to fetch product" });
        }
    });
    app.post("/api/products", async (req, res) => {
        try {
            const validatedData = schema_1.insertProductSchema.parse(req.body);
            const product = await db_1.db.createProduct(validatedData);
            res.status(201).json(product);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid product data",
                    errors: error.errors,
                });
            }
            console.error("Create product error:", error);
            res.status(500).json({ message: "Failed to create product" });
        }
    });
    app.put("/api/products/:id", async (req, res) => {
        try {
            const validatedData = schema_1.insertProductSchema.partial().parse(req.body);
            const product = await db_1.db.updateProduct(req.params.id, validatedData);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            res.json(product);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid product data",
                    errors: error.errors,
                });
            }
            console.error("Update product error:", error);
            res.status(500).json({ message: "Failed to update product" });
        }
    });
    // Orders endpoints - Fixed method names and data handling
    app.get("/api/orders", async (req, res) => {
        try {
            const orders = await db_1.db.listOrders(); // Changed from getOrders
            const products = await db_1.db.listProducts();
            // Create a product lookup map
            const productMap = new Map(products.map((product) => [product.id, product.name]));
            // Transform orders to match frontend expectations
            const transformedOrders = orders.map((order) => {
                // Handle items if they exist in the order
                const items = order.items || [];
                const firstItem = items[0];
                const productId = firstItem?.productId;
                const serviceName = productId
                    ? productMap.get(productId) || "Unknown Service"
                    : "Unknown Service";
                return {
                    ...order,
                    date: order.createdAt,
                    total: parseFloat(order.totalAmount || "0"),
                    service: serviceName,
                    priority: "Normal",
                };
            });
            res.json(transformedOrders);
        }
        catch (error) {
            console.error("Fetch orders error:", error);
            res.status(500).json({ message: "Failed to fetch orders" });
        }
    });
    app.get("/api/orders/:id", async (req, res) => {
        try {
            const order = await db_1.db.getOrder(req.params.id);
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }
            const products = await db_1.db.listProducts();
            const productMap = new Map(products.map((product) => [product.id, product.name]));
            const items = order.items || [];
            const firstItem = items[0];
            const productId = firstItem?.productId;
            const serviceName = productId
                ? productMap.get(productId) || "Unknown Service"
                : "Unknown Service";
            const transformedOrder = {
                ...order,
                date: order.createdAt,
                total: parseFloat(order.totalAmount || "0"),
                service: serviceName,
                priority: "Normal",
            };
            res.json(transformedOrder);
        }
        catch (error) {
            console.error("Fetch order error:", error);
            res.status(500).json({ message: "Failed to fetch order" });
        }
    });
    app.post("/api/orders", async (req, res) => {
        try {
            const validatedData = schema_1.insertOrderSchema.parse(req.body);
            const order = await db_1.db.createOrder(validatedData);
            // Award loyalty points
            await loyalty_program_1.loyaltyProgram.processOrderRewards(order.customerId, parseFloat(order.totalAmount || "0"));
            // Trigger real-time update
            await websocket_server_1.realtimeServer.triggerUpdate("order", "created", order);
            res.status(201).json(order);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid order data",
                    errors: error.errors,
                });
            }
            console.error("Create order error:", error);
            res.status(500).json({ message: "Failed to create order" });
        }
    });
    app.put("/api/orders/:id", async (req, res) => {
        try {
            const validatedData = schema_1.insertOrderSchema.partial().parse(req.body);
            const order = await db_1.db.updateOrder(req.params.id, validatedData);
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }
            // Trigger real-time update
            await websocket_server_1.realtimeServer.triggerUpdate("order", "updated", order);
            res.json(order);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid order data",
                    errors: error.errors,
                });
            }
            console.error("Update order error:", error);
            res.status(500).json({ message: "Failed to update order" });
        }
    });
    app.delete("/api/orders/:id", async (req, res) => {
        try {
            await db_1.db.deleteOrder(req.params.id);
            res.json({ message: "Order deleted successfully" });
        }
        catch (error) {
            console.error("Delete order error:", error);
            res.status(500).json({ message: "Failed to delete order" });
        }
    });
    app.delete("/api/orders", async (req, res) => {
        try {
            const { orderIds } = req.body;
            if (!Array.isArray(orderIds) || orderIds.length === 0) {
                return res.status(400).json({
                    message: "orderIds must be a non-empty array",
                });
            }
            const results = await Promise.allSettled(orderIds.map((id) => db_1.db.deleteOrder(id)));
            const successful = results.filter((result) => result.status === "fulfilled").length;
            const failed = results.length - successful;
            res.json({
                message: `Deleted ${successful} orders successfully${failed > 0 ? `, ${failed} failed` : ""}`,
                successful,
                failed,
                total: orderIds.length,
            });
        }
        catch (error) {
            console.error("Bulk delete orders error:", error);
            res.status(500).json({ message: "Failed to delete orders" });
        }
    });
    // Customer KPIs endpoint - Fixed method names
    app.get("/api/customers/kpis", async (req, res) => {
        try {
            const customers = await db_1.db.listCustomers(); // Changed from getCustomers
            const orders = await db_1.db.listOrders(); // Changed from getOrders
            const totalCustomers = customers.length;
            const newCustomersThisMonth = customers.filter((customer) => {
                const customerDate = new Date(customer.createdAt);
                const currentDate = new Date();
                return (customerDate.getMonth() === currentDate.getMonth() &&
                    customerDate.getFullYear() === currentDate.getFullYear());
            }).length;
            const totalRevenue = customers.reduce((sum, customer) => sum + parseFloat(customer.totalSpent || "0"), 0);
            const avgOrderValue = orders.length > 0
                ? orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0) / orders.length
                : 0;
            const repeatCustomers = customers.filter((customer) => (customer.totalOrders || 0) > 1).length;
            const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
            res.json({
                totalCustomers,
                newCustomersThisMonth,
                totalRevenue,
                avgOrderValue,
                retentionRate,
            });
        }
        catch (error) {
            console.error("Failed to fetch customer KPIs:", error);
            res.status(500).json({ message: "Failed to fetch customer KPIs" });
        }
    });
    // Customers endpoints - Fixed method names
    app.get("/api/customers", async (req, res) => {
        try {
            const customers = await db_1.db.listCustomers(); // Changed from getCustomers
            const transformedCustomers = customers.map((customer) => ({
                ...customer,
                joinDate: customer.createdAt,
                totalSpent: parseFloat(customer.totalSpent || "0"),
            }));
            res.json(transformedCustomers);
        }
        catch (error) {
            console.error("Fetch customers error:", error);
            res.status(500).json({ message: "Failed to fetch customers" });
        }
    });
    app.get("/api/customers/:id", async (req, res) => {
        try {
            const customer = await db_1.db.getCustomer(req.params.id);
            if (!customer) {
                return res.status(404).json({ message: "Customer not found" });
            }
            const transformedCustomer = {
                ...customer,
                joinDate: customer.createdAt,
                totalSpent: parseFloat(customer.totalSpent || "0"),
            };
            res.json(transformedCustomer);
        }
        catch (error) {
            console.error("Fetch customer error:", error);
            res.status(500).json({ message: "Failed to fetch customer" });
        }
    });
    app.post("/api/customers", async (req, res) => {
        try {
            const validatedData = schema_1.insertCustomerSchema.parse(req.body);
            const customer = await db_1.db.createCustomer(validatedData);
            // Trigger real-time update
            await websocket_server_1.realtimeServer.triggerUpdate("customer", "created", customer);
            res.status(201).json(customer);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid customer data",
                    errors: error.errors,
                });
            }
            console.error("Create customer error:", error);
            res.status(500).json({ message: "Failed to create customer" });
        }
    });
    app.put("/api/customers/:id", async (req, res) => {
        try {
            const validatedData = schema_1.insertCustomerSchema.partial().parse(req.body);
            const customer = await db_1.db.updateCustomer(req.params.id, validatedData);
            if (!customer) {
                return res.status(404).json({ message: "Customer not found" });
            }
            const transformedCustomer = {
                ...customer,
                joinDate: customer.createdAt,
                totalSpent: parseFloat(customer.totalSpent || "0"),
            };
            res.json(transformedCustomer);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid customer data",
                    errors: error.errors,
                });
            }
            console.error("Update customer error:", error);
            res.status(500).json({ message: "Failed to update customer" });
        }
    });
    app.delete("/api/customers/:id", async (req, res) => {
        try {
            await db_1.db.deleteCustomer(req.params.id);
            res.json({ message: "Customer deleted successfully" });
        }
        catch (error) {
            console.error("Delete customer error:", error);
            res.status(500).json({ message: "Failed to delete customer" });
        }
    });
    // POS Transactions endpoints - Fixed method names
    app.get("/api/pos/transactions", async (req, res) => {
        try {
            const transactions = await db_1.db.listPosTransactions(); // Changed from getPosTransactions
            res.json(transactions);
        }
        catch (error) {
            console.error("Fetch POS transactions error:", error);
            res.status(500).json({ message: "Failed to fetch POS transactions" });
        }
    });
    app.post("/api/pos/transactions", async (req, res) => {
        try {
            const validatedData = schema_1.insertOrderTransactionSchema.parse(req.body);
            const transaction = await db_1.db.createPosTransaction(validatedData);
            res.status(201).json(transaction);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid transaction data",
                    errors: error.errors,
                });
            }
            console.error("Create POS transaction error:", error);
            res.status(500).json({ message: "Failed to create transaction" });
        }
    });
    // Services endpoints - Fixed method names
    app.get("/api/services", async (req, res) => {
        try {
            const services = await db_1.db.listServices(); // Changed from getServices
            res.json(services);
        }
        catch (error) {
            console.error("Fetch services error:", error);
            res.status(500).json({ message: "Failed to fetch services" });
        }
    });
    // Continue with rest of the endpoints using similar fixes...
    // [Rest of the routes continue with the same pattern of fixing method names and adding error logging]
    // Global Search endpoint - Fixed method names
    app.get("/api/search", async (req, res) => {
        try {
            const query = req.query.q;
            const limit = parseInt(req.query.limit) || 10;
            if (!query || query.trim().length < 2) {
                return res.json({
                    orders: [],
                    customers: [],
                    products: [],
                    services: [],
                    totalResults: 0,
                });
            }
            const searchTerm = query.toLowerCase().trim();
            // Search with fixed method names
            const orders = await db_1.db.listOrders(); // Changed from getOrders
            const customers = await db_1.db.listCustomers(); // Changed from getCustomers
            const products = await db_1.db.listProducts(); // Changed from getProducts
            const services = await db_1.db.listServices(); // Changed from getServices
            const matchingOrders = orders
                .filter((order) => order.customerName?.toLowerCase().includes(searchTerm) ||
                order.orderNumber?.toLowerCase().includes(searchTerm) ||
                order.status?.toLowerCase().includes(searchTerm))
                .slice(0, limit);
            const matchingCustomers = customers
                .filter((customer) => customer.name?.toLowerCase().includes(searchTerm) ||
                customer.email?.toLowerCase().includes(searchTerm) ||
                customer.phone?.toLowerCase().includes(searchTerm))
                .slice(0, limit);
            const matchingProducts = products
                .filter((product) => product.name?.toLowerCase().includes(searchTerm) ||
                product.category?.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm))
                .slice(0, limit);
            const matchingServices = services
                .filter((service) => service.name?.toLowerCase().includes(searchTerm) ||
                service.description?.toLowerCase().includes(searchTerm))
                .slice(0, limit);
            const totalResults = matchingOrders.length +
                matchingCustomers.length +
                matchingProducts.length +
                matchingServices.length;
            res.json({
                orders: matchingOrders.map((order) => ({
                    id: order.id,
                    type: "order",
                    title: `Order #${order.orderNumber || order.id}`,
                    subtitle: order.customerName,
                    description: `${order.status} - ₹${order.totalAmount}`,
                    url: `/orders/${order.id}`,
                    createdAt: order.createdAt,
                })),
                customers: matchingCustomers.map((customer) => ({
                    id: customer.id,
                    type: "customer",
                    title: customer.name,
                    subtitle: customer.email,
                    description: `₹${customer.totalSpent} total spent`,
                    url: `/customers/${customer.id}`,
                    createdAt: customer.createdAt,
                })),
                products: matchingProducts.map((product) => ({
                    id: product.id,
                    type: "product",
                    title: product.name,
                    subtitle: product.category,
                    description: `${product.stockQuantity} in stock`,
                    url: `/inventory/${product.id}`,
                    createdAt: product.createdAt,
                })),
                services: matchingServices.map((service) => ({
                    id: service.id,
                    type: "service",
                    title: service.name,
                    subtitle: service.description,
                    description: `₹${service.price}`,
                    url: `/services/${service.id}`,
                    createdAt: service.createdAt,
                })),
                totalResults,
                query: searchTerm,
            });
        }
        catch (error) {
            console.error("Search error:", error);
            res.status(500).json({ message: "Search failed" });
        }
    });
    // Add remaining endpoints here following the same pattern...
    const httpServer = (0, http_1.createServer)(app);
    return httpServer;
}
//# sourceMappingURL=routes.js.map