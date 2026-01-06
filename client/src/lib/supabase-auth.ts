import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not found. Authentication will not work.');
}

// Create Supabase client
const validSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const validSupabaseKey = supabaseAnonKey || 'placeholder';

export const isSupabaseConfigured = !validSupabaseUrl.includes('placeholder');

export const supabase = createClient(validSupabaseUrl, validSupabaseKey, {
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Employee types
export interface AuthEmployee {
    id: string;
    employeeId: string;
    username: string;
    role: 'admin' | 'franchise_manager' | 'factory_manager' | 'employee' | 'staff' | 'driver' | 'manager';
    franchiseId?: string;
    factoryId?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    position?: string;
    department?: string;
    hireDate?: string;
    baseSalary?: number;
}

// Simple JWT-like token for client-side sessions
interface SessionPayload {
    id: string;
    employeeId: string;
    username: string;
    role: string;
    franchiseId?: string;
    factoryId?: string;
    exp: number;
}

// Generate a simple session token (client-side)
function generateSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
    const data: SessionPayload = {
        ...payload,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    return btoa(JSON.stringify(data));
}

// Parse session token
function parseSessionToken(token: string): SessionPayload | null {
    try {
        const data = JSON.parse(atob(token));
        if (data.exp && data.exp < Date.now()) {
            return null; // Token expired
        }
        return data;
    } catch {
        return null;
    }
}

/**
 * Direct Supabase Authentication Service
 * This bypasses the need for a backend /api/auth endpoint
 */
export const SupabaseAuthService = {
    /**
     * Login with username/email and password
     */
    async login(username: string, password: string): Promise<{ token: string; employee: AuthEmployee }> {
        if (!isSupabaseConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        }

        console.log(`🔐 Attempting direct Supabase login for: ${username}`);

        // Try 'employees' table first
        let employee: any = null;
        let normalizedRole: string;

        const { data: employees, error: empError } = await supabase
            .from('employees')
            .select('*')
            .or(`employee_id.eq."${username}",email.eq."${username}"`);

        if (!empError && employees && employees.length > 0) {
            const emp = employees[0];

            if (emp.status !== 'active') {
                throw new Error('Account is inactive. Please contact your administrator.');
            }

            if (!emp.password) {
                throw new Error('Password not set. Please contact your administrator.');
            }

            // Verify password using bcryptjs (works in browser)
            const isValidPassword = await bcrypt.compare(password, emp.password);
            if (!isValidPassword) {
                throw new Error('Invalid username or password');
            }

            normalizedRole = emp.role === 'manager' ? 'franchise_manager' : emp.role;

            employee = {
                id: emp.id,
                employeeId: emp.employee_id,
                username: emp.employee_id,
                role: normalizedRole,
                franchiseId: emp.franchise_id,
                factoryId: emp.factory_id,
                fullName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                email: emp.email,
                phone: emp.phone,
                isActive: emp.status === 'active',
                position: emp.position,
                department: emp.department,
                hireDate: emp.hire_date,
                baseSalary: emp.salary ? parseFloat(emp.salary) : undefined,
            };
        }

        // If not found in 'employees', try 'auth_employees' table
        if (!employee) {
            const { data: authEmployees, error: authError } = await supabase
                .from('auth_employees')
                .select('*')
                .or(`employee_id.eq."${username}",email.eq."${username}",username.eq."${username}"`);

            if (!authError && authEmployees && authEmployees.length > 0) {
                const authEmp = authEmployees[0];

                if (authEmp.is_active !== true) {
                    throw new Error('Account is inactive. Please contact your administrator.');
                }

                const passwordHash = authEmp.password_hash || authEmp.password;
                if (!passwordHash) {
                    throw new Error('Password not set. Please contact your administrator.');
                }

                const isValidPassword = await bcrypt.compare(password, passwordHash);
                if (!isValidPassword) {
                    throw new Error('Invalid username or password');
                }

                employee = {
                    id: authEmp.id,
                    employeeId: authEmp.employee_id,
                    username: authEmp.username || authEmp.employee_id,
                    role: authEmp.role,
                    franchiseId: authEmp.franchise_id,
                    factoryId: authEmp.factory_id,
                    fullName: authEmp.full_name || authEmp.username,
                    email: authEmp.email,
                    phone: authEmp.phone,
                    isActive: authEmp.is_active === true,
                    position: authEmp.position,
                    department: authEmp.department,
                    hireDate: authEmp.hire_date,
                    baseSalary: authEmp.base_salary ? parseFloat(authEmp.base_salary) : undefined,
                };
            }
        }

        if (!employee) {
            throw new Error('Invalid username or password');
        }

        // Generate session token
        const token = generateSessionToken({
            id: employee.id,
            employeeId: employee.employeeId,
            username: employee.username,
            role: employee.role,
            franchiseId: employee.franchiseId,
            factoryId: employee.factoryId,
        });

        console.log(`✅ Login successful for: ${username}`);
        return { token, employee };
    },

    /**
     * Verify session token and get current employee
     */
    async verifySession(token: string): Promise<AuthEmployee | null> {
        const payload = parseSessionToken(token);
        if (!payload) {
            return null;
        }

        // Fetch fresh employee data from Supabase
        const { data: emp, error } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', payload.employeeId)
            .single();

        if (!error && emp && emp.status === 'active') {
            const normalizedRole = emp.role === 'manager' ? 'franchise_manager' : emp.role;
            return {
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
                hireDate: emp.hire_date,
                baseSalary: emp.salary ? parseFloat(emp.salary) : undefined,
            };
        }

        // Try auth_employees table
        const { data: authEmp, error: authError } = await supabase
            .from('auth_employees')
            .select('*')
            .eq('employee_id', payload.employeeId)
            .single();

        if (!authError && authEmp && authEmp.is_active === true) {
            return {
                id: authEmp.id,
                employeeId: authEmp.employee_id,
                username: authEmp.username || authEmp.employee_id,
                role: authEmp.role as any,
                franchiseId: authEmp.franchise_id,
                factoryId: authEmp.factory_id,
                fullName: authEmp.full_name || authEmp.username,
                email: authEmp.email,
                phone: authEmp.phone,
                isActive: authEmp.is_active === true,
                position: authEmp.position,
                department: authEmp.department,
                hireDate: authEmp.hire_date,
                baseSalary: authEmp.base_salary ? parseFloat(authEmp.base_salary) : undefined,
            };
        }

        return null;
    },

    /**
     * Logout - just for consistency, token is stored client-side
     */
    logout(): void {
        // Nothing to do server-side, token is just deleted client-side
        console.log('🔓 Logged out');
    },
};

export default SupabaseAuthService;
