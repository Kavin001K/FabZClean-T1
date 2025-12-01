import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

// Use placeholder if not set to avoid crash, but auth will fail if relying on Supabase
const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder'
);

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    // In production, we must have a secure secret
    console.warn("⚠️ JWT_SECRET is not set. Using fallback for now, but this is insecure for production.");
}

if (!process.env.SUPABASE_SERVICE_KEY) {
    console.warn("⚠️ SUPABASE_SERVICE_KEY is not set. Using ANON key. RLS policies may block backend operations.");
}

const FINAL_SECRET = JWT_SECRET || process.env.SESSION_SECRET || 'fabzclean-secret-key-change-in-production';
const JWT_EXPIRY = '30d'; // 30 days - long session for better UX

export interface EmployeeJWTPayload {
    employeeId: string;
    username: string;
    role: 'admin' | 'franchise_manager' | 'factory_manager';
    franchiseId?: string;
    factoryId?: string;
}

export interface AuthEmployee {
    id: string;
    employeeId: string;
    username: string;
    role: 'admin' | 'franchise_manager' | 'factory_manager';
    franchiseId?: string;
    factoryId?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    // HR Fields
    position?: string;
    department?: string;
    hireDate?: Date;
    salaryType?: 'hourly' | 'monthly';
    baseSalary?: number;
    hourlyRate?: number;
    workingHours?: number;
    emergencyContact?: string;
    qualifications?: string;
    notes?: string;
    address?: string;
}

export class AuthService {
    /**
     * Authenticate employee with username and password
     */
    static async login(username: string, password: string, ipAddress?: string): Promise<{ token: string; employee: AuthEmployee }> {
        console.log(`🔐 Attempting login for: ${username}`);

        // 1. Try Local Storage (SQLite) first
        try {
            // Username is likely an email in the local seed data
            // Cast to any because SQLite table structure differs from shared schema (has password/role)
            const localEmployee = await storage.getEmployeeByEmail(username) as any;

            if (localEmployee && localEmployee.password) {
                console.log(`✅ Found user in local storage: ${localEmployee.email}`);

                // Verify password
                const isValidPassword = await bcrypt.compare(password, localEmployee.password);
                if (!isValidPassword) {
                    console.warn(`❌ Invalid password for user: ${username}`);
                    throw new Error('Invalid username or password');
                }

                // Map local employee to AuthEmployee
                // Note: Local employees might not have all fields like franchiseId/factoryId in the simple schema
                const role = (localEmployee.role || 'admin').toLowerCase().replace(' ', '_') as any;

                const authEmployee: AuthEmployee = {
                    id: localEmployee.id,
                    employeeId: localEmployee.id, // Use ID as employeeId for local
                    username: localEmployee.email || username,
                    role: role,
                    fullName: localEmployee.name || `${localEmployee.firstName} ${localEmployee.lastName}`,
                    email: localEmployee.email || undefined,
                    isActive: true, // Assume active for local
                };

                // Generate JWT
                const payload: EmployeeJWTPayload = {
                    employeeId: authEmployee.employeeId,
                    username: authEmployee.username,
                    role: authEmployee.role,
                };

                const token = jwt.sign(payload, FINAL_SECRET, { expiresIn: JWT_EXPIRY });

                return { token, employee: authEmployee };
            }
        } catch (err) {
            console.warn(`⚠️ Local auth failed or user not found: ${err}`);
            // Continue to Supabase auth if local fails
        }

        // 2. Fallback to Supabase Auth (Original Logic)
        try {
            // Fetch employee by username or email
            const { data: employees, error } = await supabase
                .from('auth_employees')
                .select('*')
                .or(`username.eq."${username}",email.eq."${username}"`);

            const emp = employees?.[0];

            if (error || !emp) {
                throw new Error('Invalid username or password');
            }

            // Check if account is active
            if (!emp.is_active) {
                throw new Error('Account is inactive');
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, emp.password_hash);
            if (!isValidPassword) {
                throw new Error('Invalid username or password');
            }

            // Update last login
            await supabase
                .from('auth_employees')
                .update({ last_login: new Date().toISOString() })
                .eq('id', emp.id);

            // Log login action
            await this.logAction(emp.employee_id, emp.username, 'login', null, null, {}, ipAddress);

            // Generate JWT
            const payload: EmployeeJWTPayload = {
                employeeId: emp.employee_id,
                username: emp.username,
                role: emp.role,
                franchiseId: emp.franchise_id,
                factoryId: emp.factory_id,
            };

            const token = jwt.sign(payload, FINAL_SECRET, { expiresIn: JWT_EXPIRY });

            const employee: AuthEmployee = {
                id: emp.id,
                employeeId: emp.employee_id,
                username: emp.username,
                role: emp.role,
                franchiseId: emp.franchise_id,
                factoryId: emp.factory_id,
                fullName: emp.full_name,
                email: emp.email,
                phone: emp.phone,
                isActive: emp.is_active,
            };

            return { token, employee };
        } catch (err: any) {
            // Log failed login attempts
            try {
                await this.logAction(
                    'system',
                    username,
                    'login_failed',
                    'auth',
                    null,
                    { error: err.message, ip: ipAddress },
                    ipAddress
                );
            } catch (logError) {
                // Ignore logging errors to prevent crash
            }
            throw err;
        }
    }

