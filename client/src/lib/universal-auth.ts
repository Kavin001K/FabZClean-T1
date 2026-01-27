/**
 * UNIVERSAL AUTH SERVICE
 * Works in three modes:
 * 1. Offline (IndexedDB) - AWS Amplify static hosting
 * 2. Supabase Direct - Direct connection to Supabase
 * 3. Backend API - Custom backend server
 */

import bcrypt from 'bcryptjs';
import { localDB } from './local-storage-db';

// Get environment configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const apiUrl = import.meta.env.VITE_API_URL || '';

// Determine auth mode
type AuthMode = 'offline' | 'supabase' | 'api';

const getAuthMode = (): AuthMode => {
    // Check for forced offline mode
    if (localStorage.getItem('FORCE_LOCAL_MODE') === 'true') {
        return 'offline';
    }

    // Check for Amplify hosting or no backend config
    const host = window.location.hostname;
    const isAmplify = host.includes('amplifyapp.com') || host.includes('cloudfront.net');
    if (isAmplify) {
        return 'offline';
    }

    // Check for Supabase configuration
    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
        return 'supabase';
    }

    // Check for API URL
    if (apiUrl) {
        return 'api';
    }

    // Default to offline
    return 'offline';
};

// Employee types
export interface AuthEmployee {
    id: string;
    employeeId: string;
    username: string;
    role: 'admin' | 'franchise_manager' | 'factory_manager' | 'employee' | 'staff' | 'driver' | 'manager';
    franchiseId?: string | null;
    factoryId?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    position?: string;
    department?: string;
}

interface SessionPayload {
    id: string;
    employeeId: string;
    username: string;
    role: string;
    franchiseId?: string | null;
    factoryId?: string;
    exp: number;
}

// Token helpers
function generateSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
    const data: SessionPayload = {
        ...payload,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    return btoa(JSON.stringify(data));
}

