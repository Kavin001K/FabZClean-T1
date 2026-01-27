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

  // INDUSTRY STANDARD ADDITIONS

  // Legal & Compliance
  tradeLicenseNumber: text("trade_license_number"),
  msmeRegistration: text("msme_registration"),
  onboardingStatus: text("onboarding_status", { enum: ["pending", "in_progress", "verified", "suspended"] }).default("pending"),
  onboardingChecklist: jsonb("onboarding_checklist").default({
    staff_trained: false,
    machinery_installed: false,
    legal_signed: false
  }),

  // Geofencing for Logistics
  serviceRadiusKm: decimal("service_radius_km", { precision: 5, scale: 2 }).default("5.00"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),

  // Financial Agreements
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }).default("0"),
  billingCycle: text("billing_cycle", { enum: ["weekly", "fortnightly", "monthly"] }).default("monthly"),

  // 1. Onboarding & Compliance (Merging existing)
  onboardingSteps: jsonb("onboarding_steps"),
  isDepositPaid: boolean("is_deposit_paid").default(false),
  securityDepositAmount: decimal("security_deposit_amount", { precision: 12, scale: 2 }).default("0"),

  // 2. Legal & KYC (Merging existing - avoiding duplicates)
  licenseExpiryDate: timestamp("license_expiry_date"),
  fireSafetyStatus: text("fire_safety_status", { enum: ["compliant", "pending", "expired", "not_applicable"] }).default("pending"),

  // 3. Financial Configuration (Merging existing)
  royaltyModel: text("royalty_model", { enum: ["fixed", "percentage"] }).default("percentage"),

  // 4. Territory & Geofencing (Merging existing)
  pinCode: text("pin_code"),

  // 5. Digital Footprint (Merging existing)
  googleMapsPlaceId: text("google_maps_place_id"),
  socialHandles: jsonb("social_handles"), // { instagram: string, facebook: string }
  adminAlertEmail: text("admin_alert_email"),
  customerSupportEmail: text("customer_support_email"),

  // Finance Settings
  defaultCreditLimit: decimal("default_credit_limit", { precision: 10, scale: 2 }).default("1000"),
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
  reorderLevel: integer("reorder_level").notNull().default(10), // Acts as min_stock_level
  supplier: text("supplier"),

  // New Inventory Management Fields
  batchNumber: text("batch_number"),
  expiryDate: timestamp("expiry_date"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }), // For cost tracking
  unitType: text("unit_type", { enum: ["piece", "kg", "liter", "meter", "box"] }).default("piece"),
  conversionFactor: decimal("conversion_factor", { precision: 10, scale: 4 }).default("1"), // e.g. 1 Box = 100 Pieces

  // Audit Trail (Lightweight)
  lastStockUpdate: timestamp("last_stock_update"),
  lastStockUpdateBy: text("last_stock_update_by"),

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
  employeeId: varchar("employee_id").references(() => employees.id),
  createdBy: text("created_by"), // Identifier for who created the order
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  status: text("status", { enum: ["pending", "processing", "completed", "cancelled", "assigned", "in_transit", "shipped", "out_for_delivery", "delivered", "in_store", "ready_for_transit", "ready_for_pickup", "archived"] }).notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "partial", "paid", "failed", "credit"] }).notNull().default("pending"),
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
  // Operational Metadata
  isExpress: boolean("is_express").default(false),
  garmentCount: integer("garment_count").notNull().default(0),
  rackLocation: text("rack_location"), // For store pickup efficiency

  // Security Handshake
  handoverOtp: text("handover_otp"), // Generated for driver/factory handshake
  itemVerificationStatus: text("item_verification", { enum: ["unverified", "verified", "disputed"] }).default("unverified"),

  // Insurance / Liability
  orderNotes: text("order_notes"), // Internal staff notes
  customerInstructions: text("customer_instructions"),
  photoUrls: jsonb("photo_urls"), // Proof of garment condition at pickup

  // Financial additions for Partial Payments
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0.00"),
  lastPaymentMethod: text("last_payment_method"), // cash, upi, wallet

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  orderId: varchar("order_id").references(() => orders.id),
  driverId: varchar("driver_id"),
  driverName: text("driver_name").notNull(),
  vehicleId: text("vehicle_id").notNull(),
  status: text("status", { enum: ["pending", "in_transit", "delivered", "failed", "scheduled"] }).notNull().default("pending"),
  scheduledDate: timestamp("scheduled_date"),
  statusUpdatedAt: timestamp("status_updated_at"),
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
  email: text("email"),
  phone: text("phone").notNull(), // Required for ID verification
  address: jsonb("address"),

  // CRM & Retention
  loyaltyTier: text("loyalty_tier", { enum: ["bronze", "silver", "gold", "platinum"] }).default("bronze"),
  loyaltyPoints: integer("loyalty_points").default(0),
  marketingOptIn: boolean("marketing_opt_in").default(true),
  customerPreferences: jsonb("customer_preferences").default({
    starch: "none",
    packaging: "fold",
    fragrance: "standard"
  }),

  // Financial Ledger
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0"),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).default("5000"), // Store-defined limit
  totalLifetimeSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"), // Renaming/Mapping to existing
  totalOrders: integer("total_orders").default(0),

  // Kept for backward compatibility
  creditBalance: decimal("credit_balance", { precision: 10, scale: 2 }).default("0"),
  tier: text("tier", { enum: ["Bronze", "Silver", "Gold", "Platinum"] }).default("Bronze"),
  preferences: jsonb("preferences"),
  status: text("status", { enum: ["active", "inactive", "archived"] }).default("active"),

  lastOrderAt: timestamp("last_order_at"), // Mapped from last_order
  lastOrder: timestamp("last_order"), // Keeping existing field but maybe deprecating?
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  name: text("name").notNull(),
  category: text("category").notNull(), // Laundry, Dry Cleaning, Repairs, etc.
  description: text("description"),

  // Pricing & Tax
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  pricingModel: text("pricing_model", { enum: ["per_piece", "per_kg", "per_sqft", "fixed"] }).default("per_piece"),
  hsnSacCode: text("hsn_sac_code"), // For GST compliance

  // Workflow & Resources
  duration: text("duration"), // Keeping for backward compatibility (display string)
  leadTimeHours: integer("lead_time_hours").default(24), // For automatic due date calculation
  requiredInventory: jsonb("required_inventory"), // [{ chemicalId, amount }, ...]

  // Handling
  technicianNotes: text("technician_notes"), // Printed on tags

  // Display
  thumbnailUrl: text("thumbnail_url"),

  // Hierarchy
  parentServiceId: text("parent_service_id"), // If this is an add-on (e.g., Starch)
  isAddOn: boolean("is_add_on").default(false),

  status: text("status", { enum: ["Active", "Inactive", "Archived"] }).notNull().default("Active"),
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
  username: text("username"),
  password: text("password"),
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
  role: text("role", { enum: ["admin", "franchise_manager", "staff", "driver"] }).default("staff"),
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
  type: text("type", { enum: ["invoice", "receipt", "report", "label", "other", "legal_agreement", "tax_compliance", "kyc_proof", "operational_license", "insurance"] }).notNull().default("invoice"),
  category: text("category", { enum: ["legal", "tax", "kyc", "license", "insurance", "operational"] }),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(), // Path in Supabase storage
  fileUrl: text("file_url").notNull(), // Public URL
  status: text("status", { enum: ["draft", "sent", "paid", "overdue", "cancelled", "active", "expired", "revoked"] }).default("draft"),

  // Versions & Expiry
  versionNumber: integer("version_number").default(1),
  expiryDate: timestamp("expiry_date"),

  // Verification Logic
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => employees.id),
  verificationStatus: text("verification_status", { enum: ["unverified", "verified", "rejected"] }).default("unverified"),
  rejectionReason: text("rejection_reason"),

  amount: decimal("amount", { precision: 10, scale: 2 }),
  customerName: text("customer_name"),
  orderNumber: text("order_number"),
  metadata: jsonb("metadata"), // Additional data (extracted OCR text, etc.)
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
  // New Delta Capture Fields
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  severity: text("severity", { enum: ["info", "warning", "critical", "error"] }).default("info"),
  category: text("category"), // financial, logistics, security, lifecycle
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Updated Franchise Onboarding Schema
export const insertFranchiseSchema = createInsertSchema(franchises).extend({
  // Adding manual validations for flattened address fields if needed
  street: z.string().min(5).optional(),
  pincode: z.string().length(6).optional(),
});

