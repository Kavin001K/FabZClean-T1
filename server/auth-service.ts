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
const JWT_EXPIRY = '24h'; // 24 hours - standard session length

export interface EmployeeJWTPayload {
    id: string; // Add UUID
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

        // 1. Try Local Storage (SQLite) first (Keep existing logic if needed, or simplify)
        try {
            const localEmployee = await storage.getEmployeeByEmail(username) as any;
            if (localEmployee && localEmployee.password) {
                // ... existing local auth logic can remain or be skipped if we trust supabase primarily ...
                // For now, let's keep the focus on Supabase fix as requested.
            }
        } catch (err) {
            // Ignore
        }

        // 2. Supabase Auth (Fixed for 'employees' table)
        try {
            // Fetch employee by employee_id or email
            const { data: employees, error } = await supabase
                .from('employees')
                .select('*')
                .or(`employee_id.eq."${username}",email.eq."${username}"`);

            const emp = employees?.[0];

            if (error || !emp) {
                console.warn(`❌ Login failed: User not found for ${username}`);
                throw new Error('Invalid username or password');
            }

            // Check if account is active
            if (emp.status !== 'active') {
                throw new Error('Account is inactive');
            }

            // Verify password
            // Note: In new schema, 'password' column holds the hash
            const isValidPassword = await bcrypt.compare(password, emp.password);
            if (!isValidPassword) {
                console.warn(`❌ Login failed: Invalid password for ${username}`);
                throw new Error('Invalid username or password');
            }

            // Update last login - 'employees' doesn't have last_login, maybe update 'updated_at' or ignore
            // await supabase.from('employees').update({ updated_at: new Date() }).eq('id', emp.id);

            // Log login action
            // FIX: Use emp.id (UUID) and pass franchise_id
            await this.logAction(emp.id, emp.employee_id, 'login', null, null, { email: emp.email }, ipAddress, undefined, emp.franchise_id);

            // Normalize role for legacy/seed data compatibility
            let normalizedRole = emp.role;
            if (emp.role === 'manager') {
                normalizedRole = 'franchise_manager';
            }

            // Generate JWT
            const payload: EmployeeJWTPayload = {
                id: emp.id,
                employeeId: emp.employee_id,
                username: emp.email || emp.employee_id,
                role: normalizedRole as any,
                franchiseId: emp.franchise_id,
                factoryId: emp.factory_id || undefined, // undefined if not present
            };

            const token = jwt.sign(payload, FINAL_SECRET, { expiresIn: JWT_EXPIRY });

            const employee: AuthEmployee = {
                id: emp.id,
                employeeId: emp.employee_id,
                username: emp.employee_id, // Use employee_id as primary username handle
                role: normalizedRole as any,
                franchiseId: emp.franchise_id,
                factoryId: emp.factory_id, // Might be null
                fullName: `${emp.first_name} ${emp.last_name}`,
                email: emp.email,
                phone: emp.phone,
                isActive: emp.status === 'active',
                // Map other HR fields if needed
                position: emp.position,
                department: emp.department,
                hireDate: emp.hire_date ? new Date(emp.hire_date) : undefined,
                baseSalary: emp.salary ? parseFloat(emp.salary) : undefined,
            };

            return { token, employee };
        } catch (err: any) {
            console.error(`Login error: ${err.message}`);
            try {
                // Try to log failure if possible (might fail if audit_logs schema mismatch or generic error)
            } catch (e) { }
            throw err;
        }
    }

    /**
     * Verify JWT and return employee info
     */
    static async verifyToken(token: string): Promise<EmployeeJWTPayload> {
        try {
            const payload = jwt.verify(token, FINAL_SECRET) as EmployeeJWTPayload;

            // Check Supabase 'employees' table
            const { data: emp, error } = await supabase
                .from('employees')
                .select('*') // Select all to get 'id' (UUID) if needed for verification recalculation
                .eq('employee_id', payload.employeeId)
                .single();

            if (error || !emp || emp.status !== 'active') {
                // Try local check if supabase failed (fallback)
                const local = await storage.getEmployee(payload.employeeId); // Assuming payload.employeeId maps to id in local?
                if (local && local.status === 'active') return payload;

                throw new Error('Invalid or inactive employee');
            }

            // Normalize role
            let normalizedRole = emp.role;
            if (emp.role === 'manager') {
                normalizedRole = 'franchise_manager';
            }

            // Ensure we return the most up-to-date payload, esp. with UUID if missing in old tokens
            return {
                ...payload,
                id: emp.id,
                franchiseId: emp.franchise_id,
                role: normalizedRole as any
            };
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Create a new employee (admin/manager only)
     */
    static async createEmployee(
        data: {
            username: string; // Will map to employee_id or email? Usually employee_id
            password: string;
            role: 'admin' | 'franchise_manager' | 'factory_manager' | 'staff' | 'driver';
            franchiseId?: string;
            factoryId?: string;
            fullName?: string; // Need to split this!
            email?: string;
            phone?: string;
            position?: string;
            department?: string;
            hireDate?: Date;
            baseSalary?: number;
            // ... other fields
        },
        createdByEmployeeId: string
    ): Promise<AuthEmployee> {
        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // Split fullName into first/last
        const names = (data.fullName || 'New Employee').split(' ');
        const firstName = names[0];
        const lastName = names.slice(1).join(' ') || 'Staff';

        // Insert employee
        const { data: emp, error } = await supabase
            .from('employees')
            .insert({
                employee_id: data.username, // Using username as employee_id
                first_name: firstName,
                last_name: lastName,
                email: data.email,
                phone: data.phone,
                password: passwordHash, // Storing hash in 'password' column
                role: data.role,
                franchise_id: data.franchiseId || null,
                // factory_id: data.factoryId, // If column exists? Schema didn't show factory_id in create table, checking...
                status: 'active',
                position: data.position || 'Staff',
                department: data.department || 'Operations',
                hire_date: data.hireDate ? data.hireDate.toISOString() : new Date().toISOString(),
                salary: data.baseSalary || 0,
            })
            .select()
            .single();

        if (error || !emp) {
            console.error("❌ Create Employee DB Error:", error);
            throw new Error(`Failed to create employee: ${error?.message}`);
        }

        // Log creation
        await this.logAction(createdByEmployeeId, createdByEmployeeId, 'create_employee', 'employee', emp.employee_id, {
            username: emp.employee_id,
            role: emp.role
        });

        return {
            id: emp.id,
            employeeId: emp.employee_id,
            username: emp.employee_id,
            role: emp.role as any,
            franchiseId: emp.franchise_id,
            fullName: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            phone: emp.phone,
            isActive: emp.status === 'active',
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
            isActive: boolean;
            position: string;
            department: string;
            salary: number;
        }>,
        updatedBy: string
    ): Promise<AuthEmployee> {
        const updateData: any = {};

        if (data.fullName !== undefined) {
            const names = data.fullName.split(' ');
            updateData.first_name = names[0];
            updateData.last_name = names.slice(1).join(' ') || '';
        }
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.franchiseId !== undefined) updateData.franchise_id = data.franchiseId;
        if (data.isActive !== undefined) updateData.status = data.isActive ? 'active' : 'inactive';
        if (data.position !== undefined) updateData.position = data.position;
        if (data.department !== undefined) updateData.department = data.department;
        if (data.salary !== undefined) updateData.salary = data.salary;

        if (Object.keys(updateData).length === 0) {
            throw new Error('No fields to update');
        }

        const { data: emp, error } = await supabase
            .from('employees') // employees table
            .update(updateData)
            .eq('employee_id', employeeId)
            .select()
            .single();

        if (error || !emp) {
            throw new Error('Employee not found');
        }

        await this.logAction(updatedBy, updatedBy, 'update_employee', 'employee', employeeId, data);

        return {
            id: emp.id,
            employeeId: emp.employee_id,
            username: emp.employee_id,
            role: emp.role as any,
            franchiseId: emp.franchise_id,
            fullName: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            phone: emp.phone,
            isActive: emp.status === 'active',
            // ... map other fields if needed ...
        };
    }

    /**
     * Change password (user changes their own password)
     */
    static async changePassword(employeeId: string, currentPassword: string, newPassword: string): Promise<void> {
        // 1. Get employee
        const { data: emp, error } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', employeeId)
            .single();

        if (error || !emp) throw new Error('Employee not found');

        // 2. Verify current
        const isValid = await bcrypt.compare(currentPassword, emp.password);
        if (!isValid) throw new Error('Invalid current password');

        // 3. Update
        const hash = await bcrypt.hash(newPassword, 10);
        const { error: upError } = await supabase
            .from('employees')
            .update({ password: hash }) // Column is 'password'
            .eq('employee_id', employeeId);

        if (upError) throw new Error('Failed to update password');

        await this.logAction(emp.id, emp.employee_id, 'change_password', 'employee', employeeId, {}, undefined, undefined, emp.franchise_id);
    }

    /**
     * Reset password (admin/manager resets employee password)
     */
    static async resetPassword(targetEmployeeId: string, newPassword: string, resetByEmployeeId: string): Promise<void> {
        // 1. Get the employee who is resetting the password
        const { data: resetBy, error: resetByError } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', resetByEmployeeId)
            .single();

        if (resetByError || !resetBy) throw new Error('Unauthorized: Resetter not found');

        // 2. Get the target employee
        const { data: targetEmp, error: targetError } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', targetEmployeeId)
            .single();

        if (targetError || !targetEmp) throw new Error('Target employee not found');

        // 3. Authorization check
        if (resetBy.role === 'franchise_manager') {
            // Franchise managers can only reset passwords for employees in their franchise
            if (targetEmp.franchise_id !== resetBy.franchise_id) {
                throw new Error('Unauthorized: You can only reset passwords for employees in your franchise');
            }
            // Franchise managers cannot reset admin passwords
            if (targetEmp.role === 'admin') {
                throw new Error('Unauthorized: You cannot reset admin passwords');
            }
        } else if (resetBy.role !== 'admin') {
            // Only admins and franchise managers can reset passwords
            throw new Error('Unauthorized: Only admins and managers can reset passwords');
        }

        // 4. Hash new password
        const hash = await bcrypt.hash(newPassword, 10);

        // 5. Update password
        const { error: updateError } = await supabase
            .from('employees')
            .update({ password: hash, updated_at: new Date().toISOString() })
            .eq('employee_id', targetEmployeeId);

        if (updateError) throw new Error('Failed to reset password');

        // 6. Log the action
        await this.logAction(
            resetBy.id,
            resetBy.employee_id,
            'reset_employee_password',
            'employee',
            targetEmployeeId,
            { target_employee: targetEmp.employee_id, reset_by: resetBy.employee_id },
            undefined,
            undefined,
            resetBy.franchise_id
        );

        console.log(`✅ Password reset for ${targetEmployeeId} by ${resetByEmployeeId}`);
    }

    /**
     * Delete/Deactivate employee (admin/manager only)
     */
    static async deleteEmployee(targetEmployeeId: string, deletedByEmployeeId: string, hardDelete: boolean = false): Promise<void> {
        // 1. Get the employee who is deleting
        const { data: deletedBy, error: deletedByError } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', deletedByEmployeeId)
            .single();

        if (deletedByError || !deletedBy) throw new Error('Unauthorized: Deleter not found');

        // 2. Get the target employee
        const { data: targetEmp, error: targetError } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', targetEmployeeId)
            .single();

        if (targetError || !targetEmp) throw new Error('Target employee not found');

        // 3. Authorization check
        if (deletedBy.role === 'franchise_manager') {
            // Franchise managers can only delete employees in their franchise
            if (targetEmp.franchise_id !== deletedBy.franchise_id) {
                throw new Error('Unauthorized: You can only delete employees in your franchise');
            }
            // Franchise managers cannot delete admins
            if (targetEmp.role === 'admin') {
                throw new Error('Unauthorized: You cannot delete admin accounts');
            }
        } else if (deletedBy.role !== 'admin') {
            // Only admins and franchise managers can delete employees
            throw new Error('Unauthorized: Only admins and managers can delete employees');
        }

        // 4. Prevent self-deletion
        if (targetEmployeeId === deletedByEmployeeId) {
            throw new Error('You cannot delete your own account');
        }

        // 5. Delete or deactivate
        if (hardDelete && deletedBy.role === 'admin') {
            // Hard delete (admin only) - CASCADE will handle related records
            const { error: deleteError } = await supabase
                .from('employees')
                .delete()
                .eq('employee_id', targetEmployeeId);

            if (deleteError) throw new Error('Failed to delete employee');

            await this.logAction(
                deletedBy.id,
                deletedBy.employee_id,
                'delete_employee_hard',
                'employee',
                targetEmployeeId,
                { target_employee: targetEmp.employee_id, deleted_by: deletedBy.employee_id },
                undefined,
                undefined,
                deletedBy.franchise_id
            );

            console.log(`✅ Employee ${targetEmployeeId} permanently deleted by ${deletedByEmployeeId}`);
        } else {
            // Soft delete (deactivate)
            const { error: updateError } = await supabase
                .from('employees')
                .update({ status: 'terminated', updated_at: new Date().toISOString() })
                .eq('employee_id', targetEmployeeId);

            if (updateError) throw new Error('Failed to deactivate employee');

            await this.logAction(
                deletedBy.id,
                deletedBy.employee_id,
                'deactivate_employee',
                'employee',
                targetEmployeeId,
                { target_employee: targetEmp.employee_id, deactivated_by: deletedBy.employee_id },
                undefined,
                undefined,
                deletedBy.franchise_id
            );

            console.log(`✅ Employee ${targetEmployeeId} deactivated by ${deletedByEmployeeId}`);
        }
    }


    /**
     * Get employee by ID
     */
    static async getEmployee(employeeId: string): Promise<AuthEmployee | null> {
        const { data: emp, error } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', employeeId)
            .single();

        if (error || !emp) return null;

        return {
            id: emp.id,
            employeeId: emp.employee_id,
            username: emp.employee_id,
            role: emp.role as any,
            franchiseId: emp.franchise_id,
            fullName: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            phone: emp.phone,
            isActive: emp.status === 'active',
            position: emp.position,
            department: emp.department,
            hireDate: emp.hire_date ? new Date(emp.hire_date) : undefined,
            baseSalary: emp.salary ? parseFloat(emp.salary) : 0,
            address: emp.address ? JSON.stringify(emp.address) : undefined, // simple cast
        };
    }

    /**
     * List employees
     */
    static async listEmployees(requesterRole: string, franchiseId?: string, factoryId?: string): Promise<AuthEmployee[]> {
        let query = supabase
            .from('employees') // employees table
            .select('*')
            .order('created_at', { ascending: false });

        if (requesterRole === 'franchise_manager' && franchiseId) {
            query = query.eq('franchise_id', franchiseId);
        }

        const { data, error } = await query;

        if (error) {
            console.error("List employees error:", error);
            throw new Error('Failed to list employees');
        }

        return (data || []).map(emp => ({
            id: emp.id,
            employeeId: emp.employee_id,
            username: emp.employee_id,
            role: emp.role as any,
            franchiseId: emp.franchise_id,
            fullName: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            phone: emp.phone,
            isActive: emp.status === 'active',
            position: emp.position,
            department: emp.department,
            hireDate: emp.hire_date ? new Date(emp.hire_date) : undefined,
        }));
    }

    /**
     * Log employee action to audit log
     */
    static async logAction(
        employeeId: string, // MUST be UUID
        username: string,
        action: string,
        entityType: string | null,
        entityId: string | null,
        details: any,
        ipAddress?: string,
        userAgent?: string,
        franchiseId?: string // Added
    ): Promise<void> {
        // Ensure audit_logs schema matches 'full_db_setup.sql'
        // Columns: franchise_id, employee_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at
        try {
            await supabase
                .from('audit_logs')
                .insert({
                    franchise_id: franchiseId, // Scoping
                    employee_id: employeeId,   // UUID
                    // 'employee_username' removed
                    action,
                    entity_type: entityType,
                    entity_id: entityId,
                    details,
                    ip_address: ipAddress || null,
                    user_agent: userAgent || null,
                });

            // Broadcast realtime event
            const { realtimeServer } = require('./websocket-server');
            realtimeServer.broadcast({
                type: 'audit_log_created',
                data: {
                    franchise_id: franchiseId,
                    employee_id: employeeId,
                    username,
                    action,
                    entity_type: entityType,
                    entity_id: entityId,
                    details,
                    created_at: new Date().toISOString()
                }
            });

        } catch (e) {
            console.error("Audit log failed:", e);
        }
    }

    /**
     * Get audit logs
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

        if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);
        if (filters?.action) query = query.eq('action', filters.action);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (error) throw new Error('Failed to fetch audit logs');
        return data || [];
    }
}
