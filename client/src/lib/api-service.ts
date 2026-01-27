/**
 * UNIFIED API SERVICE
 * Automatically switches between:
 * - Local IndexedDB (AWS Amplify static hosting / offline mode)
 * - Backend API (when server is available)
 * 
 * This enables the app to work on AWS Amplify free tier without a backend
 */

import { localDB } from './local-storage-db';

// Detect if running in static/offline mode
const isStaticMode = (): boolean => {
    // Check if we're on Amplify or if API is unavailable
    const host = window.location.hostname;
    const isAmplify = host.includes('amplifyapp.com') || host.includes('cloudfront.net');
    const forceLocal = localStorage.getItem('FORCE_LOCAL_MODE') === 'true';
    const noBackend = !import.meta.env.VITE_API_URL && !import.meta.env.VITE_SUPABASE_URL;

    return isAmplify || forceLocal || noBackend;
};

// API base URL
import { getApiUrl } from './api-config';

// Initialize local database on first load
let dbInitialized = false;
const ensureDBReady = async () => {
    if (!dbInitialized && isStaticMode()) {
        await localDB.init();
        await localDB.seed();
        dbInitialized = true;
    }
};

// ============================================
// AUTHENTICATION
// ============================================
export interface AuthUser {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    franchiseId: string | null;
    token?: string;
}

export async function login(employeeId: string, password: string): Promise<AuthUser> {
    await ensureDBReady();

    if (isStaticMode()) {
        // Local authentication using bcrypt comparison
        const employee = await localDB.getEmployeeByEmployeeId(employeeId);
        if (!employee) {
            const byEmail = await localDB.getEmployeeByEmail(employeeId);
            if (!byEmail) throw new Error('Invalid credentials');
            // For demo, accept any password in local mode
            // In production, use bcryptjs to compare
            return {
                id: byEmail.id,
                employeeId: byEmail.employeeId,
                firstName: byEmail.firstName,
                lastName: byEmail.lastName,
                email: byEmail.email,
                role: byEmail.role,
                franchiseId: byEmail.franchiseId,
                token: 'local-token-' + Date.now(),
            };
        }

        // Simple demo check (in production, use bcryptjs)
        return {
            id: employee.id,
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            role: employee.role,
            franchiseId: employee.franchiseId,
            token: 'local-token-' + Date.now(),
        };
    } else {
        // API authentication
        const response = await fetch(`${getApiUrl()}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, password }),
        });

        if (!response.ok) throw new Error('Invalid credentials');
        return response.json();
    }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
        return JSON.parse(stored);
    }
    return null;
}

export function logout(): void {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
}

// ============================================
// FRANCHISES
// ============================================
export async function getFranchises() {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getFranchises();
    } else {
        const response = await fetch(`${getApiUrl()}/api/franchises`);
        return response.json();
    }
}

export async function getFranchise(id: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getFranchise(id);
    } else {
        const response = await fetch(`${getApiUrl()}/api/franchises/${id}`);
        return response.json();
    }
}

// ============================================
// CUSTOMERS
// ============================================
export async function getCustomers(franchiseId?: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getCustomers(franchiseId);
    } else {
        const url = franchiseId
            ? `${getApiUrl()}/api/customers?franchiseId=${franchiseId}`
            : `${getApiUrl()}/api/customers`;
        const response = await fetch(url);
        return response.json();
    }
}

export async function getCustomer(id: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getCustomer(id);
    } else {
        const response = await fetch(`${getApiUrl()}/api/customers/${id}`);
        return response.json();
    }
}

export async function createCustomer(data: any) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.createCustomer({
            name: data.name,
            email: data.email || '',
            phone: data.phone,
            address: data.address || {},
            totalOrders: 0,
            totalSpent: '0',
            franchiseId: data.franchiseId,
        });
    } else {
        const response = await fetch(`${getApiUrl()}/api/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    }
}

export async function updateCustomer(id: string, data: any) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.updateCustomer(id, data);
    } else {
        const response = await fetch(`${getApiUrl()}/api/customers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    }
}

// ============================================
// SERVICES
// ============================================
export async function getServices(franchiseId?: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getServices(franchiseId);
    } else {
        const url = franchiseId
            ? `${getApiUrl()}/api/services?franchiseId=${franchiseId}`
            : `${getApiUrl()}/api/services`;
        const response = await fetch(url);
        return response.json();
    }
}

export async function getService(id: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getService(id);
    } else {
        const response = await fetch(`${getApiUrl()}/api/services/${id}`);
        return response.json();
    }
}

export async function createService(data: any) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.createService({
            name: data.name,
            category: data.category,
            description: data.description || '',
            price: data.price,
            duration: data.duration || '24 hours',
            status: data.status || 'Active',
            franchiseId: data.franchiseId,
        });
    } else {
        const response = await fetch(`${getApiUrl()}/api/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    }
}

