"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const ticketController_1 = require("../controllers/ticketController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const upload = (0, multer_1.default)();
// Public routes (no authentication required)
router.post('/', upload.any(), ticketController_1.createTicket);
router.get('/public/:id', ticketController_1.getPublicTicketById);
router.get('/public/:ticketId/responses', ticketController_1.getPublicTicketResponses);
router.post('/public/:ticketId/feedback', ticketController_1.addTicketFeedback);
// Protected routes
router.post('/:ticketId/assign', authMiddleware_1.protect, ticketController_1.assignTicket);
router.get('/user', authMiddleware_1.protect, ticketController_1.getUserTickets);
router.get('/agency/:agencyId', authMiddleware_1.protect, ticketController_1.getAgencyTickets);
router.get('/:id', authMiddleware_1.protect, ticketController_1.getTicketById);
router.post('/:ticketId/responses', authMiddleware_1.protect, ticketController_1.addTicketResponse);
router.get('/:ticketId/responses', authMiddleware_1.protect, ticketController_1.getTicketResponses);
router.put('/:id/status', authMiddleware_1.protect, ticketController_1.updateTicketStatus);
exports.default = router;
