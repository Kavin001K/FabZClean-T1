import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================
// RBAC: System Roles, Departments & Auto-Mapping
// ============================================================

export const SYSTEM_ROLES = [
  'admin',
  'store_manager',
  'factory_manager',
  'store_staff',
  'factory_staff',
  'driver',
] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const DEPARTMENTS = [
  'Management',
  'Staff & Faculty',
  'Deliver',
] as const;
export type Department = (typeof DEPARTMENTS)[number];

/** Auto-map: systemRole → { department, position } */
export const ROLE_MAP: Record<SystemRole, { department: Department; position: string }> = {
  admin: { department: 'Management', position: 'Admin' },
  store_manager: { department: 'Management', position: 'Store Manager' },
  factory_manager: { department: 'Management', position: 'Factory Manager' },
  store_staff: { department: 'Staff & Faculty', position: 'Store Staff' },
  factory_staff: { department: 'Staff & Faculty', position: 'Factory Staff' },
  driver: { department: 'Deliver', position: 'Driver' },
};

/** Roles that can log in to the system */
export const LOGIN_ROLES: SystemRole[] = ['admin', 'store_manager', 'factory_manager', 'store_staff', 'driver'];

/** Maximum number of admin users allowed */
export const MAX_ADMIN_COUNT = 5;

/** Navigation access matrix: role → allowed route prefixes */
export const ROLE_NAV_ACCESS: Record<SystemRole, string[]> = {
  admin: ['/', '/dashboard', '/create-order', '/orders', '/customers', '/wallet-management', '/credits', '/user-management', '/services', '/print-queue', '/settings', '/profile'],
  store_manager: ['/', '/dashboard', '/create-order', '/orders', '/customers', '/wallet-management', '/credits', '/services', '/print-queue', '/settings', '/profile'],
  factory_manager: ['/', '/dashboard', '/orders', '/print-queue', '/settings', '/profile'],
  store_staff: ['/', '/dashboard', '/create-order', '/orders', '/customers', '/wallet-management', '/credits', '/print-queue', '/profile'],
  factory_staff: [], // No login
  driver: ['/profile'],
};


