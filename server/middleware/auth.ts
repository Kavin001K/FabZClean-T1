import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { UserRole } from "../../shared/supabase";
import { authMiddleware as employeeAuthMiddleware, roleMiddleware as employeeRoleMiddleware } from "./employee-auth";

// CORS middleware configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow all localhost origins for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Get allowed origins from environment variable (comma-separated list)
    const envOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [];

    // Static IP support - allow HTTP/HTTPS from static IP if configured
    const staticIP = process.env.STATIC_IP;
    if (staticIP) {
      envOrigins.push(`http://${staticIP}`);
      envOrigins.push(`http://${staticIP}:${process.env.PORT || '5000'}`);
      if (process.env.PORT === '80') {
        envOrigins.push(`http://${staticIP}`);
      }
    }

    const allowedOrigins = [...envOrigins];

    // Check if origin matches any allowed origin
    const isAllowed = allowedOrigins.some(allowed => {
      if (origin === allowed) return true;
      if (origin.startsWith(allowed)) return true;
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      // In production, log but allow for now (you can make this stricter)
      if (process.env.NODE_ENV === 'production') {
        console.warn(`CORS: Origin ${origin} not in allowed list. Current allowed: ${allowedOrigins.join(', ')}`);
        callback(null, true);
      } else {
        callback(null, true); // Allow all in development
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: error.message
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication'
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
};

// Compatibility exports for existing route files
// These delegate to the new employee-auth middleware

/**
 * Authentication middleware - requires valid JWT token
 * Compatible with old code, uses new employee auth system
 */
export const jwtRequired = employeeAuthMiddleware;

/**
 * Role-based access control middleware
 * Compatible with old code, uses new employee auth system
 */
export const requireRole = (allowedRoles: UserRole[] | string[]) => {
  // Convert UserRole[] to string[] if needed
  const roles = allowedRoles.map(role =>
    typeof role === 'string' ? role : role as string
  );
  return employeeRoleMiddleware(roles);
};

/**
 * Admin-only middleware
 */
export const adminLoginRequired = requireRole(['admin']);

// Input validation middleware
export const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[VALIDATION ERROR] Path:', req.path);
        console.error('[VALIDATION ERROR] Details:', JSON.stringify(error.errors, null, 2));
        console.error('[VALIDATION ERROR] Body Keys:', Object.keys(req.body || {}));
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
          path: req.path
        });
      }
      console.error('[VALIDATION ERROR] Unknown:', error);
      return res.status(500).json({ error: 'Internal validation error' });
    }
  };
};

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (windowMs: number = 60000, maxRequests: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - windowMs;

    const clientData = rateLimitMap.get(key);

    if (!clientData || clientData.resetTime < windowStart) {
      rateLimitMap.set(key, { count: 1, resetTime: now });
      return next();
    }

    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime + windowMs - now) / 1000)
      });
    }

    clientData.count++;
    next();
  };
};

// Type exports for compatibility
export interface AuthenticatedRequest extends Request {
  employee?: {
    employeeId: string;
    username: string;
    role: string;
    franchiseId?: string;
    factoryId?: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  session?: any;
}
