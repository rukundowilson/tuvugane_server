import express from 'express';
import multer from 'multer';
import { 
  createTicket,
  assignTicket,
  getTicketById,
  getUserTickets,
  getAgencyTickets,
  addTicketResponse,
  getTicketResponses,
  updateTicketStatus,
  getPublicTicketById,
  getPublicTicketResponses,
  addTicketFeedback
} from '../controllers/ticketController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer();

// Public routes (no authentication required)
router.post('/', upload.any(), createTicket);
router.get('/public/:id', getPublicTicketById);
router.get('/public/:ticketId/responses', getPublicTicketResponses);
router.post('/public/:ticketId/feedback', addTicketFeedback);

// Protected routes
router.post('/:ticketId/assign', protect, assignTicket);
router.get('/user', protect, getUserTickets);
router.get('/agency/:agencyId', protect, getAgencyTickets);
router.get('/:id', protect, getTicketById);
router.post('/:ticketId/responses', protect, addTicketResponse);
router.get('/:ticketId/responses', protect, getTicketResponses);
router.put('/:id/status', protect, updateTicketStatus);

export default router; 