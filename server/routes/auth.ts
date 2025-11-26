import express, { Request, Response } from 'express';
import { AuthService } from '../auth-service';
import { authMiddleware, roleMiddleware, auditMiddleware } from '../middleware/employee-auth';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const result = await AuthService.login(username, password, ipAddress);

    res.json({
      success: true,
      token: result.token,
      employee: result.employee,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client should delete token)
 */
router.post('/logout', authMiddleware, auditMiddleware('logout'), async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get current employee info
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('📍 /api/auth/me endpoint hit, employee:', req.employee?.employeeId);
    const employee = await AuthService.getEmployee(req.employee!.employeeId);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ success: true, employee });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch employee info' });
  }
});

/**
 * POST /api/auth/change-password
 * Change own password
 */
router.post('/change-password', authMiddleware, auditMiddleware('change_password'), async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // For now, only admin can change passwords
    // You can extend this to allow employees to change their own passwords
    if (req.employee!.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can change passwords' });
    }

    await AuthService.resetPassword(req.employee!.employeeId, newPassword, req.employee!.employeeId);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
});

export default router;