export const insertUserSchema = createInsertSchema(users);

export const insertProductSchema = createInsertSchema(products).extend({
  price: z.union([z.string(), z.number()]).transform(val => val.toString()),
  stockQuantity: z.coerce.number().min(0),
  reorderLevel: z.coerce.number().min(0),
  // New Fields Validation
  batchNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
  costPerUnit: z.union([z.string(), z.number()]).transform(val => val.toString()).optional(),
  unitType: z.enum(["piece", "kg", "liter", "meter", "box"]).optional().default("piece"),
  conversionFactor: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().default("1"),
});
export const insertDeliverySchema = createInsertSchema(deliveries);

// Create a base insert schema and extend it with additional fields
export const insertOrderSchema = z.object({
  id: z.string().optional(),
  franchiseId: z.string().optional().nullable(),
  orderNumber: z.string().optional(), // Made optional - auto-generated by server if not provided
  customerId: z.string().optional().nullable(),
  customerName: z.string(),
  customerEmail: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  status: z.enum(["pending", "processing", "completed", "cancelled", "assigned", "in_transit", "shipped", "out_for_delivery", "delivered", "in_store", "ready_for_transit", "ready_for_pickup", "archived"]),
  paymentStatus: z.enum(["pending", "partial", "paid", "failed", "credit"]).default("pending"),
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

  // New Fields
  isExpress: z.boolean().optional().default(false),
  garmentCount: z.number().optional().default(0),
  rackLocation: z.string().optional().nullable(),
  handoverOtp: z.string().optional().nullable(),
  itemVerificationStatus: z.enum(["unverified", "verified", "disputed"]).optional().default("unverified"),
  orderNotes: z.string().optional().nullable(),
  customerInstructions: z.string().optional().nullable(),
  photoUrls: z.any().optional().nullable(),
}).passthrough();

