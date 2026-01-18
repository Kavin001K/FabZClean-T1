# In-House Authentication System Implementation Guide

## Overview
This guide provides step-by-step instructions to implement a complete RBAC (Role-Based Access Control) authentication system from scratch.

## ✅ Step 1: Install Dependencies

```bash
npm install bcrypt jsonwebtoken
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

## ✅ Step 2: Database Schema

Add these tables to `server/SQLiteStorage.ts` in the `createTables()` method (after the existing users table):

```sql
CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  name TEXT,
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_token ON auth_sessions(refresh_token);
```

## ✅ Step 3: Auth Utilities (Already Created)

File: `server/utils/auth-utils.ts` ✅
- Password hashing with bcrypt
- JWT token generation and verification
- Session management utilities

## Step 4: Add Auth Methods to SQLiteStorage

Add these methods to `server/SQLiteStorage.ts`:

```typescript
// Auth User Methods
async createAuthUser(data: {
  email: string;
  passwordHash: string;
  role?: string;
  name?: string;
}): Promise<{ id: string; email: string; role: string; name?: string }> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const role = data.role || 'user';

  this.db
    .prepare(
      `INSERT INTO auth_users (id, email, password_hash, role, name, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    )
    .run(id, data.email, data.passwordHash, role, data.name || null, now, now);

  return { id, email: data.email, role, name: data.name };
}

async getAuthUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  password_hash: string;
  role: string;
  name?: string;
  is_active: number;
} | null> {
  const row = this.db
    .prepare('SELECT * FROM auth_users WHERE email = ?')
    .get(email) as any;

  return row || null;
}

async getAuthUserById(id: string): Promise<{
  id: string;
  email: string;
  role: string;
  name?: string;
  is_active: number;
} | null> {
  const row = this.db
    .prepare('SELECT id, email, role, name, is_active FROM auth_users WHERE id = ?')
    .get(id) as any;

  return row || null;
}

async updateAuthUserLastLogin(userId: string): Promise<void> {
  const now = new Date().toISOString();
  this.db
    .prepare('UPDATE auth_users SET last_login = ?, updated_at = ? WHERE id = ?')
    .run(now, now, userId);
}

// Session Methods
async createSession(data: {
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
}): Promise<void> {
  const id = randomUUID();
  const now = new Date().toISOString();

  this.db
    .prepare(
      `INSERT INTO auth_sessions (id, user_id, token, refresh_token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, data.userId, data.token, data.refreshToken, data.expiresAt, now);
}

async getSessionByToken(token: string): Promise<{
  id: string;
  user_id: string;
  token: string;
  refresh_token: string;
  expires_at: string;
} | null> {
  const row = this.db
    .prepare('SELECT * FROM auth_sessions WHERE token = ?')
    .get(token) as any;

  return row || null;
}

async getSessionByRefreshToken(refreshToken: string): Promise<{
  id: string;
  user_id: string;
  token: string;
  refresh_token: string;
  expires_at: string;
} | null> {
  const row = this.db
    .prepare('SELECT * FROM auth_sessions WHERE refresh_token = ?')
    .get(refreshToken) as any;

  return row || null;
}

async deleteSession(token: string): Promise<void> {
  this.db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
}

async deleteSessionByRefreshToken(refreshToken: string): Promise<void> {
  this.db.prepare('DELETE FROM auth_sessions WHERE refresh_token = ?').run(refreshToken);
}

async deleteAllUserSessions(userId: string): Promise<void> {
  this.db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
}

