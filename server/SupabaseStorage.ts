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
} from "../shared/schema";
import { Driver, InsertDriver } from "./SQLiteStorage";

export class SupabaseStorage {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn("⚠️ Supabase credentials not found. SupabaseStorage will fail if used.");
        }

        this.supabase = createClient(supabaseUrl || '', supabaseKey || '');
    }

    // Helper to map Supabase dates to JS Dates and handle snake_case to camelCase
    private mapDates(record: any): any {
        if (!record) return record;

        const newRecord = { ...record };

        // Map snake_case to camelCase for critical fields
        const mappings: Record<string, string> = {
            'customer_phone': 'customerPhone',
            'customer_name': 'customerName',
            'customer_email': 'customerEmail',
            'order_number': 'orderNumber',
            'total_amount': 'totalAmount',
            'payment_status': 'paymentStatus',
            'pickup_date': 'pickupDate',
            'shipping_address': 'shippingAddress',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt',
            // New fields
            'advance_paid': 'advancePaid',
            'payment_method': 'paymentMethod',
            'discount_type': 'discountType',
            'discount_value': 'discountValue',
            'coupon_code': 'couponCode',
            'extra_charges': 'extraCharges',

            'loyalty_points': 'loyaltyPoints',
            // Audit Log fields
            'employee_id': 'employeeId',
            'entity_type': 'entityType',
            'entity_id': 'entityId',
            'ip_address': 'ipAddress',
            'user_agent': 'userAgent',
            'franchise_id': 'franchiseId'
        };

        Object.entries(mappings).forEach(([snake, camel]) => {
            // If snake_case exists, and camelCase is missing OR null, map it.
            // This handles cases where both columns exist in DB but one is empty.
            if (newRecord[snake] !== undefined) {
                if (newRecord[camel] === undefined || newRecord[camel] === null) {
                    newRecord[camel] = newRecord[snake];
                }
            }
        });

        // Map joined customer data if available (from Supabase join)
        // Supabase might return it as 'customers' (plural) or 'customer' depending on query
        const customerData = newRecord.customers || newRecord.customer;
        if (customerData) {
            // Handle both single object and array (though it should be single for Many-to-One)
            const cust = Array.isArray(customerData) ? customerData[0] : customerData;
            if (cust) {
                if (!newRecord.customerName) newRecord.customerName = cust.name;
                if (!newRecord.customerEmail) newRecord.customerEmail = cust.email;
                if (!newRecord.customerPhone) newRecord.customerPhone = cust.phone;
            }
        }

        // Common date fields
        ['createdAt', 'updatedAt', 'pickupDate', 'deliveryDate', 'deliveredAt', 'lastOrder', 'lastActive', 'completedAt', 'dispatchedAt', 'receivedAt', 'invoiceDate'].forEach(field => {
            if (newRecord[field]) {
                newRecord[field] = new Date(newRecord[field]);
            }
        });

        // Handle JSON fields
        ['items', 'shippingAddress', 'location', 'route', 'storeDetails', 'factoryDetails'].forEach(field => {
            if (newRecord[field] && typeof newRecord[field] === 'string') {
                try {
                    newRecord[field] = JSON.parse(newRecord[field]);
                } catch (e) {
                    // Ignore parse errors, might be already object or invalid
                }
            }
        });

        // Calculate totalAmount if missing or zero
        if ((!newRecord.totalAmount || newRecord.totalAmount == 0) && newRecord.items && Array.isArray(newRecord.items)) {
            const calculated = newRecord.items.reduce((sum: number, item: any) => {
                const price = parseFloat(item.price || item.unitPrice || 0);
                const qty = parseFloat(item.quantity || 1);
                return sum + (price * qty);
            }, 0);
            if (calculated > 0) {
                newRecord.totalAmount = calculated.toFixed(2);
            }
        }

        // Enrich order with service name from items if available
        if (newRecord.items && Array.isArray(newRecord.items) && newRecord.items.length > 0 && !newRecord.service) {
            const services = newRecord.items.map((item: any) => item.service || item.serviceName || item.name).filter(Boolean);
            if (services.length > 0) {
                // Deduplicate services
                newRecord.service = Array.from(new Set(services)).join(', ');
            }
        }

        return newRecord;
    }

    // ======= USERS =======
    async createUser(data: InsertUser): Promise<User> {
        const { data: user, error } = await this.supabase
            .from('users')
            .insert(data)
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
        const { data, error } = await this.supabase
            .from('users')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= PRODUCTS =======
    async createProduct(data: InsertProduct): Promise<Product> {
        const { data: product, error } = await this.supabase
            .from('products')
            .insert(data)
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
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) return undefined;
        return this.mapDates(product);
    }

    async deleteProduct(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('products')
            .delete()
            .eq('id', id);

        return !error;
    }

    async listProducts(): Promise<Product[]> {
        const { data, error } = await this.supabase
            .from('products')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getProducts(): Promise<Product[]> {
        return this.listProducts();
    }

    // ======= CUSTOMERS =======
    async createCustomer(data: InsertCustomer): Promise<Customer> {
        // Ensure address is stringified if it's an object, as Supabase client might need it for jsonb
        const insertData = { ...data };
        if (insertData.address && typeof insertData.address === 'object') {
            // @ts-ignore - Supabase expects different types depending on client version, force stringify for safety if needed, 
            // but actually for jsonb it should be object. However, if previous errors were 400, let's try to ensure it matches what Supabase expects.
            // If the column is jsonb, passing an object is correct. 
            // If the column is text (which it shouldn't be after the fix), stringify is needed.
            // Let's rely on the fact that we fixed the column to jsonb.
            // BUT, if the error persists, it might be that the type definition in InsertCustomer says string but we pass object.
        }

        const { data: customer, error } = await this.supabase
            .from('customers')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(customer);
    }

    async getCustomer(id: string): Promise<Customer | undefined> {
        const { data: customer, error } = await this.supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return this.mapDates(customer);
    }

    async updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
        const { data: customer, error } = await this.supabase
            .from('customers')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) return undefined;
        return this.mapDates(customer);
    }

    async deleteCustomer(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('customers')
            .delete()
            .eq('id', id);

        return !error;
    }

    async listCustomers(): Promise<Customer[]> {
        const { data, error } = await this.supabase
            .from('customers')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getCustomers(): Promise<Customer[]> {
        return this.listCustomers();
    }

    // ======= ORDERS =======
    async createOrder(data: InsertOrder): Promise<Order> {
        // Ensure JSON fields are stringified if needed (Supabase client handles objects for JSONB columns automatically, but let's be safe)
        const insertData: any = { ...data };

        // Map camelCase to snake_case for insertion
        const mappings: Record<string, string> = {
            'customerPhone': 'customer_phone',
            'customerName': 'customer_name',
            'customerEmail': 'customer_email',
            'orderNumber': 'order_number',
            'totalAmount': 'total_amount',
            'paymentStatus': 'payment_status',
            'pickupDate': 'pickup_date',
            'shippingAddress': 'shipping_address',
            'advancePaid': 'advance_paid',
            'paymentMethod': 'payment_method',
            'discountType': 'discount_type',
            'discountValue': 'discount_value',
            'couponCode': 'coupon_code',
            'extraCharges': 'extra_charges',
            'gstEnabled': 'gst_enabled',
            'gstRate': 'gst_rate',
            'gstAmount': 'gst_amount',
            'gstNumber': 'gst_number',
            'panNumber': 'pan_number',
            'specialInstructions': 'special_instructions',
            'customerId': 'customer_id',
            'franchiseId': 'franchise_id'
        };

        Object.entries(mappings).forEach(([camel, snake]) => {
            if (insertData[camel] !== undefined) {
                insertData[snake] = insertData[camel];
                delete insertData[camel];
            }
        });

        const { data: order, error } = await this.supabase
            .from('orders')
            .insert(insertData)
            .select('*')
            .single();

        if (error) throw error;
        return this.mapDates(order);
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
        console.log(`[SupabaseStorage] Updating order ${id} with:`, JSON.stringify(data));
        const updateData: any = { ...data };

        // Map camelCase to snake_case for update
        const mappings: Record<string, string> = {
            'customerPhone': 'customer_phone',
            'customerName': 'customer_name',
            'customerEmail': 'customer_email',
            'orderNumber': 'order_number',
            'totalAmount': 'total_amount',
            'paymentStatus': 'payment_status',
            'pickupDate': 'pickup_date',
            'shippingAddress': 'shipping_address',
            'advancePaid': 'advance_paid',
            'paymentMethod': 'payment_method',
            'discountType': 'discount_type',
            'discountValue': 'discount_value',
            'couponCode': 'coupon_code',
            'extraCharges': 'extra_charges',
            'gstEnabled': 'gst_enabled',
            'gstRate': 'gst_rate',
            'gstAmount': 'gst_amount',
            'gstNumber': 'gst_number',
            'panNumber': 'pan_number',
            'specialInstructions': 'special_instructions',
            'customerId': 'customer_id',
            'franchiseId': 'franchise_id'
        };

        Object.entries(mappings).forEach(([camel, snake]) => {
            if (updateData[camel] !== undefined) {
                updateData[snake] = updateData[camel];
                delete updateData[camel];
            }
        });

        console.log(`[SupabaseStorage] Mapped update data for ${id}:`, JSON.stringify(updateData));

        const { data: order, error } = await this.supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

        if (error) return undefined;
        return this.mapDates(order);
    }

    async deleteOrder(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('orders')
            .delete()
            .eq('id', id);

        return !error;
    }

    async listOrders(): Promise<Order[]> {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*, customers(name, email, phone)');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getOrders(): Promise<Order[]> {
        return this.listOrders();
    }

    async getActiveOrders(): Promise<Order[]> {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
            .in('status', ['in_progress', 'shipped', 'out_for_delivery', 'in_transit', 'assigned']);

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getAnalyticsSummary(): Promise<any> {
        // This is a simplified version. For production, consider using RPC or Edge Functions.
        const { count: totalOrders } = await this.supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: totalCustomers } = await this.supabase.from('customers').select('*', { count: 'exact', head: true });
        const { count: completedOrders } = await this.supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed');

        // Revenue aggregation (client-side for now as Supabase JS doesn't support SUM easily without RPC)
        // Ideally: create a view or function in Supabase
        const { data: orders } = await this.supabase.from('orders').select('totalAmount');
        const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0) || 0;

        // Recent activity
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentOrders } = await this.supabase.from('orders').select('*').gt('createdAt', fiveMinutesAgo).order('createdAt', { ascending: false }).limit(10);
        const { data: recentCustomers } = await this.supabase.from('customers').select('*').gt('createdAt', fiveMinutesAgo).order('createdAt', { ascending: false }).limit(10);

        // Status counts (aggregation in memory for now)
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

    async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
        const { data: auditLog, error } = await this.supabase
            .from('audit_logs')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(auditLog);
    }

    async getAuditLogs(params: any): Promise<{ data: AuditLog[]; count: number }> {
        const {
            page = 1,
            limit = 20,
            employeeId,
            action,
            startDate,
            endDate,
            entityType,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = params;

        const offset = (page - 1) * limit;

        let query = this.supabase
            .from('audit_logs')
            .select('*', { count: 'exact' });

        if (employeeId) query = query.eq('employee_id', employeeId);
        if (action) query = query.eq('action', action);
        if (entityType) query = query.eq('entity_type', entityType);
        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        const { data, error, count } = await query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            data: data.map(item => this.mapDates(item)),
            count: count || 0
        };
    }

    async searchGlobal(query: string): Promise<any> {
        const { data: orders } = await this.supabase
            .from('orders')
            .select('id, orderNumber, status')
            .or(`orderNumber.ilike.%${query}%,customerName.ilike.%${query}%`)
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

        const formattedOrders = orders?.map(o => ({ id: o.id, title: o.orderNumber, type: 'order', subtitle: o.status })) || [];
        const formattedCustomers = customers?.map(c => ({ id: c.id, title: c.name, type: 'customer', subtitle: c.phone })) || [];
        const formattedProducts = products?.map(p => ({ id: p.id, title: p.name, type: 'product', subtitle: p.sku })) || [];

        return [...formattedOrders, ...formattedCustomers, ...formattedProducts];
    }

    // ======= DELIVERIES =======
    async createDelivery(data: InsertDelivery): Promise<Delivery> {
        const { data: delivery, error } = await this.supabase
            .from('deliveries')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(delivery);
    }

    async getDelivery(id: string): Promise<Delivery | undefined> {
        const { data: delivery, error } = await this.supabase
            .from('deliveries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return this.mapDates(delivery);
    }

    async updateDelivery(id: string, data: Partial<InsertDelivery>): Promise<Delivery | undefined> {
        const { data: delivery, error } = await this.supabase
            .from('deliveries')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) return undefined;
        return this.mapDates(delivery);
    }

    async getDeliveries(): Promise<Delivery[]> {
        const { data, error } = await this.supabase
            .from('deliveries')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= DRIVERS =======
    async createDriver(data: InsertDriver): Promise<Driver> {
        const { data: driver, error } = await this.supabase
            .from('drivers')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(driver);
    }

    async getDriver(id: string): Promise<Driver | null> {
        const { data: driver, error } = await this.supabase
            .from('drivers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return this.mapDates(driver);
    }

    async listDrivers(): Promise<Driver[]> {
        const { data, error } = await this.supabase
            .from('drivers')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async updateDriver(id: string, data: Partial<InsertDriver>): Promise<Driver | null> {
        const { data: driver, error } = await this.supabase
            .from('drivers')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) return null;
        return this.mapDates(driver);
    }

    async deleteDriver(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('drivers')
            .delete()
            .eq('id', id);

        return !error;
    }

    async getDriversByStatus(status: string): Promise<Driver[]> {
        const { data, error } = await this.supabase
            .from('drivers')
            .select('*')
            .eq('status', status);

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async updateDriverLocation(id: string, latitude: number, longitude: number): Promise<Driver | null> {
        const { data: driver, error } = await this.supabase
            .from('drivers')
            .update({ currentLatitude: latitude, currentLongitude: longitude })
            .eq('id', id)
            .select()
            .single();

        if (error) return null;
        return this.mapDates(driver);
    }

    // ======= SERVICES =======
    async createService(data: InsertService): Promise<Service> {
        const { data: service, error } = await this.supabase
            .from('services')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(service);
    }

    async getService(id: string): Promise<Service | undefined> {
        const { data: service, error } = await this.supabase
            .from('services')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return this.mapDates(service);
    }

    async updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined> {
        const { data: service, error } = await this.supabase
            .from('services')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) return undefined;
        return this.mapDates(service);
    }

    async deleteService(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('services')
            .delete()
            .eq('id', id);

        return !error;
    }

    async getServices(): Promise<Service[]> {
        const { data, error } = await this.supabase
            .from('services')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= EMPLOYEES =======
    async createEmployee(data: InsertEmployee): Promise<Employee> {
        const { data: employee, error } = await this.supabase
            .from('employees')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(employee);
    }

    async getEmployee(id: string): Promise<Employee | undefined> {
        const { data: employee, error } = await this.supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return this.mapDates(employee);
    }

    async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
        const { data: employee, error } = await this.supabase
            .from('employees')
            .select('*')
            .eq('email', email)
            .single();

        if (error) return undefined;
        return this.mapDates(employee);
    }

    async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
        const { data: employee, error } = await this.supabase
            .from('employees')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) return undefined;
        return this.mapDates(employee);
    }

    async deleteEmployee(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('employees')
            .delete()
            .eq('id', id);

        return !error;
    }

    async getEmployees(): Promise<Employee[]> {
        const { data, error } = await this.supabase
            .from('employees')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= BARCODES =======
    async createBarcode(data: InsertBarcode): Promise<Barcode> {
        const { data: barcode, error } = await this.supabase
            .from('barcodes')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(barcode);
    }

    async getBarcode(id: string): Promise<Barcode | undefined> {
        const { data: barcode, error } = await this.supabase
            .from('barcodes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return this.mapDates(barcode);
    }

    async getBarcodeByCode(code: string): Promise<Barcode | undefined> {
        const { data: barcode, error } = await this.supabase
            .from('barcodes')
            .select('*')
            .eq('code', code)
            .single();

        if (error) return undefined;
        return this.mapDates(barcode);
    }

    async getBarcodesByEntity(entityType: string, entityId: string): Promise<Barcode[]> {
        const { data, error } = await this.supabase
            .from('barcodes')
            .select('*')
            .eq('entityType', entityType)
            .eq('entityId', entityId);

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getBarcodes(): Promise<Barcode[]> {
        const { data, error } = await this.supabase
            .from('barcodes')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= SHIPMENTS =======
    async getShipments(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('shipments')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getShipment(id: string): Promise<any | undefined> {
        const { data: shipment, error } = await this.supabase
            .from('shipments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return this.mapDates(shipment);
    }

    async createShipment(data: any): Promise<any> {
        const { data: shipment, error } = await this.supabase
            .from('shipments')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(shipment);
    }

    async updateShipment(id: string, data: any): Promise<any | undefined> {
        const { data: shipment, error } = await this.supabase
            .from('shipments')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) return undefined;
        return this.mapDates(shipment);
    }

    // ======= POS TRANSACTIONS =======
    async getPosTransactions(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('posTransactions')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getPosTransaction(id: string): Promise<any | undefined> {
        const { data: transaction, error } = await this.supabase
            .from('posTransactions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return this.mapDates(transaction);
    }

    async createPosTransaction(data: any): Promise<any> {
        const { data: transaction, error } = await this.supabase
            .from('posTransactions')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(transaction);
    }

    // ======= DASHBOARD METRICS =======
    async getDashboardMetrics(): Promise<any> {
        // This is a complex query, might be better to do in separate calls or a stored procedure
        // For now, fetching data and calculating in JS (similar to SQLite implementation)
        const orders = await this.listOrders();
        const customers = await this.listCustomers();
        const products = await this.listProducts();

        const totalRevenue = orders.reduce(
            (sum, order) => sum + parseFloat(order.totalAmount || "0"),
            0
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = orders.filter(
            (order) => order.createdAt && new Date(order.createdAt) >= today
        ).length;

        const newCustomersToday = customers.filter(
            (customer) => customer.createdAt && new Date(customer.createdAt) >= today
        ).length;

        return {
            totalRevenue,
            totalOrders: ordersToday,
            newCustomers: newCustomersToday,
            inventoryItems: products.length
        };
    }

    // ======= SETTINGS =======
    async getAllSettings(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('settings')
            .select('*')
            .order('category', { ascending: true })
            .order('key', { ascending: true });

        if (error) throw error;
        return data.map(row => ({
            ...row,
            value: JSON.parse(row.value),
            updatedAt: row.updatedAt ? new Date(row.updatedAt) : null
        }));
    }

    async getSettingsByCategory(category: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('settings')
            .select('*')
            .eq('category', category)
            .order('key', { ascending: true });

        if (error) throw error;
        return data.map(row => ({
            ...row,
            value: JSON.parse(row.value),
            updatedAt: row.updatedAt ? new Date(row.updatedAt) : null
        }));
    }

    async getSetting(key: string): Promise<any | null> {
        const { data, error } = await this.supabase
            .from('settings')
            .select('*')
            .eq('key', key)
            .single();

        if (error) return null;
        return {
            ...data,
            value: JSON.parse(data.value),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : null
        };
    }

    async updateSetting(key: string, value: any, category: string, updatedBy: string): Promise<any> {
        const now = new Date().toISOString();
        const valueStr = JSON.stringify(value);

        // Check if exists
        const existing = await this.getSetting(key);

        let result;
        if (existing) {
            const { data, error } = await this.supabase
                .from('settings')
                .update({ value: valueStr, category, updatedBy, updatedAt: now })
                .eq('key', key)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await this.supabase
                .from('settings')
                .insert({ key, value: valueStr, category, updatedBy, updatedAt: now })
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        return {
            ...result,
            value: JSON.parse(result.value),
            updatedAt: result.updatedAt ? new Date(result.updatedAt) : null
        };
    }

    async updateSettings(settings: any[], updatedBy: string): Promise<any[]> {
        const results = [];
        for (const setting of settings) {
            results.push(await this.updateSetting(setting.key, setting.value, setting.category, updatedBy));
        }
        return results;
    }

    async deleteAllSettings(): Promise<void> {
        const { error } = await this.supabase
            .from('settings')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) throw error;
    }

    // ======= FRANCHISES =======
    async createFranchise(data: any): Promise<any> {
        const { data: franchise, error } = await this.supabase
            .from('franchises')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(franchise);
    }

    async getFranchise(id: string): Promise<any | undefined> {
        const { data: franchise, error } = await this.supabase
            .from('franchises')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return this.mapDates(franchise);
    }

    async updateFranchise(id: string, data: any): Promise<any | undefined> {
        const { data: franchise, error } = await this.supabase
            .from('franchises')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) return undefined;
        return this.mapDates(franchise);
    }

    async deleteFranchise(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('franchises')
            .delete()
            .eq('id', id);

        return !error;
    }

    async listFranchises(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('franchises')
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= EMPLOYEE TASKS & ATTENDANCE =======
    async createTask(data: any): Promise<any> {
        const { data: task, error } = await this.supabase
            .from('employee_tasks')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(task);
    }

    async listTasks(franchiseId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('employee_tasks')
            .select('*')
            .eq('franchiseId', franchiseId);

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async createAttendance(data: any): Promise<any> {
        const { data: attendance, error } = await this.supabase
            .from('employee_attendance')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(attendance);
    }

    async listAttendance(franchiseId: string, employeeId?: string, date?: Date): Promise<any[]> {
        let query = this.supabase
            .from('employee_attendance')
            .select('*')
            .eq('franchiseId', franchiseId);

        if (employeeId) {
            query = query.eq('employeeId', employeeId);
        }

        if (date) {
            // Assuming date is stored as YYYY-MM-DD or timestamp
            // If timestamp, we might need range. For now, exact match on date string if schema uses date type
            // or if it uses text YYYY-MM-DD
            const dateStr = date.toISOString().split('T')[0];
            query = query.eq('date', dateStr);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= TRANSIT ORDERS =======
    async listTransitOrders(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('transit_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getTransitOrdersByStatus(status: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('transit_orders')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getTransitOrdersByType(type: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('transit_orders')
            .select('*')
            .eq('type', type)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    // ======= DOCUMENTS =======
    async createDocument(data: any): Promise<any> {
        const { data: document, error } = await this.supabase
            .from('documents')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return this.mapDates(document);
    }

    async listDocuments(filters: any = {}): Promise<any[]> {
        let query = this.supabase
            .from('documents')
            .select('*');

        if (filters.type) {
            query = query.eq('type', filters.type);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query.order('createdAt', { ascending: false });

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getDocument(id: string): Promise<any | undefined> {
        const { data: document, error } = await this.supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return this.mapDates(document);
    }

    async deleteDocument(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('documents')
            .delete()
            .eq('id', id);

        return !error;
    }

    close() {
        // Supabase client doesn't need explicit closing
    }
}