export const insertOrderTransactionSchema = createInsertSchema(orderTransactions);

// Updated Customer CRM Schema
export const insertCustomerSchema = z.object({
  id: z.string().optional(),
  franchiseId: z.string().optional().nullable(),
  name: z.string().optional(),
  email: z.string().optional().nullable(),
  phone: z.string().min(10).max(15).optional(),
  address: z.any().optional().nullable(),
  loyaltyTier: z.enum(["bronze", "silver", "gold", "platinum"]).optional(),
  loyaltyPoints: z.number().optional(),
  marketingOptIn: z.boolean().optional(),
  walletBalance: z.coerce.string().optional(),
  creditLimit: z.coerce.string().optional(),
  totalLifetimeSpent: z.coerce.string().optional(),
  totalOrders: z.number().optional(),
  creditBalance: z.coerce.string().optional(),
  tier: z.string().optional(),
  status: z.string().optional(),
  lastOrderAt: z.coerce.date().optional().nullable(),
  lastOrder: z.coerce.date().optional().nullable(),
  initialDeposit: z.coerce.number().optional(),
}).passthrough();

export const insertServiceSchema = createInsertSchema(services).extend({
  price: z.union([z.string(), z.number()]).transform(val => val.toString()),
  leadTimeHours: z.coerce.number().optional().default(24),
  pricingModel: z.enum(["per_piece", "per_kg", "per_sqft", "fixed"]).optional().default("per_piece"),
  isAddOn: z.coerce.boolean().optional().default(false),
  // New Fields Validation
  hsnSacCode: z.string().optional(),
  technicianNotes: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  parentServiceId: z.string().optional(),
  requiredInventory: z.any().optional(), // JSONB
});

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

