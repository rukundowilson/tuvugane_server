import express from 'express';
import { 
  registerSuperAdmin, 
  loginSuperAdmin, 
  verifySuperAdmin, 
  getSuperAdminProfile,
  resendVerification,
  getAllSuperAdmins
} from '../controllers/superAdminController';
import { createAdmin } from '../controllers/adminController';
import { protect, superAdminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', registerSuperAdmin);
router.post('/login', loginSuperAdmin);
router.get('/verify/:token', verifySuperAdmin);
router.post('/resend-verification', resendVerification);

// Protected routes
router.get('/profile', protect, superAdminOnly, getSuperAdminProfile);
router.get('/', protect, superAdminOnly, getAllSuperAdmins);

// Admin management routes
router.post('/create-admin', protect, superAdminOnly, createAdmin);

export default router; 