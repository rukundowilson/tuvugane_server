"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.post('/login', adminController_1.loginAdmin);
// Agency Admin Routes
router.get('/profile', authMiddleware_1.protect, adminController_1.getAdminProfile);
router.get('/by-agency/:agencyId', authMiddleware_1.protect, adminController_1.getAdminsByAgency);
// Super Admin Routes
router.post('/', authMiddleware_1.protect, authMiddleware_1.superAdminOnly, adminController_1.createAdmin);
router.get('/', authMiddleware_1.protect, authMiddleware_1.superAdminOnly, adminController_1.getAdmins);
router.get('/:id', authMiddleware_1.protect, adminController_1.getAdminById);
router.put('/:id', authMiddleware_1.protect, adminController_1.updateAdmin);
router.delete('/:id', authMiddleware_1.protect, authMiddleware_1.superAdminOnly, adminController_1.deleteAdmin);
exports.default = router;