// Logistics Vehicles
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  licensePlate: text("license_plate").notNull().unique(),
  makeModel: text("make_model").notNull(),
  type: text("type", { enum: ["bike", "scooter", "van", "truck"] }).notNull().default("van"),
  capacityKg: decimal("capacity_kg", { precision: 8, scale: 2 }).notNull(),
  status: text("status", { enum: ["active", "maintenance", "inactive"] }).default("active"),
  gpsDeviceId: text("gps_device_id"),
  insuranceExpiry: timestamp("insurance_expiry"),
  fitnessExpiry: timestamp("fitness_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transitOrders = pgTable("transit_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transitId: text("transit_id").notNull().unique(),
  type: text("type").notNull(), // To Factory, Return to Store
  status: text("status").notNull(), // Pending, In Transit, Received, Completed
  origin: text("origin"),
  destination: text("destination"),
  createdBy: text("created_by"),

  // Logistics Accountability
  totalWeightKg: decimal("total_weight_kg", { precision: 10, scale: 2 }),
  vehicleCapacityUtilization: decimal("utilization_percent", { precision: 5, scale: 2 }),

  // Handshake Proofs
  dispatchVerifiedBy: text("dispatch_verified_by"), // Staff ID
  receiptVerifiedBy: text("receipt_verified_by"), // Factory Manager ID
  dispatchSignature: text("dispatch_signature"), // Base64 or URL
  receiptSignature: text("receipt_signature"),

  // GPS Snapshot
  originCoords: jsonb("origin_coords"),
  destinationCoords: jsonb("destination_coords"),

  // Handover Security (Chain of Custody)
  verificationOtp: text("verification_otp"),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),

  // Link to Real Vehicle
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  driverId: varchar("driver_id").references(() => employees.id),

  // Legacy fields (keep for fallback)
  vehicleNumber: text("vehicle_number"),
  vehicleType: text("vehicle_type"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  driverLicense: text("driver_license"),

  employeeId: text("employee_id"), // Redundant if driverId is used, but keeping
  employeeName: text("employee_name"),
  designation: text("designation"),
  employeePhone: text("employee_phone"),

  franchiseId: text("franchise_id"),
  totalOrders: integer("total_orders").default(0),
  totalItems: integer("total_items").default(0),
  totalWeight: decimal("total_weight").default("0"), // Keeping existing along with totalWeightKg

  // New: Security Flags
  securityFlags: jsonb("security_flags"), // e.g. ["delayed", "off_route"]

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

// Insert Schemas
export const insertVehicleSchema = createInsertSchema(vehicles);
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// ============================================================================
// DAILY SUMMARIES TABLE - Enterprise BI Data Warehouse
// Pre-calculated statistical data for <200ms analytics load times
// ============================================================================

export const dailySummaries = pgTable("daily_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  franchiseId: varchar("franchise_id").references(() => franchises.id),
  date: timestamp("date").notNull(),

  // ============================================================================
  // REVENUE METRICS
  // ============================================================================
  totalRevenue: decimal("total_revenue", { precision: 14, scale: 2 }).default("0"),
  orderCount: integer("order_count").default(0),
  avgOrderValue: decimal("avg_order_value", { precision: 10, scale: 2 }).default("0"),

  // Growth Metrics
  revenueGrowthDaily: decimal("revenue_growth_daily", { precision: 8, scale: 4 }),  // vs previous day %
  revenueGrowthWeekly: decimal("revenue_growth_weekly", { precision: 8, scale: 4 }), // vs same day last week %
  revenueGrowthMonthly: decimal("revenue_growth_mom", { precision: 8, scale: 4 }),  // Month over Month %
  revenueGrowthYearly: decimal("revenue_growth_yoy", { precision: 8, scale: 4 }),   // Year over Year %

  // ============================================================================
  // PREDICTIVE METRICS
  // ============================================================================
  projectedMonthEndRevenue: decimal("projected_month_end_revenue", { precision: 14, scale: 2 }),
  revenueVelocity: decimal("revenue_velocity", { precision: 8, scale: 4 }),  // Current vs 7-day SMA %
  revenueVelocityTrend: text("revenue_velocity_trend", { enum: ["accelerating", "decelerating", "stable"] }),
  atRiskRevenue: decimal("at_risk_revenue", { precision: 12, scale: 2 }).default("0"),  // Orders past due

  // Linear Regression for Revenue Forecasting (y = mx + b)
  regressionSlope: decimal("regression_slope", { precision: 12, scale: 6 }),  // m
  regressionIntercept: decimal("regression_intercept", { precision: 12, scale: 2 }),  // b
  regressionR2: decimal("regression_r2", { precision: 5, scale: 4 }),  // Coefficient of determination
  forecastNext7Days: jsonb("forecast_next_7_days"),  // [{ date, predicted, confidence }]

  // ============================================================================
  // CUSTOMER METRICS
  // ============================================================================
  customerCount: integer("customer_count").default(0),
  newCustomerCount: integer("new_customer_count").default(0),
  returningCustomerCount: integer("returning_customer_count").default(0),

  // Customer Lifetime Value (CLV) Metrics
  avgCustomerClv: decimal("avg_customer_clv", { precision: 12, scale: 2 }),
  totalPlatinumCustomers: integer("total_platinum_customers").default(0),
  totalGoldCustomers: integer("total_gold_customers").default(0),
  totalSilverCustomers: integer("total_silver_customers").default(0),
  totalBronzeCustomers: integer("total_bronze_customers").default(0),

  // Cohort Metrics
  customerChurnRate: decimal("customer_churn_rate", { precision: 6, scale: 4 }),  // %
  avgRetentionRate: decimal("avg_retention_rate", { precision: 6, scale: 4 }),  // %
  cohortData: jsonb("cohort_data"),  // Detailed cohort retention matrix

  // ============================================================================
  // SERVICE METRICS (Contribution Analysis)
  // ============================================================================
  topServiceId: varchar("top_service_id"),
  topServiceName: text("top_service_name"),
  topServiceRevenue: decimal("top_service_revenue", { precision: 12, scale: 2 }),

  // Service Mix Variance: (Actual% - Target%) * TotalRevenue
  serviceMixVariance: decimal("service_mix_variance", { precision: 12, scale: 2 }),
  heroServicesCount: integer("hero_services_count").default(0),  // High margin performers
  lossLeaderServicesCount: integer("loss_leader_services_count").default(0),

  // Detailed breakdown
  serviceMix: jsonb("service_mix"),  // { serviceId: { name, count, revenue, actualPercent, variance, category } }
  serviceCorrelationTop5: jsonb("service_correlation_top5"),  // Top 5 frequently bought together pairs

  // ============================================================================
  // OPERATIONAL METRICS (Little's Law: L = λ × W)
  // ============================================================================
  avgTurnaroundHours: decimal("avg_turnaround_hours", { precision: 10, scale: 2 }),
  turnaroundStdDev: decimal("turnaround_std_dev", { precision: 10, scale: 4 }),  // Variance in hours
  turnaroundConsistencyScore: integer("turnaround_consistency_score"),  // 0-100
  percentWithinTarget: decimal("percent_within_target", { precision: 6, scale: 2 }),  // % within ±2 hours

  // Little's Law Components
  ordersArrivalRate: decimal("orders_arrival_rate", { precision: 10, scale: 4 }),  // λ (orders per day)
  avgWaitTime: decimal("avg_wait_time", { precision: 10, scale: 4 }),  // W (processing days)
  itemsInProcess: decimal("items_in_process", { precision: 10, scale: 2 }),  // L = λ × W
  bottleneckType: text("bottleneck_type", { enum: ["volume", "processing", "balanced"] }),
  bottleneckRecommendation: text("bottleneck_recommendation"),

  // Order Status Metrics
  readyOnTimeCount: integer("ready_on_time_count").default(0),
  delayedOrderCount: integer("delayed_order_count").default(0),
  pendingOrdersCount: integer("pending_orders_count").default(0),
  completedOrdersCount: integer("completed_orders_count").default(0),

  // ============================================================================
  // STAFF PRODUCTIVITY (Weighted Z-Scores)
  // ============================================================================
  avgStaffZScore: decimal("avg_staff_z_score", { precision: 6, scale: 4 }),
  topPerformerEmployeeId: varchar("top_performer_employee_id"),
  topPerformerName: text("top_performer_name"),
  topPerformerZScore: decimal("top_performer_z_score", { precision: 6, scale: 4 }),
  totalStaffProductivity: decimal("total_staff_productivity", { precision: 12, scale: 2 }),  // Weighted items/hr

  // Detailed staff breakdown
  staffPerformance: jsonb("staff_performance"),  // { staffId: { name, zScore, percentile, rating, weightedScore } }

  // ============================================================================
  // TAX METRICS (GST Breakout Model)
  // ============================================================================
  totalTaxCollected: decimal("total_tax_collected", { precision: 12, scale: 2 }).default("0"),
  cgstAmount: decimal("cgst_amount", { precision: 12, scale: 2 }).default("0"),
  sgstAmount: decimal("sgst_amount", { precision: 12, scale: 2 }).default("0"),
  igstAmount: decimal("igst_amount", { precision: 12, scale: 2 }).default("0"),
  taxableAmount: decimal("taxable_amount", { precision: 14, scale: 2 }).default("0"),

  // HSN/SAC Code Breakdown
  taxByHsnCode: jsonb("tax_by_hsn_code"),  // { hsnCode: { taxableAmount, cgst, sgst, igst } }

  // ============================================================================
  // FINANCIAL METRICS (Contribution Margin)
  // ============================================================================
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0"),
  contributionMargin: decimal("contribution_margin", { precision: 8, scale: 4 }),  // Percentage
  grossProfit: decimal("gross_profit", { precision: 14, scale: 2 }),

  // Payment breakdown
  paymentMethodMix: jsonb("payment_method_mix"),  // { cash: amount, upi: amount, card: amount, credit: amount }
  creditSalesAmount: decimal("credit_sales_amount", { precision: 12, scale: 2 }).default("0"),
  creditCollectedAmount: decimal("credit_collected_amount", { precision: 12, scale: 2 }).default("0"),

  // ============================================================================
  // ANOMALY DETECTION (Fraud Audit)
  // ============================================================================
  anomalyCount: integer("anomaly_count").default(0),
  anomalyDetails: jsonb("anomaly_details"),  // [{ orderId, orderNumber, zScore, flagReason }]
  suspiciousOrderIds: jsonb("suspicious_order_ids"),  // Array of order IDs >3 std devs

  // ============================================================================
  // STATISTICAL AGGREGATES
  // ============================================================================
  orderValueMean: decimal("order_value_mean", { precision: 10, scale: 2 }),
  orderValueMedian: decimal("order_value_median", { precision: 10, scale: 2 }),
  orderValueMode: decimal("order_value_mode", { precision: 10, scale: 2 }),
  orderValueStdDev: decimal("order_value_std_dev", { precision: 10, scale: 4 }),
  orderValueVariance: decimal("order_value_variance", { precision: 14, scale: 4 }),
  orderValue25thPercentile: decimal("order_value_p25", { precision: 10, scale: 2 }),
  orderValue75thPercentile: decimal("order_value_p75", { precision: 10, scale: 2 }),
  orderValue85thPercentile: decimal("order_value_p85", { precision: 10, scale: 2 }),
  orderValue95thPercentile: decimal("order_value_p95", { precision: 10, scale: 2 }),

  // ============================================================================
  // PEAK DEMAND HEATMAP DATA
  // ============================================================================
  peakDemandHour: integer("peak_demand_hour"),  // 0-23
  peakDemandDayOfWeek: integer("peak_demand_day_of_week"),  // 0-6 (Sun-Sat)
  peakDemandScore: decimal("peak_demand_score", { precision: 5, scale: 4 }),  // 0-1 normalized
  demandHeatmapTop10: jsonb("demand_heatmap_top10"),  // Top 10 busiest time slots

  // ============================================================================
  // MOVING AVERAGES (Seasonality)
  // ============================================================================
  sma7DayRevenue: decimal("sma_7_day_revenue", { precision: 12, scale: 2 }),  // 7-day Simple Moving Average
  sma14DayRevenue: decimal("sma_14_day_revenue", { precision: 12, scale: 2 }),  // 14-day SMA
  sma30DayRevenue: decimal("sma_30_day_revenue", { precision: 12, scale: 2 }),  // 30-day SMA
  ema7DayRevenue: decimal("ema_7_day_revenue", { precision: 12, scale: 2 }),  // 7-day Exponential Moving Average

  // ============================================================================
  // METADATA & AUDIT
  // ============================================================================
  calculationDurationMs: integer("calculation_duration_ms"),  // Time to compute this summary
  dataQualityScore: integer("data_quality_score"),  // 0-100, based on completeness
  lastRecalculatedAt: timestamp("last_recalculated_at"),
  version: integer("version").default(1),  // Schema version for migrations

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDailySummarySchema = createInsertSchema(dailySummaries);
export type InsertDailySummary = z.infer<typeof insertDailySummarySchema>;
export type DailySummary = typeof dailySummaries.$inferSelect;

