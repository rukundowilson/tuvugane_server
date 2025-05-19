"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const superAdminController_1 = require("../controllers/superAdminController");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.post('/register', superAdminController_1.registerSuperAdmin);
router.post('/login', superAdminController_1.loginSuperAdmin);
router.get('/verify/:token', superAdminController_1.verifySuperAdmin);
router.post('/resend-verification', superAdminController_1.resendVerification);
// Protected routes
router.get('/profile', authMiddleware_1.protect, authMiddleware_1.superAdminOnly, superAdminController_1.getSuperAdminProfile);
router.get('/', authMiddleware_1.protect, authMiddleware_1.superAdminOnly, superAdminController_1.getAllSuperAdmins);
// Admin management routes
router.post('/create-admin', authMiddleware_1.protect, authMiddleware_1.superAdminOnly, adminController_1.createAdmin);
exports.default = router;
