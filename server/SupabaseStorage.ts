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

    // Helper to map Supabase dates to JS Dates
    private mapDates(record: any): any {
        if (!record) return record;
        const newRecord = { ...record };

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
        const { data: customer, error } = await this.supabase
            .from('customers')
            .insert(data)
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
            .select()
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
            .select()
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

    close() {
        // Supabase client doesn't need explicit closing
    }
}
