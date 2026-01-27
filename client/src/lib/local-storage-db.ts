/**
 * LOCAL STORAGE DATABASE
 * Client-side database using IndexedDB for offline-first functionality
 * Works seamlessly with AWS Amplify static hosting
 * No backend required - all data stored locally in the browser
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database Schema
interface FabZCleanDB extends DBSchema {
    franchises: {
        key: string;
        value: {
            id: string;
            name: string;
            franchiseId: string;
            ownerName: string;
            email: string;
            phone: string;
            address: any;
            status: string;
            createdAt: string;
            updatedAt: string;
        };
        indexes: { 'by-franchiseId': string };
    };
    employees: {
        key: string;
        value: {
            id: string;
            franchiseId: string | null;
            employeeId: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            position: string;
            department: string;
            role: string;
            password: string;
            status: string;
            createdAt: string;
            updatedAt: string;
        };
        indexes: {
            'by-franchiseId': string;
            'by-employeeId': string;
            'by-email': string;
        };
    };
    customers: {
        key: string;
        value: {
            id: string;
            franchiseId: string;
            name: string;
            email: string;
            phone: string;
            address: any;
            totalOrders: number;
            totalSpent: string;
            createdAt: string;
            updatedAt: string;
        };
        indexes: {
            'by-franchiseId': string;
            'by-phone': string;
        };
    };
    services: {
        key: string;
        value: {
            id: string;
            franchiseId: string;
            name: string;
            category: string;
            description: string;
            price: string;
            duration: string;
            status: string;
            createdAt: string;
            updatedAt: string;
        };
        indexes: {
            'by-franchiseId': string;
            'by-category': string;
        };
    };
    orders: {
        key: string;
        value: {
            id: string;
            franchiseId: string;
            orderNumber: string;
            customerId: string;
            customerName: string;
            customerPhone: string;
            status: string;
            paymentStatus: string;
            totalAmount: string;
            items: any[];
            createdAt: string;
            updatedAt: string;
        };
        indexes: {
            'by-franchiseId': string;
            'by-customerId': string;
            'by-status': string;
            'by-orderNumber': string;
        };
    };
    settings: {
        key: string;
        value: {
            id: string;
            key: string;
            value: string;
            category: string;
            updatedAt: string;
        };
        indexes: { 'by-key': string };
    };
    auditLogs: {
        key: string;
        value: {
            id: string;
            franchiseId: string;
            employeeId: string;
            action: string;
            entityType: string;
            entityId: string;
            details: any;
            createdAt: string;
        };
        indexes: { 'by-franchiseId': string };
    };
}

const DB_NAME = 'fabzclean-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<FabZCleanDB> | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<FabZCleanDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<FabZCleanDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Franchises store
            if (!db.objectStoreNames.contains('franchises')) {
                const franchisesStore = db.createObjectStore('franchises', { keyPath: 'id' });
                franchisesStore.createIndex('by-franchiseId', 'franchiseId', { unique: true });
            }

            // Employees store
            if (!db.objectStoreNames.contains('employees')) {
                const employeesStore = db.createObjectStore('employees', { keyPath: 'id' });
                employeesStore.createIndex('by-franchiseId', 'franchiseId');
                employeesStore.createIndex('by-employeeId', 'employeeId', { unique: true });
                employeesStore.createIndex('by-email', 'email');
            }

            // Customers store
            if (!db.objectStoreNames.contains('customers')) {
                const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
                customersStore.createIndex('by-franchiseId', 'franchiseId');
                customersStore.createIndex('by-phone', 'phone');
            }

            // Services store
            if (!db.objectStoreNames.contains('services')) {
                const servicesStore = db.createObjectStore('services', { keyPath: 'id' });
                servicesStore.createIndex('by-franchiseId', 'franchiseId');
                servicesStore.createIndex('by-category', 'category');
            }

            // Orders store
            if (!db.objectStoreNames.contains('orders')) {
                const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
                ordersStore.createIndex('by-franchiseId', 'franchiseId');
                ordersStore.createIndex('by-customerId', 'customerId');
                ordersStore.createIndex('by-status', 'status');
                ordersStore.createIndex('by-orderNumber', 'orderNumber', { unique: true });
            }

            // Settings store
            if (!db.objectStoreNames.contains('settings')) {
                const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
                settingsStore.createIndex('by-key', 'key', { unique: true });
            }

            // Audit logs store
            if (!db.objectStoreNames.contains('auditLogs')) {
                const logsStore = db.createObjectStore('auditLogs', { keyPath: 'id' });
                logsStore.createIndex('by-franchiseId', 'franchiseId');
            }
        },
    });

    return dbInstance;
}

/**
 * Generate a UUID
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
    return new Date().toISOString();
}

// ============================================
// CRUD OPERATIONS
// ============================================

// FRANCHISES
export async function getFranchises() {
    const db = await initDB();
    return db.getAll('franchises');
}

export async function getFranchise(id: string) {
    const db = await initDB();
    return db.get('franchises', id);
}

export async function createFranchise(data: Omit<FabZCleanDB['franchises']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
    const db = await initDB();
    const franchise = {
        ...data,
        id: generateId(),
        createdAt: now(),
        updatedAt: now(),
    };
    await db.add('franchises', franchise);
    return franchise;
}

// EMPLOYEES
export async function getEmployees(franchiseId?: string) {
    const db = await initDB();
    if (franchiseId) {
        return db.getAllFromIndex('employees', 'by-franchiseId', franchiseId);
    }
    return db.getAll('employees');
}

export async function getEmployee(id: string) {
    const db = await initDB();
    return db.get('employees', id);
}

export async function getEmployeeByEmployeeId(employeeId: string) {
    const db = await initDB();
    return db.getFromIndex('employees', 'by-employeeId', employeeId);
}

export async function getEmployeeByEmail(email: string) {
    const db = await initDB();
    return db.getFromIndex('employees', 'by-email', email);
}

export async function createEmployee(data: Omit<FabZCleanDB['employees']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
    const db = await initDB();
    const employee = {
        ...data,
        id: generateId(),
        createdAt: now(),
        updatedAt: now(),
    };
    await db.add('employees', employee);
    return employee;
}

export async function updateEmployee(id: string, data: Partial<FabZCleanDB['employees']['value']>) {
    const db = await initDB();
    const existing = await db.get('employees', id);
    if (!existing) throw new Error('Employee not found');

    const updated = {
        ...existing,
        ...data,
        updatedAt: now(),
    };
    await db.put('employees', updated);
    return updated;
}

// CUSTOMERS
export async function getCustomers(franchiseId?: string) {
    const db = await initDB();
    if (franchiseId) {
        return db.getAllFromIndex('customers', 'by-franchiseId', franchiseId);
    }
    return db.getAll('customers');
}

export async function getCustomer(id: string) {
    const db = await initDB();
    return db.get('customers', id);
}

export async function getCustomerByPhone(phone: string) {
    const db = await initDB();
    return db.getFromIndex('customers', 'by-phone', phone);
}

export async function createCustomer(data: Omit<FabZCleanDB['customers']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
    const db = await initDB();
    const customer = {
        ...data,
        id: generateId(),
        createdAt: now(),
        updatedAt: now(),
    };
    await db.add('customers', customer);
    return customer;
}

export async function updateCustomer(id: string, data: Partial<FabZCleanDB['customers']['value']>) {
    const db = await initDB();
    const existing = await db.get('customers', id);
    if (!existing) throw new Error('Customer not found');

    const updated = {
        ...existing,
        ...data,
        updatedAt: now(),
    };
    await db.put('customers', updated);
    return updated;
}

// SERVICES
export async function getServices(franchiseId?: string) {
    const db = await initDB();
    if (franchiseId) {
        return db.getAllFromIndex('services', 'by-franchiseId', franchiseId);
    }
    return db.getAll('services');
}

export async function getService(id: string) {
    const db = await initDB();
    return db.get('services', id);
}

export async function createService(data: Omit<FabZCleanDB['services']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
    const db = await initDB();
    const service = {
        ...data,
        id: generateId(),
        createdAt: now(),
        updatedAt: now(),
    };
    await db.add('services', service);
    return service;
}

// ORDERS
export async function getOrders(franchiseId?: string) {
    const db = await initDB();
    if (franchiseId) {
        return db.getAllFromIndex('orders', 'by-franchiseId', franchiseId);
    }
    return db.getAll('orders');
}

export async function getOrder(id: string) {
    const db = await initDB();
    return db.get('orders', id);
}

export async function getOrderByNumber(orderNumber: string) {
    const db = await initDB();
    return db.getFromIndex('orders', 'by-orderNumber', orderNumber);
}

export async function createOrder(data: Omit<FabZCleanDB['orders']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
    const db = await initDB();
    const order = {
        ...data,
        id: generateId(),
        createdAt: now(),
        updatedAt: now(),
    };
    await db.add('orders', order);
    return order;
}

export async function updateOrder(id: string, data: Partial<FabZCleanDB['orders']['value']>) {
    const db = await initDB();
    const existing = await db.get('orders', id);
    if (!existing) throw new Error('Order not found');

    const updated = {
        ...existing,
        ...data,
        updatedAt: now(),
    };
    await db.put('orders', updated);
    return updated;
}

// SETTINGS
export async function getSettings() {
    const db = await initDB();
    return db.getAll('settings');
}

export async function getSetting(key: string) {
    const db = await initDB();
    return db.getFromIndex('settings', 'by-key', key);
}

export async function setSetting(key: string, value: string, category: string = 'general') {
    const db = await initDB();
    const existing = await db.getFromIndex('settings', 'by-key', key);

    if (existing) {
        const updated = {
            ...existing,
            value,
            category,
            updatedAt: now(),
        };
        await db.put('settings', updated);
        return updated;
    } else {
        const setting = {
            id: generateId(),
            key,
            value,
            category,
            updatedAt: now(),
        };
        await db.add('settings', setting);
        return setting;
    }
}

// AUDIT LOGS
export async function logAction(
    franchiseId: string,
    employeeId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: any = {}
) {
    const db = await initDB();
    const log = {
        id: generateId(),
        franchiseId,
        employeeId,
        action,
        entityType,
        entityId,
        details,
        createdAt: now(),
    };
    await db.add('auditLogs', log);
    return log;
}

export async function getAuditLogs(franchiseId?: string) {
    const db = await initDB();
    if (franchiseId) {
        return db.getAllFromIndex('auditLogs', 'by-franchiseId', franchiseId);
    }
    return db.getAll('auditLogs');
}

// ============================================
// SEED DEFAULT DATA
// ============================================
export async function seedDefaultData() {
    const db = await initDB();

    // Check if already seeded
    const franchises = await db.getAll('franchises');
    if (franchises.length > 0) {
return;
    }
// Seed franchises
    const pollachi = {
        id: 'franchise-pollachi',
        name: 'Fab Clean Pollachi',
        franchiseId: 'FAB-POLLACHI',
        ownerName: 'Manager Pollachi',
        email: 'pollachi@fabzclean.com',
        phone: '9363059595',
        address: { street: '#16, Venkatramana Round Road', city: 'Pollachi', state: 'Tamil Nadu', zip: '642002' },
        status: 'active',
        createdAt: now(),
        updatedAt: now(),
    };

    const kinathukadavu = {
        id: 'franchise-kinathukadavu',
        name: 'Fab Clean Kinathukadavu',
        franchiseId: 'FAB-KIN',
        ownerName: 'Manager Kinathukadavu',
        email: 'kinathukadavu@fabzclean.com',
        phone: '9363719595',
        address: { street: '#442/11, Opp MlA Office', city: 'Kinathukadavu', state: 'Tamil Nadu', zip: '642109' },
        status: 'active',
        createdAt: now(),
        updatedAt: now(),
    };

    await db.add('franchises', pollachi);
    await db.add('franchises', kinathukadavu);

    // Seed admin employee (password hash for 'Durai@2025')
    const admin = {
        id: 'admin-user-id',
        franchiseId: null,
        employeeId: 'myfabclean',
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@myfabclean.com',
        phone: '9999999999',
        position: 'Administrator',
        department: 'Management',
        role: 'admin',
        password: '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
        status: 'active',
        createdAt: now(),
        updatedAt: now(),
    };
    await db.add('employees', admin);

    // Seed services for both franchises
    const servicesList = [
        { name: 'Shirt', category: 'Ironing', price: '20.00', duration: '24 hours' },
        { name: 'Pant', category: 'Ironing', price: '20.00', duration: '24 hours' },
        { name: 'Shirt', category: 'Laundry', price: '30.00', duration: '48 hours' },
        { name: 'Pant', category: 'Laundry', price: '30.00', duration: '48 hours' },
        { name: 'Shirt', category: 'Dry Cleaning', price: '60.00', duration: '72 hours' },
        { name: 'Pant', category: 'Dry Cleaning', price: '70.00', duration: '72 hours' },
        { name: 'Saree (Cotton)', category: 'Ironing', price: '50.00', duration: '24 hours' },
        { name: 'Saree (Silk)', category: 'Dry Cleaning', price: '250.00', duration: '72 hours' },
    ];

    for (const franchise of [pollachi, kinathukadavu]) {
        for (const svc of servicesList) {
            await db.add('services', {
                id: generateId(),
                franchiseId: franchise.id,
                name: svc.name,
                category: svc.category,
                description: `${svc.category} for ${svc.name}`,
                price: svc.price,
                duration: svc.duration,
                status: 'Active',
                createdAt: now(),
                updatedAt: now(),
            });
        }
    }

    // Seed default settings
    const defaultSettings = [
        { key: 'company_name', value: 'FabZ Clean', category: 'general' },
        { key: 'gst_enabled', value: 'true', category: 'billing' },
        { key: 'gst_rate', value: '18', category: 'billing' },
        { key: 'currency', value: 'INR', category: 'billing' },
    ];

    for (const s of defaultSettings) {
        await db.add('settings', {
            id: generateId(),
            key: s.key,
            value: s.value,
            category: s.category,
            updatedAt: now(),
        });
    }
}

// ============================================
// EXPORT ALL
// ============================================
export const localDB = {
    init: initDB,
    seed: seedDefaultData,
    generateId,
    now,
    // Franchises
    getFranchises,
    getFranchise,
    createFranchise,
    // Employees
    getEmployees,
    getEmployee,
    getEmployeeByEmployeeId,
    getEmployeeByEmail,
    createEmployee,
    updateEmployee,
    // Customers
    getCustomers,
    getCustomer,
    getCustomerByPhone,
    createCustomer,
    updateCustomer,
    // Services
    getServices,
    getService,
    createService,
    // Orders
    getOrders,
    getOrder,
    getOrderByNumber,
    createOrder,
    updateOrder,
    // Settings
    getSettings,
    getSetting,
    setSetting,
    // Audit
    logAction,
    getAuditLogs,
};

export default localDB;
