import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

// Remove Supabase - we now use local SQLite storage only
// const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
// const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    // In production, we must have a secure secret
    console.warn("⚠️ JWT_SECRET is not set. Using fallback for now, but this is insecure for production.");
}

const FINAL_SECRET = JWT_SECRET || process.env.SESSION_SECRET || 'fabzclean-secret-key-change-in-production';
const JWT_EXPIRY = '24h'; // 24 hours - standard session length

export interface EmployeeJWTPayload {
    id: string; // Add UUID
    employeeId: string;
    username: string;
    email?: string;
    role: 'admin' | 'franchise_manager' | 'factory_manager' | 'employee' | 'staff' | 'driver' | 'manager';
    franchiseId?: string;
    factoryId?: string;
}

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
    // HR Fields
    position?: string;
    department?: string;
    hireDate?: Date;
    salaryType?: 'hourly' | 'monthly' | string;
    baseSalary?: number;
    salary?: number;
    hourlyRate?: number;
    workingHours?: number;
    emergencyContact?: string;
    qualifications?: string;
    notes?: string;
    address?: string;
    status?: 'active' | 'inactive' | 'terminated' | string;
    // Personal info
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    // Banking
    bankName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    panNumber?: string;
    aadharNumber?: string;
}

export class AuthService {
    /**
     * Authenticate employee with username and password
     */
    static async login(username: string, password: string, ipAddress?: string): Promise<{ token: string; employee: AuthEmployee }> {
        console.log(`🔐 Attempting login for: ${username}`);

        // Use Local Storage (SQLite) ONLY - no cloud fallback
        try {
            console.log(`🔍 Searching for user in local DB: ${username}`);
            const localEmployee = await storage.getEmployeeByEmail(username) as any;

            if (!localEmployee) {
                // Log failed attempt
                await (storage as any).logAction(
                    'ANONYMOUS',
                    'login_failed',
                    'auth',
                    username,
                    { reason: 'User not found', ip: ipAddress },
                    ipAddress
                );
                console.log(`❌ User not found: ${username}`);
                throw new Error('Invalid username or password');
            }

            console.log(`🔍 Employee found: ${localEmployee.employeeId || localEmployee.employee_id}, status: ${localEmployee.status}`);

            if (!localEmployee.password) {
                console.log(`❌ No password set for user: ${username}`);
                throw new Error('Account not properly configured');
            }

            const isValidPassword = await bcrypt.compare(password, localEmployee.password);

            if (!isValidPassword) {
                // Log failed attempt
                await (storage as any).logAction(
                    localEmployee.id,
                    'login_failed',
                    'auth',
                    localEmployee.id,
                    { reason: 'Invalid password', ip: ipAddress },
                    ipAddress
                );
                console.log(`❌ Password mismatch for user: ${username}`);
                throw new Error('Invalid username or password');
            }

            if (localEmployee.status === 'inactive' || localEmployee.status === 'terminated') {
                console.log(`❌ User inactive: ${username}, status: ${localEmployee.status}`);
                throw new Error('Account is inactive');
            }

            // Normalize role
            let normalizedRole = localEmployee.role;
            if (normalizedRole === 'manager') normalizedRole = 'franchise_manager';

            const payload: EmployeeJWTPayload = {
                id: localEmployee.id,
                employeeId: localEmployee.employee_id || localEmployee.employeeId,
                username: localEmployee.email || localEmployee.employee_id,
                role: normalizedRole as any,
                franchiseId: localEmployee.franchise_id || localEmployee.franchiseId,
                factoryId: localEmployee.factory_id || localEmployee.factoryId,
            };

            const token = jwt.sign(payload, FINAL_SECRET, { expiresIn: JWT_EXPIRY });

            const employee: AuthEmployee = {
                id: localEmployee.id,
                employeeId: localEmployee.employee_id || localEmployee.employeeId,
                username: localEmployee.employee_id || localEmployee.employeeId,
                role: normalizedRole as any,
                franchiseId: localEmployee.franchise_id || localEmployee.franchiseId,
                factoryId: localEmployee.factory_id || localEmployee.factoryId,
                fullName: `${localEmployee.first_name || ''} ${localEmployee.last_name || ''}`.trim() || localEmployee.fullName || localEmployee.name,
                email: localEmployee.email,
                phone: localEmployee.phone,
                isActive: localEmployee.status === 'active' || !localEmployee.status,
            };

            // Log successful login
            await (storage as any).logAction(
                localEmployee.id,
                'login_success',
                'auth',
                localEmployee.id,
                { email: localEmployee.email, ip: ipAddress },
                ipAddress
            );

            console.log(`✅ Login successful for: ${username}`);
            return { token, employee };

        } catch (err: any) {
            if (err.message === 'Invalid username or password' ||
                err.message === 'Account not properly configured' ||
                err.message === 'Account is inactive') {
                throw err;
            }
            console.error(`❌ Login error:`, err.message);
            throw new Error('Invalid username or password');
        }
    }