    /**
     * Verify JWT and return employee info
     */
    static async verifyToken(token: string): Promise<EmployeeJWTPayload> {
        try {
            const payload = jwt.verify(token, FINAL_SECRET) as EmployeeJWTPayload;

            // 1. Check Local Storage first
            try {
                // If the ID looks like a UUID (local), check local storage
                const localEmployee = await storage.getEmployee(payload.employeeId); // payload.employeeId is mapped to id for local
                if (localEmployee) {
                    return payload;
                }
            } catch (e) {
                // Ignore local check error
            }

            // 2. Check Supabase
            const { data: emp, error } = await supabase
                .from('auth_employees')
                .select('is_active')
                .eq('employee_id', payload.employeeId)
                .single();

            if (error || !emp || !emp.is_active) {
                // If not found in Supabase AND not found in local (checked above), then invalid
                // But if we are running locally with placeholder Supabase, Supabase check will fail.
                // So if we are here, it means it wasn't found locally either.
                throw new Error('Invalid or inactive employee');
            }

            return payload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Create a new employee (admin/manager only)
     */
    static async createEmployee(
        data: {
            username: string;
            password: string;
            role: 'admin' | 'franchise_manager' | 'factory_manager';
            franchiseId?: string;
            factoryId?: string;
            fullName?: string;
            email?: string;
            phone?: string;
            // HR Fields
            position?: string;
            department?: string;
            hireDate?: Date;
            salaryType?: 'hourly' | 'monthly';
            baseSalary?: number;
            hourlyRate?: number;
            workingHours?: number;
            emergencyContact?: string;
            qualifications?: string;
            notes?: string;
            address?: string;
        },
        createdByEmployeeId: string
    ): Promise<AuthEmployee> {
        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // Get creator's ID
        const { data: creator } = await supabase
            .from('auth_employees')
            .select('id')
            .eq('employee_id', createdByEmployeeId)
            .single();

        // Insert employee (employee_id will be auto-generated by trigger)
        const { data: emp, error } = await supabase
            .from('auth_employees')
            .insert({
                username: data.username,
                password_hash: passwordHash,
                role: data.role,
                franchise_id: data.franchiseId || null,
                factory_id: data.factoryId || null,
                full_name: data.fullName || null,
                email: data.email || null,
                phone: data.phone || null,
                // created_by: creator?.id || null, // Removed to fix schema cache error
                // HR Fields
                position: data.position || null,
                department: data.department || null,
                hire_date: data.hireDate ? data.hireDate.toISOString() : null,
                salary_type: data.salaryType || null,
                base_salary: data.baseSalary || null,
                hourly_rate: data.hourlyRate || null,
                working_hours: data.workingHours || 8,
                emergency_contact: data.emergencyContact || null,
                qualifications: data.qualifications || null,
                notes: data.notes || null,
                address: data.address || null,
            })
            .select('id, employee_id, username, role, franchise_id, factory_id, full_name, email, phone, is_active, position, department, hire_date, salary_type, base_salary, hourly_rate, working_hours, emergency_contact, qualifications, notes, address')
            .single();

        if (error || !emp) {
            console.error("❌ Create Employee DB Error:", error);
            throw new Error(`Failed to create employee: ${error?.message}`);
        }

        // Log creation
        await this.logAction(createdByEmployeeId, createdByEmployeeId, 'create_employee', 'employee', emp.employee_id, {
            username: emp.username,
            role: emp.role
        });

        return {
            id: emp.id,
            employeeId: emp.employee_id,
            username: emp.username,
            role: emp.role,
            franchiseId: emp.franchise_id,
            factoryId: emp.factory_id,
            fullName: emp.full_name,
            email: emp.email,
            phone: emp.phone,
            isActive: emp.is_active,
            position: emp.position,
            department: emp.department,
            hireDate: emp.hire_date ? new Date(emp.hire_date) : undefined,
            salaryType: emp.salary_type,
            baseSalary: emp.base_salary,
            hourlyRate: emp.hourly_rate,
            workingHours: emp.working_hours,
            emergencyContact: emp.emergency_contact,
            qualifications: emp.qualifications,
            notes: emp.notes,
            address: emp.address,
        };
    }

    /**
     * Update employee
     */
    static async updateEmployee(
        employeeId: string,
        data: Partial<{
            fullName: string;
            email: string;
            phone: string;
            franchiseId: string;
            factoryId: string;
            isActive: boolean;
            // HR Fields
            position: string;
            department: string;
            hireDate: Date;
            salaryType: 'hourly' | 'monthly';
            baseSalary: number;
            hourlyRate: number;
            workingHours: number;
            emergencyContact: string;
            qualifications: string;
            notes: string;
            address: string;
        }>,
        updatedBy: string
    ): Promise<AuthEmployee> {
        const updateData: any = {};

        if (data.fullName !== undefined) updateData.full_name = data.fullName;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.franchiseId !== undefined) updateData.franchise_id = data.franchiseId;
        if (data.factoryId !== undefined) updateData.factory_id = data.factoryId;
        if (data.factoryId !== undefined) updateData.factory_id = data.factoryId;
        if (data.isActive !== undefined) updateData.is_active = data.isActive;
        // HR Fields
        if (data.position !== undefined) updateData.position = data.position;
        if (data.department !== undefined) updateData.department = data.department;
        if (data.hireDate !== undefined) updateData.hire_date = data.hireDate.toISOString();
        if (data.salaryType !== undefined) updateData.salary_type = data.salaryType;
        if (data.baseSalary !== undefined) updateData.base_salary = data.baseSalary;
        if (data.hourlyRate !== undefined) updateData.hourly_rate = data.hourlyRate;
        if (data.workingHours !== undefined) updateData.working_hours = data.workingHours;
        if (data.emergencyContact !== undefined) updateData.emergency_contact = data.emergencyContact;
        if (data.qualifications !== undefined) updateData.qualifications = data.qualifications;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.address !== undefined) updateData.address = data.address;

        if (Object.keys(updateData).length === 0) {
            throw new Error('No fields to update');
        }

        const { data: emp, error } = await supabase
            .from('auth_employees')
            .update(updateData)
            .eq('employee_id', employeeId)
            .select()
            .single();

        if (error || !emp) {
            throw new Error('Employee not found');
        }

        // Log update
        await this.logAction(updatedBy, updatedBy, 'update_employee', 'employee', employeeId, data);

        return {
            id: emp.id,
            employeeId: emp.employee_id,
            username: emp.username,
            role: emp.role,
            franchiseId: emp.franchise_id,
            factoryId: emp.factory_id,
            fullName: emp.full_name,
            email: emp.email,
            phone: emp.phone,
            isActive: emp.is_active,
            position: emp.position,
            department: emp.department,
            hireDate: emp.hire_date ? new Date(emp.hire_date) : undefined,
            salaryType: emp.salary_type,
            baseSalary: emp.base_salary,
            hourlyRate: emp.hourly_rate,
            workingHours: emp.working_hours,
            emergencyContact: emp.emergency_contact,
            qualifications: emp.qualifications,
            notes: emp.notes,
            address: emp.address,
        };
    }

