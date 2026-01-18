import { supabase, isSupabaseConfigured } from './supabase';

export { supabase, isSupabaseConfigured };

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

export const SupabaseAuthService = {
    async login(username: string, password: string): Promise<{ token: string; employee: AuthEmployee }> {
        throw new Error('Supabase auth is disabled. Please use the Local Backend API.');
    },

    async verifySession(token: string): Promise<AuthEmployee | null> {
        return null;
    },

    logout(): void {
        console.log('Supabase auth logout called (no-op)');
    },
};

export default SupabaseAuthService;
