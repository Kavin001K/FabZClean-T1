import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const franchises = pgTable("franchises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  franchiseId: text("franchise_id").notNull().unique(), // Custom ID e.g. FR-001
  branchCode: text("branch_code"), // Short code for order numbers (e.g., POL, KIN)
  ownerName: text("owner_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  whatsappNumber: text("whatsapp_number"), // For WhatsApp notifications
  address: jsonb("address").notNull(),

  // Legal & Tax Information
  legalEntityName: text("legal_entity_name"),
  taxId: text("tax_id"), // PAN Number
  gstNumber: text("gst_number"), // GSTIN
  gstEnabled: boolean("gst_enabled").default(true),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("18.00"),
  sacCode: text("sac_code").default("9971"), // Service Accounting Code

  // Banking Information (for invoices)
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankIfsc: text("bank_ifsc"),
  bankAccountName: text("bank_account_name"),
  bankBranch: text("bank_branch"),

  // UPI Payment
  upiId: text("upi_id"), // For QR code payments
  upiDisplayName: text("upi_display_name"),

  // Operating Hours
  openingTime: text("opening_time").default("09:00"),
  closingTime: text("closing_time").default("21:00"),
  workingDays: jsonb("working_days").default(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),

  // Branding
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#4CAF50"),
  secondaryColor: text("secondary_color").default("#2196F3"),

  // Contact Persons
  managerName: text("manager_name"),
  managerPhone: text("manager_phone"),
  managerEmail: text("manager_email"),

  // Franchise Agreement
  status: text("status", { enum: ["active", "inactive", "pending", "suspended"] }).default("active"),
  documents: jsonb("documents"), // Array of document URLs/metadata
  agreementStartDate: timestamp("agreement_start_date"),
  agreementEndDate: timestamp("agreement_end_date"),
  royaltyPercentage: decimal("royalty_percentage", { precision: 5, scale: 2 }).default("0"),

  // Operational Settings
  autoGenerateOrderNumber: boolean("auto_generate_order_number").default(true),
  orderNumberPrefix: text("order_number_prefix"), // Override default prefix
  enableDelivery: boolean("enable_delivery").default(true),
  defaultDeliveryCharge: decimal("default_delivery_charge", { precision: 10, scale: 2 }).default("0"),
  enableExpressService: boolean("enable_express_service").default(true),
  expressServiceMultiplier: decimal("express_service_multiplier", { precision: 3, scale: 2 }).default("1.50"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  franchiseId: varchar("franchise_id").references(() => franchises.id), // Link to franchise
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id), // Inventory per franchise
  name: text("name").notNull(),
  sku: text("sku").notNull(), // Removed unique constraint globally, should be unique per franchise ideally
  category: text("category").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(10),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  zip: string;
  country?: string;
}

export interface OrderItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  price: string;
  subtotal: string;
  customName?: string;
  tagNote?: string;
}

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  orderNumber: text("order_number").notNull(),
  customerId: text("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  status: text("status", { enum: ["pending", "processing", "completed", "cancelled", "assigned", "in_transit", "shipped", "out_for_delivery", "delivered", "in_store", "ready_for_transit", "ready_for_pickup"] }).notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed", "credit"] }).notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
  pickupDate: timestamp("pickup_date"),
  advancePaid: decimal("advance_paid", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: text("payment_method").default("cash"),
  discountType: text("discount_type"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  couponCode: text("coupon_code"),
  extraCharges: decimal("extra_charges", { precision: 10, scale: 2 }),
  gstEnabled: boolean("gst_enabled").default(false),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("18.00"),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).default("0.00"),
  panNumber: text("pan_number"),
  gstNumber: text("gst_number"),
  specialInstructions: text("special_instructions"),
  // Delivery-related fields
  fulfillmentType: text("fulfillment_type", { enum: ["pickup", "delivery"] }).default("pickup"),
  deliveryCharges: decimal("delivery_charges", { precision: 10, scale: 2 }).default("0"),
  deliveryAddress: jsonb("delivery_address").$type<ShippingAddress>(),
  // Express Order / Priority
  isExpressOrder: boolean("is_express_order").default(false),
  priority: text("priority", { enum: ["normal", "high", "urgent"] }).default("normal"),
  // WhatsApp notification tracking
  lastWhatsappStatus: text("last_whatsapp_status"),
  lastWhatsappSentAt: timestamp("last_whatsapp_sent_at"),
  whatsappMessageCount: integer("whatsapp_message_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  driverName: text("driver_name").notNull(),
  vehicleId: text("vehicle_id").notNull(),
  status: text("status", { enum: ["pending", "in_transit", "delivered", "failed"] }).notNull().default("pending"), // pending, in_transit, delivered, failed
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  location: jsonb("location"), // Current GPS coordinates
  route: jsonb("route"), // Array of delivery stops
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderTransactions = pgTable("order_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  transactionNumber: varchar("transaction_number", { length: 255 }).notNull(),
  items: jsonb("items").notNull(), // Array of transaction items
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method", { enum: ["cash", "credit", "debit", "mobile"] }).notNull(), // cash, credit, debit, mobile
  cashierId: text("cashier_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  name: text("name").notNull(),
  email: text("email"), // Removed unique constraint globally
  phone: text("phone"),
  address: jsonb("address"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  creditBalance: decimal("credit_balance", { precision: 10, scale: 2 }).default("0"),
  lastOrder: timestamp("last_order"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: text("duration").notNull(),
  status: text("status", { enum: ["Active", "Inactive"] }).notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  shipmentNumber: text("shipment_number").notNull(),
  orderIds: jsonb("order_ids").notNull(), // Array of order IDs
  carrier: text("carrier").notNull(),
  trackingNumber: text("tracking_number"),
  status: text("status", { enum: ["pending", "in_transit", "delivered", "failed"] }).notNull().default("pending"),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const barcodes = pgTable("barcodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  code: text("code").notNull().unique(), // The actual barcode/QR code value
  type: text("type", { enum: ["qr", "barcode", "ean13", "code128"] }).notNull(), // Type of code
  entityType: text("entity_type", { enum: ["order", "shipment", "product"] }).notNull(), // What entity this code represents
  entityId: varchar("entity_id").notNull(), // ID of the entity (order, shipment, product)
  data: jsonb("data"), // Additional data stored in the code
  imagePath: text("image_path"), // Path to stored image file
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  employeeId: text("employee_id").notNull(), // Removed unique constraint globally
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"), // Removed unique constraint globally
  phone: text("phone"),
  position: text("position").notNull(),
  department: text("department").notNull(),
  hireDate: timestamp("hire_date").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  status: text("status", { enum: ["active", "inactive", "terminated"] }).notNull().default("active"),
  managerId: varchar("manager_id").references((): any => employees.id),
  address: jsonb("address"),
  emergencyContact: jsonb("emergency_contact"),
  skills: jsonb("skills"), // Array of skills
  performanceRating: decimal("performance_rating", { precision: 3, scale: 2 }).default("0.00"),
  lastReviewDate: timestamp("last_review_date"),
  profileImage: text("profile_image"),
  orderLetter: text("order_letter"), // Unique letter (A-Z) for order isolation
  settings: jsonb("settings"), // User preferences
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeeAttendance = pgTable("employee_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  date: timestamp("date").notNull(),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  breakStart: timestamp("break_start"),
  breakEnd: timestamp("break_end"),
  totalHours: decimal("total_hours", { precision: 4, scale: 2 }),
  status: text("status", { enum: ["present", "absent", "late", "half_day"] }).notNull().default("present"),
  notes: text("notes"),
  locationCheckIn: jsonb("location_check_in"), // Added location
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeeTasks = pgTable("employee_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "cancelled", "verified"] }).notNull().default("pending"),
  estimatedHours: decimal("estimated_hours", { precision: 4, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 4, scale: 2 }),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  assignedBy: varchar("assigned_by").references(() => employees.id),
  metrics: jsonb("metrics"), // Added metrics
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeePerformance = pgTable("employee_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  reviewPeriod: text("review_period").notNull(), // e.g., "2024-Q1"
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull(), // 1.00 to 5.00
  goals: jsonb("goals"), // Array of goals and achievements
  feedback: text("feedback"),
  reviewedBy: varchar("reviewed_by").references(() => employees.id),
  reviewDate: timestamp("review_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  type: text("type", { enum: ["invoice", "receipt", "report", "label", "other", "legal"] }).notNull().default("invoice"),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(), // Path in Supabase storage
  fileUrl: text("file_url").notNull(), // Public URL
  status: text("status", { enum: ["draft", "sent", "paid", "overdue", "cancelled"] }).default("draft"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  customerName: text("customer_name"),
  orderNumber: text("order_number"),
  metadata: jsonb("metadata"), // Additional data (invoice details, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  employeeId: varchar("employee_id").references(() => employees.id),
  action: text("action").notNull(), // login, create_order, etc.
  entityType: text("entity_type"), // order, employee, product
  entityId: text("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertFranchiseSchema = createInsertSchema(franchises, {
  agreementStartDate: z.coerce.date().optional().nullable(),
  agreementEndDate: z.coerce.date().optional().nullable(),
  royaltyPercentage: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().default("0"),
  documents: z.any().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export const insertUserSchema = createInsertSchema(users);

export const insertProductSchema = createInsertSchema(products);

// Create a base insert schema and extend it with additional fields
// Using a more permissive approach to avoid drizzle-zod strict key checking
const baseOrderSchema = createInsertSchema(orders);

export const insertOrderSchema = z.object({
  id: z.string().optional(),
  franchiseId: z.string().optional().nullable(),
  orderNumber: z.string().optional(), // Made optional - auto-generated by server if not provided
  customerId: z.string().optional().nullable(),
  customerName: z.string(),
  customerEmail: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  status: z.enum(["pending", "processing", "completed", "cancelled", "assigned", "in_transit", "shipped", "out_for_delivery", "delivered", "in_store", "ready_for_transit", "ready_for_pickup"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "credit"]).default("pending"),
  totalAmount: z.union([z.string(), z.number()]).transform(val => val.toString()),
  items: z.any(),
  shippingAddress: z.any().optional().nullable(),
  pickupDate: z.coerce.date().optional().nullable(),
  advancePaid: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().nullable(),
  paymentMethod: z.string().optional().default("cash"),
  discountType: z.string().optional().nullable(),
  discountValue: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().nullable(),
  couponCode: z.string().optional().nullable(),
  extraCharges: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().nullable(),
  gstEnabled: z.coerce.boolean().optional().default(false),
  gstRate: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().nullable(),
  gstAmount: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().nullable(),
  panNumber: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  specialInstructions: z.string().optional().nullable(),
  fulfillmentType: z.enum(["pickup", "delivery"]).optional().default("pickup"),
  deliveryCharges: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().nullable(),
  deliveryAddress: z.any().optional().nullable(),
  isExpressOrder: z.coerce.boolean().optional().default(false),
  priority: z.enum(["normal", "high", "urgent"]).optional().default("normal"),
  // WhatsApp notification tracking
  lastWhatsappStatus: z.string().optional().nullable(),
  lastWhatsappSentAt: z.coerce.date().optional().nullable(),
  whatsappMessageCount: z.number().optional().default(0),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}).passthrough();

export const insertDeliverySchema = createInsertSchema(deliveries);

export const insertOrderTransactionSchema = createInsertSchema(orderTransactions);

export const insertCustomerSchema = createInsertSchema(customers);

export const insertServiceSchema = createInsertSchema(services);

export const insertShipmentSchema = createInsertSchema(shipments);

export const insertBarcodeSchema = createInsertSchema(barcodes);

export const insertEmployeeSchema = createInsertSchema(employees);

export const insertEmployeeAttendanceSchema = createInsertSchema(employeeAttendance);

export const insertEmployeeTaskSchema = createInsertSchema(employeeTasks);

export const insertEmployeePerformanceSchema = createInsertSchema(employeePerformance);

export const insertDocumentSchema = createInsertSchema(documents);

// Types
export type InsertFranchise = z.infer<typeof insertFranchiseSchema>;
export type Franchise = typeof franchises.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect & { service?: string };

export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;

export type InsertOrderTransaction = z.infer<typeof insertOrderTransactionSchema>;
export type OrderTransaction = typeof orderTransactions.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipments.$inferSelect;

export type InsertBarcode = z.infer<typeof insertBarcodeSchema>;
export type Barcode = typeof barcodes.$inferSelect;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export type InsertEmployeeAttendance = z.infer<typeof insertEmployeeAttendanceSchema>;
export type EmployeeAttendance = typeof employeeAttendance.$inferSelect;

export type InsertEmployeeTask = z.infer<typeof insertEmployeeTaskSchema>;
export type EmployeeTask = typeof employeeTasks.$inferSelect;

export type InsertEmployeePerformance = z.infer<typeof insertEmployeePerformanceSchema>;
export type EmployeePerformance = typeof employeePerformance.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export const transitOrders = pgTable("transit_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transitId: text("transit_id").notNull().unique(),
  type: text("type").notNull(), // To Factory, Return to Store
  status: text("status").notNull(), // Pending, In Transit, Received, Completed
  origin: text("origin"),
  destination: text("destination"),
  createdBy: text("created_by"),
  vehicleNumber: text("vehicle_number"),
  vehicleType: text("vehicle_type"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  driverLicense: text("driver_license"),
  employeeName: text("employee_name"),
  employeeId: text("employee_id"),
  designation: text("designation"),
  employeePhone: text("employee_phone"),
  franchiseId: text("franchise_id"),
  totalOrders: integer("total_orders").default(0),
  totalItems: integer("total_items").default(0),
  totalWeight: decimal("total_weight").default("0"),
  orders: jsonb("orders"), // Stores summary of orders if needed
  storeDetails: jsonb("store_details"),
  factoryDetails: jsonb("factory_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  dispatchedAt: timestamp("dispatched_at"),
  receivedAt: timestamp("received_at"),
});

export const transitOrderItems = pgTable("transit_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transitOrderId: varchar("transit_order_id").references(() => transitOrders.id),
  orderId: varchar("order_id").references(() => orders.id),
  orderNumber: text("order_number"),
  customerId: text("customer_id"),
  customerName: text("customer_name"),
  itemCount: integer("item_count").default(0),
  weight: decimal("weight").default("0"),
  serviceType: text("service_type"),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transitStatusHistory = pgTable("transit_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transitOrderId: varchar("transit_order_id").references(() => transitOrders.id),
  status: text("status").notNull(),
  notes: text("notes"),
  location: text("location"), // GPS or place name
  updatedBy: text("updated_by"),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransitOrderSchema = createInsertSchema(transitOrders);
export const insertTransitOrderItemSchema = createInsertSchema(transitOrderItems);
export const insertTransitStatusHistorySchema = createInsertSchema(transitStatusHistory);

export type InsertTransitOrder = z.infer<typeof insertTransitOrderSchema>;
export type TransitOrder = typeof transitOrders.$inferSelect;

export type InsertTransitOrderItem = z.infer<typeof insertTransitOrderItemSchema>;
export type TransitOrderItem = typeof transitOrderItems.$inferSelect;

export type InsertTransitStatusHistory = z.infer<typeof insertTransitStatusHistorySchema>;
export type TransitStatusHistory = typeof transitStatusHistory.$inferSelect;

// ============================================================
// CUSTOMER CREDIT SYSTEM
// Tracks credit transactions - debits (orders on credit) and payments
// ============================================================

export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id), // Link to order if credit was from an order

  // Transaction type
  type: text("type", { enum: ["credit", "payment", "adjustment", "refund"] }).notNull(),

  // Amount (positive for credit given, negative for payment received)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  // Running balance after this transaction
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),

  // Payment method (for payments/settlements)
  paymentMethod: text("payment_method"), // cash, card, upi, bank_transfer

  // Reference numbers
  referenceNumber: text("reference_number"), // UPI ref, cheque number, etc.

  // Notes and reason
  notes: text("notes"),
  reason: text("reason"), // e.g., "Order placed on credit", "Monthly settlement"

  // Who recorded this
  recordedBy: varchar("recorded_by"), // Employee ID
  recordedByName: text("recorded_by_name"),

  // Timestamps
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions);
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
