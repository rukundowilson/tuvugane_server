import express from 'express';
import { 
  createAdmin,
  getAdmins,
  getAdminsByAgency,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  loginAdmin,
  getAdminProfile
} from '../controllers/adminController';
import { protect, agencyAdminOnly, superAdminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/login', loginAdmin);

// Agency Admin Routes
router.get('/profile', protect, getAdminProfile);
router.get('/by-agency/:agencyId', protect, getAdminsByAgency);

// Super Admin Routes
router.post('/', protect, superAdminOnly, createAdmin);
router.get('/', protect, superAdminOnly, getAdmins);
router.get('/:id', protect, getAdminById);
router.put('/:id', protect, updateAdmin);
router.delete('/:id', protect, superAdminOnly, deleteAdmin);

export default router; 