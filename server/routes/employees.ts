import express, { Request, Response } from 'express';
import { AuthService } from '../auth-service';
import { authMiddleware, roleMiddleware, auditMiddleware } from '../middleware/employee-auth';

const router = express.Router();

// All employee routes require authentication
router.use(authMiddleware);

/**
 * GET /api/employees
 * List all employees (filtered by role)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        console.log('GET /api/employees - Requesting user:', JSON.stringify(req.employee));

        const employees = await AuthService.listEmployees(
            req.employee!.role,
            req.employee!.franchiseId,
            req.employee!.factoryId
        );

        console.log(`GET /api/employees - Found ${employees.length} employees`);
        res.json({ success: true, employees });
    } catch (error: any) {
        console.error('GET /api/employees - Error:', error);
        res.status(500).json({ error: error.message || 'Failed to list employees' });
    }
});

/**
 * GET /api/employees/:id
 * Get employee by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const employee = await AuthService.getEmployee(req.params.id);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Check if user has permission to view this employee
        console.log(`[GET /api/employees/:id] Requester: ${req.employee?.username} (${req.employee?.role}), Target: ${employee.username} (Franchise: ${employee.franchiseId})`);

        if (req.employee!.role !== 'admin') {
            if (req.employee!.role === 'franchise_manager' && employee.franchiseId !== req.employee!.franchiseId) {
                return res.status(403).json({ error: 'You can only view employees in your franchise' });
            }
            if (req.employee!.role === 'factory_manager' && employee.factoryId !== req.employee!.factoryId) {
                return res.status(403).json({ error: 'You can only view employees in your factory' });
            }
        }

        res.json({ success: true, employee });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch employee' });
    }
});

/**
 * POST /api/employees
 * Create new employee (admin and managers only)
 */
router.post(
    '/',
    roleMiddleware(['admin', 'franchise_manager']),
    auditMiddleware('create_employee', 'employee'),
    async (req: Request, res: Response) => {
        try {
            const {
                username, password, role, franchiseId, factoryId, fullName, email, phone,
                position, department, hireDate, salaryType, baseSalary, hourlyRate,
                workingHours, emergencyContact, qualifications, notes, address
            } = req.body;

            // Validation
            if (!username || !password || !role) {
                return res.status(400).json({ error: 'Username, password, and role are required' });
            }

            if (password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long' });
            }

            // Replace the hardcoded array with a robust check
            const ALLOWED_ROLES = ['admin', 'franchise_manager', 'factory_manager', 'staff', 'employee', 'driver'] as const;

            if (!ALLOWED_ROLES.includes(role as any)) {
                return res.status(400).json({
                    error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}`
                });
            }

            // Franchise managers can only create employees for their franchise
            if (req.employee!.role === 'franchise_manager') {
                const ALLOWED_FRANCHISE_ROLES = ['factory_manager', 'staff', 'employee', 'driver'];
                if (!ALLOWED_FRANCHISE_ROLES.includes(role)) {
                    return res.status(403).json({ error: 'Franchise managers can only create factory managers, employees, and drivers' });
                }
                // Strictly enforce franchise ID
                if (franchiseId && franchiseId !== req.employee!.franchiseId) {
                    return res.status(403).json({ error: 'You can only create employees for your franchise' });
                }
                // If not provided, it will be auto-filled below, but logic is fine
            }

            // Create employee
            const employee = await AuthService.createEmployee(
                {
                    username,
                    password,
                    role,
                    franchiseId: franchiseId || req.employee!.franchiseId, // Use current user's franchise if not provided
                    factoryId,
                    fullName,
                    email,
                    phone,
                    position,
                    department,
                    hireDate: hireDate ? new Date(hireDate) : undefined,
                    salaryType,
                    baseSalary: baseSalary ? parseFloat(baseSalary) : undefined,
                    hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
                    workingHours: workingHours ? parseInt(workingHours) : undefined,
                    emergencyContact,
                    qualifications,
                    notes,
                    address
                },
                req.employee!.employeeId
            );

            res.status(201).json({ success: true, employee });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to create employee' });
        }
    }
);

/**
 * PUT /api/employees/:id
 * Update employee (admin and managers only)
 */
router.put(
    '/:id',
    roleMiddleware(['admin', 'franchise_manager']),
    auditMiddleware('update_employee', 'employee'),
    async (req: Request, res: Response) => {
        try {
            const {
                fullName, email, phone, franchiseId, factoryId, isActive,
                position, department, hireDate, salaryType, baseSalary, hourlyRate,
                workingHours, emergencyContact, qualifications, notes, address
            } = req.body;

            // Fetch employee to check permissions
            const targetEmployee = await AuthService.getEmployee(req.params.id);
            if (!targetEmployee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            // Franchise managers can only update employees in their franchise
            if (req.employee!.role === 'franchise_manager') {
                if (targetEmployee.franchiseId !== req.employee!.franchiseId) {
                    return res.status(403).json({ error: 'You can only update employees in your franchise' });
                }
            }

            const employee = await AuthService.updateEmployee(
                req.params.id,
                {
                    fullName, email, phone, franchiseId, factoryId, isActive,
                    position, department,
                    hireDate: hireDate ? new Date(hireDate) : undefined,
                    salaryType,
                    baseSalary: baseSalary ? parseFloat(baseSalary) : undefined,
                    hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
                    workingHours: workingHours ? parseInt(workingHours) : undefined,
                    emergencyContact, qualifications, notes, address
                },
                req.employee!.employeeId
            );

            res.json({ success: true, employee });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to update employee' });
        }
    }
);

/**
 * DELETE /api/employees/:id
 * Delete or deactivate employee (admin and managers)
 * Query param: hardDelete=true for permanent deletion (admin only)
 */
router.delete(
    '/:id',
    roleMiddleware(['admin', 'franchise_manager']),
    auditMiddleware('delete_employee', 'employee'),
    async (req: Request, res: Response) => {
        try {
            const hardDelete = req.query.hardDelete === 'true';

            await AuthService.deleteEmployee(
                req.params.id,
                req.employee!.employeeId,
                hardDelete
            );

            res.json({
                success: true,
                message: hardDelete ? 'Employee permanently deleted' : 'Employee deactivated'
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to delete employee' });
        }
    }
);

/**
 * POST /api/employees/:id/reset-password
 * Reset employee password (admin only)
 */
router.post(
    '/:id/reset-password',
    roleMiddleware(['admin']),
    auditMiddleware('reset_employee_password', 'employee'),
    async (req: Request, res: Response) => {
        try {
            const { newPassword } = req.body;

            if (!newPassword || newPassword.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long' });
            }

            await AuthService.resetPassword(req.params.id, newPassword, req.employee!.employeeId);

            res.json({ success: true, message: 'Password reset successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to reset password' });
        }
    }
);

/**
 * GET /api/employees/audit-logs
 * Get audit logs (admin only)
 */
router.get(
    '/audit-logs',
    roleMiddleware(['admin']),
    async (req: Request, res: Response) => {
        try {
            const { employeeId, action, startDate, endDate, limit } = req.query;

            const filters: any = {};
            if (employeeId) filters.employeeId = employeeId as string;
            if (action) filters.action = action as string;
            if (startDate) filters.startDate = new Date(startDate as string);
            if (endDate) filters.endDate = new Date(endDate as string);
            if (limit) filters.limit = parseInt(limit as string);

            const logs = await AuthService.getAuditLogs(filters);

            res.json({ success: true, logs });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
        }
    }
);

export default router;
