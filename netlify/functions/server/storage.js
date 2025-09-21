"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.MemStorage = void 0;
const crypto_1 = require("crypto");
class MemStorage {
    constructor() {
        this.users = new Map();
        this.products = new Map();
        this.orders = new Map();
        this.deliveries = new Map();
        this.posTransactions = new Map();
        this.customers = new Map();
        this.services = new Map();
        this.shipments = new Map();
        this.barcodes = new Map();
        this.employees = new Map();
        this.initializeData();
    }
    initializeData() {
        // Initialize with sample data for demonstration
        // This would normally be seeded from a database
        // Sample Products
        const sampleProducts = [
            {
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Stain Remover Plus",
                sku: "SRP-004",
                category: "Cleaning Solutions",
                description: "Heavy-duty stain remover for tough stains",
                price: "34.99",
                stockQuantity: 156,
                reorderLevel: 30,
                supplier: "CleanTech Industries",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Glass Cleaner",
                sku: "GLC-005",
                category: "Cleaning Solutions",
                description: "Streak-free glass and mirror cleaner",
                price: "18.99",
                stockQuantity: 89,
                reorderLevel: 40,
                supplier: "Crystal Clear Co",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Floor Mop Set",
                sku: "FMS-006",
                category: "Cleaning Tools",
                description: "Professional floor mopping system",
                price: "67.99",
                stockQuantity: 45,
                reorderLevel: 20,
                supplier: "Floor Care Pro",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Disinfectant Spray",
                sku: "DSP-007",
                category: "Cleaning Solutions",
                description: "Hospital-grade disinfectant spray",
                price: "28.99",
                stockQuantity: 234,
                reorderLevel: 50,
                supplier: "Health Clean Inc",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Vacuum Bags",
                sku: "VAB-008",
                category: "Cleaning Tools",
                description: "HEPA filter vacuum bags",
                price: "15.99",
                stockQuantity: 12,
                reorderLevel: 25,
                supplier: "Air Quality Solutions",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "All-Purpose Cleaner",
                sku: "APC-009",
                category: "Cleaning Solutions",
                description: "Versatile cleaner for multiple surfaces",
                price: "22.99",
                stockQuantity: 178,
                reorderLevel: 35,
                supplier: "CleanTech Industries",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Scrub Brushes Set",
                sku: "SBS-010",
                category: "Cleaning Tools",
                description: "Multi-purpose scrub brush collection",
                price: "39.99",
                stockQuantity: 67,
                reorderLevel: 15,
                supplier: "Textile Solutions",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ];
        sampleProducts.forEach(product => {
            this.products.set(product.id, product);
        });
        // Sample Customers
        const sampleCustomers = [
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Sarah Johnson",
                email: "sarah.johnson@email.com",
                phone: "+1-555-0123",
                address: { street: "123 Main St", city: "Springfield", state: "IL", zip: "62701" },
                totalOrders: 15,
                totalSpent: "1247.89",
                lastOrder: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Mike Chen",
                email: "mike.chen@email.com",
                phone: "+1-555-0124",
                address: { street: "456 Oak Ave", city: "Springfield", state: "IL", zip: "62702" },
                totalOrders: 8,
                totalSpent: "756.32",
                lastOrder: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Emily Rodriguez",
                email: "emily.rodriguez@email.com",
                phone: "+1-555-0125",
                address: { street: "789 Pine St", city: "Springfield", state: "IL", zip: "62703" },
                totalOrders: 22,
                totalSpent: "1893.45",
                lastOrder: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "David Thompson",
                email: "david.thompson@email.com",
                phone: "+1-555-0126",
                address: { street: "321 Elm St", city: "Springfield", state: "IL", zip: "62704" },
                totalOrders: 5,
                totalSpent: "423.78",
                lastOrder: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Lisa Wang",
                email: "lisa.wang@email.com",
                phone: "+1-555-0127",
                address: { street: "654 Maple Ave", city: "Springfield", state: "IL", zip: "62705" },
                totalOrders: 31,
                totalSpent: "2156.90",
                lastOrder: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Robert Brown",
                email: "robert.brown@email.com",
                phone: "+1-555-0128",
                address: { street: "987 Cedar Blvd", city: "Springfield", state: "IL", zip: "62706" },
                totalOrders: 12,
                totalSpent: "892.34",
                lastOrder: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Jennifer Davis",
                email: "jennifer.davis@email.com",
                phone: "+1-555-0129",
                address: { street: "147 Birch St", city: "Springfield", state: "IL", zip: "62707" },
                totalOrders: 18,
                totalSpent: "1345.67",
                lastOrder: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Michael Wilson",
                email: "michael.wilson@email.com",
                phone: "+1-555-0130",
                address: { street: "258 Spruce Dr", city: "Springfield", state: "IL", zip: "62708" },
                totalOrders: 7,
                totalSpent: "567.89",
                lastOrder: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ];
        sampleCustomers.forEach(customer => {
            this.customers.set(customer.id, customer);
        });
        // Sample Services
        const sampleServices = [
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Dry Cleaning",
                category: "Cleaning",
                description: "Professional dry cleaning service for delicate fabrics",
                price: "15.00",
                duration: "2-3 days",
                status: "Active",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Premium Laundry",
                category: "Laundry",
                description: "High-quality laundry service with premium detergents",
                price: "8.00",
                duration: "1-2 days",
                status: "Active",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Leather Care",
                category: "Specialty",
                description: "Specialized cleaning and conditioning for leather items",
                price: "25.00",
                duration: "3-5 days",
                status: "Active",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Stain Removal",
                category: "Specialty",
                description: "Professional stain removal for tough stains",
                price: "12.00",
                duration: "1-2 days",
                status: "Active",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Express Service",
                category: "Express",
                description: "Same-day cleaning service for urgent needs",
                price: "20.00",
                duration: "Same day",
                status: "Active",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Wedding Dress Cleaning",
                category: "Specialty",
                description: "Specialized cleaning for wedding dresses and formal wear",
                price: "50.00",
                duration: "5-7 days",
                status: "Active",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Rug Cleaning",
                category: "Home",
                description: "Professional rug and carpet cleaning service",
                price: "30.00",
                duration: "3-4 days",
                status: "Active",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                name: "Alterations",
                category: "Tailoring",
                description: "Basic alterations and repairs",
                price: "10.00",
                duration: "2-3 days",
                status: "Active",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ];
        sampleServices.forEach(service => {
            this.services.set(service.id, service);
        });
        // Sample Shipments
        const sampleShipments = [
            {
                id: (0, crypto_1.randomUUID)(),
                shipmentNumber: "SHIP-2024-001",
                orderIds: ["06c2947f-a468-4e69-890c-6d022251efff"],
                carrier: "FedEx",
                trackingNumber: "FX123456789",
                status: "in_transit",
                estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
                actualDelivery: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                shipmentNumber: "SHIP-2024-002",
                orderIds: ["06c2947f-a468-4e69-890c-6d022251efff"],
                carrier: "UPS",
                trackingNumber: "UPS987654321",
                status: "delivered",
                estimatedDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                actualDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                shipmentNumber: "SHIP-2024-003",
                orderIds: ["06c2947f-a468-4e69-890c-6d022251efff"],
                carrier: "DHL",
                trackingNumber: "DHL456789123",
                status: "pending",
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                actualDelivery: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ];
        sampleShipments.forEach(shipment => {
            this.shipments.set(shipment.id, shipment);
        });
        // Sample Orders
        const productIds = Array.from(this.products.keys());
        const customerNames = sampleCustomers.map(c => c.name);
        const sampleOrders = [
            {
                id: (0, crypto_1.randomUUID)(),
                orderNumber: "FC-2024-001",
                customerName: "Sarah Johnson",
                customerEmail: "sarah.johnson@email.com",
                customerPhone: "+1-555-0123",
                status: "processing",
                paymentStatus: "paid",
                totalAmount: "156.00",
                items: [
                    { productId: productIds[0], quantity: 2, price: "89.99" }
                ],
                shippingAddress: { street: "123 Main St", city: "Springfield", state: "IL", zip: "62701" },
                createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderNumber: "FC-2024-002",
                customerName: "Mike Chen",
                customerEmail: "mike.chen@email.com",
                customerPhone: "+1-555-0124",
                status: "completed",
                paymentStatus: "paid",
                totalAmount: "89.50",
                items: [
                    { productId: productIds[0], quantity: 1, price: "89.99" }
                ],
                shippingAddress: { street: "456 Oak Ave", city: "Springfield", state: "IL", zip: "62702" },
                createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderNumber: "FC-2024-003",
                customerName: "Emily Rodriguez",
                customerEmail: "emily.rodriguez@email.com",
                customerPhone: "+1-555-0125",
                status: "pending",
                paymentStatus: "pending",
                totalAmount: "234.97",
                items: [
                    { productId: productIds[1], quantity: 5, price: "12.99" },
                    { productId: productIds[3], quantity: 2, price: "34.99" },
                    { productId: productIds[4], quantity: 3, price: "18.99" }
                ],
                shippingAddress: { street: "789 Pine St", city: "Springfield", state: "IL", zip: "62703" },
                createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderNumber: "FC-2024-004",
                customerName: "Lisa Wang",
                customerEmail: "lisa.wang@email.com",
                customerPhone: "+1-555-0127",
                status: "pending",
                paymentStatus: "paid",
                totalAmount: "178.95",
                items: [
                    { productId: productIds[5], quantity: 1, price: "67.99" },
                    { productId: productIds[6], quantity: 2, price: "28.99" },
                    { productId: productIds[7], quantity: 3, price: "15.99" }
                ],
                shippingAddress: { street: "654 Maple Ave", city: "Springfield", state: "IL", zip: "62705" },
                createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderNumber: "FC-2024-005",
                customerName: "Robert Brown",
                customerEmail: "robert.brown@email.com",
                customerPhone: "+1-555-0128",
                status: "completed",
                paymentStatus: "paid",
                totalAmount: "45.98",
                items: [
                    { productId: productIds[8], quantity: 2, price: "22.99" }
                ],
                shippingAddress: { street: "987 Cedar Blvd", city: "Springfield", state: "IL", zip: "62706" },
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderNumber: "FC-2024-006",
                customerName: "Jennifer Davis",
                customerEmail: "jennifer.davis@email.com",
                customerPhone: "+1-555-0129",
                status: "processing",
                paymentStatus: "paid",
                totalAmount: "127.97",
                items: [
                    { productId: productIds[9], quantity: 1, price: "39.99" },
                    { productId: productIds[1], quantity: 3, price: "12.99" },
                    { productId: productIds[4], quantity: 2, price: "18.99" }
                ],
                shippingAddress: { street: "147 Birch St", city: "Springfield", state: "IL", zip: "62707" },
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderNumber: "FC-2024-007",
                customerName: "David Thompson",
                customerEmail: "david.thompson@email.com",
                customerPhone: "+1-555-0126",
                status: "cancelled",
                paymentStatus: "failed",
                totalAmount: "89.99",
                items: [
                    { productId: productIds[0], quantity: 1, price: "89.99" }
                ],
                shippingAddress: { street: "321 Elm St", city: "Springfield", state: "IL", zip: "62704" },
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderNumber: "FC-2024-008",
                customerName: "Michael Wilson",
                customerEmail: "michael.wilson@email.com",
                customerPhone: "+1-555-0130",
                status: "completed",
                paymentStatus: "paid",
                totalAmount: "67.99",
                items: [
                    { productId: productIds[5], quantity: 1, price: "67.99" }
                ],
                shippingAddress: { street: "258 Spruce Dr", city: "Springfield", state: "IL", zip: "62708" },
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                updatedAt: new Date(),
            }
        ];
        sampleOrders.forEach(order => {
            this.orders.set(order.id, order);
        });
        // Sample POS Transactions
        const sampleTransactions = [
            {
                id: (0, crypto_1.randomUUID)(),
                transactionNumber: "POS-2024-001",
                items: [
                    { productId: productIds[0], quantity: 1, price: "89.99" }
                ],
                totalAmount: "89.99",
                paymentMethod: "credit",
                cashierId: "DEMO_CASHIER",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                transactionNumber: "POS-2024-002",
                items: [
                    { productId: productIds[1], quantity: 3, price: "12.99" },
                    { productId: productIds[4], quantity: 2, price: "18.99" }
                ],
                totalAmount: "70.95",
                paymentMethod: "cash",
                cashierId: "DEMO_CASHIER",
                createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                updatedAt: new Date(Date.now() - 30 * 60 * 1000),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                transactionNumber: "POS-2024-003",
                items: [
                    { productId: productIds[6], quantity: 1, price: "28.99" },
                    { productId: productIds[8], quantity: 1, price: "22.99" }
                ],
                totalAmount: "51.98",
                paymentMethod: "debit",
                cashierId: "DEMO_CASHIER",
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                transactionNumber: "POS-2024-004",
                items: [
                    { productId: productIds[5], quantity: 1, price: "67.99" }
                ],
                totalAmount: "67.99",
                paymentMethod: "credit",
                cashierId: "DEMO_CASHIER",
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                transactionNumber: "POS-2024-005",
                items: [
                    { productId: productIds[3], quantity: 2, price: "34.99" },
                    { productId: productIds[7], quantity: 4, price: "15.99" }
                ],
                totalAmount: "139.94",
                paymentMethod: "mobile",
                cashierId: "DEMO_CASHIER",
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            }
        ];
        sampleTransactions.forEach(transaction => {
            this.posTransactions.set(transaction.id, transaction);
        });
        // Sample Deliveries
        const orderIds = Array.from(this.orders.keys());
        const sampleDeliveries = [
            {
                id: (0, crypto_1.randomUUID)(),
                orderId: orderIds[0],
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
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderId: orderIds[2],
                driverName: "Maria Garcia",
                vehicleId: "VAN-002",
                status: "pending",
                estimatedDelivery: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
                actualDelivery: null,
                location: { lat: 39.7817, lng: -89.6501 },
                route: [
                    { address: "789 Pine St, Springfield, IL", status: "pending" }
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderId: orderIds[3],
                driverName: "David Wilson",
                vehicleId: "TRUCK-003",
                status: "delivered",
                estimatedDelivery: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
                actualDelivery: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                location: { lat: 39.7817, lng: -89.6501 },
                route: [
                    { address: "654 Maple Ave, Springfield, IL", status: "completed" }
                ],
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderId: orderIds[5],
                driverName: "Sarah Johnson",
                vehicleId: "VAN-004",
                status: "in_transit",
                estimatedDelivery: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
                actualDelivery: null,
                location: { lat: 39.7817, lng: -89.6501 },
                route: [
                    { address: "147 Birch St, Springfield, IL", status: "pending" }
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: (0, crypto_1.randomUUID)(),
                orderId: orderIds[7],
                driverName: "Mike Chen",
                vehicleId: "TRUCK-005",
                status: "delivered",
                estimatedDelivery: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                actualDelivery: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
                location: { lat: 39.7817, lng: -89.6501 },
                route: [
                    { address: "258 Spruce Dr, Springfield, IL", status: "completed" }
                ],
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
                updatedAt: new Date(),
            }
        ];
        sampleDeliveries.forEach(delivery => {
            this.deliveries.set(delivery.id, delivery);
        });
    }
    // User methods
    async getUser(id) {
        return this.users.get(id);
    }
    async getUserByUsername(username) {
        return Array.from(this.users.values()).find((user) => user.username === username);
    }
    async createUser(insertUser) {
        const id = (0, crypto_1.randomUUID)();
        const user = { ...insertUser, id };
        this.users.set(id, user);
        return user;
    }
    // Product methods
    async getProducts() {
        return Array.from(this.products.values());
    }
    async getProduct(id) {
        return this.products.get(id);
    }
    async createProduct(insertProduct) {
        const id = (0, crypto_1.randomUUID)();
        const product = {
            ...insertProduct,
            id,
            description: insertProduct.description || null,
            stockQuantity: insertProduct.stockQuantity || 0,
            reorderLevel: insertProduct.reorderLevel || 10,
            supplier: insertProduct.supplier || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.products.set(id, product);
        return product;
    }
    async updateProduct(id, updates) {
        const product = this.products.get(id);
        if (!product)
            return undefined;
        const updatedProduct = {
            ...product,
            ...updates,
            updatedAt: new Date()
        };
        this.products.set(id, updatedProduct);
        return updatedProduct;
    }
    // Order methods
    async getOrders() {
        return Array.from(this.orders.values());
    }
    async getOrder(id) {
        return this.orders.get(id);
    }
    async createOrder(insertOrder) {
        const id = (0, crypto_1.randomUUID)();
        const order = {
            ...insertOrder,
            id,
            customerEmail: insertOrder.customerEmail || null,
            customerPhone: insertOrder.customerPhone || null,
            paymentStatus: insertOrder.paymentStatus || "pending",
            shippingAddress: insertOrder.shippingAddress || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.orders.set(id, order);
        return order;
    }
    async updateOrder(id, updates) {
        const order = this.orders.get(id);
        if (!order)
            return undefined;
        const updatedOrder = {
            ...order,
            ...updates,
            updatedAt: new Date()
        };
        this.orders.set(id, updatedOrder);
        return updatedOrder;
    }
    async deleteOrder(id) {
        return this.orders.delete(id);
    }
    // Delivery methods
    async getDeliveries() {
        return Array.from(this.deliveries.values());
    }
    async getDelivery(id) {
        return this.deliveries.get(id);
    }
    async createDelivery(insertDelivery) {
        const id = (0, crypto_1.randomUUID)();
        const delivery = {
            ...insertDelivery,
            id,
            status: insertDelivery.status || "pending",
            orderId: insertDelivery.orderId || null,
            estimatedDelivery: insertDelivery.estimatedDelivery || null,
            actualDelivery: insertDelivery.actualDelivery || null,
            location: insertDelivery.location || null,
            route: insertDelivery.route || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.deliveries.set(id, delivery);
        return delivery;
    }
    async updateDelivery(id, updates) {
        const delivery = this.deliveries.get(id);
        if (!delivery)
            return undefined;
        const updatedDelivery = {
            ...delivery,
            ...updates,
            updatedAt: new Date()
        };
        this.deliveries.set(id, updatedDelivery);
        return updatedDelivery;
    }
    // POS Transaction methods
    async getPosTransactions() {
        return Array.from(this.posTransactions.values());
    }
    async getPosTransaction(id) {
        return this.posTransactions.get(id);
    }
    async createPosTransaction(insertTransaction) {
        const id = (0, crypto_1.randomUUID)();
        const transaction = {
            ...insertTransaction,
            id,
            cashierId: insertTransaction.cashierId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.posTransactions.set(id, transaction);
        return transaction;
    }
    // Customer methods
    async getCustomers() {
        return Array.from(this.customers.values());
    }
    async getCustomer(id) {
        return this.customers.get(id);
    }
    async createCustomer(insertCustomer) {
        const id = (0, crypto_1.randomUUID)();
        const customer = {
            ...insertCustomer,
            id,
            email: insertCustomer.email || null,
            phone: insertCustomer.phone || null,
            address: insertCustomer.address || null,
            totalOrders: insertCustomer.totalOrders || null,
            totalSpent: insertCustomer.totalSpent || null,
            lastOrder: insertCustomer.lastOrder || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.customers.set(id, customer);
        return customer;
    }
    async updateCustomer(id, updates) {
        const customer = this.customers.get(id);
        if (!customer)
            return undefined;
        const updatedCustomer = {
            ...customer,
            ...updates,
            updatedAt: new Date()
        };
        this.customers.set(id, updatedCustomer);
        return updatedCustomer;
    }
    async deleteCustomer(id) {
        return this.customers.delete(id);
    }
    // Service methods
    async getServices() {
        return Array.from(this.services.values());
    }
    async getService(id) {
        return this.services.get(id);
    }
    async createService(insertService) {
        const id = (0, crypto_1.randomUUID)();
        const service = {
            ...insertService,
            id,
            description: insertService.description || null,
            status: insertService.status || "Active",
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.services.set(id, service);
        return service;
    }
    async updateService(id, updates) {
        const service = this.services.get(id);
        if (!service)
            return undefined;
        const updatedService = {
            ...service,
            ...updates,
            updatedAt: new Date()
        };
        this.services.set(id, updatedService);
        return updatedService;
    }
    async deleteService(id) {
        return this.services.delete(id);
    }
    // Shipment methods
    async getShipments() {
        return Array.from(this.shipments.values());
    }
    async getShipment(id) {
        return this.shipments.get(id);
    }
    async createShipment(insertShipment) {
        const id = (0, crypto_1.randomUUID)();
        const shipment = {
            ...insertShipment,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.shipments.set(id, shipment);
        return shipment;
    }
    async updateShipment(id, updates) {
        const shipment = this.shipments.get(id);
        if (!shipment)
            return undefined;
        const updatedShipment = {
            ...shipment,
            ...updates,
            updatedAt: new Date()
        };
        this.shipments.set(id, updatedShipment);
        return updatedShipment;
    }
    // Barcode methods
    async getBarcodes() {
        return Array.from(this.barcodes.values());
    }
    async getBarcode(id) {
        return this.barcodes.get(id);
    }
    async getBarcodeByCode(code) {
        return Array.from(this.barcodes.values()).find(barcode => barcode.code === code);
    }
    async getBarcodesByEntity(entityType, entityId) {
        return Array.from(this.barcodes.values()).filter(barcode => barcode.entityType === entityType && barcode.entityId === entityId);
    }
    async createBarcode(insertBarcode) {
        const id = (0, crypto_1.randomUUID)();
        const barcode = {
            ...insertBarcode,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.barcodes.set(id, barcode);
        return barcode;
    }
    async updateBarcode(id, updates) {
        const barcode = this.barcodes.get(id);
        if (!barcode)
            return undefined;
        const updatedBarcode = {
            ...barcode,
            ...updates,
            updatedAt: new Date()
        };
        this.barcodes.set(id, updatedBarcode);
        return updatedBarcode;
    }
    async deleteBarcode(id) {
        return this.barcodes.delete(id);
    }
    // Employee methods
    async getEmployees() {
        return Array.from(this.employees.values());
    }
    async getEmployee(id) {
        return this.employees.get(id);
    }
    async createEmployee(insertEmployee) {
        const id = (0, crypto_1.randomUUID)();
        const employee = {
            ...insertEmployee,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.employees.set(id, employee);
        return employee;
    }
    async updateEmployee(id, updates) {
        const employee = this.employees.get(id);
        if (!employee)
            return undefined;
        const updatedEmployee = {
            ...employee,
            ...updates,
            updatedAt: new Date()
        };
        this.employees.set(id, updatedEmployee);
        return updatedEmployee;
    }
    async deleteEmployee(id) {
        return this.employees.delete(id);
    }
    // Analytics methods
    async getDashboardMetrics() {
        const orders = Array.from(this.orders.values());
        const posTransactions = Array.from(this.posTransactions.values());
        const deliveries = Array.from(this.deliveries.values());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const ordersToday = orders.filter(order => order.createdAt && order.createdAt >= today).length;
        const posTransactionsToday = posTransactions.filter(transaction => transaction.createdAt >= today).length;
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
        const dailyRevenue = orders
            .filter(order => order.createdAt && order.createdAt >= today)
            .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
        const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
        const completedDeliveries = deliveries.filter(delivery => delivery.status === "delivered");
        const onTimeDeliveries = completedDeliveries.filter(delivery => delivery.actualDelivery && delivery.estimatedDelivery &&
            delivery.actualDelivery <= delivery.estimatedDelivery);
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
exports.MemStorage = MemStorage;
exports.storage = new MemStorage();
//# sourceMappingURL=storage.js.map