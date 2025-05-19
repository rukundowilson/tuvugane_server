"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const agencyController_1 = require("../controllers/agencyController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.get('/', agencyController_1.getAgencies);
// Protected routes
router.post('/', authMiddleware_1.protect, agencyController_1.createAgency);
router.get('/:id', authMiddleware_1.protect, agencyController_1.getAgencyById);
router.put('/:id', authMiddleware_1.protect, agencyController_1.updateAgency);
router.delete('/:id', authMiddleware_1.protect, agencyController_1.deleteAgency);
exports.default = router;
