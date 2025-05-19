"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.post('/register', userController_1.registerUser);
router.post('/login', userController_1.loginUser);
// Protected routes
router.get('/profile', authMiddleware_1.protect, userController_1.getProfile);
router.get('/dashboard', authMiddleware_1.protect, userController_1.getUserDashboard);
router.get('/tickets', authMiddleware_1.protect, userController_1.getUserTickets);
exports.default = router;
