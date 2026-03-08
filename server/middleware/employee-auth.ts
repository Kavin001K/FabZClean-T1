import { Request, Response, NextFunction } from 'express';
import { AuthService, EmployeeJWTPayload } from '../auth-service';
import { SystemRole, SYSTEM_ROLES, LOGIN_ROLES } from '../../shared/schema';

// Extend Express Request to include employee info
declare global {
    namespace Express {
        interface Request {
            employee?: EmployeeJWTPayload;
        }
    }
}

/**
 * Middleware to verify JWT and attach employee to request
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        // Skip authentication in development mode for local testing
        if (process.env.NODE_ENV !== 'production' && process.env.API_DEBUG === 'true') {
            // Create a mock employee for development
            req.employee = {
                id: 'dev-admin-id',
                employeeId: 'dev-admin',
                username: 'System Admin',
                role: 'admin',
                email: 'admin@fabzclean.local',
                exp: 0
            };
            return next();
        }

        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const employee = await AuthService.verifyToken(token);

        // Attach employee to request
        req.employee = employee;

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Middleware to check if employee has required role.
 * STRICT enforcement — only listed roles are allowed through.
 */
export function roleMiddleware(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.employee) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const role = req.employee.role;

        // Admin always has access
        if (role === 'admin') return next();

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: role,
            });
        }

        next();
    };
}

/**
 * Scope Guard middleware — ensures users only see data from their store/factory.
 * Attaches `req.scopeFilter` with { storeId?, factoryId? } for downstream use.
 * 
 * Usage: router.get('/orders', authMiddleware, scopeGuard, handler)
 * Then in handler: const filter = (req as any).scopeFilter;
 */
export function scopeGuard(req: Request, res: Response, next: NextFunction) {
    if (!req.employee) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const role = req.employee.role as SystemRole;
    const emp = req.employee as any;

    // Build scope filter based on role
    const scopeFilter: { storeId?: string; factoryId?: string; global: boolean } = { global: false };

    switch (role) {
        case 'admin':
            // Admin sees everything
            scopeFilter.global = true;
            break;

        case 'store_manager':
        case 'store_staff':
            // Scoped to their store
            scopeFilter.storeId = emp.storeId || emp.franchiseId;
            break;

        case 'factory_manager':
            // Factory manager can read all orders but only manage factory staff
            scopeFilter.factoryId = emp.factoryId;
            scopeFilter.global = true; // Can read all orders
            break;

        case 'driver':
            // Driver only sees assigned orders (handled at route level)
            break;

        default:
            return res.status(403).json({ error: 'Role not authorized for system access' });
    }

    (req as any).scopeFilter = scopeFilter;
    next();
}

/**
 * Middleware to automatically log actions
 */
export function auditMiddleware(action: string, entityType?: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to log after response
        res.json = function (body: any) {
            // Only log if request was successful
            if (res.statusCode < 400 && req.employee) {
                const entityId = req.params.id || body?.id || null;
                const ipAddress = req.ip || req.connection.remoteAddress;
                const userAgent = req.get('user-agent');

                // Log action asynchronously (don't wait)
                AuthService.logAction(
                    req.employee.id,
                    req.employee.username,
                    action,
                    entityType || null,
                    entityId,
                    {
                        method: req.method,
                        path: req.path,
                        body: req.body,
                    },
                    ipAddress,
                    userAgent
                ).catch(err => {
                    console.error('Failed to log action:', err);
                });
            }

            return originalJson(body);
        };

        next();
    };
}

/**
 * Middleware to ensure user is authenticated (no scope filtering needed in single-tenant system)
 */
export function scopeMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.employee) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // Single-tenant: no franchise/factory scoping needed
    next();
}
