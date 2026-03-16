import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    type User,
    type InsertUser,
    type Product,
    type InsertProduct,
    type Order,
    type InsertOrder,
    type Delivery,
    type InsertDelivery,
    type Customer,
    type InsertCustomer,
    type Service,
    type InsertService,
    type Barcode,
    type InsertBarcode,
    type Employee,
    type InsertEmployee,
    type AuditLog,
    type InsertAuditLog
} from "../shared/schema";
import { Driver, InsertDriver } from "./storage";

export class SupabaseStorage {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn("⚠️ Supabase credentials not found. SupabaseStorage will fail if used.");
        }

        this.supabase = createClient(supabaseUrl || '', supabaseKey || '');
    }

    // Map DB snake_case to App camelCase
    private mapDates(record: any): any {
        if (!record) return record;

        const newRecord = { ...record };
        const mappings: Record<string, string> = {
            'franchise_id': 'franchiseId',
            'owner_name': 'ownerName',
            'legal_entity_name': 'legalEntityName',
            'tax_id': 'taxId',
            'agreement_start_date': 'agreementStartDate',
            'agreement_end_date': 'agreementEndDate',
            'royalty_percentage': 'royaltyPercentage',
            'stock_quantity': 'stockQuantity',
            'reorder_level': 'reorderLevel',
            'customer_id': 'customerId',
            'customer_name': 'customerName',
            'customer_email': 'customerEmail',
            'customer_phone': 'customerPhone',
            'credit_balance': 'creditBalance',
            'credit_limit': 'creditLimit',
            'wallet_balance_cache': 'walletBalanceCache',
            'total_orders': 'totalOrders',
            'total_spent': 'totalSpent',
            'last_order': 'lastOrder',
            'order_number': 'orderNumber',
            'payment_status': 'paymentStatus',
            'total_amount': 'totalAmount',
            'balance_after': 'balanceAfter',
            'transaction_type': 'transactionType',
            'reference_type': 'referenceType',
            'reference_id': 'referenceId',
            'verified_by_staff': 'verifiedByStaff',
            'entry_no': 'entryNo',
            'recorded_by': 'recordedBy',
            'reference_number': 'referenceNumber',
            'transaction_date': 'transactionDate',
            'shipping_address': 'shippingAddress',
            'pickup_date': 'pickupDate',
            'advance_paid': 'advancePaid',
            'payment_method': 'paymentMethod',
            'discount_type': 'discountType',
            'discount_value': 'discountValue',
            'coupon_code': 'couponCode',
            'extra_charges': 'extraCharges',
            'gst_enabled': 'gstEnabled',
            'gst_rate': 'gstRate',
            'gst_amount': 'gstAmount',
            'qualifications': 'qualifications',
            'salary_type': 'salaryType',
            'bank_name': 'bankName',
            'account_number': 'accountNumber',
            'ifsc_code': 'ifscCode',
            'pan_number': 'panNumber',
            'aadhar_number': 'aadharNumber',
            'gst_number': 'gstNumber',
            'working_hours': 'workingHours',
            'date_of_birth': 'dateOfBirth',
            'gender': 'gender',
            'blood_group': 'bloodGroup',
            'notes': 'notes',
            'special_instructions': 'specialInstructions',
            'order_id': 'orderId',
            'driver_name': 'driverName',
            'vehicle_id': 'vehicleId',
            'estimated_delivery': 'estimatedDelivery',
            'actual_delivery': 'actualDelivery',
            'transaction_number': 'transactionNumber',
            'cashier_id': 'cashierId',
            'shipment_number': 'shipmentNumber',
            'order_ids': 'orderIds',
            'tracking_number': 'trackingNumber',
            'entity_type': 'entityType',
            'entity_id': 'entityId',
            'image_path': 'imagePath',
            'is_active': 'isActive',
            'employee_id': 'employeeId',
            'first_name': 'firstName',
            'last_name': 'lastName',
            'hire_date': 'hireDate',
            'hourly_rate': 'hourlyRate',
            'manager_id': 'managerId',
            'emergency_contact': 'emergencyContact',
            'performance_rating': 'performanceRating',
            'last_review_date': 'lastReviewDate',
            'clock_in': 'clockIn',
            'clock_out': 'clockOut',
            'break_start': 'breakStart',
            'break_end': 'breakEnd',
            'total_hours': 'totalHours',
            'location_check_in': 'locationCheckIn',
            'estimated_hours': 'estimatedHours',
            'actual_hours': 'actualHours',
            'due_date': 'dueDate',
            'completed_date': 'completedDate',
            'assigned_by': 'assignedBy',
            'review_period': 'reviewPeriod',
            'reviewed_by': 'reviewedBy',
            'review_date': 'reviewDate',
            'file_url': 'fileUrl',
            'ip_address': 'ipAddress',
            'user_agent': 'userAgent',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt',
            'profile_image': 'profileImage',
            // Transit mappings
            'transit_id': 'transitId',
            'transit_order_id': 'transitOrderId',
            'dispatched_at': 'dispatchedAt',
            'completed_at': 'completedAt',
            'received_at': 'receivedAt',
            'store_details': 'storeDetails',
            'factory_details': 'factoryDetails',
            'total_items': 'totalItems',
            'total_weight': 'totalWeight',
            'service_type': 'serviceType',
            'item_count': 'itemCount',
            'vehicle_number': 'vehicleNumber',
            'vehicle_type': 'vehicleType',
            'driver_license': 'driverLicense',
            'driver_phone': 'driverPhone',
            'employee_name': 'employeeName',
            'employee_phone': 'employeePhone',
            // Delivery-related mappings
            'fulfillment_type': 'fulfillmentType',
            'delivery_charges': 'deliveryCharges',
            'delivery_address': 'deliveryAddress',
            // Express/Priority mappings
            'is_express_order': 'isExpressOrder',
            'priority': 'priority',
            // Print queue mappings
            'tags_printed': 'tagsPrinted',
            // Delivery earnings & analytics mappings
            'delivery_earnings_calculated': 'deliveryEarningsCalculated',
            'is_credit_order': 'isCreditOrder',
            'delivered_at': 'deliveredAt',
            'delivery_partner_id': 'deliveryPartnerId',
            'per_order_salary': 'perOrderSalary',
            'order_letter': 'orderLetter',
            'recorded_by_name': 'recordedByName',
            'month_year': 'monthYear',
            'metric_type': 'metricType',
            'percentage_change_mom': 'percentageChangeMoM',
            'last_computed_at': 'lastComputedAt',
            'invoice_url': 'invoiceUrl',
            'last_whatsapp_status': 'lastWhatsappStatus',
            'last_whatsapp_sent_at': 'lastWhatsappSentAt',
            'whatsapp_message_count': 'whatsappMessageCount'
        };

        Object.entries(mappings).forEach(([snake, camel]) => {
            if (newRecord[snake] !== undefined) {
                if (newRecord[camel] === undefined || newRecord[camel] === null) {
                    newRecord[camel] = newRecord[snake];
                }
            }
        });

        // Joined customer data
        const customerData = newRecord.customers || newRecord.customer;
        if (customerData) {
            const cust = Array.isArray(customerData) ? customerData[0] : customerData;
            if (cust) {
                if (!newRecord.customerName) newRecord.customerName = cust.name;
                if (!newRecord.customerEmail) newRecord.customerEmail = cust.email;
                if (!newRecord.customerPhone) newRecord.customerPhone = cust.phone;
            }
        }
        return newRecord;
    }



    // Map App camelCase to DB snake_case for inserts/updates
    private toSnakeCase(data: any): any {
        if (!data) return data;
        const newData: any = {};
        const mappings: Record<string, string> = {
            'franchiseId': 'franchise_id',
            'ownerName': 'owner_name',
            'legalEntityName': 'legal_entity_name',
            'taxId': 'tax_id',
            'agreementStartDate': 'agreement_start_date',
            'agreementEndDate': 'agreement_end_date',
            'royaltyPercentage': 'royalty_percentage',
            'stockQuantity': 'stock_quantity',
            'reorderLevel': 'reorder_level',
            'customerId': 'customer_id',
            'customerName': 'customer_name',
            'customerEmail': 'customer_email',
            'customerPhone': 'customer_phone',
            'creditBalance': 'credit_balance',
            'creditLimit': 'credit_limit',
            'walletBalanceCache': 'wallet_balance_cache',
            'totalOrders': 'total_orders',
            'totalSpent': 'total_spent',
            'lastOrder': 'last_order',
            'orderNumber': 'order_number',
            'paymentStatus': 'payment_status',
            'totalAmount': 'total_amount',
            'balanceAfter': 'balance_after',
            'transactionType': 'transaction_type',
            'referenceType': 'reference_type',
            'referenceId': 'reference_id',
            'verifiedByStaff': 'verified_by_staff',
            'entryNo': 'entry_no',
            'recordedBy': 'recorded_by',
            'referenceNumber': 'reference_number',
            'transactionDate': 'transaction_date',
            'shippingAddress': 'shipping_address',
            'pickupDate': 'pickup_date',
            'advancePaid': 'advance_paid',
            'paymentMethod': 'payment_method',
            'discountType': 'discount_type',
            'discountValue': 'discount_value',
            'couponCode': 'coupon_code',
            'extraCharges': 'extra_charges',
            'gstEnabled': 'gst_enabled',
            'gstRate': 'gst_rate',
            'gstAmount': 'gst_amount',
            'qualifications': 'qualifications',
            'salaryType': 'salary_type',
            'bankName': 'bank_name',
            'accountNumber': 'account_number',
            'ifscCode': 'ifsc_code',
            'panNumber': 'pan_number',
            'aadharNumber': 'aadhar_number',
            'gstNumber': 'gst_number',
            'workingHours': 'working_hours',
            'dateOfBirth': 'date_of_birth',
            'gender': 'gender',
            'bloodGroup': 'blood_group',
            'notes': 'notes',
            'specialInstructions': 'special_instructions',
            'orderId': 'order_id',
            'driverName': 'driver_name',
            'vehicleId': 'vehicle_id',
            'estimatedDelivery': 'estimated_delivery',
            'actualDelivery': 'actual_delivery',
            'transactionNumber': 'transaction_number',
            'cashierId': 'cashier_id',
            'shipmentNumber': 'shipment_number',
            'orderIds': 'order_ids',
            'trackingNumber': 'tracking_number',
            'entityType': 'entity_type',
            'entityId': 'entity_id',
            'imagePath': 'image_path',
            'isActive': 'is_active',
            'employeeId': 'employee_id',
            'firstName': 'first_name',
            'lastName': 'last_name',
            'hireDate': 'hire_date',
            'hourlyRate': 'hourly_rate',
            'managerId': 'manager_id',
            'emergencyContact': 'emergency_contact',
            'performanceRating': 'performance_rating',
            'lastReviewDate': 'last_review_date',
            'clockIn': 'clock_in',
            'clockOut': 'clock_out',
            'breakStart': 'break_start',
            'breakEnd': 'break_end',
            'totalHours': 'total_hours',
            'locationCheckIn': 'location_check_in',
            'estimatedHours': 'estimated_hours',
            'actualHours': 'actual_hours',
            'dueDate': 'due_date',
            'completedDate': 'completed_date',
            'assignedBy': 'assigned_by',
            'reviewPeriod': 'review_period',
            'reviewedBy': 'reviewed_by',
            'reviewDate': 'review_date',
            'fileUrl': 'file_url',
            'ipAddress': 'ip_address',
            'userAgent': 'user_agent',
            'createdAt': 'created_at',
            'updatedAt': 'updated_at',
            'profileImage': 'profile_image',
            // Transit-related mappings
            'transitId': 'transit_id',
            'transitOrderId': 'transit_order_id',
            'dispatchedAt': 'dispatched_at',
            'completedAt': 'completed_at',
            'receivedAt': 'received_at',
            'storeDetails': 'store_details',
            'factoryDetails': 'factory_details',
            'totalItems': 'total_items',
            'totalWeight': 'total_weight',
            'serviceType': 'service_type',
            'itemCount': 'item_count',
            'vehicleNumber': 'vehicle_number',
            'vehicleType': 'vehicle_type',
            'driverLicense': 'driver_license',
            'driverPhone': 'driver_phone',
            'employeeName': 'employee_name',
            'employeePhone': 'employee_phone',
            // Delivery-related mappings
            'fulfillmentType': 'fulfillment_type',
            'deliveryCharges': 'delivery_charges',
            'deliveryAddress': 'delivery_address',
            // Express/Priority mappings
            'isExpressOrder': 'is_express_order',
            'priority': 'priority',
            // WhatsApp tracking mappings
            'lastWhatsappStatus': 'last_whatsapp_status',
            'lastWhatsappSentAt': 'last_whatsapp_sent_at',
            'whatsappMessageCount': 'whatsapp_message_count',
            'tagsPrinted': 'tags_printed',
            // Created/Updated by mappings
            'createdBy': 'created_by',
            'updatedBy': 'updated_by',
            'assignedTo': 'assigned_to',
            'completedBy': 'completed_by',
            'cancelledBy': 'cancelled_by',
            'approvedBy': 'approved_by',
            'verifiedBy': 'verified_by',
            'tagNote': 'tag_note',
            'barcodeId': 'barcode_id',
            'licenseNumber': 'license_number',
            'totalDeliveries': 'total_deliveries',
            'totalEarnings': 'total_earnings',
            'currentLatitude': 'current_latitude',
            'currentLongitude': 'current_longitude',
            'lastActive': 'last_active',
            // Delivery earnings & analytics mappings
            'deliveryEarningsCalculated': 'delivery_earnings_calculated',
            'isCreditOrder': 'is_credit_order',
            'deliveredAt': 'delivered_at',
            'deliveryPartnerId': 'delivery_partner_id',
            'perOrderSalary': 'per_order_salary',
            'orderLetter': 'order_letter',
            'recordedByName': 'recorded_by_name',
            'invoiceUrl': 'invoice_url',
            'monthYear': 'month_year',
            'metricType': 'metric_type',
            'percentageChangeMoM': 'percentage_change_mom',
            'lastComputedAt': 'last_computed_at',
            // RBAC store/factory scoping
            'storeId': 'store_id',
            'systemRole': 'system_role',
            'factoryId': 'factory_id',
            // Employee: baseSalary maps to DB column 'salary'
            'baseSalary': 'salary',
        };

        // If key exists in mappings, use snake_case. If not, preserve original (e.g. 'status', 'email', 'name')
        Object.keys(data).forEach(key => {
            if (mappings[key]) {
                newData[mappings[key]] = data[key];
            } else {
                newData[key] = data[key];
            }
        });

        // Ensure JSON fields are handled if needed, usually Supabase client handles object -> JSONB auto
        return newData;
    }

    // ======= USERS =======
    async createUser(data: InsertUser): Promise<User> {
        const { data: user, error } = await this.supabase
            .from('users')
            .insert(this.toSnakeCase(data))
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(user);
    }

    async getUser(id: string): Promise<User | undefined> {
        const { data: user, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return undefined;
        return this.mapDates(user);
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        const { data: user, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        if (error) return undefined;
        return this.mapDates(user);
    }

    async listUsers(): Promise<User[]> {
        const { data, error } = await this.supabase.from('users').select('*');
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= PRODUCTS =======
    async createProduct(data: InsertProduct): Promise<Product> {
        const { data: product, error } = await this.supabase
            .from('products')
            .insert(this.toSnakeCase(data))
            .select()
            .single();
        if (error) throw error;
        return this.mapDates(product);
    }

    async getProduct(id: string): Promise<Product | undefined> {
        const { data: product, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return undefined;
        return this.mapDates(product);
    }

    async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
        const { data: product, error } = await this.supabase
            .from('products')
            .update(this.toSnakeCase(data))
            .eq('id', id)
            .select()
            .single();
        if (error) return undefined;
        return this.mapDates(product);
    }

    async deleteProduct(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('products').delete().eq('id', id);
        return !error;
    }

    async listProducts(): Promise<Product[]> {
        const { data, error } = await this.supabase.from('products').select('*');
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }
    async getProducts(): Promise<Product[]> { return this.listProducts(); }

    // ======= CUSTOMERS =======
    async createCustomer(data: InsertCustomer): Promise<Customer> {
        // Generate FZCMY sequence logic
        const customers = await this.listCustomers();
        let maxSequence = 0;
        for (const c of customers) {
            if (c.id.startsWith('FZCMY')) {
                const numStr = c.id.substring(5);
                const num = parseInt(numStr, 10);
                if (!isNaN(num) && num > maxSequence) {
                    maxSequence = num;
                }
            }
        }
        const nextSequence = maxSequence + 1;
        const sequenceNum = String(nextSequence).padStart(4, '0');
        const generatedId = `FZCMY${sequenceNum}`;

        const dataWithId = {
            ...data,
            id: generatedId,
            creditLimit: (data as any)?.creditLimit ?? "1000",
        };

        const { data: customer, error } = await this.supabase
            .from('customers')
            .insert(this.toSnakeCase(dataWithId))
            .select()
            .single();
        if (error) throw error;
        return this.mapDates(customer);
    }

    async getCustomer(id: string): Promise<Customer | undefined> {
        const { data: customer, error } = await this.supabase.from('customers').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(customer);
    }

    async updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
        const snakeData = this.toSnakeCase(data);
        console.log('[SupabaseStorage] updateCustomer:', id, snakeData);
        const { data: customer, error } = await this.supabase
            .from('customers')
            .update(snakeData)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('[SupabaseStorage] updateCustomer ERROR:', error.message, error.details);
            throw new Error(`Failed to update customer: ${error.message}`);
        }
        return this.mapDates(customer);
    }

    async deleteCustomer(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('customers').update({ status: 'deleted' }).eq('id', id);
        return !error;
    }

    async listCustomers(
        franchiseId?: string,
        options: {
            search?: string;
            phone?: string;
            limit?: number;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        } = {}
    ): Promise<Customer[]> {
        let query = this.supabase.from('customers').select('*');
        if (franchiseId) query = query.eq('franchise_id', franchiseId);
        query = query.neq('status', 'deleted');

        const search = String(options.search || '').trim();
        if (search) {
            const safeSearch = search.replace(/[%_]/g, '');
            const digitsOnly = search.replace(/\D/g, '');
            
            // Build a valid PostgREST OR query string
            const conditions: string[] = [];
            
            if (safeSearch.length >= 2) {
                conditions.push(`name.ilike.%${safeSearch}%`);
                conditions.push(`email.ilike.%${safeSearch}%`);
            }
            
            if (digitsOnly.length >= 1) {
                conditions.push(`phone.ilike.%${digitsOnly}%`);
            }
            
            if (conditions.length > 0) {
                query = query.or(conditions.join(','));
            }
        }

        const phone = String(options.phone || '').trim();
        if (phone) {
            query = query.eq('phone', phone);
        }

        // Apply sorting
        if (options.sortBy) {
            const isAscending = options.sortOrder !== 'desc';
            const mappedSortBy = this.toSnakeCase({ [options.sortBy]: true });
            const sortField = Object.keys(mappedSortBy)[0] || options.sortBy;
            query = query.order(sortField, { ascending: isAscending });
        } else {
            // Default sort by relevance, then newest
            if (search) {
                // Without complex backend scoring, fall back to simple descending id/created
                query = query.order('id', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }
        }

        // Apply limit
        const limitToApply = options.limit && options.limit > 0 ? options.limit : 50;
        query = query.limit(limitToApply);

        // Execute query
        const { data, error } = await query;
        if (error) {
            console.error('[SupabaseStorage] listCustomers Query Error:', error);
            throw error;
        }
        
        return (data || []).map(item => this.mapDates(item));
    }
    async getCustomers(franchiseId?: string): Promise<Customer[]> { return this.listCustomers(franchiseId); }

    /**
     * High-performance autocomplete search using PostgreSQL RPC with pg_trgm indexes.
     * Returns results ranked by relevance score (exact > prefix > contains > trigram).
     */
    async searchCustomersAutocomplete(query: string, limit: number = 10): Promise<Customer[]> {
        const trimmed = (query || '').trim();
        if (!trimmed) return [];

        try {
            // Attempt RPC (optimized, relevance-scored search)
            const { data, error } = await this.supabase.rpc('search_customers_autocomplete', {
                p_query: trimmed,
                p_limit: limit
            });

            if (error) {
                console.warn('[SupabaseStorage] Autocomplete RPC error:', error.message);
                // Fallback to standard search if RPC fails (e.g. function doesn't exist)
                return this.listCustomers(undefined, { search: trimmed, limit });
            }

            if (!data || !Array.isArray(data)) return [];

            return data.map((item: any) => this.mapDates(item));
        } catch (err) {
            console.error('[SupabaseStorage] searchCustomersAutocomplete fatal error:', err);
            // Fallback to standard search
            return this.listCustomers(undefined, { search: trimmed, limit });
        }
    }

    // ======= ORDERS =======

    /**
     * Get the branch code from franchiseId
     * Maps franchiseId to 3-letter branch code
     * Handles formats: 'pollachi', 'franchise-pollachi', 'FR-001', etc.
     */
    private getBranchCode(franchiseId?: string): string {
        if (!franchiseId) return 'FAB';

        const branchCodes: Record<string, string> = {
            'pollachi': 'POL',
            'kinathukadavu': 'KIN',
            'coimbatore': 'CBE',
        };

        let normalizedId = franchiseId.toLowerCase().trim();

        // Handle 'franchise-xxx' format
        if (normalizedId.startsWith('franchise-')) {
            normalizedId = normalizedId.replace('franchise-', '');
        }

        return branchCodes[normalizedId] || normalizedId.substring(0, 3).toUpperCase();
    }

    /**
     * Generate next order number using atomic database function
     * Format: FZC-2025POL0001A
     */
    async getNextOrderNumber(franchiseId?: string): Promise<string> {
        const branchCode = this.getBranchCode(franchiseId);

        try {
            // Try to use the database function for atomic sequence generation
            const { data, error } = await this.supabase.rpc('get_next_order_number', {
                p_branch_code: branchCode
            });

            if (data && !error) {
                return data;
            }

            // Fallback: Generate manually if function doesn't exist
            console.warn('[OrderNumber] Database function not found, using fallback');
        } catch (err) {
            console.warn('[OrderNumber] RPC failed, using fallback:', err);
        }

        // Fallback generation
        const currentYear = new Date().getFullYear();
        const timestamp = Date.now();
        const sequence = (timestamp % 9999) + 1;
        const paddedSequence = String(sequence).padStart(4, '0');
        return `FZC-${currentYear}${branchCode}${paddedSequence}A`;
    }

    async createOrder(data: InsertOrder): Promise<Order> {
        // Generate order number if not provided
        if (!data.orderNumber) {
            data.orderNumber = await this.getNextOrderNumber((data as any).franchiseId);
        }

        try {
            // Strip WhatsApp tracking fields - they shouldn't be set during creation
            // They will be updated after WhatsApp notifications are sent
            const cleanData = { ...data };
            delete (cleanData as any).whatsappMessageCount;
            delete (cleanData as any).lastWhatsappStatus;
            delete (cleanData as any).lastWhatsappSentAt;

            const snakeCaseData = this.toSnakeCase(cleanData);

            // Remove fields that may not exist in the orders table to prevent schema errors
            const safeOrderFields = [
                'id', 'order_number', 'customer_id', 'customer_name', 'customer_email',
                'customer_phone', 'status', 'total_amount', 'payment_status', 'payment_method',
                'items', 'notes', 'special_instructions', 'shipping_address', 'pickup_date',
                'advance_paid', 'discount_type', 'discount_value', 'coupon_code',
                'extra_charges', 'gst_enabled', 'gst_rate', 'gst_amount', 'pan_number',
                'gst_number', 'franchise_id', 'created_at', 'updated_at', 'priority',
                'is_express_order', 'fulfillment_type', 'delivery_charges', 'delivery_address',
                'tag_note', 'barcode_id', 'assigned_to', 'wallet_used', 'credit_used',
                'is_credit_order', 'delivery_earnings_calculated', 'delivery_cash_collected'
            ];
            const safeData: any = {};
            for (const key of Object.keys(snakeCaseData)) {
                if (safeOrderFields.includes(key)) {
                    safeData[key] = snakeCaseData[key];
                }
            }

            console.log('[SupabaseStorage] Creating order with data:', JSON.stringify(safeData, null, 2));
            // Retry once per unknown-column error by stripping the offending key.
            // This protects order creation when app payload and Supabase schema are temporarily out of sync.
            const insertPayload: Record<string, any> = { ...safeData };
            for (let attempt = 0; attempt < 8; attempt++) {
                const { data: order, error } = await this.supabase
                    .from('orders')
                    .insert(insertPayload)
                    .select('*')
                    .single();

                if (!error) {
                    return this.mapDates(order);
                }

                const missingColumnMatch = /Could not find the '([^']+)' column of 'orders' in the schema cache/i.exec(error.message || '');
                const missingColumn = missingColumnMatch?.[1];
                if (missingColumn && Object.prototype.hasOwnProperty.call(insertPayload, missingColumn)) {
                    console.warn(`[SupabaseStorage] Removing unknown orders column "${missingColumn}" and retrying insert`);
                    delete insertPayload[missingColumn];
                    continue;
                }

                console.error('[SupabaseStorage] Supabase create order error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                throw new Error(`Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}${error.details ? ` - ${error.details}` : ''}`);
            }

            throw new Error('Database error: Failed to create order after removing unknown columns');
        } catch (err) {
            console.error('[SupabaseStorage] Create order exception:', err);
            if (err instanceof Error) {
                throw err;
            }
            throw new Error(`Failed to create order: ${JSON.stringify(err)}`);
        }
    }

    async getOrder(id: string): Promise<Order | undefined> {
        try {
            const { data: order, error } = await this.supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error || !order) {
                console.warn(`[SupabaseStorage] Order ${id} not found:`, error?.message);
                return undefined;
            }

            // Separately fetch customer data to avoid join issues
            if (order.customer_id) {
                const { data: customerData } = await this.supabase
                    .from('customers')
                    .select('name, email, phone')
                    .eq('id', order.customer_id)
                    .single();
                if (customerData) {
                    (order as any).customers = customerData;
                }
            }

            return this.mapDates(order);
        } catch (err) {
            console.error('[SupabaseStorage] getOrder exception:', err);
            return undefined;
        }
    }

    async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined> {
        const snakeData = this.toSnakeCase(data);
        console.log('[SupabaseStorage] updateOrder:', id, Object.keys(snakeData));
        const { data: order, error } = await this.supabase
            .from('orders')
            .update(snakeData)
            .eq('id', id)
            .select('*')
            .single();
        if (error) {
            console.error('[SupabaseStorage] updateOrder ERROR:', error.message, error.details);
            throw new Error(`Failed to update order: ${error.message}`);
        }
        return this.mapDates(order);
    }

    async deleteOrder(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('orders').delete().eq('id', id);
        return !error;
    }

    async listOrders(franchiseId?: string): Promise<Order[]> {
        let query = this.supabase.from('orders').select('*');
        if (franchiseId) query = query.eq('franchise_id', franchiseId);
        const { data, error } = await query;
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getOrdersForPrintQueue(): Promise<Order[]> {
        let query = this.supabase
            .from('orders')
            .select('*')
            .or('tags_printed.is.null,tags_printed.eq.false')
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false });

        let { data, error } = await query;

        // If tags_printed column doesn't exist in a drifted schema, fallback gracefully.
        if (error && /Could not find the 'tags_printed' column of 'orders' in the schema cache/i.test(error.message || '')) {
            console.warn('[SupabaseStorage] orders.tags_printed missing; falling back to unfiltered print queue');
            const fallback = await this.supabase
                .from('orders')
                .select('*')
                .neq('status', 'cancelled')
                .order('created_at', { ascending: false });
            data = fallback.data as any;
            error = fallback.error as any;
        }

        if (error) throw error;
        return (data || []).map(item => this.mapDates(item));
    }

    async markTagsPrinted(orderId: string): Promise<void> {
        const now = new Date().toISOString();
        const { error } = await this.supabase
            .from('orders')
            .update({ tags_printed: true, updated_at: now })
            .eq('id', orderId);

        // If tags_printed doesn't exist, keep endpoint non-breaking.
        if (error && /Could not find the 'tags_printed' column of 'orders' in the schema cache/i.test(error.message || '')) {
            console.warn('[SupabaseStorage] orders.tags_printed missing; skipping tags_printed update');
            return;
        }

        if (error) throw error;
    }

    // ======= TRANSIT ORDERS =======

    /**
     * Generate next transit ID using atomic database function
     * Format: TRN-2025POL001A-F
     */
    async getNextTransitId(franchiseId?: string, type: 'To Factory' | 'Return to Store' | string = 'To Factory'): Promise<string> {
        const branchCode = this.getBranchCode(franchiseId);

        // Direction indicator: F (To Factory) or S (To Store)
        const direction = type === 'To Factory' || type === 'store_to_factory' ? 'F' : 'S';

        try {
            // Try to use the database function for atomic sequence generation
            // Function returns "2025POL001A" part
            const { data, error } = await this.supabase.rpc('get_next_transit_number', {
                p_branch_code: branchCode
            });

            if (data && !error) {
                return `TRN-${data}-${direction}`;
            }

            console.warn('[TransitID] Database function not found/error, using fallback:', error?.message);
        } catch (err) {
            console.warn('[TransitID] RPC failed, using fallback:', err);
        }

        // Fallback generation (Timestamp based)
        const currentYear = new Date().getFullYear();
        const timestamp = Date.now();
        const sequence = (timestamp % 999) + 1;
        const paddedSequence = String(sequence).padStart(3, '0');
        const suffix = 'A'; // Simplified fallback

        return `TRN-${currentYear}${branchCode}${paddedSequence}${suffix}-${direction}`;
    }

    async listTransitOrders(franchiseId?: string): Promise<any[]> {
        let query = this.supabase.from('transit_orders').select('*');
        if (franchiseId) query = query.eq('franchise_id', franchiseId);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(t => this.mapDates(t));
    }
    async getOrders(): Promise<Order[]> { return this.listOrders(); }
    async getActiveOrders(): Promise<Order[]> {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
            .in('status', ['in_progress', 'shipped', 'out_for_delivery', 'in_transit', 'assigned']);
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getAnalyticsSummary(): Promise<any> {
        const { count: totalOrders } = await this.supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: totalCustomers } = await this.supabase.from('customers').select('*', { count: 'exact', head: true });
        const { count: completedOrders } = await this.supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed');
        const { data: orders } = await this.supabase.from('orders').select('total_amount');
        const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0) || 0;

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentOrders } = await this.supabase.from('orders').select('*').gt('created_at', fiveMinutesAgo).order('created_at', { ascending: false }).limit(10);
        const { data: recentCustomers } = await this.supabase.from('customers').select('*').gt('created_at', fiveMinutesAgo).order('created_at', { ascending: false }).limit(10);

        const { data: allStatuses } = await this.supabase.from('orders').select('status');
        const statusMap = allStatuses?.reduce((acc: any, curr: any) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {}) || {};

        return {
            kpis: {
                totalRevenue,
                totalOrders: totalOrders || 0,
                totalCustomers: totalCustomers || 0,
                completionRate: (totalOrders || 0) > 0 ? ((completedOrders || 0) / (totalOrders || 1)) * 100 : 0,
                avgOrderValue: (totalOrders || 0) > 0 ? (totalRevenue / (totalOrders || 1)) : 0,
            },
            recentActivity: {
                newOrders: recentOrders?.length || 0,
                newCustomers: recentCustomers?.length || 0,
                orders: recentOrders?.map(item => this.mapDates(item)) || [],
                customers: recentCustomers?.map(item => this.mapDates(item)) || []
            },
            statusCounts: statusMap
        };
    }

    // ======= WALLET & MASTER LEDGER RPC CALLS =======
    // These methods call Postgres Stored Procedures to guarantee ACID transactions.

    async processWalletRecharge(
        customerId: string,
        amount: number,
        paymentMethod: string,
        recordedBy: string,
        recordedByName: string
    ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
        try {
            const { data, error } = await this.supabase.rpc('process_wallet_recharge', {
                p_customer_id: customerId,
                p_amount: amount,
                p_payment_method: paymentMethod,
                p_recorded_by: recordedBy,
                p_recorded_by_name: recordedByName
            });

            if (error) throw error;
            return { success: true, newBalance: data };
        } catch (err: any) {
            console.error('[SupabaseStorage] Recharging Wallet failed:', err);
            return { success: false, error: err.message || 'Failed to recharge wallet due to a database exception.' };
        }
    }

    async processOrderCheckout(
        orderId: string,
        customerId: string,
        cashAmount: number,
        walletAmount: number,
        recordedBy: string,
        recordedByName: string,
        options?: {
            useWallet?: boolean;
            walletDebitRequested?: number;
            paymentMethod?: string;
        }
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        const useWallet = options?.useWallet ?? walletAmount > 0;
        const walletDebitRequested = options?.walletDebitRequested ?? walletAmount;
        const normalizedPaymentMethod = options?.paymentMethod || 'CASH';

        try {
            // Bypass broken RPC entirely and implement canonical checkout in JS
            const [orderRes, customerRes] = await Promise.all([
                this.supabase.from('orders').select('*').eq('id', orderId).single(),
                this.supabase.from('customers').select('*').eq('id', customerId).single()
            ]);

            if (orderRes.error || !orderRes.data) throw new Error('Order not found');
            if (customerRes.error || !customerRes.data) throw new Error('Customer not found');

            const order = orderRes.data;
            const customer = customerRes.data;

            const orderTotal = parseFloat(order.total_amount || '0');
            const advancePaid = parseFloat(order.advance_paid || '0');
            let walletBalance = parseFloat(customer.wallet_balance_cache || '0');
            let remainingAmount = Math.max(0, orderTotal - advancePaid);

            let walletDebited = 0;
            if (useWallet && remainingAmount > 0) {
                if (walletDebitRequested > 0) {
                    walletDebited = Math.min(remainingAmount, Math.max(walletBalance, 0), walletDebitRequested);
                } else {
                    walletDebited = Math.min(remainingAmount, Math.max(walletBalance, 0));
                }
            }

            let cashApplied = Math.min(
                Math.max(remainingAmount - walletDebited, 0),
                Math.max(cashAmount || 0, 0)
            );

            let walletTxId = null;
            if (walletDebited > 0) {
                walletBalance -= walletDebited;
                const { data: wTx, error: wErr } = await this.supabase.from('wallet_transactions').insert({
                    transaction_id: `WLT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    customer_id: customerId,
                    type: 'debit',
                    amount: walletDebited,
                    balance_before: walletBalance + walletDebited,
                    balance_after: walletBalance,
                    reference_order_id: orderId,
                    verified_by_staff: recordedBy
                }).select('id').single();
                if (wErr) throw wErr;
                walletTxId = wTx.id;

                // Update customer wallet balance cache
                await this.supabase.from('customers').update({ wallet_balance_cache: walletBalance }).eq('id', customerId);
            }

            // --- RECALCULATE CUSTOMER ORDER METRICS (NATIVELY) ---
            // Because we bypassed the `process_payment_checkout_v2` RPC, we must 
            // natively recalculate the customer's total orders and total spent.
            try {
                const { data: ordCounts } = await this.supabase
                    .from('orders')
                    .select('total_amount, status')
                    .eq('customer_id', customerId)
                    .neq('status', 'cancelled');
                
                if (ordCounts && Array.isArray(ordCounts)) {
                    const totalOrders = ordCounts.length;
                    const totalSpent = ordCounts.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);

                    await this.supabase.from('customers').update({
                        total_orders: totalOrders,
                        total_spent: totalSpent,
                        last_order: new Date().toISOString()
                    }).eq('id', customerId);
                }
            } catch (metricsErr) {
                console.warn('[SupabaseStorage] Non-fatal error updating customer metrics in checkout:', metricsErr);
            }


            // Note: We don't track CASH payments in wallet_transactions anymore as per simplified schema, 
            // the cash total is implicitly tracked by advance_paid + the order metrics.
            
            const newAdvancePaid = Math.min(orderTotal, advancePaid + walletDebited + cashApplied);
            const creditAssigned = Math.max(0, orderTotal - newAdvancePaid);
            const newPaymentStatus = creditAssigned > 0 ? 'credit' : 'paid';

            let finalPaymentMethod = order.payment_method;
            if (walletDebited > 0 && cashApplied > 0) finalPaymentMethod = 'split';
            else if (walletDebited > 0) finalPaymentMethod = 'credit_wallet';
            else if (cashApplied > 0) finalPaymentMethod = normalizedPaymentMethod;

            const { error: ordErr } = await this.supabase.from('orders').update({
                advance_paid: newAdvancePaid,
                wallet_used: Math.min(orderTotal, parseFloat(order.wallet_used || '0') + walletDebited),
                credit_used: creditAssigned,
                payment_status: newPaymentStatus,
                payment_method: finalPaymentMethod
            }).eq('id', orderId);

            if (ordErr) throw ordErr;

            const splitData = {
                cashApplied,
                walletDebited,
                creditAssigned
            };

            return { 
                success: true, 
                data: {
                    payment_status: newPaymentStatus,
                    split: splitData,
                    transaction_ids: {
                        wallet_transaction_id: walletTxId
                    }
                } 
            };
        } catch (err: any) {
            console.error('[SupabaseStorage] JS Checkout processing failed:', err);
            return { success: false, error: err.message || 'Payment processing failed.' };
        }
    }

    async processCreditRepayment(
        customerId: string,
        amount: number,
        paymentMethod: string,
        recordedBy: string,
        recordedByName: string
    ): Promise<{ success: boolean; balanceAfter?: number; error?: string }> {
        try {
            const { data, error } = await this.supabase.rpc('process_credit_repayment', {
                p_customer_id: customerId,
                p_amount: amount,
                p_payment_method: paymentMethod,
                p_recorded_by: recordedBy,
                p_recorded_by_name: recordedByName
            });

            if (error) throw error;
            return { success: true, balanceAfter: data.balance_after };
        } catch (err: any) {
            console.error('[SupabaseStorage] Credit repayment failed:', err);
            return { success: false, error: err.message || 'Credit repayment failed.' };
        }
    }

    // ======= AUDIT LOGS =======
    async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
        const { data: auditLog, error } = await this.supabase
            .from('audit_logs')
            .insert(this.toSnakeCase(data))
            .select()
            .single();
        if (error) throw error;
        return this.mapDates(auditLog);
    }

    async getAuditLogs(params: any): Promise<{ data: AuditLog[]; count: number }> {
        const { page = 1, limit = 20, employeeId, action, startDate, endDate, entityType, sortBy = 'created_at', sortOrder = 'desc' } = params;
        const offset = (page - 1) * limit;
        let query = this.supabase.from('audit_logs').select('*', { count: 'exact' });

        if (employeeId) query = query.eq('employee_id', employeeId);
        if (action) query = query.eq('action', action);
        if (entityType) query = query.eq('entity_type', entityType);
        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        const { data, error, count } = await query.order(sortBy, { ascending: sortOrder === 'asc' }).range(offset, offset + limit - 1);
        if (error) throw error;
        return { data: data.map(item => this.mapDates(item)), count: count || 0 };
    }

    // ======= SEARCH =======
    async searchGlobal(query: string): Promise<any> {
        const { data: orders } = await this.supabase
            .from('orders')
            .select('id, order_number, status')
            .or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%`)
            .limit(5);

        const { data: customers } = await this.supabase
            .from('customers')
            .select('id, name, phone')
            .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5);

        const { data: products } = await this.supabase
            .from('products')
            .select('id, name, sku')
            .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
            .limit(5);

        const formattedOrders = orders?.map(o => ({ id: o.id, title: o.order_number, type: 'order', subtitle: o.status })) || [];
        const formattedCustomers = customers?.map(c => ({ id: c.id, title: c.name, type: 'customer', subtitle: c.phone })) || [];
        const formattedProducts = products?.map(p => ({ id: p.id, title: p.name, type: 'product', subtitle: p.sku })) || [];

        return [...formattedOrders, ...formattedCustomers, ...formattedProducts];
    }

    // ======= DELIVERIES =======
    async createDelivery(data: InsertDelivery): Promise<Delivery> {
        const { data: delivery, error } = await this.supabase
            .from('deliveries')
            .insert(this.toSnakeCase(data))
            .select()
            .single();
        if (error) throw error;
        return this.mapDates(delivery);
    }

    async getDelivery(id: string): Promise<Delivery | undefined> {
        const { data: delivery, error } = await this.supabase.from('deliveries').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(delivery);
    }

    async updateDelivery(id: string, data: Partial<InsertDelivery>): Promise<Delivery | undefined> {
        const { data: delivery, error } = await this.supabase
            .from('deliveries')
            .update(this.toSnakeCase(data))
            .eq('id', id)
            .select()
            .single();
        if (error) return undefined;
        return this.mapDates(delivery);
    }

    async getDeliveries(): Promise<Delivery[]> {
        const { data, error } = await this.supabase.from('deliveries').select('*');
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async listDeliveries(): Promise<Delivery[]> {
        return this.getDeliveries();
    }

    async deleteDelivery(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('deliveries').delete().eq('id', id);
        return !error;
    }

    // ======= DRIVERS =======
    async createDriver(data: InsertDriver): Promise<Driver> {
        const { data: driver, error } = await this.supabase.from('drivers').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(driver);
    }

    async getDriver(id: string): Promise<Driver | null> {
        const { data: driver, error } = await this.supabase.from('drivers').select('*').eq('id', id).single();
        if (error) return null;
        return this.mapDates(driver);
    }

    async listDrivers(): Promise<Driver[]> {
        const { data, error } = await this.supabase.from('drivers').select('*');
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async updateDriver(id: string, data: Partial<InsertDriver>): Promise<Driver | null> {
        const { data: driver, error } = await this.supabase.from('drivers').update(this.toSnakeCase(data)).eq('id', id).select().single();
        if (error) return null;
        return this.mapDates(driver);
    }

    async deleteDriver(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('drivers').delete().eq('id', id);
        return !error;
    }

    async getDriversByStatus(status: string): Promise<Driver[]> {
        const { data, error } = await this.supabase.from('drivers').select('*').eq('status', status);
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async updateDriverLocation(id: string, latitude: number, longitude: number): Promise<Driver | null> {
        const { data: driver, error } = await this.supabase
            .from('drivers')
            .update({ current_latitude: latitude, current_longitude: longitude })
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return this.mapDates(driver);
    }

    // ======= SERVICES =======
    async createService(data: InsertService): Promise<Service> {
        const { data: service, error } = await this.supabase.from('services').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(service);
    }

    async getService(id: string): Promise<Service | undefined> {
        const { data: service, error } = await this.supabase.from('services').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(service);
    }

    async updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined> {
        const { data: service, error } = await this.supabase.from('services').update(this.toSnakeCase(data)).eq('id', id).select().single();
        if (error) return undefined;
        return this.mapDates(service);
    }

    async deleteService(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('services').delete().eq('id', id);
        return !error;
    }

    async getServices(franchiseId?: string): Promise<Service[]> {
        let query = this.supabase.from('services').select('*');
        if (franchiseId) query = query.eq('franchise_id', franchiseId);
        const { data, error } = await query;
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= EMPLOYEES =======
    async createEmployee(data: InsertEmployee): Promise<Employee> {
        const { data: employee, error } = await this.supabase.from('employees').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(employee);
    }

    async getEmployee(id: string): Promise<Employee | undefined> {
        const { data: employee, error } = await this.supabase.from('employees').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(employee);
    }

    async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
        const { data: employee, error } = await this.supabase.from('employees').select('*').eq('email', email).single();
        if (error) return undefined;
        return this.mapDates(employee);
    }

    async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
        const snakeData = this.toSnakeCase(data);
        console.log('[SupabaseStorage] updateEmployee:', id, snakeData);
        const { data: employee, error } = await this.supabase.from('employees').update(snakeData).eq('id', id).select().single();
        if (error) {
            console.error('[SupabaseStorage] updateEmployee ERROR:', error.message, error.details);
            throw new Error(`Failed to update employee: ${error.message}`);
        }
        return this.mapDates(employee);
    }

    async deleteEmployee(id: string): Promise<boolean> {
        const { error, count } = await this.supabase
            .from('employees')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete employee error:', error);
            throw new Error(error.message || 'Failed to delete employee');
        }

        return true;
    }

    async getEmployees(franchiseId?: string, factoryId?: string): Promise<Employee[]> {
        let query = this.supabase.from('employees').select('*');
        if (franchiseId) query = query.eq('franchise_id', franchiseId);
        if (factoryId) query = query.eq('factory_id', factoryId);

        const { data, error } = await query;
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async listEmployees(franchiseId?: string, factoryId?: string): Promise<Employee[]> {
        return this.getEmployees(franchiseId, factoryId);
    }

    // ======= BARCODES =======
    async createBarcode(data: InsertBarcode): Promise<Barcode> {
        const { data: barcode, error } = await this.supabase.from('barcodes').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(barcode);
    }

    async getBarcode(id: string): Promise<Barcode | undefined> {
        const { data: barcode, error } = await this.supabase.from('barcodes').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(barcode);
    }

    async getBarcodeByCode(code: string): Promise<Barcode | undefined> {
        const { data: barcode, error } = await this.supabase.from('barcodes').select('*').eq('code', code).single();
        if (error) return undefined;
        return this.mapDates(barcode);
    }

    async getBarcodesByEntity(entityType: string, entityId: string): Promise<Barcode[]> {
        const { data, error } = await this.supabase.from('barcodes').select('*').eq('entity_type', entityType).eq('entity_id', entityId);
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getBarcodes(): Promise<Barcode[]> {
        const { data, error } = await this.supabase.from('barcodes').select('*');
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= SHIPMENTS =======
    async getShipments(): Promise<any[]> {
        const { data, error } = await this.supabase.from('shipments').select('*');
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getShipment(id: string): Promise<any | undefined> {
        const { data: shipment, error } = await this.supabase.from('shipments').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(shipment);
    }

    async createShipment(data: any): Promise<any> {
        const { data: shipment, error } = await this.supabase.from('shipments').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(shipment);
    }

    async updateShipment(id: string, data: any): Promise<any | undefined> {
        const { data: shipment, error } = await this.supabase.from('shipments').update(this.toSnakeCase(data)).eq('id', id).select().single();
        if (error) return undefined;
        return this.mapDates(shipment);
    }

    // ======= TRANSACTIONS (Master Ledger) =======
    async getOrderTransactions(orderId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('transactions')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to get transactions for order:', error);
            throw error;
        }

        return (data || []).map((row: any) => this.mapDates(row));
    }
    async getPosTransactions(): Promise<any[]> {
        const { data, error } = await this.supabase.from('order_transactions').select('*');
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getPosTransaction(id: string): Promise<any | undefined> {
        const { data: transaction, error } = await this.supabase.from('order_transactions').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(transaction);
    }

    async createPosTransaction(data: any): Promise<any> {
        const { data: transaction, error } = await this.supabase.from('order_transactions').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(transaction);
    }

    // ======= DASHBOARD METRICS =======
    async getDashboardMetrics(): Promise<any> {
        const orders = await this.listOrders();
        const customers = await this.listCustomers();
        const products = await this.listProducts();

        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = orders.filter(order => order.createdAt && new Date(order.createdAt) >= today).length;
        const newCustomersToday = customers.filter(customer => customer.createdAt && new Date(customer.createdAt) >= today).length;

        return { totalRevenue, totalOrders: ordersToday, newCustomers: newCustomersToday, inventoryItems: products.length };
    }

    // ======= SETTINGS =======
    async getAllSettings(): Promise<any[]> {
        const { data, error } = await this.supabase.from('settings').select('*').order('category', { ascending: true }).order('key', { ascending: true });
        if (error) throw error;
        return data.map(row => ({ ...row, value: JSON.parse(row.value), updatedAt: row.updated_at ? new Date(row.updated_at) : null }));
    }

    async getSettingsByCategory(category: string): Promise<any[]> {
        const { data, error } = await this.supabase.from('settings').select('*').eq('category', category).order('key', { ascending: true });
        if (error) throw error;
        return data.map(row => ({ ...row, value: JSON.parse(row.value), updatedAt: row.updated_at ? new Date(row.updated_at) : null }));
    }

    async getSetting(key: string): Promise<any | null> {
        const { data, error } = await this.supabase.from('settings').select('*').eq('key', key).single();
        if (error) return null;
        return { ...data, value: JSON.parse(data.value), updatedAt: data.updated_at ? new Date(data.updated_at) : null };
    }

    async updateSetting(key: string, value: any, category: string, updatedBy: string): Promise<any> {
        const now = new Date().toISOString();
        const valueStr = JSON.stringify(value);
        const existing = await this.getSetting(key);
        let result;

        if (existing) {
            const { data, error } = await this.supabase.from('settings').update({ value: valueStr, category, updated_by: updatedBy, updated_at: now }).eq('key', key).select().single();
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await this.supabase.from('settings').insert({ key, value: valueStr, category, updated_by: updatedBy, updated_at: now }).select().single();
            if (error) throw error;
            result = data;
        }

        return { ...result, value: JSON.parse(result.value), updatedAt: result.updated_at ? new Date(result.updated_at) : null };
    }

    async updateSettings(settings: any[], updatedBy: string): Promise<any[]> {
        const results = [];
        for (const setting of settings) {
            results.push(await this.updateSetting(setting.key, setting.value, setting.category, updatedBy));
        }
        return results;
    }

    async deleteAllSettings(): Promise<void> {
        const { error } = await this.supabase.from('settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
    }

    // ======= FRANCHISES =======
    async createFranchise(data: any): Promise<any> {
        const { data: franchise, error } = await this.supabase.from('franchises').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(franchise);
    }

    async getFranchise(id: string): Promise<any | undefined> {
        const { data: franchise, error } = await this.supabase.from('franchises').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(franchise);
    }

    async updateFranchise(id: string, data: any): Promise<any | undefined> {
        const { data: franchise, error } = await this.supabase.from('franchises').update(this.toSnakeCase(data)).eq('id', id).select().single();
        if (error) return undefined;
        return this.mapDates(franchise);
    }

    async deleteFranchise(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('franchises').delete().eq('id', id);
        return !error;
    }

    async listFranchises(): Promise<any[]> {
        const { data, error } = await this.supabase.from('franchises').select('*');
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }



    async getTransitOrdersByStatus(status: string, franchiseId?: string): Promise<any[]> {
        let query = this.supabase.from('transit_orders').select('*').eq('status', status).order('created_at', { ascending: false });
        if (franchiseId) query = query.eq('franchise_id', franchiseId);
        const { data, error } = await query;
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getTransitOrdersByType(type: string, franchiseId?: string): Promise<any[]> {
        let query = this.supabase.from('transit_orders').select('*').eq('type', type).order('created_at', { ascending: false });
        if (franchiseId) query = query.eq('franchise_id', franchiseId);
        const { data, error } = await query;
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getTransitOrder(id: string): Promise<any | undefined> {
        const { data, error } = await this.supabase.from('transit_orders').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(data);
    }

    async createTransitOrder(data: any): Promise<any> {
        const { data: transitOrder, error } = await this.supabase.from('transit_orders').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(transitOrder);
    }

    async createTransitOrderItem(data: any): Promise<any> {
        const { data: item, error } = await this.supabase.from('transit_order_items').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(item);
    }

    async createTransitStatusHistory(data: any): Promise<any> {
        const { data: history, error } = await this.supabase.from('transit_status_history').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(history);
    }

    async getTransitOrderItems(transitOrderId: string): Promise<any[]> {
        const { data, error } = await this.supabase.from('transit_order_items').select('*').eq('transit_order_id', transitOrderId);
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async updateTransitOrder(id: string, data: any): Promise<any> {
        const { data: transitOrder, error } = await this.supabase.from('transit_orders').update(this.toSnakeCase(data)).eq('id', id).select().single();
        if (error) throw error;
        return this.mapDates(transitOrder);
    }

    async updateTransitStatus(id: string, status: string, notes?: string, location?: string, updatedBy?: string): Promise<any> {
        const updateData: any = { status, updated_at: new Date().toISOString() };
        if (notes) updateData.notes = notes;
        if (location) updateData.location = location;
        if (updatedBy) updateData.updated_by = updatedBy;

        const { data: transitOrder, error } = await this.supabase
            .from('transit_orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return this.mapDates(transitOrder);
    }

    async getTransitStatusHistory(transitOrderId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('transit_status_history')
            .select('*')
            .eq('transit_order_id', transitOrderId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data.map(item => this.mapDates(item));
    }

    async getTransitBatch(id: string): Promise<any> {
        const { data, error } = await this.supabase.from('transit_batches').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(data);
    }

    async listTransitBatches(): Promise<any[]> {
        const { data, error } = await this.supabase.from('transit_batches').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async createTransitBatch(data: any): Promise<any> {
        const { data: batch, error } = await this.supabase.from('transit_batches').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(batch);
    }

    async updateTransitBatch(id: string, data: any): Promise<any> {
        const { data: batch, error } = await this.supabase.from('transit_batches').update(this.toSnakeCase(data)).eq('id', id).select().single();
        if (error) return undefined;
        return this.mapDates(batch);
    }

    async deleteTransitBatch(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('transit_batches').delete().eq('id', id);
        return !error;
    }

    async deleteTransitOrder(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('transit_orders').delete().eq('id', id);
        return !error;
    }

    // ======= DOCUMENTS =======
    async createDocument(data: any): Promise<any> {
        const { data: document, error } = await this.supabase.from('documents').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(document);
    }

    async listDocuments(filters: any = {}): Promise<any[]> {
        let query = this.supabase.from('documents').select('*');
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.limit) query = query.limit(filters.limit);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getDocument(id: string): Promise<any | undefined> {
        const { data: document, error } = await this.supabase.from('documents').select('*').eq('id', id).single();
        if (error) return undefined;
        return this.mapDates(document);
    }

    async deleteDocument(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('documents').delete().eq('id', id);
        return !error;
    }

    // ======= TASKS =======
    async createTask(data: any): Promise<any> {
        const { data: task, error } = await this.supabase.from('employee_tasks').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(task);
    }

    async listTasks(franchiseId?: string, employeeId?: string): Promise<any[]> {
        let query = this.supabase.from('employee_tasks').select('*');
        if (franchiseId) query = query.eq('franchise_id', franchiseId);
        if (employeeId) query = query.eq('employee_id', employeeId);
        const { data, error } = await query;
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async updateTask(id: string, data: any): Promise<any | undefined> {
        const { data: task, error } = await this.supabase.from('employee_tasks').update(this.toSnakeCase(data)).eq('id', id).select().single();
        if (error) return undefined;
        return this.mapDates(task);
    }

    // ======= ATTENDANCE =======
    async createAttendance(data: any): Promise<any> {
        const { data: attendance, error } = await this.supabase.from('employee_attendance').insert(this.toSnakeCase(data)).select().single();
        if (error) throw error;
        return this.mapDates(attendance);
    }

    async listAttendance(franchiseId?: string, employeeId?: string, date?: Date): Promise<any[]> {
        let query = this.supabase.from('employee_attendance').select('*');
        if (franchiseId) query = query.eq('franchise_id', franchiseId);
        if (employeeId) query = query.eq('employee_id', employeeId);
        if (date) {
            const dateStr = date.toISOString().split('T')[0];
            query = query.gte('date', `${dateStr}T00:00:00`).lte('date', `${dateStr}T23:59:59`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async updateAttendance(id: string, data: any): Promise<any> {
        const { data: attendance, error } = await this.supabase
            .from('employee_attendance')
            .update(this.toSnakeCase(data))
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(attendance);
    }

    // ======= CUSTOMER CREDIT SYSTEM =======
    private isWalletInfraMissing(error: any): boolean {
        const code = error?.code;
        if (code && ['42P01', '42703', '42883', '42704'].includes(code)) return true;
        const message = String(error?.message || '').toLowerCase();
        return message.includes('wallet_transactions') && (
            message.includes('does not exist') ||
            message.includes('relation') ||
            message.includes('column')
        );
    }

    async addCustomerCredit(
        customerId: string,
        amount: number,
        type: string,
        description: string,
        referenceId?: string,
        employeeId?: string,
        paymentMethod?: string
    ): Promise<any> {
        const { data: customer, error: custError } = await this.supabase
            .from('customers')
            .select('id, credit_balance, wallet_balance_cache, franchise_id')
            .eq('id', customerId)
            .single();

        if (custError) {
            console.error('Add Credit: Customer fetch failed', custError);
            throw new Error('Customer not found');
        }

        const currentBalance = parseFloat(customer.credit_balance || '0');
        const normalizedType = String(type || '').toLowerCase();

        // Preferred path: immutable wallet ledger.
        // Legacy credit_balance semantics are opposite to wallet semantics:
        // credit balance +X (customer owes more) == wallet amount -X.
        const walletAmount = -amount;

        let walletTransactionType: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT' = walletAmount >= 0 ? 'CREDIT' : 'DEBIT';
        if (normalizedType === 'adjustment') {
            walletTransactionType = 'ADJUSTMENT';
        }

        let referenceType: 'PAYMENT' | 'ORDER' | 'ADJUSTMENT' | 'MANUAL' = 'MANUAL';
        if (normalizedType === 'payment' || normalizedType === 'deposit') {
            referenceType = 'PAYMENT';
        } else if (normalizedType === 'credit' || normalizedType === 'usage') {
            referenceType = 'ORDER';
        } else if (normalizedType === 'adjustment') {
            referenceType = 'ADJUSTMENT';
        }

        const normalizedPaymentMethod = paymentMethod
            ? String(paymentMethod).trim().toUpperCase().replace(/\s+/g, '_')
            : null;

        const { data: walletTx, error: walletError } = await this.supabase
            .from('wallet_transactions')
            .insert({
                customer_id: customerId,
                franchise_id: customer.franchise_id || null,
                transaction_type: walletTransactionType,
                amount: walletAmount,
                payment_method: normalizedPaymentMethod,
                verified_by_staff: employeeId || null,
                reference_type: referenceType,
                reference_id: referenceId || null,
                note: description || null,
                created_by: employeeId || null,
            })
            .select('*')
            .single();

        if (!walletError && walletTx) {
            const mapped = this.mapDates(walletTx);
            const walletBalance = parseFloat(walletTx.balance_after || mapped.balanceAfter || '0');
            const legacyCreditBalance = walletBalance < 0 ? Math.abs(walletBalance) : 0;

            return {
                ...mapped,
                type: normalizedType || 'adjustment',
                amount: amount.toString(),
                balanceAfter: legacyCreditBalance.toFixed(2),
                previousBalance: currentBalance,
                newBalance: legacyCreditBalance
            };
        }

        // If wallet infra is unavailable, fallback to legacy table to keep app functional.
        if (walletError && !this.isWalletInfraMissing(walletError)) {
            console.error('Add Credit: Wallet transaction insert failed', walletError);
            throw walletError;
        }

        // Compatibility fallback for pre-migration environments that still have the
        // older wallet_transactions shape but not the unified ledger columns.
        const currentWalletBalance = parseFloat((customer as any).wallet_balance_cache || (currentBalance > 0 ? (-currentBalance).toString() : '0'));
        const legacyWalletBalanceAfter = currentWalletBalance + walletAmount;
        const legacyCreditBalance = legacyWalletBalanceAfter < 0 ? Math.abs(legacyWalletBalanceAfter) : 0;
        const legacyTransactionId = `WLT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        const legacyTxData = {
            transaction_id: legacyTransactionId,
            customer_id: customerId,
            type: walletAmount >= 0 ? 'credit' : 'debit',
            amount: Math.abs(walletAmount),
            balance_before: currentWalletBalance,
            balance_after: legacyWalletBalanceAfter,
            reference_order_id: referenceType === 'ORDER' ? (referenceId || null) : null,
            verified_by_staff: employeeId || null,
        };

        const { data: transaction, error: txError } = await this.supabase
            .from('wallet_transactions')
            .insert(legacyTxData)
            .select()
            .single();

        if (txError) {
            console.error('Add Credit: Legacy wallet transaction insert failed', txError);
            throw txError;
        }

        // Keep cached balances in sync only for the compatibility fallback path.
        const { error: updateError } = await this.supabase
            .from('customers')
            .update({
                credit_balance: legacyCreditBalance,
                wallet_balance_cache: legacyWalletBalanceAfter,
            })
            .eq('id', customerId);

        if (updateError) {
            console.error('Add Credit: Compatibility cache sync failed', updateError);
            throw updateError;
        }

        return {
            ...this.mapDates(transaction),
            previousBalance: currentBalance,
            type: normalizedType || 'adjustment',
            amount: amount.toString(),
            balanceAfter: legacyCreditBalance.toFixed(2),
            newBalance: legacyCreditBalance
        };
    }

    async getCustomerCreditHistory(customerId: string): Promise<any[]> {
        // Preferred path: wallet ledger mapped to legacy credit view model.
        const { data: walletData, error: walletError } = await this.supabase
            .from('wallet_transactions')
            .select(`
                *,
                staff:employees!verified_by_staff(first_name, last_name, employee_id)
            `)
            .eq('customer_id', customerId)
            .order('entry_no', { ascending: false });

        if (!walletError && walletData) {
            return walletData.map((row: any) => {
                const mapped = this.mapDates(row);
                const walletAmount = parseFloat(row.amount || mapped.amount || '0');
                const walletBalanceAfter = parseFloat(row.balance_after || mapped.balanceAfter || '0');
                const referenceType = row.reference_type || mapped.referenceType;
                const note = String(row.note || mapped.note || mapped.notes || '');
                const extractedTransactionId = (() => {
                    const match = note.match(/\[(WLT-[^\]]+|CRD-[^\]]+)\]/);
                    if (match?.[1]) return match[1];
                    const entryNo = row.entry_no || mapped.entryNo;
                    const baseId = entryNo || row.id || mapped.id;
                    return baseId ? `TXN-${baseId}` : `TXN-${Date.now()}`;
                })();

                let legacyType = 'adjustment';
                if (mapped.transactionType === 'DEBIT') {
                    legacyType = 'credit';
                } else if (mapped.transactionType === 'CREDIT') {
                    legacyType = referenceType === 'PAYMENT' ? 'payment' : 'deposit';
                }

                return {
                    ...mapped,
                    type: legacyType,
                    // Legacy credit amount: + means customer owes more, - means customer paid.
                    amount: (-walletAmount).toFixed(2),
                    balanceAfter: (walletBalanceAfter < 0 ? Math.abs(walletBalanceAfter) : 0).toFixed(2),
                    orderId: referenceType === 'ORDER' ? (row.reference_id || mapped.referenceId) : undefined,
                    referenceNumber: referenceType !== 'ORDER' ? (row.reference_id || mapped.referenceId) : undefined,
                    description: row.note || mapped.note || mapped.notes || '',
                    transactionId: extractedTransactionId,
                    creditId: row.customer_id || mapped.customerId || customerId,
                    recordedByName: row.staff ? `${row.staff.first_name} ${row.staff.last_name}`.trim() : (row.recorded_by_name || mapped.recordedByName),
                    staffId: row.staff?.employee_id || null
                };
            });
        }

        if (walletError && !this.isWalletInfraMissing(walletError)) {
            console.error('Get Credit History from wallet ledger failed', walletError);
            return [];
        }

        // Legacy fallback path
        const { data, error } = await this.supabase
            .from('credit_transactions')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get Credit History failed', error);
            return [];
        }
        return data.map(item => this.mapDates(item));
    }

    async getCustomersWithOutstandingCredit(franchiseId?: string): Promise<Customer[]> {
        let query = this.supabase
            .from('customers')
            .select('*')
            .gt('credit_balance', 0);

        if (franchiseId) {
            query = query.eq('franchise_id', franchiseId);
        }

        const { data, error } = await query.order('credit_balance', { ascending: false });
        if (error) {
            console.error('Get outstanding customers failed', error);
            return [];
        }

        return data.map((item: any) => this.mapDates(item));
    }

    close() { }

    // Alias for logAction used by AuthService
    async logAction(
        employeeId: string,
        action: string,
        entityType: string,
        entityId: string,
        details: any,
        ipAddress?: string,
        userAgent?: string
    ) {
        return this.createAuditLog({
            employeeId,
            action,
            entityType,
            entityId,
            details: JSON.stringify(details),
            ipAddress,
            userAgent
        } as any);
    }
    async getGlobalCreditHistory(limit: number = 50): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('wallet_transactions')
            .select('*, customers(name)')
            .order('entry_no', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('getGlobalCreditHistory error:', error);
            return [];
        }

        return data.map((row: any) => {
            const mapped = this.mapDates(row);
            const walletAmount = parseFloat(row.amount || mapped.amount || '0');
            const walletBalanceAfter = parseFloat(row.balance_after || mapped.balanceAfter || '0');
            const referenceType = row.reference_type || mapped.referenceType;
            const note = String(row.note || mapped.note || mapped.notes || '');
            const extractedTransactionId = (() => {
                const match = note.match(/\[(WLT-[^\]]+|CRD-[^\]]+)\]/);
                if (match?.[1]) return match[1];
                const entryNo = row.entry_no || mapped.entryNo;
                const baseId = entryNo || row.id || mapped.id;
                return baseId ? `TXN-${baseId}` : `TXN-${Date.now()}`;
            })();

            let legacyType = 'adjustment';
            if (mapped.transactionType === 'DEBIT') {
                legacyType = 'credit';
            } else if (mapped.transactionType === 'CREDIT') {
                legacyType = referenceType === 'PAYMENT' ? 'payment' : 'deposit';
            }

            return {
                ...mapped,
                customerName: row.customers?.name || 'Unknown',
                type: legacyType,
                amount: (-walletAmount).toFixed(2),
                balanceAfter: walletBalanceAfter.toFixed(2),
                description: row.note || mapped.note || mapped.notes || '',
                transactionId: extractedTransactionId,
                creditId: row.customer_id || mapped.customerId,
            };
        });
    }
}
