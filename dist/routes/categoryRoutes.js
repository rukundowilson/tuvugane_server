"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categoryController_1 = require("../controllers/categoryController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.get('/', categoryController_1.getCategories);
router.get('/:categoryId/agency', categoryController_1.getAgencyByCategory);
router.get('/:categoryId/agencies', categoryController_1.getAgenciesByCategory);
// Protected routes (super admin only)
router.post('/', authMiddleware_1.protect, categoryController_1.createCategory);
router.get('/:id', authMiddleware_1.protect, categoryController_1.getCategoryById);
router.put('/:id', authMiddleware_1.protect, categoryController_1.updateCategory);
router.delete('/:id', authMiddleware_1.protect, categoryController_1.deleteCategory);
// Agency category mapping routes
router.post('/map', authMiddleware_1.protect, categoryController_1.mapCategoryToAgency);
router.get('/agency/:agencyId', authMiddleware_1.protect, categoryController_1.getAgencyCategoryMappings);
router.delete('/map/:mappingId', authMiddleware_1.protect, categoryController_1.deleteCategoryAgencyMapping);
exports.default = router;
