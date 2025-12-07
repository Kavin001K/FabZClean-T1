import { Request, Response, NextFunction } from 'express';
import { AuthService, EmployeeJWTPayload } from '../auth-service';

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
        // Skip authentication in development mode - DISABLED to allow real auth testing
        /*
        if (process.env.NODE_ENV !== 'production') {
            // Create a mock employee for development
            req.employee = {
                employeeId: 'dev-admin',
                username: 'System Admin',
                role: 'admin',
                email: 'admin@fabzclean.local',
                exp: 0
            };
            return next();
        }
        */

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
 * Middleware to check if employee has required role
 */
export function roleMiddleware(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.employee) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.employee.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
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
                    req.employee.id, // Use UUID from JWT payload
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
                    userAgent,
                    req.employee.franchiseId // Pass franchise config
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
 * Middleware to filter data based on employee's scope
 * Adds franchiseId or factoryId to query filters for non-admin users
 */
export function scopeMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.employee) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin sees everything - no filtering needed
    if (req.employee.role === 'admin') {
        return next();
    }

    // Add scope filters to query/body
    if (req.employee.role === 'franchise_manager' && req.employee.franchiseId) {
        // Add franchise filter
        if (req.method === 'GET') {
            req.query.franchiseId = req.employee.franchiseId;
        } else {
            req.body.franchiseId = req.employee.franchiseId;
        }
    } else if (req.employee.role === 'factory_manager' && req.employee.factoryId) {
        // Add factory filter
        if (req.method === 'GET') {
            req.query.factoryId = req.employee.factoryId;
        } else {
            req.body.factoryId = req.employee.factoryId;
        }
    }

    next();
}