    /**
     * Change password (for users changing their own password)
     */
    static async changePassword(employeeId: string, currentPassword: string, newPassword: string): Promise<void> {
        // 1. Get employee to verify current password
        const { data: emp, error } = await supabase
            .from('auth_employees')
            .select('*')
            .eq('employee_id', employeeId)
            .single();

        if (error || !emp) {
            throw new Error('Employee not found');
        }

        // 2. Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, emp.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid current password');
        }

        // 3. Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // 4. Update password
        const { error: updateError } = await supabase
            .from('auth_employees')
            .update({ password_hash: passwordHash })
            .eq('employee_id', employeeId);

        if (updateError) {
            throw new Error('Failed to update password');
        }

        // Log password change
        await this.logAction(employeeId, emp.username, 'change_password', 'employee', employeeId, {});
    }

    /**
     * Reset employee password (admin only)
     */
    static async resetPassword(employeeId: string, newPassword: string, resetBy: string): Promise<void> {
        const passwordHash = await bcrypt.hash(newPassword, 10);

        const { error } = await supabase
            .from('auth_employees')
            .update({ password_hash: passwordHash })
            .eq('employee_id', employeeId);

        if (error) {
            throw new Error('Failed to reset password');
        }

        // Log password reset
        await this.logAction(resetBy, resetBy, 'reset_password', 'employee', employeeId, {});
    }

    /**
     * Get employee by ID
     */
    static async getEmployee(employeeId: string): Promise<AuthEmployee | null> {
        const { data: emp, error } = await supabase
            .from('auth_employees')
            .select('*')
            .eq('employee_id', employeeId)
            .single();

        if (error || !emp) {
            return null;
        }

        return {
            id: emp.id,
            employeeId: emp.employee_id,
            username: emp.username,
            role: emp.role,
            franchiseId: emp.franchise_id,
            factoryId: emp.factory_id,
            fullName: emp.full_name,
            email: emp.email,
            phone: emp.phone,
            isActive: emp.is_active,
            position: emp.position,
            department: emp.department,
            hireDate: emp.hire_date ? new Date(emp.hire_date) : undefined,
            salaryType: emp.salary_type,
            baseSalary: emp.base_salary,
            hourlyRate: emp.hourly_rate,
            workingHours: emp.working_hours,
            emergencyContact: emp.emergency_contact,
            qualifications: emp.qualifications,
            notes: emp.notes,
            address: emp.address,
        };
    }

    /**
     * List employees (filtered by requester's role)
     */
    static async listEmployees(requesterRole: string, franchiseId?: string, factoryId?: string): Promise<AuthEmployee[]> {
        let query = supabase
            .from('auth_employees')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter by scope
        if (requesterRole === 'franchise_manager' && franchiseId) {
            query = query.eq('franchise_id', franchiseId);
        } else if (requesterRole === 'factory_manager' && factoryId) {
            query = query.eq('factory_id', factoryId);
        }
        // Admin sees all

        const { data, error } = await query;

        if (error) {
            throw new Error('Failed to list employees');
        }

        return (data || []).map(emp => ({
            id: emp.id,
            employeeId: emp.employee_id,
            username: emp.username,
            role: emp.role,
            franchiseId: emp.franchise_id,
            factoryId: emp.factory_id,
            fullName: emp.full_name,
            email: emp.email,
            phone: emp.phone,
            isActive: emp.is_active,
            position: emp.position,
            department: emp.department,
            hireDate: emp.hire_date ? new Date(emp.hire_date) : undefined,
            salaryType: emp.salary_type,
            baseSalary: emp.base_salary,
            hourlyRate: emp.hourly_rate,
            workingHours: emp.working_hours,
            emergencyContact: emp.emergency_contact,
            qualifications: emp.qualifications,
            notes: emp.notes,
            address: emp.address,
        }));
    }

    /**
     * Log employee action to audit log
     */
    static async logAction(
        employeeId: string,
        username: string,
        action: string,
        entityType: string | null,
        entityId: string | null,
        details: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await supabase
            .from('audit_logs')
            .insert({
                employee_id: employeeId,
                employee_username: username,
                action,
                entity_type: entityType,
                entity_id: entityId,
                details,
                ip_address: ipAddress || null,
                user_agent: userAgent || null,
            });
    }

    /**
     * Get audit logs (admin only)
     */
    static async getAuditLogs(filters?: {
        employeeId?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<any[]> {
        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.employeeId) {
            query = query.eq('employee_id', filters.employeeId);
        }
        if (filters?.action) {
            query = query.eq('action', filters.action);
        }
        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate.toISOString());
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error('Failed to fetch audit logs');
        }

        return data || [];
    }
}
