import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/check-user', async (req: Request, res: Response) => {
    const { username, secret } = req.query;

    if (secret !== 'debug123') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const { data: employees, error } = await supabase
            .from('auth_employees')
            .select('*')
            .or(`username.eq."${username}",email.eq."${username}"`);

        if (error) {
            return res.json({ status: 'error', error: error.message });
        }

        if (!employees || employees.length === 0) {
            return res.json({ status: 'not_found', message: 'User not found in auth_employees' });
        }

        const emp = employees[0];
        const passwordMatch = await bcrypt.compare('admin123', emp.password_hash);

        return res.json({
            status: 'found',
            user: {
                id: emp.id,
                username: emp.username,
                isActive: emp.is_active,
                role: emp.role,
                hasPasswordHash: !!emp.password_hash,
                passwordMatchWithAdmin123: passwordMatch
            }
        });

    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/reset-password', async (req: Request, res: Response) => {
    const { username, secret } = req.query;

    if (secret !== 'debug123') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        // Generate hash using the server's bcrypt library
        const passwordHash = await bcrypt.hash('admin123', 10);

        const { data, error } = await supabase
            .from('auth_employees')
            .update({ password_hash: passwordHash, is_active: true })
            .eq('username', username)
            .select();

        if (error) {
            return res.json({ status: 'error', error: error.message });
        }

        return res.json({
            status: 'success',
            message: 'Password reset to admin123',
            user: data
        });

    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export const debugRouter = router;
```
