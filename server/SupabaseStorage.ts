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
    type InsertAuditLog,
    type TransitOrder,
    type InsertTransitOrder
} from "../shared/schema";
import { Driver, InsertDriver } from "./SQLiteStorage";

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
            'total_orders': 'totalOrders',
            'total_spent': 'totalSpent',
            'last_order': 'lastOrder',
            'order_number': 'orderNumber',
            'payment_status': 'paymentStatus',
            'total_amount': 'totalAmount',
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
            'pan_number': 'panNumber',
            'gst_number': 'gstNumber',
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
            'priority': 'priority'
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
            'totalOrders': 'total_orders',
            'totalSpent': 'total_spent',
            'lastOrder': 'last_order',
            'orderNumber': 'order_number',
            'paymentStatus': 'payment_status',
            'totalAmount': 'total_amount',
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
            'panNumber': 'pan_number',
            'gstNumber': 'gst_number',
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
            'whatsappMessageCount': 'whatsapp_message_count'
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
        const { data: customer, error } = await this.supabase
            .from('customers')
            .insert(this.toSnakeCase(data))
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
        const { data: customer, error } = await this.supabase
            .from('customers')
            .update(this.toSnakeCase(data))
            .eq('id', id)
            .select()
            .single();
        if (error) return undefined;
        return this.mapDates(customer);
    }

    async deleteCustomer(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('customers').delete().eq('id', id);
        return !error;
    }

    async listCustomers(franchiseId?: string): Promise<Customer[]> {
        let query = this.supabase.from('customers').select('*');
        if (franchiseId) query = query.eq('franchise_id', franchiseId);
        const { data, error } = await query;
        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }
    async getCustomers(franchiseId?: string): Promise<Customer[]> { return this.listCustomers(franchiseId); }

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
            const snakeCaseData = this.toSnakeCase(data);
            console.log('[SupabaseStorage] Creating order with data:', JSON.stringify(snakeCaseData, null, 2));

            const { data: order, error } = await this.supabase
                .from('orders')
                .insert(snakeCaseData)
                .select('*')
                .single();

            if (error) {
                console.error('[SupabaseStorage] Supabase create order error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                throw new Error(`Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}${error.details ? ` - ${error.details}` : ''}`);
            }

            return this.mapDates(order);
        } catch (err) {
            console.error('[SupabaseStorage] Create order exception:', err);
            if (err instanceof Error) {
                throw err;
            }
            throw new Error(`Failed to create order: ${JSON.stringify(err)}`);
        }
    }

    async getOrder(id: string): Promise<Order | undefined> {
        const { data: order, error } = await this.supabase
            .from('orders')
            .select('*, customers(name, email, phone)')
            .eq('id', id)
            .single();
        if (error) return undefined;
        return this.mapDates(order);
    }

    async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined> {
        const { data: order, error } = await this.supabase
            .from('orders')
            .update(this.toSnakeCase(data))
            .eq('id', id)
            .select('*')
            .single();
        if (error) return undefined;
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

    async listTransitOrders(franchiseId?: string): Promise<TransitOrder[]> {
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
        const { data: employee, error } = await this.supabase.from('employees').update(this.toSnakeCase(data)).eq('id', id).select().single();
        if (error) return undefined;
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

    async getEmployees(): Promise<Employee[]> {
        const { data, error } = await this.supabase.from('employees').select('*');
        if (error) throw error;
        return data.map(item => this.mapDates(item));
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

    // ======= ORDER TRANSACTIONS (Fixed Name) =======
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

    async getTransitStatusHistory(transitOrderId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('transit_status_history')
            .select('*')
            .eq('transit_order_id', transitOrderId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data.map(item => this.mapDates(item));
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

    close() { }
}
