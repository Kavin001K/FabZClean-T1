import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Authentication decorator equivalent for Express middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'employee' | 'customer' | 'worker';
  };
  session?: any;
}

// Session-based authentication middleware (for admin)
export const adminLoginRequired = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check for admin session (simplified - in production use proper session management)
  const adminToken = req.headers.authorization?.replace('Bearer ', '') || 
                    req.cookies?.admin_token ||
                    req.session?.admin_logged_in;

  if (!adminToken) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  // For now, accept any token - in production validate JWT or session
  req.user = {
    id: 'admin',
    email: 'admin@fabzclean.com',
    name: 'Admin User',
    role: 'admin'
  };

  next();
};

// JWT-based authentication middleware (for customers/workers)
export const jwtRequired = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: "JWT token required" });
  }

  try {
    // Simplified JWT validation - in production use proper JWT library
    // For now, just check if token exists and has basic structure
    if (token.length < 10) {
      throw new Error('Invalid token');
    }

    // Mock user data - in production decode JWT
    req.user = {
      id: 'user123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'customer'
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

// Input validation middleware
export const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      return res.status(500).json({ error: "Internal validation error" });
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
        error: "Too many requests",
        retryAfter: Math.ceil((clientData.resetTime + windowMs - now) / 1000)
      });
    }

    clientData.count++;
    next();
  };
};

// CORS middleware configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'https://fabzclean-admin.netlify.app',
      'https://fabzclean-employee.netlify.app',
      'https://fabzclean-customer.netlify.app',
      'https://fabzclean-worker.netlify.app'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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
