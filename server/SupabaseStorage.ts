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
            'loyalty_points': 'loyaltyPoints'
        };

        Object.entries(mappings).forEach(([snake, camel]) => {
            if (newRecord[snake] !== undefined && newRecord[camel] === undefined) {
                newRecord[camel] = newRecord[snake];
                // Optional: delete snake_case key to clean up? No, keep it just in case.
            }
        });

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
        const insertData = { ...data };

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
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return this.mapDates(order);
    }

    async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined> {
        const { data: order, error } = await this.supabase
            .from('orders')
            .update(data)
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
            .select('*');

        if (error) throw error;
        return data.map(item => this.mapDates(item));
    }

    async getOrders(): Promise<Order[]> {
        return this.listOrders();
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
