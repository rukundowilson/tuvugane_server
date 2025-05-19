import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getProfile,
  getUserDashboard,
  getUserTickets
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getProfile);
router.get('/dashboard', protect, getUserDashboard);
router.get('/tickets', protect, getUserTickets);

export default router; 