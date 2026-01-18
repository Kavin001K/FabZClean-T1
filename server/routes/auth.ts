import { Router, Request, Response } from 'express';
import { AuthService } from '../auth-service';
import { authMiddleware, auditMiddleware } from '../middleware/employee-auth';
import { LocalStorage } from '../services/local-storage';
import multer from 'multer';

const router = Router();

// Configure Multer to use memory storage for processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

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

    // LOGGING: Explicitly log login success with role context
    await AuthService.logAction(
      result.employee.id!,
      result.employee.username,
      'login_success',
      'session',
      'active',
      {
        role: result.employee.role,
        franchiseId: result.employee.franchiseId,
        loginMethod: 'password'
      },
      ipAddress,
      req.get('user-agent')
    );

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
 * Upload profile image with optimization via LocalStorage service
 */
router.post('/upload-profile-image', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const employeeId = req.employee!.id!;
    const originalSize = req.file.size;

    console.log(`[Auth] Uploading profile image for ${req.employee?.employeeId}, size: ${Math.round(originalSize / 1024)}KB`);

    // 1. Save to Local Storage with optimization
    const imageUrl = await LocalStorage.saveProfileImage(
      employeeId,
      req.file.buffer,
      req.file.originalname
    );

    // 2. Update employee record with new URL
    const updatedEmployee = await AuthService.updateEmployee(
      employeeId,
      { profileImage: imageUrl },
      req.employee!.employeeId
    );

    if (!updatedEmployee) {
      // Clean up the saved file if DB update fails
      await LocalStorage.deleteFile(imageUrl);
      return res.status(404).json({ error: 'Employee not found' });
    }

    // 3. Log the action
    await AuthService.logAction(
      req.employee!.employeeId,
      req.employee!.username,
      'upload_profile_image',
      'user_profile',
      req.employee!.employeeId,
      {
        originalSizeKB: Math.round(originalSize / 1024),
        path: imageUrl
      },
      req.ip || req.connection.remoteAddress,
      req.get('user-agent'),
      req.employee!.franchiseId
    );

    console.log(`✅ Profile image saved for ${req.employee?.employeeId}: ${imageUrl}`);

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: imageUrl
    });
  } catch (error: any) {
    console.error('[Auth] Upload profile image error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload profile image' });
  }
});

export default router;
