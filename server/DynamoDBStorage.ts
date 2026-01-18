/**
 * DYNAMODB STORAGE IMPLEMENTATION
 * Full replacement for SQLite with AWS DynamoDB
 * 
 * Features:
 * - Franchise-based data isolation (GSI on franchiseId)
 * - Role-based access control
 * - Audit logging
 * - Full CRUD for all entities
 * 
 * DynamoDB Tables Required:
 * - fabzclean_franchises
 * - fabzclean_employees
 * - fabzclean_customers
 * - fabzclean_orders
 * - fabzclean_services
 * - fabzclean_drivers
 * - fabzclean_settings
 * - fabzclean_audit_logs
 * - fabzclean_documents
 * - fabzclean_transit_orders
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    QueryCommand,
    ScanCommand,
    BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type { IStorage } from './storage';
import type {
    Franchise,
    Customer,
    Service,
    Order,
    Employee,
    Driver,
    Delivery,
    Document,
    InsertFranchise,
    InsertCustomer,
    InsertService,
    InsertOrder,
    InsertEmployee,
    InsertDriver,
    InsertDelivery,
    InsertDocument,
} from '@shared/schema';

// ============================================
// CONFIGURATION
// ============================================

const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'fabzclean_';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

// Table names
const TABLES = {
    FRANCHISES: `${TABLE_PREFIX}franchises`,
    EMPLOYEES: `${TABLE_PREFIX}employees`,
    CUSTOMERS: `${TABLE_PREFIX}customers`,
    ORDERS: `${TABLE_PREFIX}orders`,
    SERVICES: `${TABLE_PREFIX}services`,
    DRIVERS: `${TABLE_PREFIX}drivers`,
    SETTINGS: `${TABLE_PREFIX}settings`,
    AUDIT_LOGS: `${TABLE_PREFIX}audit_logs`,
    DOCUMENTS: `${TABLE_PREFIX}documents`,
    TRANSIT_ORDERS: `${TABLE_PREFIX}transit_orders`,
    DELIVERIES: `${TABLE_PREFIX}deliveries`,
    PRODUCTS: `${TABLE_PREFIX}products`,
};

// ============================================
// DYNAMODB CLIENT
// ============================================

const client = new DynamoDBClient({
    region: AWS_REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    } : undefined, // Use IAM role if no credentials provided
});

const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: true,
    },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function nowISO(): string {
    return new Date().toISOString();
}

function parseDate(val: string | Date | undefined): Date | undefined {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
}

// ============================================
// DYNAMODB STORAGE CLASS
// ============================================

export class DynamoDBStorage implements IStorage {

    // ==========================================
    // FRANCHISES
    // ==========================================

    async getFranchises(): Promise<Franchise[]> {
        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.FRANCHISES,
        }));
        return (result.Items || []).map(this.mapFranchise);
    }

    async getFranchise(id: string): Promise<Franchise | undefined> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.FRANCHISES,
            Key: { id },
        }));
        return result.Item ? this.mapFranchise(result.Item) : undefined;
    }

    async createFranchise(data: InsertFranchise): Promise<Franchise> {
        const now = nowISO();
        const franchise: any = {
            id: uuidv4(),
            ...data,
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.FRANCHISES,
            Item: franchise,
        }));

        return this.mapFranchise(franchise);
    }

    async updateFranchise(id: string, data: Partial<InsertFranchise>): Promise<Franchise> {
        const existing = await this.getFranchise(id);
        if (!existing) throw new Error('Franchise not found');

        const updated = { ...existing, ...data, updatedAt: nowISO() };
        await docClient.send(new PutCommand({
            TableName: TABLES.FRANCHISES,
            Item: updated,
        }));

        return this.mapFranchise(updated);
    }

    async deleteFranchise(id: string): Promise<void> {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.FRANCHISES,
            Key: { id },
        }));
    }

    private mapFranchise(item: any): Franchise {
        return {
            ...item,
            address: typeof item.address === 'string' ? JSON.parse(item.address) : item.address,
            createdAt: parseDate(item.createdAt),
            updatedAt: parseDate(item.updatedAt),
        };
    }

    // ==========================================
    // EMPLOYEES (with franchise isolation)
    // ==========================================

    async getEmployees(franchiseId?: string): Promise<Employee[]> {
        if (franchiseId) {
            const result = await docClient.send(new QueryCommand({
                TableName: TABLES.EMPLOYEES,
                IndexName: 'franchiseId-index',
                KeyConditionExpression: 'franchiseId = :fid',
                ExpressionAttributeValues: { ':fid': franchiseId },
            }));
            return (result.Items || []).map(this.mapEmployee);
        }

        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.EMPLOYEES,
        }));
        return (result.Items || []).map(this.mapEmployee);
    }

    async getEmployee(id: string): Promise<Employee | undefined> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.EMPLOYEES,
            Key: { id },
        }));
        return result.Item ? this.mapEmployee(result.Item) : undefined;
    }

    async getEmployeeByEmail(emailOrEmployeeId: string): Promise<Employee | undefined> {
        // Query by email GSI
        let result = await docClient.send(new QueryCommand({
            TableName: TABLES.EMPLOYEES,
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': emailOrEmployeeId },
        }));

        if (result.Items && result.Items.length > 0) {
            return this.mapEmployee(result.Items[0]);
        }

        // Query by employeeId GSI
        result = await docClient.send(new QueryCommand({
            TableName: TABLES.EMPLOYEES,
            IndexName: 'employeeId-index',
            KeyConditionExpression: 'employeeId = :eid',
            ExpressionAttributeValues: { ':eid': emailOrEmployeeId },
        }));

        if (result.Items && result.Items.length > 0) {
            return this.mapEmployee(result.Items[0]);
        }

        return undefined;
    }

    async createEmployee(data: InsertEmployee): Promise<Employee> {
        const now = nowISO();

        // Hash password if provided
        let password = data.password;
        if (password && !password.startsWith('$2')) {
            password = await bcrypt.hash(password, 10);
        }

        const employee: any = {
            id: uuidv4(),
            ...data,
            password,
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.EMPLOYEES,
            Item: employee,
        }));

        return this.mapEmployee(employee);
    }

    async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee> {
        const existing = await this.getEmployee(id);
        if (!existing) throw new Error('Employee not found');

        // Hash password if being updated
        let password = data.password;
        if (password && !password.startsWith('$2')) {
            password = await bcrypt.hash(password, 10);
        }

        const updated = {
            ...existing,
            ...data,
            password: password || existing.password,
            updatedAt: nowISO()
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.EMPLOYEES,
            Item: updated,
        }));

        return this.mapEmployee(updated);
    }

    async deleteEmployee(id: string): Promise<void> {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.EMPLOYEES,
            Key: { id },
        }));
    }

    private mapEmployee(item: any): Employee {
        return {
            ...item,
            createdAt: parseDate(item.createdAt),
            updatedAt: parseDate(item.updatedAt),
            hireDate: parseDate(item.hireDate),
        };
    }

    // ==========================================
    // CUSTOMERS (with franchise isolation)
    // ==========================================

    async getCustomers(franchiseId?: string): Promise<Customer[]> {
        if (franchiseId) {
            const result = await docClient.send(new QueryCommand({
                TableName: TABLES.CUSTOMERS,
                IndexName: 'franchiseId-index',
                KeyConditionExpression: 'franchiseId = :fid',
                ExpressionAttributeValues: { ':fid': franchiseId },
            }));
            return (result.Items || []).map(this.mapCustomer);
        }

        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.CUSTOMERS,
        }));
        return (result.Items || []).map(this.mapCustomer);
    }

    async getCustomer(id: string): Promise<Customer | undefined> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.CUSTOMERS,
            Key: { id },
        }));
        return result.Item ? this.mapCustomer(result.Item) : undefined;
    }

    async getCustomerByPhone(phone: string, franchiseId?: string): Promise<Customer | undefined> {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLES.CUSTOMERS,
            IndexName: 'phone-index',
            KeyConditionExpression: 'phone = :phone',
            ExpressionAttributeValues: { ':phone': phone },
        }));

        const items = result.Items || [];
        if (franchiseId) {
            const filtered = items.filter((i: any) => i.franchiseId === franchiseId);
            return filtered.length > 0 ? this.mapCustomer(filtered[0]) : undefined;
        }

        return items.length > 0 ? this.mapCustomer(items[0]) : undefined;
    }

    async createCustomer(data: InsertCustomer): Promise<Customer> {
        const now = nowISO();
        const customer: any = {
            id: uuidv4(),
            ...data,
            totalOrders: 0,
            totalSpent: '0',
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.CUSTOMERS,
            Item: customer,
        }));

        return this.mapCustomer(customer);
    }

    async updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer> {
        const existing = await this.getCustomer(id);
        if (!existing) throw new Error('Customer not found');

        const updated = { ...existing, ...data, updatedAt: nowISO() };
        await docClient.send(new PutCommand({
            TableName: TABLES.CUSTOMERS,
            Item: updated,
        }));

        return this.mapCustomer(updated);
    }

    async deleteCustomer(id: string): Promise<void> {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.CUSTOMERS,
            Key: { id },
        }));
    }

    private mapCustomer(item: any): Customer {
        return {
            ...item,
            address: typeof item.address === 'string' ? JSON.parse(item.address) : item.address,
            createdAt: parseDate(item.createdAt),
            updatedAt: parseDate(item.updatedAt),
            lastOrder: parseDate(item.lastOrder),
        };
    }

    // ==========================================
    // ORDERS (with franchise isolation)
    // ==========================================

    async getOrders(franchiseId?: string): Promise<Order[]> {
        if (franchiseId) {
            const result = await docClient.send(new QueryCommand({
                TableName: TABLES.ORDERS,
                IndexName: 'franchiseId-index',
                KeyConditionExpression: 'franchiseId = :fid',
                ExpressionAttributeValues: { ':fid': franchiseId },
            }));
            return (result.Items || []).map(this.mapOrder);
        }

        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.ORDERS,
        }));
        return (result.Items || []).map(this.mapOrder);
    }

    async getOrder(id: string): Promise<Order | undefined> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.ORDERS,
            Key: { id },
        }));
        return result.Item ? this.mapOrder(result.Item) : undefined;
    }

    async getOrderByNumber(orderNumber: string, franchiseId?: string): Promise<Order | undefined> {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLES.ORDERS,
            IndexName: 'orderNumber-index',
            KeyConditionExpression: 'orderNumber = :on',
            ExpressionAttributeValues: { ':on': orderNumber },
        }));

        const items = result.Items || [];
        if (franchiseId) {
            const filtered = items.filter((i: any) => i.franchiseId === franchiseId);
            return filtered.length > 0 ? this.mapOrder(filtered[0]) : undefined;
        }

        return items.length > 0 ? this.mapOrder(items[0]) : undefined;
    }

    async createOrder(data: InsertOrder): Promise<Order> {
        const now = nowISO();
        const order: any = {
            id: uuidv4(),
            ...data,
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.ORDERS,
            Item: order,
        }));

        return this.mapOrder(order);
    }

    async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order> {
        const existing = await this.getOrder(id);
        if (!existing) throw new Error('Order not found');

        const updated = { ...existing, ...data, updatedAt: nowISO() };
        await docClient.send(new PutCommand({
            TableName: TABLES.ORDERS,
            Item: updated,
        }));

        return this.mapOrder(updated);
    }

    async deleteOrder(id: string): Promise<void> {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.ORDERS,
            Key: { id },
        }));
    }

    private mapOrder(item: any): Order {
        return {
            ...item,
            items: typeof item.items === 'string' ? JSON.parse(item.items) : item.items,
            shippingAddress: typeof item.shippingAddress === 'string' ? JSON.parse(item.shippingAddress) : item.shippingAddress,
            deliveryAddress: typeof item.deliveryAddress === 'string' ? JSON.parse(item.deliveryAddress) : item.deliveryAddress,
            createdAt: parseDate(item.createdAt),
            updatedAt: parseDate(item.updatedAt),
            pickupDate: parseDate(item.pickupDate),
        };
    }

    // ==========================================
    // SERVICES (with franchise isolation)
    // ==========================================

    async getServices(franchiseId?: string): Promise<Service[]> {
        if (franchiseId) {
            const result = await docClient.send(new QueryCommand({
                TableName: TABLES.SERVICES,
                IndexName: 'franchiseId-index',
                KeyConditionExpression: 'franchiseId = :fid',
                ExpressionAttributeValues: { ':fid': franchiseId },
            }));
            return (result.Items || []).map(this.mapService);
        }

        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.SERVICES,
        }));
        return (result.Items || []).map(this.mapService);
    }

    async getService(id: string): Promise<Service | undefined> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.SERVICES,
            Key: { id },
        }));
        return result.Item ? this.mapService(result.Item) : undefined;
    }

    async createService(data: InsertService): Promise<Service> {
        const now = nowISO();
        const service: any = {
            id: uuidv4(),
            ...data,
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.SERVICES,
            Item: service,
        }));

        return this.mapService(service);
    }

    async updateService(id: string, data: Partial<InsertService>): Promise<Service> {
        const existing = await this.getService(id);
        if (!existing) throw new Error('Service not found');

        const updated = { ...existing, ...data, updatedAt: nowISO() };
        await docClient.send(new PutCommand({
            TableName: TABLES.SERVICES,
            Item: updated,
        }));

        return this.mapService(updated);
    }

    async deleteService(id: string): Promise<void> {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.SERVICES,
            Key: { id },
        }));
    }

    private mapService(item: any): Service {
        return {
            ...item,
            createdAt: parseDate(item.createdAt),
            updatedAt: parseDate(item.updatedAt),
        };
    }

    // ==========================================
    // DRIVERS (with franchise isolation)
    // ==========================================

    async getDrivers(franchiseId?: string): Promise<Driver[]> {
        if (franchiseId) {
            const result = await docClient.send(new QueryCommand({
                TableName: TABLES.DRIVERS,
                IndexName: 'franchiseId-index',
                KeyConditionExpression: 'franchiseId = :fid',
                ExpressionAttributeValues: { ':fid': franchiseId },
            }));
            return (result.Items || []).map(this.mapDriver);
        }

        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.DRIVERS,
        }));
        return (result.Items || []).map(this.mapDriver);
    }

    async getDriver(id: string): Promise<Driver | undefined> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.DRIVERS,
            Key: { id },
        }));
        return result.Item ? this.mapDriver(result.Item) : undefined;
    }

    async createDriver(data: InsertDriver): Promise<Driver> {
        const now = nowISO();
        const driver: any = {
            id: uuidv4(),
            ...data,
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.DRIVERS,
            Item: driver,
        }));

        return this.mapDriver(driver);
    }

    async updateDriver(id: string, data: Partial<InsertDriver>): Promise<Driver> {
        const existing = await this.getDriver(id);
        if (!existing) throw new Error('Driver not found');

        const updated = { ...existing, ...data, updatedAt: nowISO() };
        await docClient.send(new PutCommand({
            TableName: TABLES.DRIVERS,
            Item: updated,
        }));

        return this.mapDriver(updated);
    }

    async deleteDriver(id: string): Promise<void> {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.DRIVERS,
            Key: { id },
        }));
    }

    private mapDriver(item: any): Driver {
        return {
            ...item,
            createdAt: parseDate(item.createdAt),
            updatedAt: parseDate(item.updatedAt),
            lastActive: parseDate(item.lastActive),
        };
    }

    // ==========================================
    // SETTINGS
    // ==========================================

    async getSettings(): Promise<any[]> {
        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.SETTINGS,
        }));
        return result.Items || [];
    }

    async getSetting(key: string): Promise<any | undefined> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.SETTINGS,
            Key: { key },
        }));
        return result.Item;
    }

    async setSetting(key: string, value: any, category: string = 'general'): Promise<void> {
        await docClient.send(new PutCommand({
            TableName: TABLES.SETTINGS,
            Item: {
                key,
                value: typeof value === 'object' ? JSON.stringify(value) : value,
                category,
                updatedAt: nowISO(),
            },
        }));
    }

    async deleteSetting(key: string): Promise<void> {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.SETTINGS,
            Key: { key },
        }));
    }

    // ==========================================
    // AUDIT LOGS
    // ==========================================

    async createAuditLog(data: {
        franchiseId?: string;
        employeeId: string;
        employeeUsername: string;
        action: string;
        entityType?: string;
        entityId?: string;
        details?: any;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void> {
        await docClient.send(new PutCommand({
            TableName: TABLES.AUDIT_LOGS,
            Item: {
                id: uuidv4(),
                ...data,
                details: typeof data.details === 'object' ? JSON.stringify(data.details) : data.details,
                createdAt: nowISO(),
            },
        }));
    }

    async getAuditLogs(filters?: {
        franchiseId?: string;
        employeeId?: string;
        action?: string;
        limit?: number;
    }): Promise<any[]> {
        if (filters?.franchiseId) {
            const result = await docClient.send(new QueryCommand({
                TableName: TABLES.AUDIT_LOGS,
                IndexName: 'franchiseId-index',
                KeyConditionExpression: 'franchiseId = :fid',
                ExpressionAttributeValues: { ':fid': filters.franchiseId },
                Limit: filters.limit || 100,
                ScanIndexForward: false, // Most recent first
            }));
            return result.Items || [];
        }

        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.AUDIT_LOGS,
            Limit: filters?.limit || 100,
        }));
        return result.Items || [];
    }

    // ==========================================
    // DOCUMENTS
    // ==========================================

    async getDocuments(franchiseId?: string): Promise<Document[]> {
        if (franchiseId) {
            const result = await docClient.send(new QueryCommand({
                TableName: TABLES.DOCUMENTS,
                IndexName: 'franchiseId-index',
                KeyConditionExpression: 'franchiseId = :fid',
                ExpressionAttributeValues: { ':fid': franchiseId },
            }));
            return (result.Items || []).map(this.mapDocument);
        }

        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.DOCUMENTS,
        }));
        return (result.Items || []).map(this.mapDocument);
    }

    async getDocument(id: string): Promise<Document | undefined> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.DOCUMENTS,
            Key: { id },
        }));
        return result.Item ? this.mapDocument(result.Item) : undefined;
    }

    async createDocument(data: InsertDocument): Promise<Document> {
        const now = nowISO();
        const doc: any = {
            id: uuidv4(),
            ...data,
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.DOCUMENTS,
            Item: doc,
        }));

        return this.mapDocument(doc);
    }

    async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document> {
        const existing = await this.getDocument(id);
        if (!existing) throw new Error('Document not found');

        const updated = { ...existing, ...data, updatedAt: nowISO() };
        await docClient.send(new PutCommand({
            TableName: TABLES.DOCUMENTS,
            Item: updated,
        }));

        return this.mapDocument(updated);
    }

    async deleteDocument(id: string): Promise<void> {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.DOCUMENTS,
            Key: { id },
        }));
    }

    private mapDocument(item: any): Document {
        return {
            ...item,
            metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata,
            createdAt: parseDate(item.createdAt),
            updatedAt: parseDate(item.updatedAt),
        };
    }

    // ==========================================
    // DELIVERIES
    // ==========================================

    async getDeliveries(): Promise<Delivery[]> {
        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.DELIVERIES,
        }));
        return (result.Items || []).map(this.mapDelivery);
    }

    async getDeliveriesByOrder(orderId: string): Promise<Delivery[]> {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLES.DELIVERIES,
            IndexName: 'orderId-index',
            KeyConditionExpression: 'orderId = :oid',
            ExpressionAttributeValues: { ':oid': orderId },
        }));
        return (result.Items || []).map(this.mapDelivery);
    }

    async createDelivery(data: InsertDelivery): Promise<Delivery> {
        const now = nowISO();
        const delivery: any = {
            id: uuidv4(),
            ...data,
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.DELIVERIES,
            Item: delivery,
        }));

        return this.mapDelivery(delivery);
    }

    async updateDelivery(id: string, data: Partial<InsertDelivery>): Promise<Delivery> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.DELIVERIES,
            Key: { id },
        }));

        if (!result.Item) throw new Error('Delivery not found');

        const updated = { ...result.Item, ...data, updatedAt: nowISO() };
        await docClient.send(new PutCommand({
            TableName: TABLES.DELIVERIES,
            Item: updated,
        }));

        return this.mapDelivery(updated);
    }

    private mapDelivery(item: any): Delivery {
        return {
            ...item,
            location: typeof item.location === 'string' ? JSON.parse(item.location) : item.location,
            route: typeof item.route === 'string' ? JSON.parse(item.route) : item.route,
            createdAt: parseDate(item.createdAt),
            updatedAt: parseDate(item.updatedAt),
        };
    }

    // ==========================================
    // SEED DATA
    // ==========================================

    async seedDefaultData(): Promise<void> {
        console.log('🌱 Seeding default data to DynamoDB...');

        // Check if already seeded
        const existingAdmin = await this.getEmployeeByEmail('myfabclean');
        if (existingAdmin) {
            console.log('✅ Data already seeded');
            return;
        }

        const now = nowISO();

        // Seed franchises
        const franchises = [
            {
                id: 'franchise-pollachi',
                name: 'Fab Clean Pollachi',
                franchiseId: 'FAB-POLLACHI',
                ownerName: 'Manager Pollachi',
                email: 'pollachi@fabzclean.com',
                phone: '9363059595',
                address: JSON.stringify({
                    street: '#16, Venkatramana Round Road, Opp: Naturals/HDFC Bank, Mahalingapuram',
                    city: 'Pollachi',
                    state: 'Tamil Nadu',
                    zip: '642002'
                }),
                status: 'active',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: 'franchise-kinathukadavu',
                name: 'Fab Clean Kinathukadavu',
                franchiseId: 'FAB-KIN',
                ownerName: 'Manager Kinathukadavu',
                email: 'kinathukadavu@fabzclean.com',
                phone: '9363719595',
                address: JSON.stringify({
                    street: '#442/11, Opp MlA Office, Krishnasamypuram',
                    city: 'Kinathukadavu',
                    state: 'Tamil Nadu',
                    zip: '642109'
                }),
                status: 'active',
                createdAt: now,
                updatedAt: now,
            }
        ];

        for (const f of franchises) {
            await docClient.send(new PutCommand({
                TableName: TABLES.FRANCHISES,
                Item: f,
            }));
            console.log(`  ✓ Created franchise: ${f.name}`);
        }

        // Seed employees
        const adminPasswordHash = await bcrypt.hash('Durai@2025', 10);
        const defaultPasswordHash = await bcrypt.hash('password123', 10);

        const employees = [
            {
                id: 'admin-user-id',
                franchiseId: null, // Admin sees all
                employeeId: 'myfabclean',
                firstName: 'System',
                lastName: 'Admin',
                email: 'admin@myfabclean.com',
                phone: '9999999999',
                position: 'Administrator',
                department: 'Management',
                salary: '100000.00',
                role: 'admin',
                password: adminPasswordHash,
                status: 'active',
                hireDate: now,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                franchiseId: 'franchise-pollachi',
                employeeId: 'mgr-pollachi',
                firstName: 'Senthil',
                lastName: 'Kumar',
                email: 'manager.pollachi@fabzclean.com',
                phone: '9876543210',
                position: 'Store Manager',
                department: 'Operations',
                salary: '25000.00',
                role: 'franchise_manager',
                password: defaultPasswordHash,
                status: 'active',
                hireDate: now,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                franchiseId: 'franchise-kinathukadavu',
                employeeId: 'mgr-kin',
                firstName: 'Rajesh',
                lastName: 'Kannan',
                email: 'manager.kin@fabzclean.com',
                phone: '9876543220',
                position: 'Store Manager',
                department: 'Operations',
                salary: '25000.00',
                role: 'franchise_manager',
                password: defaultPasswordHash,
                status: 'active',
                hireDate: now,
                createdAt: now,
                updatedAt: now,
            },
        ];

        for (const e of employees) {
            await docClient.send(new PutCommand({
                TableName: TABLES.EMPLOYEES,
                Item: e,
            }));
            console.log(`  ✓ Created employee: ${e.firstName} ${e.lastName} (${e.role})`);
        }

        // Seed services for each franchise
        const servicesList = [
            { name: 'Shirt', category: 'Ironing', price: '20.00', duration: '24 hours' },
            { name: 'T-Shirt', category: 'Ironing', price: '20.00', duration: '24 hours' },
            { name: 'Pant', category: 'Ironing', price: '20.00', duration: '24 hours' },
            { name: 'Shirt', category: 'Laundry', price: '30.00', duration: '48 hours' },
            { name: 'T-Shirt', category: 'Laundry', price: '30.00', duration: '48 hours' },
            { name: 'Pant', category: 'Laundry', price: '30.00', duration: '48 hours' },
            { name: 'Shirt', category: 'Dry Cleaning', price: '60.00', duration: '72 hours' },
            { name: 'Pant', category: 'Dry Cleaning', price: '70.00', duration: '72 hours' },
            { name: 'Coat', category: 'Dry Cleaning', price: '200.00', duration: '72 hours' },
        ];

        for (const fid of ['franchise-pollachi', 'franchise-kinathukadavu']) {
            for (const svc of servicesList) {
                await docClient.send(new PutCommand({
                    TableName: TABLES.SERVICES,
                    Item: {
                        id: uuidv4(),
                        franchiseId: fid,
                        name: svc.name,
                        category: svc.category,
                        description: `${svc.category} for ${svc.name}`,
                        price: svc.price,
                        duration: svc.duration,
                        status: 'Active',
                        createdAt: now,
                        updatedAt: now,
                    },
                }));
            }
        }
        console.log(`  ✓ Created ${servicesList.length * 2} services`);

        // Seed default settings
        const settings = [
            { key: 'company_name', value: 'FabZ Clean', category: 'general' },
            { key: 'company_phone', value: '9363059595', category: 'general' },
            { key: 'company_email', value: 'info@fabzclean.com', category: 'general' },
            { key: 'gst_enabled', value: 'true', category: 'billing' },
            { key: 'gst_rate', value: '18', category: 'billing' },
            { key: 'currency', value: 'INR', category: 'billing' },
        ];

        for (const s of settings) {
            await docClient.send(new PutCommand({
                TableName: TABLES.SETTINGS,
                Item: { ...s, updatedAt: now },
            }));
        }
        console.log(`  ✓ Created ${settings.length} settings`);

        console.log('');
        console.log('🔐 LOGIN CREDENTIALS:');
        console.log('   Admin: myfabclean / Durai@2025');
        console.log('   Pollachi Manager: mgr-pollachi / password123');
        console.log('   Kinathukadavu Manager: mgr-kin / password123');
        console.log('');
        console.log('✅ DynamoDB seeding complete!');
    }
}

export const dynamoStorage = new DynamoDBStorage();
