"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgenciesByCategory = exports.getAgencyByCategory = exports.deleteCategoryAgencyMapping = exports.getAgencyCategoryMappings = exports.mapCategoryToAgency = exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getCategories = exports.createCategory = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../middleware/asyncHandler");
// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Super Admin)
exports.createCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    if (!name) {
        res.status(400);
        throw new Error('Please provide a category name');
    }
    // Check if category already exists
    const [existingCategories] = yield db_1.pool.query('SELECT * FROM categories WHERE name = ?', [name]);
    if (Array.isArray(existingCategories) && existingCategories.length > 0) {
        res.status(400);
        throw new Error('Category with this name already exists');
    }
    // Create new category
    const [result] = yield db_1.pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    if ('insertId' in result) {
        const [newCategory] = yield db_1.pool.query('SELECT * FROM categories WHERE category_id = ?', [result.insertId]);
        res.status(201).json({
            success: true,
            data: Array.isArray(newCategory) ? newCategory[0] : newCategory
        });
    }
    else {
        res.status(400);
        throw new Error('Failed to create category');
    }
}));
// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [categories] = yield db_1.pool.query('SELECT * FROM categories ORDER BY name');
    res.status(200).json({
        success: true,
        data: categories
    });
}));
// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private (Super Admin)
exports.getCategoryById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [categories] = yield db_1.pool.query('SELECT * FROM categories WHERE category_id = ?', [req.params.id]);
    if (!Array.isArray(categories) || categories.length === 0) {
        res.status(404);
        throw new Error('Category not found');
    }
    res.status(200).json({
        success: true,
        data: categories[0]
    });
}));
// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Super Admin)
exports.updateCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    if (!name) {
        res.status(400);
        throw new Error('Please provide a category name');
    }
    // Check if category exists
    const [categories] = yield db_1.pool.query('SELECT * FROM categories WHERE category_id = ?', [req.params.id]);
    if (!Array.isArray(categories) || categories.length === 0) {
        res.status(404);
        throw new Error('Category not found');
    }
    // Check if new name already exists
    const [existingCategories] = yield db_1.pool.query('SELECT * FROM categories WHERE name = ? AND category_id != ?', [name, req.params.id]);
    if (Array.isArray(existingCategories) && existingCategories.length > 0) {
        res.status(400);
        throw new Error('Category with this name already exists');
    }
    // Update category
    yield db_1.pool.query('UPDATE categories SET name = ? WHERE category_id = ?', [name, req.params.id]);
    const [updatedCategory] = yield db_1.pool.query('SELECT * FROM categories WHERE category_id = ?', [req.params.id]);
    res.status(200).json({
        success: true,
        data: Array.isArray(updatedCategory) ? updatedCategory[0] : updatedCategory
    });
}));
// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Super Admin)
exports.deleteCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if category exists
    const [categories] = yield db_1.pool.query('SELECT * FROM categories WHERE category_id = ?', [req.params.id]);
    if (!Array.isArray(categories) || categories.length === 0) {
        res.status(404);
        throw new Error('Category not found');
    }
    // Delete category
    yield db_1.pool.query('DELETE FROM categories WHERE category_id = ?', [req.params.id]);
    res.status(200).json({
        success: true,
        data: {}
    });
}));
// @desc    Map a category to an agency
// @route   POST /api/categories/map
// @access  Private (Agency Admin)
exports.mapCategoryToAgency = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { agency_id, category_id } = req.body;
    if (!agency_id || !category_id) {
        res.status(400);
        throw new Error('Agency ID and Category ID are required');
    }
    // Check if agency exists
    const [agencies] = yield db_1.pool.query('SELECT * FROM agencies WHERE agency_id = ?', [agency_id]);
    if (!Array.isArray(agencies) || agencies.length === 0) {
        res.status(404);
        throw new Error('Agency not found');
    }
    // Check if category exists
    const [categories] = yield db_1.pool.query('SELECT * FROM categories WHERE category_id = ?', [category_id]);
    if (!Array.isArray(categories) || categories.length === 0) {
        res.status(404);
        throw new Error('Category not found');
    }
    // Check if mapping already exists
    const [existingMappings] = yield db_1.pool.query('SELECT * FROM agencycategorymap WHERE agency_id = ? AND category_id = ?', [agency_id, category_id]);
    if (Array.isArray(existingMappings) && existingMappings.length > 0) {
        res.status(400);
        throw new Error('This category is already mapped to this agency');
    }
    // Create mapping
    const [result] = yield db_1.pool.query('INSERT INTO agencycategorymap (agency_id, category_id) VALUES (?, ?)', [agency_id, category_id]);
    if ('insertId' in result) {
        const [newMapping] = yield db_1.pool.query('SELECT * FROM agencycategorymap WHERE id = ?', [result.insertId]);
        res.status(201).json({
            success: true,
            data: Array.isArray(newMapping) ? newMapping[0] : newMapping
        });
    }
    else {
        res.status(400);
        throw new Error('Failed to create mapping');
    }
}));
// @desc    Get categories mapped to an agency
// @route   GET /api/categories/agency/:agencyId
// @access  Private (Agency Admin)
exports.getAgencyCategoryMappings = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { agencyId } = req.params;
    // Check if agency exists
    const [agencies] = yield db_1.pool.query('SELECT * FROM agencies WHERE agency_id = ?', [agencyId]);
    if (!Array.isArray(agencies) || agencies.length === 0) {
        res.status(404);
        throw new Error('Agency not found');
    }
    // Get all categories mapped to this agency
    const [mappings] = yield db_1.pool.query(`
    SELECT c.*, acm.id as mapping_id
    FROM categories c
    JOIN agencycategorymap acm ON c.category_id = acm.category_id
    WHERE acm.agency_id = ?
    ORDER BY c.name
  `, [agencyId]);
    res.status(200).json({
        success: true,
        data: mappings
    });
}));
// @desc    Delete a category-agency mapping
// @route   DELETE /api/categories/map/:mappingId
// @access  Private (Agency Admin)
exports.deleteCategoryAgencyMapping = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { mappingId } = req.params;
    // Check if mapping exists
    const [mappings] = yield db_1.pool.query('SELECT * FROM agencycategorymap WHERE id = ?', [mappingId]);
    if (!Array.isArray(mappings) || mappings.length === 0) {
        res.status(404);
        throw new Error('Mapping not found');
    }
    // Delete mapping
    yield db_1.pool.query('DELETE FROM agencycategorymap WHERE id = ?', [mappingId]);
    res.status(200).json({
        success: true,
        message: 'Category mapping removed successfully'
    });
}));
// @desc    Get the agency responsible for a specific category
// @route   GET /api/categories/:categoryId/agency
// @access  Public
exports.getAgencyByCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    // Check if category exists
    const [categories] = yield db_1.pool.query('SELECT * FROM categories WHERE category_id = ?', [categoryId]);
    if (!Array.isArray(categories) || categories.length === 0) {
        res.status(404);
        throw new Error('Category not found');
    }
    // Get agency responsible for this category
    const [mappings] = yield db_1.pool.query(`
    SELECT a.*, acm.id as mapping_id
    FROM agencies a
    JOIN agencycategorymap acm ON a.agency_id = acm.agency_id
    WHERE acm.category_id = ?
    LIMIT 1
  `, [categoryId]);
    if (!Array.isArray(mappings) || mappings.length === 0) {
        res.status(404);
        throw new Error('No agency is mapped to this category');
    }
    res.status(200).json({
        success: true,
        data: mappings[0]
    });
}));
// @desc    Get all agencies mapped to a specific category
// @route   GET /api/categories/:categoryId/agencies
// @access  Public
exports.getAgenciesByCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    // Check if category exists
    const [categories] = yield db_1.pool.query('SELECT * FROM categories WHERE category_id = ?', [categoryId]);
    if (!Array.isArray(categories) || categories.length === 0) {
        res.status(404);
        throw new Error('Category not found');
    }
    // Get all agencies mapped to this category
    const [mappings] = yield db_1.pool.query(`
    SELECT a.*, acm.id as mapping_id
    FROM agencies a
    JOIN agencycategorymap acm ON a.agency_id = acm.agency_id
    WHERE acm.category_id = ?
    ORDER BY a.name
  `, [categoryId]);
    res.status(200).json({
        success: true,
        data: mappings
    });
}));
