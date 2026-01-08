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
            console.log(`🔍 Searching for user in local DB: ${username}`);
            const localEmployee = await storage.getEmployeeByEmail(username) as any;
            console.log(`🔍 Local employee found:`, localEmployee ? `Yes (${localEmployee.employeeId || localEmployee.employee_id})` : 'No');

            if (localEmployee) {
                console.log(`🔍 Employee status: ${localEmployee.status}, has password: ${!!localEmployee.password}`);

                if (localEmployee.password) {
                    const isValidLocal = await bcrypt.compare(password, localEmployee.password);
                    console.log(`🔍 Password match: ${isValidLocal}`);

                    if (isValidLocal && (localEmployee.status === 'active' || !localEmployee.status)) {
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
                            fullName: `${localEmployee.first_name || ''} ${localEmployee.last_name || ''}`.trim() || localEmployee.fullName,
                            email: localEmployee.email,
                            phone: localEmployee.phone,
                            isActive: localEmployee.status === 'active' || !localEmployee.status,
                        };
                        console.log(`✅ Login successful (local) for: ${username}`);
                        return { token, employee };
                    } else if (!isValidLocal) {
                        console.log(`❌ Password mismatch for local user: ${username}`);
                    } else if (localEmployee.status !== 'active') {
                        console.log(`❌ User inactive: ${username}, status: ${localEmployee.status}`);
                    }
                }
            }
        } catch (err: any) {
            console.error(`❌ Local DB error:`, err.message);
            // Continue to Supabase
        }

        // 2. Try Supabase 'employees' table
        try {
            const { data: employees, error } = await supabase
                .from('employees')
                .select('*')
                .or(`employee_id.eq."${username}",email.eq."${username}"`);

            const emp = employees?.[0];

            if (!error && emp && emp.status === 'active' && emp.password) {
                const isValidPassword = await bcrypt.compare(password, emp.password);
                if (isValidPassword) {
                    await this.logAction(emp.id, emp.employee_id, 'login', null, null, { email: emp.email }, ipAddress, undefined, emp.franchise_id);

                    let normalizedRole = emp.role;
                    if (emp.role === 'manager') normalizedRole = 'franchise_manager';

                    const payload: EmployeeJWTPayload = {
                        id: emp.id,
                        employeeId: emp.employee_id,
                        username: emp.email || emp.employee_id,
                        role: normalizedRole as any,
                        franchiseId: emp.franchise_id,
                        factoryId: emp.factory_id || undefined,
                    };

                    const token = jwt.sign(payload, FINAL_SECRET, { expiresIn: JWT_EXPIRY });

                    const employee: AuthEmployee = {
                        id: emp.id,
                        employeeId: emp.employee_id,
                        username: emp.employee_id,
                        role: normalizedRole as any,
                        franchiseId: emp.franchise_id,
                        factoryId: emp.factory_id,
                        fullName: `${emp.first_name} ${emp.last_name}`,
                        email: emp.email,
                        phone: emp.phone,
                        isActive: emp.status === 'active',
                        position: emp.position,
                        department: emp.department,
                        hireDate: emp.hire_date ? new Date(emp.hire_date) : undefined,
                        baseSalary: emp.salary ? parseFloat(emp.salary) : undefined,
                    };

                    console.log(`✅ Login successful (employees table) for: ${username}`);
                    return { token, employee };
                }
            }
        } catch (err: any) {
            console.log(`ℹ️ employees table check failed: ${err.message}`);
        }

        // 3. Try Supabase 'auth_employees' table (for factory managers and other auth users)
        try {
            const { data: authEmployees, error } = await supabase
                .from('auth_employees')
                .select('*')
                .or(`employee_id.eq."${username}",email.eq."${username}",username.eq."${username}"`);

            const authEmp = authEmployees?.[0];

            if (!error && authEmp && authEmp.is_active === true) {
                // Check password_hash column in auth_employees
                const passwordHash = authEmp.password_hash || authEmp.password;
                if (passwordHash) {
                    const isValidPassword = await bcrypt.compare(password, passwordHash);
                    if (isValidPassword) {
                        // Log login action
                        try {
                            await this.logAction(authEmp.id, authEmp.employee_id, 'login', null, null, { email: authEmp.email }, ipAddress, undefined, authEmp.franchise_id);
                        } catch (e) {
                            // Ignore logging errors
                        }

                        const payload: EmployeeJWTPayload = {
                            id: authEmp.id,
                            employeeId: authEmp.employee_id,
                            username: authEmp.username || authEmp.email || authEmp.employee_id,
                            role: authEmp.role as any,
                            franchiseId: authEmp.franchise_id || undefined,
                            factoryId: authEmp.factory_id || undefined,
                        };

                        const token = jwt.sign(payload, FINAL_SECRET, { expiresIn: JWT_EXPIRY });

                        const employee: AuthEmployee = {
                            id: authEmp.id,
                            employeeId: authEmp.employee_id,
                            username: authEmp.employee_id,
                            role: authEmp.role as any,
                            franchiseId: authEmp.franchise_id,
                            factoryId: authEmp.factory_id,
                            fullName: authEmp.full_name || authEmp.username,
                            email: authEmp.email,
                            phone: authEmp.phone,
                            isActive: authEmp.is_active === true,
                            position: authEmp.position,
                            department: authEmp.department,
                            hireDate: authEmp.hire_date ? new Date(authEmp.hire_date) : undefined,
                            baseSalary: authEmp.base_salary ? parseFloat(authEmp.base_salary) : undefined,
                        };

                        console.log(`✅ Login successful (auth_employees table) for: ${username}`);
                        return { token, employee };
                    }
                }
            }
        } catch (err: any) {
            console.log(`ℹ️ auth_employees table check failed: ${err.message}`);
        }

        // All attempts failed
        console.warn(`❌ Login failed: Invalid credentials for ${username}`);
        throw new Error('Invalid username or password');
    }

    /**
     * Verify JWT and return employee info
     */
    static async verifyToken(token: string): Promise<EmployeeJWTPayload> {
        try {
            const payload = jwt.verify(token, FINAL_SECRET) as EmployeeJWTPayload;

            // 1. Try LOCAL storage FIRST (for local development with SQLite)
            try {
                // Use getEmployeeByEmail as it searches by both email AND employeeId field
                const local = await storage.getEmployeeByEmail(payload.employeeId);
                if (local && (local.status === 'active' || local.status === null || local.status === undefined)) {
                    console.log(`✅ [Auth] Token verified via local storage for: ${payload.employeeId}`);
                    return {
                        ...payload,
                        id: local.id,
                        franchiseId: local.franchiseId || (local as any).franchise_id || undefined,
                        factoryId: local.factoryId || (local as any).factory_id || undefined,
                        role: local.role as any
                    };
                }
            } catch (e) {
                // Local storage failed, try Supabase
                console.log(`⚠️ [Auth] Local storage check failed, trying Supabase...`);
            }

            // 2. Try Supabase 'employees' table (for production with Supabase)
            try {
                const { data: emp, error } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('employee_id', payload.employeeId)
                    .single();

                if (!error && emp && emp.status === 'active') {
                    let normalizedRole = emp.role;
                    if (emp.role === 'manager') normalizedRole = 'franchise_manager';

                    console.log(`✅ [Auth] Token verified via Supabase for: ${payload.employeeId}`);
                    return {
                        ...payload,
                        id: emp.id,
                        franchiseId: emp.franchise_id,
                        factoryId: emp.factory_id,
                        role: normalizedRole as any
                    };
                }
            } catch (e) {
                // Continue to auth_employees
            }

            // 3. Try Supabase 'auth_employees' table
            try {
                const { data: authEmp, error } = await supabase
                    .from('auth_employees')
                    .select('*')
                    .eq('employee_id', payload.employeeId)
                    .single();

                if (!error && authEmp && authEmp.is_active === true) {
                    console.log(`✅ [Auth] Token verified via Supabase auth_employees for: ${payload.employeeId}`);
                    return {
                        ...payload,
                        id: authEmp.id,
                        franchiseId: authEmp.franchise_id || undefined,
                        factoryId: authEmp.factory_id || undefined,
                        role: authEmp.role as any
                    };
                }
            } catch (e) {
                // All checks failed
            }

            throw new Error('Invalid or inactive employee');
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Create a new employee (admin/manager only) - prioritizes local storage
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

        // Auto-generate employee_id based on franchise and role
        // Format: FZC[franchiseNum][roleCode][sequenceNum]
        // e.g., FZC01ST03 = Franchise 1, Staff, #3
        const roleCodeMap: Record<string, string> = {
            'admin': 'AD',
            'franchise_manager': 'MG',
            'factory_manager': 'FM',
            'staff': 'ST',
            'employee': 'ST',
            'driver': 'DR'
        };
        const roleCode = roleCodeMap[data.role] || 'XX';

        // 1. Try LOCAL storage FIRST (for local development with SQLite)
        try {
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
                // Work Details
                franchiseId: data.franchiseId || null,
                factoryId: data.factoryId || null,
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

            if (newEmployee) {
                console.log(`✅ [Auth] Created employee ${generatedEmployeeId} in local storage`);
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
        } catch (localError) {
            console.log(`⚠️ [Auth] Local storage create failed, trying Supabase...`, localError);
        }

        // 2. Fall back to Supabase
        try {
            // Check if supabase client is valid
            // @ts-ignore
            if (!supabase || !supabase.supabaseUrl) {
                // If local storage failed and Supabase is not configured, we can't do anything
                throw new Error("Local storage failed and Supabase is not configured.");
            }

            // Get franchise code from franchiseId (e.g., 'franchise-pollachi' -> '01')
            let franchiseNum = '01';
            if (data.franchiseId) {
                // Count franchises or extract from ID
                const { data: franchises } = await supabase
                    .from('franchises')
                    .select('id')
                    .order('created_at', { ascending: true });
                if (franchises) {
                    const idx = franchises.findIndex(f => f.id === data.franchiseId);
                    franchiseNum = String(idx + 1).padStart(2, '0');
                }
            }

            // Count existing employees with same role in same franchise for sequence
            const { count } = await supabase
                .from('employees')
                .select('*', { count: 'exact', head: true })
                .eq('role', data.role)
                .eq('franchise_id', data.franchiseId || '');

            const sequenceNum = String((count || 0) + 1).padStart(2, '0');
            const generatedEmployeeId = `FZC${franchiseNum}${roleCode}${sequenceNum}`;

            // Insert employee
            const { data: emp, error } = await supabase
                .from('employees')
                .insert({
                    employee_id: generatedEmployeeId,
                    first_name: firstName,
                    last_name: lastName,
                    email: data.email,
                    phone: data.phone,
                    password: passwordHash,
                    role: data.role,
                    franchise_id: data.franchiseId || null,
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
                factoryId: emp.factory_id,
                fullName: `${emp.first_name} ${emp.last_name}`,
                email: emp.email,
                phone: emp.phone,
                isActive: emp.status === 'active',
            };
        } catch (supabaseError: any) {
            console.error("❌ Supabase/Fallback create failed:", supabaseError);
            throw new Error(supabaseError.message || "Failed to create employee in both Local and Cloud storage");
        }


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
        if (data.franchiseId !== undefined) updateData.franchiseId = data.franchiseId;
        if (data.factoryId !== undefined) updateData.factoryId = data.factoryId;
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

        // Try local storage first
        try {
            const updatedEmployee = await storage.updateEmployee(employeeId, updateData);

            if (!updatedEmployee) {
                throw new Error('Employee not found');
            }

            // Log the action
            try {
                await this.logAction(
                    updatedEmployee.id || employeeId,
                    updatedBy,
                    'update_employee',
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
        } catch (localError) {
            console.error('[AuthService] Local storage update failed:', localError);

            // Fallback to Supabase if available
            if (supabase) {
                try {
                    const supabaseUpdate: any = {};
                    if (data.fullName !== undefined) {
                        const names = data.fullName.split(' ');
                        supabaseUpdate.first_name = names[0];
                        supabaseUpdate.last_name = names.slice(1).join(' ') || '';
                    }
                    if (data.email !== undefined) supabaseUpdate.email = data.email;
                    if (data.phone !== undefined) supabaseUpdate.phone = data.phone;
                    if (data.franchiseId !== undefined) supabaseUpdate.franchise_id = data.franchiseId;
                    if (data.isActive !== undefined) supabaseUpdate.status = data.isActive ? 'active' : 'inactive';

                    const { data: emp, error } = await supabase
                        .from('employees')
                        .update(supabaseUpdate)
                        .eq('employee_id', employeeId)
                        .select()
                        .single();

                    if (error || !emp) {
                        throw new Error('Employee not found in Supabase');
                    }

                    return {
                        id: emp.id,
                        employeeId: emp.employee_id,
                        username: emp.employee_id,
                        role: emp.role as any,
                        franchiseId: emp.franchise_id,
                        fullName: `${emp.first_name} ${emp.last_name}`.trim(),
                        email: emp.email,
                        phone: emp.phone,
                        isActive: emp.status === 'active',
                    };
                } catch (supabaseError) {
                    console.error('[AuthService] Supabase fallback failed:', supabaseError);
                    throw localError; // Re-throw the original error
                }
            }

            throw localError;
        }
    }

    /**
     * Change password (user changes their own password)
     */
    static async changePassword(employeeId: string, currentPassword: string, newPassword: string): Promise<void> {
        // 1. Try LOCAL storage first
        try {
            // Get employee from local storage
            const employees = await storage.listEmployees();
            const localEmp = employees.find((e: any) =>
                e.employeeId === employeeId ||
                e.employee_id === employeeId ||
                e.email === employeeId ||
                e.username === employeeId
            );

            if (localEmp && localEmp.password) {
                // Verify current password
                const isValid = await bcrypt.compare(currentPassword, localEmp.password);
                if (!isValid) {
                    throw new Error('Invalid current password');
                }

                // Hash new password and update
                const hash = await bcrypt.hash(newPassword, 10);
                await storage.updateEmployee(localEmp.id, { password: hash });

                console.log(`✅ [Auth] Password changed for ${employeeId} (local storage)`);
                await this.logAction(localEmp.id, employeeId, 'change_password', 'employee', employeeId, {}, undefined, undefined, localEmp.franchiseId);
                return;
            }
        } catch (localError: any) {
            if (localError.message === 'Invalid current password') {
                throw localError; // Re-throw auth errors
            }
            console.log('⚠️ [Auth] Local password change failed, trying Supabase...', localError.message);
        }

        // 2. Fallback to Supabase
        const { data: emp, error } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', employeeId)
            .single();

        if (error || !emp) throw new Error('Employee not found');

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, emp.password);
        if (!isValid) throw new Error('Invalid current password');

        // Update password
        const hash = await bcrypt.hash(newPassword, 10);
        const { error: upError } = await supabase
            .from('employees')
            .update({ password: hash })
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
     * Delete/Deactivate employee (admin/manager only) - prioritizes local storage
     */
    static async deleteEmployee(targetEmployeeId: string, deletedByEmployeeId: string, hardDelete: boolean = false): Promise<void> {
        console.log(`🗑️ [Auth] deleteEmployee called: target=${targetEmployeeId}, by=${deletedByEmployeeId}, hardDelete=${hardDelete}`);

        // 1. Try LOCAL storage first
        try {
            const localEmployees = await storage.listEmployees();
            console.log(`📋 [Auth] Found ${localEmployees.length} employees in local storage`);

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

            console.log(`🔍 [Auth] Target found: ${!!targetEmployee}, Deleter found: ${!!deletedBy}`);

            if (targetEmployee) {
                // If deletedBy not found, check if calling user has admin role from JWT
                const hasPermission = deletedBy ?
                    (deletedBy.role === 'admin' || deletedBy.role === 'franchise_manager') :
                    true; // Allow if we can't verify - the route middleware already checked

                if (!hasPermission) {
                    throw new Error('Unauthorized: Only admins and managers can delete employees');
                }

                if (hardDelete) {
                    await storage.deleteEmployee(targetEmployee.id);
                    console.log(`✅ [Auth] Employee ${targetEmployeeId} permanently deleted from local storage`);
                } else {
                    const result = await storage.updateEmployee(targetEmployee.id, { status: 'inactive' });
                    console.log(`✅ [Auth] Employee ${targetEmployeeId} deactivated in local storage. Result:`, result);
                }
                return;
            } else {
                console.log(`⚠️ [Auth] Target employee not found in local storage`);
            }
        } catch (e) {
            console.log(`⚠️ [Auth] Local storage delete failed, trying Supabase...`, e);
        }

        // 2. Fall back to Supabase
        // Get the employee who is deleting
        const { data: deletedBy, error: deletedByError } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', deletedByEmployeeId)
            .single();

        if (deletedByError || !deletedBy) throw new Error('Unauthorized: Deleter not found');

        // Get the target employee
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
     * Checks local storage first (UUID then Email/EmpID), then Supabase as fallback
     */
    static async getEmployee(employeeId: string): Promise<AuthEmployee | null> {
        // 1. Try LOCAL storage FIRST (for local development with SQLite)
        try {
            // A: Try finding by UUID (id) first - generic for updates/fetches by ID
            let localEmployee = await storage.getEmployee(employeeId) as any;

            // B: If not found, try by Email/EmployeeID String (for login/lookup by code)
            if (!localEmployee) {
                localEmployee = await storage.getEmployeeByEmail(employeeId) as any;
            }

            if (localEmployee && (localEmployee.status === 'active' || localEmployee.status === null || localEmployee.status === undefined)) {
                let normalizedRole = localEmployee.role;
                if (normalizedRole === 'manager') normalizedRole = 'franchise_manager';

                console.log(`✅ [Auth] Employee fetched from local storage: ${localEmployee.id} (${localEmployee.name})`);
                return {
                    id: localEmployee.id,
                    employeeId: localEmployee.employeeId || localEmployee.employee_id || localEmployee.email, // Ensure fallback
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
                    // return other fields needed for edit form
                    address: localEmployee.address,
                    emergencyContact: localEmployee.emergencyContact,
                    qualifications: localEmployee.qualifications,
                    notes: localEmployee.notes,
                    salaryType: localEmployee.salaryType,
                    workingHours: localEmployee.workingHours
                };
            }
        } catch (e) {
            console.log(`⚠️ [Auth] Local storage check failed for ${employeeId}, trying Supabase...`);
            // console.error(e); // Optional debugging
        }

        // 2. Try Supabase 'employees' table (for production)
        try {
            const { data: emp, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', employeeId) // Try UUID match first
                .single();

            // If not found by UUID, try employee_id
            let targetEmp = emp;
            if (error || !emp) {
                const { data: empByCode, error: error2 } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('employee_id', employeeId)
                    .single();
                targetEmp = empByCode;
            }

            if (targetEmp) {
                let normalizedRole = targetEmp.role;
                if (targetEmp.role === 'manager') normalizedRole = 'franchise_manager';

                console.log(`✅ [Auth] Employee fetched from Supabase: ${targetEmp.id}`);
                return {
                    id: targetEmp.id,
                    employeeId: targetEmp.employee_id,
                    username: targetEmp.employee_id,
                    role: normalizedRole as any,
                    franchiseId: targetEmp.franchise_id,
                    factoryId: targetEmp.factory_id,
                    fullName: `${targetEmp.first_name} ${targetEmp.last_name}`,
                    email: targetEmp.email,
                    phone: targetEmp.phone,
                    isActive: targetEmp.status === 'active',
                    position: targetEmp.position,
                    department: targetEmp.department,
                    hireDate: targetEmp.hire_date ? new Date(targetEmp.hire_date) : undefined,
                    baseSalary: targetEmp.salary ? parseFloat(targetEmp.salary) : 0,
                    address: targetEmp.address ? (typeof targetEmp.address === 'string' ? targetEmp.address : JSON.stringify(targetEmp.address)) : undefined,
                };
            }
        } catch (e) {
            // Continue to auth_employees
        }

        // 3. Try Supabase 'auth_employees' table
        try {
            const { data: authEmp, error } = await supabase
                .from('auth_employees')
                .select('*')
                .eq('employee_id', employeeId)
                .single();

            if (!error && authEmp && authEmp.is_active === true) {
                console.log(`✅ [Auth] Employee fetched from Supabase auth_employees: ${employeeId}`);
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
                    hireDate: authEmp.hire_date ? new Date(authEmp.hire_date) : undefined,
                    baseSalary: authEmp.base_salary ? parseFloat(authEmp.base_salary) : 0,
                };
            }
        } catch (e) {
            // All checks failed
        }

        return null;
    }

    /**
     * List employees - prioritizes local SQLite storage, falls back to Supabase
     */
    static async listEmployees(requesterRole: string, franchiseId?: string, factoryId?: string): Promise<AuthEmployee[]> {
        // 1. Try LOCAL storage FIRST (for local development with SQLite)
        try {
            const localEmployees = await storage.listEmployees();
            // IMPORTANT: Return even if empty - don't fall through to Supabase!
            // Array.isArray check ensures we got a valid result, not an error
            if (Array.isArray(localEmployees)) {
                console.log(`✅ [Auth] Listed ${localEmployees.length} employees from local storage`);

                // Filter by franchise if needed
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
                    status: emp.status || 'active', // Include status for frontend display
                    position: emp.role,
                    department: undefined,
                    hireDate: emp.createdAt ? new Date(emp.createdAt) : undefined,
                }));
            }
        } catch (e) {
            console.log(`⚠️ [Auth] Local storage list failed, trying Supabase...`, e);
        }

        // 2. Fall back to Supabase
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
            // Broadcast realtime event
            try {
                // Dynamic import for ESM compatibility
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
                console.warn("Realtime server import failed, skipping broadcast", importError);
            }

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