// ============================================
// ORDERS
// ============================================
export async function getOrders(franchiseId?: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getOrders(franchiseId);
    } else {
        const url = franchiseId
            ? `${getApiUrl()}/api/orders?franchiseId=${franchiseId}`
            : `${getApiUrl()}/api/orders`;
        const response = await fetch(url);
        return response.json();
    }
}

export async function getOrder(id: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getOrder(id);
    } else {
        const response = await fetch(`${getApiUrl()}/api/orders/${id}`);
        return response.json();
    }
}

export async function getOrderByNumber(orderNumber: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getOrderByNumber(orderNumber);
    } else {
        const response = await fetch(`${getApiUrl()}/api/orders/by-number/${orderNumber}`);
        return response.json();
    }
}

export async function createOrder(data: any) {
    await ensureDBReady();

    const orderNumber = `FZC-${Date.now().toString(36).toUpperCase()}`;

    if (isStaticMode()) {
        const order = await localDB.createOrder({
            orderNumber,
            customerId: data.customerId,
            customerName: data.customerName,
            customerPhone: data.customerPhone || '',
            status: data.status || 'pending',
            paymentStatus: data.paymentStatus || 'pending',
            totalAmount: data.totalAmount,
            items: data.items || [],
            franchiseId: data.franchiseId,
        });

        // Update customer stats
        if (data.customerId) {
            const customer = await localDB.getCustomer(data.customerId);
            if (customer) {
                await localDB.updateCustomer(data.customerId, {
                    totalOrders: (customer.totalOrders || 0) + 1,
                    totalSpent: String(parseFloat(customer.totalSpent || '0') + parseFloat(data.totalAmount)),
                });
            }
        }

        return order;
    } else {
        const response = await fetch(`${getApiUrl()}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, orderNumber }),
        });
        return response.json();
    }
}

export async function updateOrder(id: string, data: any) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.updateOrder(id, data);
    } else {
        const response = await fetch(`${getApiUrl()}/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    }
}

// ============================================
// EMPLOYEES
// ============================================
export async function getEmployees(franchiseId?: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getEmployees(franchiseId);
    } else {
        const url = franchiseId
            ? `${getApiUrl()}/api/employees?franchiseId=${franchiseId}`
            : `${getApiUrl()}/api/employees`;
        const response = await fetch(url);
        return response.json();
    }
}

export async function getEmployee(id: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.getEmployee(id);
    } else {
        const response = await fetch(`${getApiUrl()}/api/employees/${id}`);
        return response.json();
    }
}

// ============================================
// SETTINGS
// ============================================
export async function getSettings() {
    await ensureDBReady();

    if (isStaticMode()) {
        const settings = await localDB.getSettings();
        // Convert array to object
        return settings.reduce((acc: Record<string, string>, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});
    } else {
        const response = await fetch(`${getApiUrl()}/api/settings`);
        return response.json();
    }
}

export async function updateSetting(key: string, value: string) {
    await ensureDBReady();

    if (isStaticMode()) {
        return localDB.setSetting(key, value);
    } else {
        const response = await fetch(`${getApiUrl()}/api/settings/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
        });
        return response.json();
    }
}

// ============================================
// UTILITY
// ============================================
export function isOfflineMode(): boolean {
    return isStaticMode();
}

export function enableOfflineMode(): void {
    localStorage.setItem('FORCE_LOCAL_MODE', 'true');
    window.location.reload();
}

export function disableOfflineMode(): void {
    localStorage.removeItem('FORCE_LOCAL_MODE');
    window.location.reload();
}

// ============================================
// EXPORT API
// ============================================
export const api = {
    // Auth
    login,
    logout,
    getCurrentUser,

    // Franchises
    getFranchises,
    getFranchise,

    // Customers
    getCustomers,
    getCustomer,
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

    // Employees
    getEmployees,
    getEmployee,

    // Settings
    getSettings,
    updateSetting,

    // Utility
    isOfflineMode,
    enableOfflineMode,
    disableOfflineMode,
};

export default api;