export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
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
  orderNumber: text("order_number").notNull(),
  franchiseId: text("franchise_id"),
  customerId: text("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  status: text("status", { enum: ["pending", "processing", "completed", "cancelled", "assigned", "in_transit", "shipped", "out_for_delivery", "delivered", "in_store", "ready_for_transit", "ready_for_pickup", "ready_for_delivery"] }).notNull(),
  paymentStatus: text("payment_status").notNull().default('pending').$type<"pending" | "paid" | "failed" | "partial" | "credit">(),
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
  deliveryPartnerId: varchar("delivery_partner_id").references(() => employees.id),
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
  // Bill / Invoice URL tracking
  invoiceUrl: text("invoice_url"),
  // Tag printing tracking
  tagsPrinted: boolean("tags_printed").default(false),
  // Delivery earnings & credit tracking
  deliveryEarningsCalculated: integer("delivery_earnings_calculated").default(0),
  deliveryCashCollected: decimal("delivery_cash_collected", { precision: 10, scale: 2 }).default("0"),
  isCreditOrder: boolean("is_credit_order").default(false),
  walletUsed: decimal("wallet_used", { precision: 10, scale: 2 }).default("0"),
  creditUsed: decimal("credit_used", { precision: 10, scale: 2 }).default("0"),
  deliveredAt: timestamp("delivered_at"),
  dispatchedAt: timestamp("dispatched_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  driverName: text("driver_name").notNull(),
  vehicleId: text("vehicle_id").notNull(),
  status: text("status", { enum: ["pending", "in_transit", "delivered", "failed"] }).notNull().default("pending"),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  location: jsonb("location"),
  route: jsonb("route"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderTransactions = pgTable("order_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionNumber: varchar("transaction_number", { length: 255 }).notNull(),
  items: jsonb("items").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method", { enum: ["cash", "credit", "debit", "mobile"] }).notNull(),
  cashierId: text("cashier_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  franchiseId: text("franchise_id"),
  address: jsonb("address"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).default("-500"),
  walletBalanceCache: decimal("wallet_balance_cache", { precision: 10, scale: 2 }).default("0"),
  creditBalance: decimal("credit_balance", { precision: 10, scale: 2 }).default("0"),
  status: text("status", { enum: ["active", "inactive", "deleted"] }).default("active"),
  lastOrder: timestamp("last_order"),
  notes: text("notes"),
  companyName: text("company_name"),
  taxId: text("tax_id"),
  dateOfBirth: text("date_of_birth"),
  paymentTerms: text("payment_terms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  shipmentNumber: text("shipment_number").notNull(),
  orderIds: jsonb("order_ids").notNull(),
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
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["qr", "barcode", "ean13", "code128"] }).notNull(),
  entityType: text("entity_type", { enum: ["order", "shipment", "product"] }).notNull(),
  entityId: varchar("entity_id").notNull(),
  data: jsonb("data"),
  imagePath: text("image_path"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: text("employee_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  franchiseId: text("franchise_id"),
  position: text("position").notNull(),
  department: text("department").notNull(),
  hireDate: timestamp("hire_date").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  status: text("status", { enum: ["active", "inactive", "terminated"] }).notNull().default("active"),
  managerId: varchar("manager_id").references((): any => employees.id),
  address: jsonb("address"),
  emergencyContact: jsonb("emergency_contact"),
  skills: jsonb("skills"),
  performanceRating: decimal("performance_rating", { precision: 3, scale: 2 }).default("0.00"),
  lastReviewDate: timestamp("last_review_date"),
  profileImage: text("profile_image"),
  orderLetter: text("order_letter"),
  settings: jsonb("settings"),
  qualifications: text("qualifications"),
  salaryType: text("salary_type").default("monthly"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  ifscCode: text("ifsc_code"),
  panNumber: text("pan_number"),
  aadharNumber: text("aadhar_number"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  bloodGroup: text("blood_group"),
  workingHours: integer("working_hours").default(8),
  notes: text("notes"),
  // Delivery partner per-order salary
  perOrderSalary: integer("per_order_salary").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type", { enum: ["invoice", "receipt", "report", "label", "other", "legal"] }).notNull().default("invoice"),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status", { enum: ["draft", "sent", "paid", "overdue", "cancelled"] }).default("draft"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  customerName: text("customer_name"),
  orderNumber: text("order_number"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Placeholder schemas to fix missing exports in existing routes
export const insertEmployeeTaskSchema = z.any();
export const insertTransitOrderSchema = z.any();
export type TransitOrder = any;

// Insert schemas
export const insertUserSchema = createInsertSchema(users);

export const insertProductSchema = createInsertSchema(products);

export const insertOrderSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.string().optional(),
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
  deliveryPartnerId: z.string().optional().nullable(),
  fulfillmentType: z.enum(["pickup", "delivery"]).optional().default("pickup"),
  deliveryCharges: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().nullable(),
  deliveryAddress: z.any().optional().nullable(),
  isExpressOrder: z.coerce.boolean().optional().default(false),
  priority: z.enum(["normal", "high", "urgent"]).optional().default("normal"),
  lastWhatsappStatus: z.string().optional().nullable(),
  lastWhatsappSentAt: z.coerce.date().optional().nullable(),
  whatsappMessageCount: z.number().optional().default(0),
  invoiceUrl: z.string().optional().nullable(),
  tagsPrinted: z.coerce.boolean().optional().default(false),
  deliveryEarningsCalculated: z.number().optional().default(0),
  isCreditOrder: z.coerce.boolean().optional().default(false),
  walletUsed: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().nullable(),
  creditUsed: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().nullable(),
  deliveredAt: z.coerce.date().optional().nullable(),
  dispatchedAt: z.coerce.date().optional().nullable(),
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

export const insertDocumentSchema = createInsertSchema(documents);

// Types
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

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// ============================================================
// CENTRALIZED TRANSACTIONS LEDGER (Master Ledger)
// ============================================================

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id),

  // Transaction type
  type: text("type", { enum: ["WALLET_RECHARGE", "ORDER_PAYMENT", "ORDER_REFUND"] }).notNull(),

  // Payment method
  paymentMethod: text("payment_method", { enum: ["CASH", "CREDIT_WALLET", "UPI", "CARD", "BANK_TRANSFER"] }).notNull(),

  // Amount
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  // Status
  status: text("status", { enum: ["SUCCESS", "FAILED", "PENDING"] }).notNull().default("SUCCESS"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions);
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// ============================================================
// WALLETS (Core Payment System)
// ============================================================

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status", { enum: ["active", "inactive", "frozen"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWalletSchema = createInsertSchema(wallets);
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  type: text("type", { enum: ["credit", "debit"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  referenceOrderId: varchar("reference_order_id").references(() => orders.id),
  verifiedByStaff: varchar("verified_by_staff").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions);
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

// ============================================================
// CREDIT ACCOUNTS AND LEDGER
// ============================================================

export const creditAccounts = pgTable("credit_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull().unique(),
  totalCredit: decimal("total_credit", { precision: 10, scale: 2 }).notNull().default("0"),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).notNull().default("1000"),
  status: text("status", { enum: ["active", "suspended"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCreditAccountSchema = createInsertSchema(creditAccounts);
export type InsertCreditAccount = z.infer<typeof insertCreditAccountSchema>;
export type CreditAccount = typeof creditAccounts.$inferSelect;

export const creditLedger = pgTable("credit_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  type: text("type", { enum: ["credit", "debit"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCreditLedgerSchema = createInsertSchema(creditLedger);
export type InsertCreditLedger = z.infer<typeof insertCreditLedgerSchema>;
export type CreditLedger = typeof creditLedger.$inferSelect;

// ============================================================
// CUSTOMER CREDIT SYSTEM (Wallet History)
// Tracks credit transactions - debits (orders on credit) and payments
// ============================================================

export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id),

  // Transaction type
  type: text("type", { enum: ["credit", "payment", "adjustment", "refund", "CREDIT_IN", "CREDIT_OUT"] }).notNull(),

  // Amount (positive for credit given, negative for payment received)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  // Running balance after this transaction
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),

  // Payment method (for payments/settlements)
  paymentMethod: text("payment_method"),

  // Reference numbers
  referenceNumber: text("reference_number"),

  // Notes and reason
  notes: text("notes"),
  reason: text("reason"),

  // Who recorded this
  recordedBy: varchar("recorded_by"),
  recordedByName: text("recorded_by_name"),

  // Timestamps
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions);
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;

// ============================================================
// MONTHLY PERFORMANCE METRICS (Autonomous Analytics)
// ============================================================

export const monthlyPerformanceMetrics = pgTable("monthly_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // e.g. "2026-03"
  metricType: text("metric_type", {
    enum: ["total_deliveries", "avg_delivery_time", "total_delivery_payouts", "revenue"]
  }).notNull(),
  value: decimal("value", { precision: 14, scale: 2 }).notNull().default("0"),
  percentageChangeMoM: decimal("percentage_change_mom", { precision: 8, scale: 2 }).default("0"),
  lastComputedAt: timestamp("last_computed_at").defaultNow(),
});

export const insertMonthlyPerformanceMetricSchema = createInsertSchema(monthlyPerformanceMetrics);
export type InsertMonthlyPerformanceMetric = z.infer<typeof insertMonthlyPerformanceMetricSchema>;
export type MonthlyPerformanceMetric = typeof monthlyPerformanceMetrics.$inferSelect;
