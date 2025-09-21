import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(10),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  status: text("status", { enum: ["pending", "processing", "completed", "cancelled"] }).notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  items: jsonb("items").notNull(), // Enhanced array of order items with garment details
  shippingAddress: jsonb("shipping_address"),
  orderType: text("order_type", { enum: ["piece_based", "weight_based", "mixed"] }).notNull().default("piece_based"),
  totalPieces: integer("total_pieces").default(0),
  totalWeight: decimal("total_weight", { precision: 8, scale: 3 }).default("0"), // kg with 3 decimal precision
  specialInstructions: text("special_instructions"),
  estimatedCompletion: timestamp("estimated_completion"),
  actualCompletion: timestamp("actual_completion"),
  tags: jsonb("tags"), // Array of automated tags
  garmentTypes: jsonb("garment_types"), // Array of garment categories in this order
  urgency: text("urgency", { enum: ["low", "normal", "high", "urgent"] }).notNull().default("normal"),
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
  transactionNumber: varchar("transaction_number", { length: 255 }).notNull().unique(),
  items: jsonb("items").notNull(), // Array of transaction items
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method", { enum: ["cash", "credit", "debit", "mobile"] }).notNull(), // cash, credit, debit, mobile
  cashierId: text("cashier_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerNumber: text("customer_number").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  alternatePhone: text("alternate_phone"),
  address: jsonb("address"),
  dateOfBirth: timestamp("date_of_birth"),
  anniversary: timestamp("anniversary"),
  gender: text("gender", { enum: ["male", "female", "other", "prefer_not_to_say"] }),
  occupation: text("occupation"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0"),
  lastOrder: timestamp("last_order"),

  // Loyalty Program
  loyaltyTier: text("loyalty_tier", { enum: ["bronze", "silver", "gold", "platinum", "diamond"] }).default("bronze"),
  loyaltyPoints: integer("loyalty_points").default(0),
  totalEarnedPoints: integer("total_earned_points").default(0),
  totalRedeemedPoints: integer("total_redeemed_points").default(0),
  memberSince: timestamp("member_since").defaultNow(),

  // Communication Preferences
  communicationPreferences: jsonb("communication_preferences"), // email, sms, whatsapp, phone
  marketingOptIn: boolean("marketing_opt_in").default(true),
  reminderOptIn: boolean("reminder_opt_in").default(true),
  language: text("language").default("en"),
  timezone: text("timezone").default("UTC"),

  // Customer Insights
  preferredServices: jsonb("preferred_services"), // Array of service IDs
  favoriteGarmentTypes: jsonb("favorite_garment_types"), // Array of garment types
  averageOrderFrequency: integer("average_order_frequency").default(30), // days
  customerSegment: text("customer_segment", {
    enum: ["new", "regular", "vip", "at_risk", "inactive", "champion"]
  }).default("new"),
  lifetimeValue: decimal("lifetime_value", { precision: 12, scale: 2 }).default("0"),
  riskScore: decimal("risk_score", { precision: 3, scale: 2 }).default("0"), // 0-1 scale for churn risk

  // Tracking
  lastContactDate: timestamp("last_contact_date"),
  lastVisitDate: timestamp("last_visit_date"),
  referralSource: text("referral_source"),
  referredBy: varchar("referred_by").references(() => customers.id),
  notes: text("notes"),
  tags: jsonb("tags"), // Array of custom tags

  isActive: boolean("is_active").default(true),
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
  shipmentNumber: text("shipment_number").notNull().unique(),
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
  employeeId: text("employee_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  position: text("position").notNull(),
  department: text("department").notNull(),
  hireDate: timestamp("hire_date").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  status: text("status", { enum: ["active", "inactive", "terminated"] }).notNull().default("active"),
  managerId: varchar("manager_id").references(() => employees.id),
  address: jsonb("address"),
  emergencyContact: jsonb("emergency_contact"),
  skills: jsonb("skills"), // Array of skills
  performanceRating: decimal("performance_rating", { precision: 3, scale: 2 }).default("0.00"),
  lastReviewDate: timestamp("last_review_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeeAttendance = pgTable("employee_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  date: timestamp("date").notNull(),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  breakStart: timestamp("break_start"),
  breakEnd: timestamp("break_end"),
  totalHours: decimal("total_hours", { precision: 4, scale: 2 }),
  status: text("status", { enum: ["present", "absent", "late", "half_day"] }).notNull().default("present"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeeTasks = pgTable("employee_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "cancelled"] }).notNull().default("pending"),
  estimatedHours: decimal("estimated_hours", { precision: 4, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 4, scale: 2 }),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  assignedBy: varchar("assigned_by").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeePerformance = pgTable("employee_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

export const garments = pgTable("garments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // shirts, pants, suits, dresses, etc.
  fabric: text("fabric"), // cotton, silk, wool, polyester, etc.
  color: text("color"),
  brand: text("brand"),
  size: text("size"),
  condition: text("condition", { enum: ["new", "good", "worn", "damaged"] }).notNull().default("good"),
  specialCare: jsonb("special_care"), // Array of special care instructions
  estimatedWeight: decimal("estimated_weight", { precision: 6, scale: 3 }), // kg
  priceCategory: text("price_category", { enum: ["standard", "premium", "luxury", "custom"] }).notNull().default("standard"),
  processingTime: integer("processing_time").default(24), // hours
  tags: jsonb("tags"), // Automated tags for categorization
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  garmentId: varchar("garment_id").references(() => garments.id),
  serviceId: varchar("service_id").references(() => services.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  weight: decimal("weight", { precision: 8, scale: 3 }), // Individual item weight
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  itemType: text("item_type", { enum: ["piece_based", "weight_based"] }).notNull(),
  specialInstructions: text("special_instructions"),
  stainDetails: text("stain_details"),
  damageNotes: text("damage_notes"),
  completionStatus: text("completion_status", { enum: ["pending", "in_progress", "completed", "quality_check"] }).notNull().default("pending"),
  qualityRating: integer("quality_rating"), // 1-5 scale
  tags: jsonb("tags"), // Item-specific tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loyaltyProgram = pgTable("loyalty_program", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  tier: text("tier", { enum: ["bronze", "silver", "gold", "platinum", "diamond"] }).notNull(),
  minSpentAmount: decimal("min_spent_amount", { precision: 10, scale: 2 }).notNull(),
  minOrders: integer("min_orders").default(0),
  pointsPerRupee: decimal("points_per_rupee", { precision: 5, scale: 2 }).default("1"), // Points earned per rupee spent
  bonusPointsMultiplier: decimal("bonus_points_multiplier", { precision: 3, scale: 2 }).default("1"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  freeServices: jsonb("free_services"), // Array of service IDs
  benefits: jsonb("benefits"), // Array of benefit descriptions
  validityDays: integer("validity_days").default(365),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  transactionType: text("transaction_type", { enum: ["earned", "redeemed", "expired", "bonus", "adjustment"] }).notNull(),
  points: integer("points").notNull(),
  description: text("description").notNull(),
  expiryDate: timestamp("expiry_date"),
  isExpired: boolean("is_expired").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  promotionCode: text("promotion_code").unique(),
  type: text("type", { enum: ["percentage", "fixed_amount", "free_service", "buy_x_get_y", "loyalty_bonus"] }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(), // Percentage or amount
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }).default("0"),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"), // Total usage limit
  usagePerCustomer: integer("usage_per_customer").default(1),
  currentUsage: integer("current_usage").default(0),

  // Targeting
  targetCustomerSegments: jsonb("target_customer_segments"), // Array of segments
  targetLoyaltyTiers: jsonb("target_loyalty_tiers"), // Array of tiers
  applicableServices: jsonb("applicable_services"), // Array of service IDs
  excludedServices: jsonb("excluded_services"), // Array of service IDs

  // Scheduling
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  isAutoApply: boolean("is_auto_apply").default(false), // Auto-apply for eligible customers

  // Advanced Rules
  rules: jsonb("rules"), // Complex promotion rules
  tags: jsonb("tags"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const promotionUsage = pgTable("promotion_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promotionId: varchar("promotion_id").references(() => promotions.id).notNull(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communications = pgTable("communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  type: text("type", { enum: ["email", "sms", "whatsapp", "phone", "push"] }).notNull(),
  channel: text("channel", { enum: ["marketing", "transactional", "reminder", "support", "survey"] }).notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  templateId: varchar("template_id").references(() => communicationTemplates.id),

  // Targeting
  campaignId: varchar("campaign_id").references(() => marketingCampaigns.id),
  segmentId: varchar("segment_id"),

  // Status
  status: text("status", { enum: ["draft", "scheduled", "sent", "delivered", "opened", "clicked", "failed"] }).default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),

  // Tracking
  externalId: text("external_id"), // ID from email/SMS service
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Additional tracking data

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const communicationTemplates = pgTable("communication_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["email", "sms", "whatsapp", "push"] }).notNull(),
  channel: text("channel", { enum: ["marketing", "transactional", "reminder", "support", "survey"] }).notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  variables: jsonb("variables"), // Available template variables
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["promotional", "retention", "winback", "welcome", "birthday", "anniversary"] }).notNull(),
  status: text("status", { enum: ["draft", "scheduled", "active", "paused", "completed", "cancelled"] }).default("draft"),

  // Targeting
  targetSegments: jsonb("target_segments"), // Array of customer segments
  targetLoyaltyTiers: jsonb("target_loyalty_tiers"), // Array of loyalty tiers
  targetCriteria: jsonb("target_criteria"), // Complex targeting rules

  // Channels
  channels: jsonb("channels"), // Array of communication channels
  templateIds: jsonb("template_ids"), // Template IDs for each channel

  // Scheduling
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  sendTime: text("send_time"), // Preferred send time (HH:MM)
  timezone: text("timezone").default("UTC"),
  frequency: text("frequency", { enum: ["once", "daily", "weekly", "monthly"] }).default("once"),

  // Performance
  targetAudience: integer("target_audience").default(0),
  totalSent: integer("total_sent").default(0),
  totalDelivered: integer("total_delivered").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalConverted: integer("total_converted").default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerSegments = pgTable("customer_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  criteria: jsonb("criteria").notNull(), // Segmentation rules
  customerCount: integer("customer_count").default(0),
  isActive: boolean("is_active").default(true),
  isAutoUpdate: boolean("is_auto_update").default(true), // Auto-update membership
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerFeedback = pgTable("customer_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  type: text("type", { enum: ["rating", "review", "complaint", "suggestion", "compliment"] }).notNull(),
  rating: integer("rating"), // 1-5 scale
  subject: text("subject"),
  content: text("content"),
  isPublic: boolean("is_public").default(false),
  status: text("status", { enum: ["pending", "reviewed", "resolved", "published"] }).default("pending"),
  response: text("response"),
  respondedBy: varchar("responded_by").references(() => employees.id),
  respondedAt: timestamp("responded_at"),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);

export const insertProductSchema = createInsertSchema(products);

export const insertOrderSchema = createInsertSchema(orders);

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

export const insertGarmentSchema = createInsertSchema(garments);

export const insertOrderItemSchema = createInsertSchema(orderItems);

export const insertLoyaltyProgramSchema = createInsertSchema(loyaltyProgram);

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions);

export const insertPromotionSchema = createInsertSchema(promotions);

export const insertPromotionUsageSchema = createInsertSchema(promotionUsage);

export const insertCommunicationSchema = createInsertSchema(communications);

export const insertCommunicationTemplateSchema = createInsertSchema(communicationTemplates);

export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns);

export const insertCustomerSegmentSchema = createInsertSchema(customerSegments);

export const insertCustomerFeedbackSchema = createInsertSchema(customerFeedback);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

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

export type InsertGarment = z.infer<typeof insertGarmentSchema>;
export type Garment = typeof garments.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertLoyaltyProgram = z.infer<typeof insertLoyaltyProgramSchema>;
export type LoyaltyProgram = typeof loyaltyProgram.$inferSelect;

export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;

export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;

export type InsertPromotionUsage = z.infer<typeof insertPromotionUsageSchema>;
export type PromotionUsage = typeof promotionUsage.$inferSelect;

export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communications.$inferSelect;

export type InsertCommunicationTemplate = z.infer<typeof insertCommunicationTemplateSchema>;
export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;

export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;

export type InsertCustomerSegment = z.infer<typeof insertCustomerSegmentSchema>;
export type CustomerSegment = typeof customerSegments.$inferSelect;

export type InsertCustomerFeedback = z.infer<typeof insertCustomerFeedbackSchema>;
export type CustomerFeedback = typeof customerFeedback.$inferSelect;