function parseSessionToken(token: string): SessionPayload | null {
    try {
        const data = JSON.parse(atob(token));
        if (data.exp && data.exp < Date.now()) {
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

// Storage keys
const STORAGE_KEYS = {
    TOKEN: 'fabzclean_auth_token',
    USER: 'fabzclean_auth_user',
};

/**
 * UNIVERSAL AUTH SERVICE
 */
export const UniversalAuthService = {
    mode: getAuthMode(),

    /**
     * Initialize the auth service
     */
    async init() {
}`);

        if (this.mode === 'offline') {
            await localDB.init();
            await localDB.seed();
        }
    },

    /**
     * Login with username/email and password
     */
    async login(username: string, password: string): Promise<{ token: string; employee: AuthEmployee }> {
if (this.mode === 'offline') {
            return this.loginOffline(username, password);
        } else if (this.mode === 'supabase') {
            return this.loginSupabase(username, password);
        } else {
            return this.loginAPI(username, password);
        }
    },

    /**
     * Offline authentication using IndexedDB
     */
    async loginOffline(username: string, password: string): Promise<{ token: string; employee: AuthEmployee }> {
        await localDB.init();

        // Find employee by employeeId or email
        let employee = await localDB.getEmployeeByEmployeeId(username);
        if (!employee) {
            employee = await localDB.getEmployeeByEmail(username);
        }

        if (!employee) {
            throw new Error('Invalid username or password');
        }

        if (employee.status !== 'active') {
            throw new Error('Account is inactive. Please contact your administrator.');
        }

        // Verify password
        if (employee.password) {
            const isValid = await bcrypt.compare(password, employee.password);
            if (!isValid) {
                throw new Error('Invalid username or password');
            }
        }

        const normalizedRole = employee.role === 'manager' ? 'franchise_manager' : employee.role;

        const authEmployee: AuthEmployee = {
            id: employee.id,
            employeeId: employee.employeeId,
            username: employee.employeeId,
            role: normalizedRole as any,
            franchiseId: employee.franchiseId,
            fullName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
            email: employee.email,
            phone: employee.phone,
            isActive: employee.status === 'active',
            position: employee.position,
            department: employee.department,
        };

        const token = generateSessionToken({
            id: authEmployee.id,
            employeeId: authEmployee.employeeId,
            username: authEmployee.username,
            role: authEmployee.role,
            franchiseId: authEmployee.franchiseId,
        });

        // Store session
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authEmployee));
return { token, employee: authEmployee };
    },

    /**
     * Supabase direct authentication
     */
    async loginSupabase(username: string, password: string): Promise<{ token: string; employee: AuthEmployee }> {
        // Import the shared Supabase client to avoid multiple instances
        const { supabase } = await import('./supabase');

        // Try employees table
        const { data: employees, error } = await supabase
            .from('employees')
            .select('*')
            .or(`employee_id.eq."${username}",email.eq."${username}"`);

        if (!error && employees && employees.length > 0) {
            const emp = employees[0];

            if (emp.status !== 'active') {
                throw new Error('Account is inactive');
            }

            if (!emp.password) {
                throw new Error('Password not set');
            }

            const isValid = await bcrypt.compare(password, emp.password);
            if (!isValid) {
                throw new Error('Invalid username or password');
            }

            const normalizedRole = emp.role === 'manager' ? 'franchise_manager' : emp.role;

            const authEmployee: AuthEmployee = {
                id: emp.id,
                employeeId: emp.employee_id,
                username: emp.employee_id,
                role: normalizedRole as any,
                franchiseId: emp.franchise_id,
                factoryId: emp.factory_id,
                fullName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                email: emp.email,
                phone: emp.phone,
                isActive: emp.status === 'active',
                position: emp.position,
                department: emp.department,
            };

            const token = generateSessionToken({
                id: authEmployee.id,
                employeeId: authEmployee.employeeId,
                username: authEmployee.username,
                role: authEmployee.role,
                franchiseId: authEmployee.franchiseId,
                factoryId: authEmployee.factoryId,
            });

            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authEmployee));
return { token, employee: authEmployee };
        }

        throw new Error('Invalid username or password');
    },

    /**
     * Backend API authentication
     */
    async loginAPI(username: string, password: string): Promise<{ token: string; employee: AuthEmployee }> {
        const response = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: username, password }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Login failed' }));
            throw new Error(error.message || 'Invalid credentials');
        }

        const data = await response.json();

        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.employee));
return data;
    },

    /**
     * Get current logged in user
     */
    getCurrentUser(): AuthEmployee | null {
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

        if (!userStr || !token) {
            return null;
        }

        // Verify token is not expired
        const payload = parseSessionToken(token);
        if (!payload) {
            this.logout();
            return null;
        }

        return JSON.parse(userStr);
    },

    /**
     * Get auth token
     */
    getToken(): string | null {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    },

    /**
     * Check if user is logged in
     */
    isAuthenticated(): boolean {
        return this.getCurrentUser() !== null;
    },

    /**
     * Check if user has specific role
     */
    hasRole(roles: string | string[]): boolean {
        const user = this.getCurrentUser();
        if (!user) return false;

        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    },

    /**
     * Check if user has access to franchise
     */
    canAccessFranchise(franchiseId: string): boolean {
        const user = this.getCurrentUser();
        if (!user) return false;

        // Admin can access all
        if (user.role === 'admin') return true;

        // Others can only access their own franchise
        return user.franchiseId === franchiseId;
    },

    /**
     * Get user's franchise filter
     */
    getFranchiseFilter(): string | undefined {
        const user = this.getCurrentUser();
        if (!user) return undefined;

        // Admin sees all
        if (user.role === 'admin') return undefined;

        // Others see only their franchise
        return user.franchiseId || undefined;
    },

    /**
     * Logout
     */
    logout(): void {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
},

    /**
     * Force mode change
     */
    setMode(mode: AuthMode): void {
        if (mode === 'offline') {
            localStorage.setItem('FORCE_LOCAL_MODE', 'true');
        } else {
            localStorage.removeItem('FORCE_LOCAL_MODE');
        }
        window.location.reload();
    },
};

// Auto-initialize
UniversalAuthService.init().catch(console.error);

export default UniversalAuthService;
