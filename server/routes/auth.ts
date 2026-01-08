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

    // Allow any authenticated user to change their own password
    await AuthService.changePassword(req.employee!.employeeId, currentPassword, newPassword);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
});

/**
 * PUT /api/auth/update-profile
 * Update own profile (any authenticated user)
 */
router.put('/update-profile', authMiddleware, auditMiddleware('update_profile'), async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, address, profileImage } = req.body;

    console.log('[Auth] Update profile for:', req.employee?.employeeId, { fullName, email, phone, hasImage: !!profileImage });

    // Update the current user's own profile
    const updatedEmployee = await AuthService.updateEmployee(
      req.employee!.id!,
      { fullName, email, phone, address, profileImage },
      req.employee!.employeeId
    );

    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ success: true, employee: updatedEmployee });
  } catch (error: any) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

/**
 * POST /api/auth/upload-profile-image
 * Upload profile image (base64)
 */
router.post('/upload-profile-image', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Validate image data format (should be base64 or data URL)
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format. Please provide a valid image.' });
    }

    // Check image size (max 500KB after base64 encoding)
    const sizeInBytes = Buffer.from(imageData.split(',')[1] || '', 'base64').length;
    if (sizeInBytes > 500 * 1024) {
      return res.status(400).json({ error: 'Image too large. Maximum size is 500KB.' });
    }

    console.log(`[Auth] Uploading profile image for ${req.employee?.employeeId}, size: ${Math.round(sizeInBytes / 1024)}KB`);

    // Update employee with profile image
    const updatedEmployee = await AuthService.updateEmployee(
      req.employee!.id!,
      { profileImage: imageData },
      req.employee!.employeeId
    );

    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: imageData
    });
  } catch (error: any) {
    console.error('[Auth] Upload profile image error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload profile image' });
  }
});

export default router;
