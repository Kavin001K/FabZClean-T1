"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertBarcodeSchema = exports.insertShipmentSchema = exports.insertServiceSchema = exports.insertCustomerSchema = exports.insertOrderTransactionSchema = exports.insertDeliverySchema = exports.insertOrderSchema = exports.insertProductSchema = exports.insertUserSchema = exports.barcodes = exports.shipments = exports.services = exports.customers = exports.orderTransactions = exports.deliveries = exports.orders = exports.products = exports.users = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
});
exports.products = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    name: (0, pg_core_1.text)("name").notNull(),
    sku: (0, pg_core_1.text)("sku").notNull().unique(),
    category: (0, pg_core_1.text)("category").notNull(),
    description: (0, pg_core_1.text)("description"),
    price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    stockQuantity: (0, pg_core_1.integer)("stock_quantity").notNull().default(0),
    reorderLevel: (0, pg_core_1.integer)("reorder_level").notNull().default(10),
    supplier: (0, pg_core_1.text)("supplier"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    orderNumber: (0, pg_core_1.text)("order_number").notNull().unique(),
    customerName: (0, pg_core_1.text)("customer_name").notNull(),
    customerEmail: (0, pg_core_1.text)("customer_email"),
    customerPhone: (0, pg_core_1.text)("customer_phone"),
    status: (0, pg_core_1.text)("status", { enum: ["pending", "processing", "completed", "cancelled"] }).notNull(), // pending, processing, completed, cancelled
    paymentStatus: (0, pg_core_1.text)("payment_status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"), // pending, paid, failed
    totalAmount: (0, pg_core_1.decimal)("total_amount", { precision: 10, scale: 2 }).notNull(),
    items: (0, pg_core_1.jsonb)("items").notNull(), // Array of order items
    shippingAddress: (0, pg_core_1.jsonb)("shipping_address"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.deliveries = (0, pg_core_1.pgTable)("deliveries", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    orderId: (0, pg_core_1.varchar)("order_id").references(() => exports.orders.id),
    driverName: (0, pg_core_1.text)("driver_name").notNull(),
    vehicleId: (0, pg_core_1.text)("vehicle_id").notNull(),
    status: (0, pg_core_1.text)("status", { enum: ["pending", "in_transit", "delivered", "failed"] }).notNull().default("pending"), // pending, in_transit, delivered, failed
    estimatedDelivery: (0, pg_core_1.timestamp)("estimated_delivery"),
    actualDelivery: (0, pg_core_1.timestamp)("actual_delivery"),
    location: (0, pg_core_1.jsonb)("location"), // Current GPS coordinates
    route: (0, pg_core_1.jsonb)("route"), // Array of delivery stops
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.orderTransactions = (0, pg_core_1.pgTable)("order_transactions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    transactionNumber: (0, pg_core_1.varchar)("transaction_number", { length: 255 }).notNull().unique(),
    items: (0, pg_core_1.jsonb)("items").notNull(), // Array of transaction items
    totalAmount: (0, pg_core_1.decimal)("total_amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: (0, pg_core_1.text)("payment_method", { enum: ["cash", "credit", "debit", "mobile"] }).notNull(), // cash, credit, debit, mobile
    cashierId: (0, pg_core_1.text)("cashier_id"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.customers = (0, pg_core_1.pgTable)("customers", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").unique(),
    phone: (0, pg_core_1.text)("phone"),
    address: (0, pg_core_1.jsonb)("address"),
    totalOrders: (0, pg_core_1.integer)("total_orders").default(0),
    totalSpent: (0, pg_core_1.decimal)("total_spent", { precision: 10, scale: 2 }).default("0"),
    lastOrder: (0, pg_core_1.timestamp)("last_order"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.services = (0, pg_core_1.pgTable)("services", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    name: (0, pg_core_1.text)("name").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    description: (0, pg_core_1.text)("description"),
    price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    duration: (0, pg_core_1.text)("duration").notNull(),
    status: (0, pg_core_1.text)("status", { enum: ["Active", "Inactive"] }).notNull().default("Active"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.shipments = (0, pg_core_1.pgTable)("shipments", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    shipmentNumber: (0, pg_core_1.text)("shipment_number").notNull().unique(),
    orderIds: (0, pg_core_1.jsonb)("order_ids").notNull(), // Array of order IDs
    carrier: (0, pg_core_1.text)("carrier").notNull(),
    trackingNumber: (0, pg_core_1.text)("tracking_number"),
    status: (0, pg_core_1.text)("status", { enum: ["pending", "in_transit", "delivered", "failed"] }).notNull().default("pending"),
    estimatedDelivery: (0, pg_core_1.timestamp)("estimated_delivery"),
    actualDelivery: (0, pg_core_1.timestamp)("actual_delivery"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.barcodes = (0, pg_core_1.pgTable)("barcodes", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    code: (0, pg_core_1.text)("code").notNull().unique(), // The actual barcode/QR code value
    type: (0, pg_core_1.text)("type", { enum: ["qr", "barcode", "ean13", "code128"] }).notNull(), // Type of code
    entityType: (0, pg_core_1.text)("entity_type", { enum: ["order", "shipment", "product"] }).notNull(), // What entity this code represents
    entityId: (0, pg_core_1.varchar)("entity_id").notNull(), // ID of the entity (order, shipment, product)
    data: (0, pg_core_1.jsonb)("data"), // Additional data stored in the code
    imagePath: (0, pg_core_1.text)("image_path"), // Path to stored image file
    isActive: (0, pg_core_1.boolean)("is_active").notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Insert schemas
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users);
exports.insertProductSchema = (0, drizzle_zod_1.createInsertSchema)(exports.products);
exports.insertOrderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.orders);
exports.insertDeliverySchema = (0, drizzle_zod_1.createInsertSchema)(exports.deliveries);
exports.insertOrderTransactionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.orderTransactions);
exports.insertCustomerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.customers);
exports.insertServiceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.services);
exports.insertShipmentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.shipments);
exports.insertBarcodeSchema = (0, drizzle_zod_1.createInsertSchema)(exports.barcodes);
