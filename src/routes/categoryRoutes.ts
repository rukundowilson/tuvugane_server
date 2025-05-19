import express from 'express';
import { 
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  mapCategoryToAgency,
  getAgencyCategoryMappings,
  deleteCategoryAgencyMapping,
  getAgencyByCategory,
  getAgenciesByCategory
} from '../controllers/categoryController';
import { protect, agencyAdminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:categoryId/agency', getAgencyByCategory);
router.get('/:categoryId/agencies', getAgenciesByCategory);

// Protected routes (super admin only)
router.post('/', protect, createCategory);
router.get('/:id', protect, getCategoryById);
router.put('/:id', protect, updateCategory);
router.delete('/:id', protect, deleteCategory);

// Agency category mapping routes
router.post('/map', protect, mapCategoryToAgency);
router.get('/agency/:agencyId', protect, getAgencyCategoryMappings);
router.delete('/map/:mappingId', protect, deleteCategoryAgencyMapping);

export default router; 