async cleanupExpiredSessions(): Promise<void> {
  const now = new Date().toISOString();
  this.db.prepare('DELETE FROM auth_sessions WHERE expires_at < ?').run(now);
}
```

## Step 5: Create Auth Routes

Create `server/routes/auth.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getTokenExpiration,
} from '../utils/auth-utils';
import { jwtRequired, requireRole } from '../middleware/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'manager', 'employee', 'driver', 'user']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register endpoint (Admin only or open registration)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db.getAuthUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await db.createAuthUser({
      email: data.email,
      passwordHash,
      role: data.role || 'user',
      name: data.name,
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create session
    const expiresAt = getTokenExpiration(process.env.JWT_EXPIRES_IN || '24h');
    await db.createSession({
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
    });

    res.status(201).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Get user
    const user = await db.getAuthUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.updateAuthUserLastLogin(user.id);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create session
    const expiresAt = getTokenExpiration(process.env.JWT_EXPIRES_IN || '24h');
    await db.createSession({
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
    });

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
router.post('/logout', jwtRequired, async (req: any, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await db.deleteSession(token);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refresh_token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if session exists
    const session = await db.getSessionByRefreshToken(refresh_token);
    if (!session) {
      return res.status(401).json({ error: 'Session not found' });
    }

    // Get user
    const user = await db.getAuthUserById(payload.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update session
    await db.deleteSession(session.token);
    const expiresAt = getTokenExpiration(process.env.JWT_EXPIRES_IN || '24h');
    await db.createSession({
      userId: user.id,
      token: accessToken,
      refreshToken: newRefreshToken,
      expiresAt: expiresAt.toISOString(),
    });

    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Get current user endpoint
router.get('/me', jwtRequired, async (req: any, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await db.getAuthUserById(payload.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
```

## Step 6: Update Auth Middleware

Update `server/middleware/auth.ts` to support both Supabase and in-house JWT:

Add this function before `jwtRequired`:

```typescript
import { verifyAccessToken } from '../utils/auth-utils';

async function resolveUser(req: AuthenticatedRequest) {
  if (req.user) {
    return req.user;
  }

  // Try in-house JWT first
  const token = extractAccessToken(req);
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      // Get user from database
      const { db } = await import('../db');
      const user = await db.getAuthUserById(payload.userId);
      if (user && user.is_active) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: user.role as UserRole,
        };
        return req.user;
      }
    }
  }

  // Fallback to Supabase
  return await resolveSupabaseUser(req);
}
```

Then update `jwtRequired` to use `resolveUser` instead of `resolveSupabaseUser`.

## Step 7: Register Auth Routes

Add to `server/routes.ts` or `server/routes/index.ts`:

```typescript
import authRoutes from './auth';

// In registerRoutes or registerAllRoutes:
app.use('/api/auth', authRoutes);
```

## Step 8: Frontend Implementation

### Update AuthContext

Update `client/src/contexts/auth-context.tsx` to support both Supabase and in-house auth.

### Update Login Page

Update `client/src/pages/login.tsx` to use the new `/api/auth/login` endpoint.

## Step 9: Environment Variables

Add to `.env` and production environment:

```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

## Step 10: Create Default Admin User

Add a script or migration to create a default admin user:

```typescript
// In server/seed-data.ts or create a new script
import { db } from './db';
import { hashPassword } from './utils/auth-utils';

async function createDefaultAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@fabzclean.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await db.getAuthUserByEmail(adminEmail);
  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  const passwordHash = await hashPassword(adminPassword);
  await db.createAuthUser({
    email: adminEmail,
    passwordHash,
    role: 'admin',
    name: 'System Administrator',
  });

  console.log('Default admin user created:', adminEmail);
}
```

## Testing

1. Register a new user: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Access protected route: `GET /api/orders` with `Authorization: Bearer <token>`
4. Refresh token: `POST /api/auth/refresh`
5. Logout: `POST /api/auth/logout`

## Security Notes

1. **Change JWT secrets** in production
2. **Use HTTPS** in production
3. **Set secure cookie flags** if using cookies
4. **Implement rate limiting** on auth endpoints
5. **Regularly cleanup expired sessions**
6. **Use strong password requirements**

## Role-Based Access Control

Roles available:
- `admin` - Full access
- `manager` - Management access
- `employee` - Employee access
- `driver` - Driver access
- `user` - Basic user access

Use `requireRole(['admin', 'manager'])` middleware to protect routes.