    /**
     * Verify JWT and return employee info - uses local SQLite storage only
     */
    static async verifyToken(token: string): Promise<EmployeeJWTPayload> {
        try {
            const payload = jwt.verify(token, FINAL_SECRET) as EmployeeJWTPayload;

            // Use LOCAL storage ONLY
            const lookupId = payload.employeeId || payload.username;
            const local = await storage.getEmployeeByEmail(lookupId);

            if (local && (local.status === 'active' || local.status === null || local.status === undefined)) {
                return {
                    ...payload,
                    id: local.id,
                    employeeId: local.employeeId,
                    username: local.username || local.employeeId,
                    franchiseId: local.franchiseId || (local as any).franchise_id || undefined,
                    factoryId: local.factoryId || (local as any).factory_id || undefined,
                    role: local.role as any
                };
            }

            // If local lookup failed but we have a valid JWT payload with an ID, trust it
            // This handles edge cases during development
            if (payload.id) {
                return payload;
            }

            throw new Error('Invalid or inactive employee');
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Create a new employee (admin/manager only) - local storage only
     */
    static async createEmployee(
        data: {
            username: string;
            password: string;
            role: 'admin' | 'franchise_manager' | 'factory_manager' | 'staff' | 'driver';
            franchiseId?: string;
            factoryId?: string;
            fullName?: string;
            email?: string;
            phone?: string;
            position?: string;
            department?: string;
            hireDate?: Date;
            baseSalary?: number;
            [key: string]: any; // Allow additional fields
        },
        createdByEmployeeId: string
    ): Promise<AuthEmployee> {
        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // Split fullName into first/last
        const names = (data.fullName || 'New Employee').split(' ');
        const firstName = names[0];
        const lastName = names.slice(1).join(' ') || 'Staff';

        // Auto-generate employee_id based on franchise and role
        const roleCodeMap: Record<string, string> = {
            'admin': 'AD',
            'franchise_manager': 'MG',
            'factory_manager': 'FM',
            'staff': 'ST',
            'employee': 'ST',
            'driver': 'DR'
        };
        const roleCode = roleCodeMap[data.role] || 'XX';

        // Count existing employees for sequence
        const localEmployees = await storage.listEmployees();
        const sameRoleCount = localEmployees.filter(e => e.role === data.role).length;
        const sequenceNum = String(sameRoleCount + 1).padStart(2, '0');
        const generatedEmployeeId = `FZC01${roleCode}${sequenceNum}`;

        const newEmployee = await storage.createEmployee({
            // Basic Info
            name: data.fullName || `${firstName} ${lastName}`,
            email: data.email || `${data.username.toLowerCase()}@fabzclean.com`,
            phone: data.phone,
            employeeId: generatedEmployeeId,
            password: passwordHash,
            role: data.role,
            status: 'active',
            firstName: firstName,
            lastName: lastName,
            // Work Details - explicitly convert empty strings to null
            franchiseId: (data.franchiseId && data.franchiseId.trim() !== '') ? data.franchiseId : null,
            factoryId: (data.factoryId && data.factoryId.trim() !== '') ? data.factoryId : null,
            position: data.position,
            department: data.department,
            hireDate: data.hireDate ? data.hireDate.toISOString() : undefined,
            managerId: null,
            // Personal Details
            address: typeof data.address === 'object' ? JSON.stringify(data.address) : data.address,
            emergencyContact: data.emergencyContact,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            bloodGroup: data.bloodGroup,
            // Compensation
            salaryType: data.salaryType || 'monthly',
            salary: data.baseSalary ? String(data.baseSalary) : (data.salary ? String(data.salary) : undefined),
            hourlyRate: data.hourlyRate ? String(data.hourlyRate) : undefined,
            workingHours: data.workingHours ? String(data.workingHours) : '8',
            // Banking & ID
            bankName: data.bankName,
            bankAccountNumber: data.bankAccountNumber,
            bankIfsc: data.bankIfsc,
            panNumber: data.panNumber,
            aadharNumber: data.aadharNumber,
            // Additional
            skills: data.qualifications,
            qualifications: data.qualifications,
            notes: data.notes,
        });

        if (!newEmployee) {
            throw new Error('Failed to create employee');
        }

        // Log creation
        await this.logAction(createdByEmployeeId, createdByEmployeeId, 'employee_create', 'employee', generatedEmployeeId, {
            username: generatedEmployeeId,
            role: data.role
        });

        console.log(`✅ [Auth] Created employee ${generatedEmployeeId}`);
        const emp = newEmployee as any;

        return {
            id: newEmployee.id,
            employeeId: generatedEmployeeId,
            username: generatedEmployeeId,
            role: data.role as any,
            franchiseId: data.franchiseId,
            factoryId: data.factoryId,
            fullName: data.fullName || `${firstName} ${lastName}`,
            email: newEmployee.email,
            phone: newEmployee.phone,
            isActive: true,
            position: newEmployee.position,
            department: newEmployee.department,
            salary: emp.salary ? parseFloat(emp.salary) : 0,
            salaryType: emp.salaryType || 'monthly',
            hourlyRate: emp.hourlyRate ? parseFloat(emp.hourlyRate) : undefined,
            workingHours: emp.workingHours ? parseInt(emp.workingHours) : 8,
            hireDate: emp.hireDate ? new Date(emp.hireDate) : undefined,
            address: emp.address,
            emergencyContact: emp.emergencyContact,
            dateOfBirth: emp.dateOfBirth,
            gender: emp.gender,
            bloodGroup: emp.bloodGroup,
            bankName: emp.bankName,
            bankAccountNumber: emp.bankAccountNumber,
            bankIfsc: emp.bankIfsc,
            panNumber: emp.panNumber,
            aadharNumber: emp.aadharNumber,
            qualifications: emp.qualifications,
            notes: emp.notes,
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
            status: 'active' | 'inactive' | 'terminated';
            position: string;
            department: string;
            salary: number;
            hireDate: Date;
            salaryType: string;
            baseSalary: number;
            hourlyRate: number;
            workingHours: number;
            emergencyContact: string;
            qualifications: string;
            notes: string;
            address: string;
            profileImage: string;
        }>,
        updatedBy: string
    ): Promise<AuthEmployee> {
        const updateData: any = {};

        // Map data to storage format
        if (data.fullName !== undefined) {
            const names = data.fullName.split(' ');
            updateData.firstName = names[0];
            updateData.lastName = names.slice(1).join(' ') || '';
        }
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;
        if (data.franchiseId !== undefined) updateData.franchiseId = data.franchiseId || null;
        if (data.factoryId !== undefined) updateData.factoryId = data.factoryId || null;
        // Handle both isActive (boolean) and status (string)
        if (data.isActive !== undefined) updateData.status = data.isActive ? 'active' : 'inactive';
        if (data.status !== undefined) updateData.status = data.status;
        if (data.position !== undefined) updateData.position = data.position;
        if (data.department !== undefined) updateData.department = data.department;
        if (data.salary !== undefined) updateData.salary = String(data.salary);
        if (data.hireDate !== undefined) updateData.hireDate = data.hireDate.toISOString();
        if (data.salaryType !== undefined) updateData.salaryType = data.salaryType;
        if (data.baseSalary !== undefined) updateData.baseSalary = String(data.baseSalary);
        if (data.hourlyRate !== undefined) updateData.hourlyRate = String(data.hourlyRate);
        if (data.workingHours !== undefined) updateData.workingHours = String(data.workingHours);
        if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
        if (data.qualifications !== undefined) updateData.qualifications = data.qualifications;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.address !== undefined) {
            updateData.address = typeof data.address === 'object' ? JSON.stringify(data.address) : data.address;
        }

        if (Object.keys(updateData).length === 0) {
            throw new Error('No fields to update');
        }

        console.log('[AuthService] updateEmployee:', employeeId, updateData);

        // Local storage update - no fallback
        const updatedEmployee = await storage.updateEmployee(employeeId, updateData);

        if (!updatedEmployee) {
            throw new Error('Employee not found');
        }

        // Log the action
        try {
            await this.logAction(
                updatedEmployee.id || employeeId,
                updatedBy,
                'employee_update',
                'employee',
                employeeId,
                data
            );
        } catch (logError) {
            console.warn('[AuthService] Failed to log update action:', logError);
        }

        return {
            id: updatedEmployee.id,
            employeeId: updatedEmployee.employeeId || updatedEmployee.username,
            username: updatedEmployee.username || updatedEmployee.employeeId,
            role: updatedEmployee.role as any,
            franchiseId: updatedEmployee.franchiseId,
            factoryId: updatedEmployee.factoryId,
            fullName: updatedEmployee.firstName
                ? `${updatedEmployee.firstName} ${updatedEmployee.lastName || ''}`.trim()
                : updatedEmployee.fullName,
            email: updatedEmployee.email,
            phone: updatedEmployee.phone,
            isActive: updatedEmployee.status === 'active' || updatedEmployee.status === null,
            position: updatedEmployee.position,
            department: updatedEmployee.department,
        };
    }

    /**
     * Change password (user changes their own password) - local storage only
     */
    static async changePassword(employeeId: string, currentPassword: string, newPassword: string): Promise<void> {
        // Get employee from local storage
        const employees = await storage.listEmployees();
        const localEmp = employees.find((e: any) =>
            e.employeeId === employeeId ||
            e.employee_id === employeeId ||
            e.email === employeeId ||
            e.username === employeeId ||
            e.id === employeeId
        );

        if (!localEmp) {
            throw new Error('Employee not found');
        }

        if (!localEmp.password) {
            throw new Error('Account not properly configured');
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, localEmp.password);
        if (!isValid) {
            throw new Error('Invalid current password');
        }

        // Hash new password and update
        const hash = await bcrypt.hash(newPassword, 10);
        await storage.updateEmployee(localEmp.id, { password: hash });

        console.log(`✅ [Auth] Password changed for ${employeeId}`);
        await this.logAction(localEmp.id, employeeId, 'password_change', 'employee', employeeId, {}, undefined, undefined, localEmp.franchiseId);
    }

    /**
     * Reset password (admin/manager resets employee password) - local storage only
     */
    static async resetPassword(targetEmployeeId: string, newPassword: string, resetByEmployeeId: string): Promise<void> {
        // Get all employees from local storage
        const employees = await storage.listEmployees();

        // Find the employee who is resetting the password
        const resetBy = employees.find((e: any) =>
            e.employeeId === resetByEmployeeId ||
            e.employee_id === resetByEmployeeId ||
            e.id === resetByEmployeeId
        );

        if (!resetBy) {
            throw new Error('Unauthorized: Resetter not found');
        }

        // Find the target employee
        const targetEmp = employees.find((e: any) =>
            e.employeeId === targetEmployeeId ||
            e.employee_id === targetEmployeeId ||
            e.id === targetEmployeeId
        );

        if (!targetEmp) {
            throw new Error('Target employee not found');
        }

        // Authorization check
        if (resetBy.role === 'franchise_manager') {
            // Franchise managers can only reset passwords for employees in their franchise
            if (targetEmp.franchiseId !== resetBy.franchiseId) {
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

        // Hash new password
        const hash = await bcrypt.hash(newPassword, 10);

        // Update password in local storage
        await storage.updateEmployee(targetEmp.id, { password: hash });

        // Log the action
        await this.logAction(
            resetBy.id,
            resetBy.employeeId || resetBy.employee_id,
            'reset_employee_password',
            'employee',
            targetEmployeeId,
            { target_employee: targetEmp.employeeId, reset_by: resetBy.employeeId },
            undefined,
            undefined,
            resetBy.franchiseId
        );

        console.log(`✅ Password reset for ${targetEmployeeId} by ${resetByEmployeeId}`);
    }

    /**
     * Delete/Deactivate employee (admin/manager only) - local storage only
     */
    static async deleteEmployee(targetEmployeeId: string, deletedByEmployeeId: string, hardDelete: boolean = false): Promise<void> {
        console.log(`🗑️ [Auth] deleteEmployee called: target=${targetEmployeeId}, by=${deletedByEmployeeId}, hardDelete=${hardDelete}`);

        const localEmployees = await storage.listEmployees();

        // Find target - match by id, employeeId, or email
        const targetEmployee = localEmployees.find(e =>
            e.id === targetEmployeeId ||
            e.employeeId === targetEmployeeId ||
            e.email === targetEmployeeId
        );

        // Find deleter - match by id, employeeId, or email  
        const deletedBy = localEmployees.find(e =>
            e.id === deletedByEmployeeId ||
            e.employeeId === deletedByEmployeeId ||
            e.email === deletedByEmployeeId
        );

        if (!targetEmployee) {
            throw new Error('Target employee not found');
        }

        // Authorization check if deleter found
        if (deletedBy) {
            if (deletedBy.role === 'franchise_manager') {
                if (targetEmployee.franchiseId !== deletedBy.franchiseId) {
                    throw new Error('Unauthorized: You can only delete employees in your franchise');
                }
                if (targetEmployee.role === 'admin') {
                    throw new Error('Unauthorized: You cannot delete admin accounts');
                }
            } else if (deletedBy.role !== 'admin') {
                throw new Error('Unauthorized: Only admins and managers can delete employees');
            }
        }

        // Prevent self-deletion
        if (targetEmployee.id === deletedByEmployeeId || targetEmployee.employeeId === deletedByEmployeeId) {
            throw new Error('You cannot delete your own account');
        }

        if (hardDelete) {
            await storage.deleteEmployee(targetEmployee.id);
            await this.logAction(
                deletedBy?.id || deletedByEmployeeId,
                deletedByEmployeeId,
                'employee_terminated',
                'employee',
                targetEmployeeId,
                { hard_delete: true },
                undefined,
                undefined,
                deletedBy?.franchiseId
            );
            console.log(`✅ [Auth] Employee ${targetEmployeeId} permanently deleted`);
        } else {
            await storage.updateEmployee(targetEmployee.id, { status: 'terminated' });
            await this.logAction(
                deletedBy?.id || deletedByEmployeeId,
                deletedByEmployeeId,
                'employee_terminated',
                'employee',
                targetEmployeeId,
                { hard_delete: false, status: 'terminated' },
                undefined,
                undefined,
                deletedBy?.franchiseId
            );
            console.log(`✅ [Auth] Employee ${targetEmployeeId} deactivated`);
        }
    }


    /**
     * Get employee by ID - local storage only
     */
    static async getEmployee(employeeId: string): Promise<AuthEmployee | null> {
        // Try finding by UUID (id) first
        let localEmployee = await storage.getEmployee(employeeId) as any;

        // If not found, try by Email/EmployeeID String
        if (!localEmployee) {
            localEmployee = await storage.getEmployeeByEmail(employeeId) as any;
        }

        if (!localEmployee) {
            return null;
        }

        if (localEmployee.status === 'inactive' || localEmployee.status === 'terminated') {
            return null;
        }

        let normalizedRole = localEmployee.role;
        if (normalizedRole === 'manager') normalizedRole = 'franchise_manager';

        return {
            id: localEmployee.id,
            employeeId: localEmployee.employeeId || localEmployee.employee_id || localEmployee.email,
            username: localEmployee.employeeId || localEmployee.employee_id || localEmployee.email || localEmployee.name,
            role: normalizedRole as any,
            franchiseId: localEmployee.franchiseId || localEmployee.franchise_id,
            factoryId: localEmployee.factoryId || localEmployee.factory_id,
            fullName: `${localEmployee.firstName || localEmployee.first_name || ''} ${localEmployee.lastName || localEmployee.last_name || ''}`.trim() || localEmployee.name || localEmployee.fullName,
            email: localEmployee.email,
            phone: localEmployee.phone,
            isActive: localEmployee.status === 'active' || localEmployee.status === null || localEmployee.status === undefined,
            position: localEmployee.position,
            department: localEmployee.department,
            hireDate: localEmployee.hireDate ? new Date(localEmployee.hireDate) : undefined,
            baseSalary: localEmployee.baseSalary ? parseFloat(localEmployee.baseSalary) : (localEmployee.salary ? parseFloat(localEmployee.salary) : 0),
            hourlyRate: localEmployee.hourlyRate ? parseFloat(localEmployee.hourlyRate) : undefined,
            status: localEmployee.status,
            address: localEmployee.address,
            emergencyContact: localEmployee.emergencyContact,
            qualifications: localEmployee.qualifications,
            notes: localEmployee.notes,
            salaryType: localEmployee.salaryType,
            workingHours: localEmployee.workingHours
        };
    }

    /**
     * List employees - local storage only
     */
    static async listEmployees(requesterRole: string, franchiseId?: string, factoryId?: string): Promise<AuthEmployee[]> {
        const localEmployees = await storage.listEmployees();

        // Filter by franchise if needed (RLS enforcement)
        let filteredEmployees = localEmployees;
        if (requesterRole === 'franchise_manager' && franchiseId) {
            filteredEmployees = localEmployees.filter(emp => emp.franchiseId === franchiseId);
        }

        return filteredEmployees.map(emp => ({
            id: emp.id,
            employeeId: emp.employeeId || emp.email || emp.id,
            username: emp.employeeId || emp.email || emp.name,
            role: emp.role as any,
            franchiseId: emp.franchiseId,
            fullName: emp.name || 'Unknown',
            email: emp.email,
            phone: emp.phone,
            isActive: emp.status === 'active' || emp.status === null || emp.status === undefined,
            status: emp.status || 'active',
            position: emp.role,
            department: undefined,
            hireDate: emp.createdAt ? new Date(emp.createdAt) : undefined,
        }));
    }

    /**
     * Log employee action to audit log - uses local SQLite storage
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
        franchiseId?: string
    ): Promise<void> {
        try {
            // Use local storage logAction method
            await (storage as any).logAction(
                employeeId,
                action,
                entityType || 'system',
                entityId || 'none',
                {
                    ...details,
                    username,
                },
                ipAddress,
                userAgent
            );

            // Broadcast realtime event
            try {
                // @ts-ignore
                const { realtimeServer } = await import('./websocket-server');
                if (realtimeServer) {
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
                }
            } catch (importError) {
                // Realtime not available, that's ok
            }

        } catch (e) {
            console.error("Audit log failed:", e);
        }
    }

    /**
     * Get audit logs from local storage
     */
    static async getAuditLogs(filters?: {
        employeeId?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<any[]> {
        try {
            const result = await storage.getAuditLogs({
                page: 1,
                limit: filters?.limit || 100,
                employeeId: filters?.employeeId,
                action: filters?.action,
                startDate: filters?.startDate?.toISOString(),
                endDate: filters?.endDate?.toISOString(),
            });
            return result.data || [];
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            return [];
        }
    }
}
