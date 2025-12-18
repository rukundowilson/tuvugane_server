import { Request, Response } from 'express';
import { pool } from '../config/db';
import { asyncHandler } from '../middleware/asyncHandler';

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Super Admin)
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a category name');
  }

  // Validate name length (max 255 characters)
  if (name.length > 255) {
    res.status(400);
    throw new Error('Category name must be 255 characters or less');
  }

  // Check if category already exists
  const [existingCategories] = await pool.query(
    'SELECT * FROM categories WHERE name = ?',
    [name]
  );

  if (Array.isArray(existingCategories) && existingCategories.length > 0) {
    res.status(400);
    throw new Error('Category with this name already exists');
  }

  // Create new category
  const [result] = await pool.query(
    'INSERT INTO categories (name) VALUES (?)',
    [name]
  );

  if ('insertId' in result) {
    const [newCategory] = await pool.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: Array.isArray(newCategory) ? newCategory[0] : newCategory
    });
  } else {
    res.status(400);
    throw new Error('Failed to create category');
  }
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
  
  res.status(200).json({
    success: true,
    data: categories
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private (Super Admin)
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const [categories] = await pool.query(
    'SELECT * FROM categories WHERE category_id = ?',
    [req.params.id]
  );

  if (!Array.isArray(categories) || categories.length === 0) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.status(200).json({
    success: true,
    data: categories[0]
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Super Admin)
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a category name');
  }

  // Validate name length (max 255 characters)
  if (name.length > 255) {
    res.status(400);
    throw new Error('Category name must be 255 characters or less');
  }

  // Check if category exists
  const [categories] = await pool.query(
    'SELECT * FROM categories WHERE category_id = ?',
    [req.params.id]
  );

  if (!Array.isArray(categories) || categories.length === 0) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Check if new name already exists
  const [existingCategories] = await pool.query(
    'SELECT * FROM categories WHERE name = ? AND category_id != ?',
    [name, req.params.id]
  );

  if (Array.isArray(existingCategories) && existingCategories.length > 0) {
    res.status(400);
    throw new Error('Category with this name already exists');
  }

  // Update category
  await pool.query(
    'UPDATE categories SET name = ? WHERE category_id = ?',
    [name, req.params.id]
  );

  const [updatedCategory] = await pool.query(
    'SELECT * FROM categories WHERE category_id = ?',
    [req.params.id]
  );

  res.status(200).json({
    success: true,
    data: Array.isArray(updatedCategory) ? updatedCategory[0] : updatedCategory
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Super Admin)
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  // Check if category exists
  const [categories] = await pool.query(
    'SELECT * FROM categories WHERE category_id = ?',
    [req.params.id]
  );

  if (!Array.isArray(categories) || categories.length === 0) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Delete category
  await pool.query('DELETE FROM categories WHERE category_id = ?', [req.params.id]);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Map a category to an agency
// @route   POST /api/categories/map
// @access  Private (Agency Admin)
export const mapCategoryToAgency = asyncHandler(async (req: Request, res: Response) => {
  const { agency_id, category_id } = req.body;

  if (!agency_id || !category_id) {
    res.status(400);
    throw new Error('Agency ID and Category ID are required');
  }

  // Check if agency exists
  const [agencies] = await pool.query(
    'SELECT * FROM agencies WHERE agency_id = ?',
    [agency_id]
  );

  if (!Array.isArray(agencies) || agencies.length === 0) {
    res.status(404);
    throw new Error('Agency not found');
  }

  // Check if category exists
  const [categories] = await pool.query(
    'SELECT * FROM categories WHERE category_id = ?',
    [category_id]
  );

  if (!Array.isArray(categories) || categories.length === 0) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Check if mapping already exists
  const [existingMappings] = await pool.query(
    'SELECT * FROM agencycategorymap WHERE agency_id = ? AND category_id = ?',
    [agency_id, category_id]
  );

  if (Array.isArray(existingMappings) && existingMappings.length > 0) {
    res.status(400);
    throw new Error('This category is already mapped to this agency');
  }

  // Create mapping
  const [result] = await pool.query(
    'INSERT INTO agencycategorymap (agency_id, category_id) VALUES (?, ?)',
    [agency_id, category_id]
  );

  if ('insertId' in result) {
    const [newMapping] = await pool.query(
      'SELECT * FROM agencycategorymap WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: Array.isArray(newMapping) ? newMapping[0] : newMapping
    });
  } else {
    res.status(400);
    throw new Error('Failed to create mapping');
  }
});

// @desc    Get categories mapped to an agency
// @route   GET /api/categories/agency/:agencyId
// @access  Private (Agency Admin)
export const getAgencyCategoryMappings = asyncHandler(async (req: Request, res: Response) => {
  const { agencyId } = req.params;

  // Check if agency exists
  const [agencies] = await pool.query(
    'SELECT * FROM agencies WHERE agency_id = ?',
    [agencyId]
  );

  if (!Array.isArray(agencies) || agencies.length === 0) {
    res.status(404);
    throw new Error('Agency not found');
  }

  // Get all categories mapped to this agency
  const [mappings] = await pool.query(`
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
});

// @desc    Delete a category-agency mapping
// @route   DELETE /api/categories/map/:mappingId
// @access  Private (Agency Admin)
export const deleteCategoryAgencyMapping = asyncHandler(async (req: Request, res: Response) => {
  const { mappingId } = req.params;

  // Check if mapping exists
  const [mappings] = await pool.query(
    'SELECT * FROM agencycategorymap WHERE id = ?',
    [mappingId]
  );

  if (!Array.isArray(mappings) || mappings.length === 0) {
    res.status(404);
    throw new Error('Mapping not found');
  }

  // Delete mapping
  await pool.query('DELETE FROM agencycategorymap WHERE id = ?', [mappingId]);

  res.status(200).json({
    success: true,
    message: 'Category mapping removed successfully'
  });
});

// @desc    Get the agency responsible for a specific category
// @route   GET /api/categories/:categoryId/agency
// @access  Public
export const getAgencyByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  // Check if category exists
  const [categories] = await pool.query(
    'SELECT * FROM categories WHERE category_id = ?',
    [categoryId]
  );

  if (!Array.isArray(categories) || categories.length === 0) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Get agency responsible for this category
  const [mappings] = await pool.query(`
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
});

// @desc    Get all agencies mapped to a specific category
// @route   GET /api/categories/:categoryId/agencies
// @access  Public
export const getAgenciesByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  // Check if category exists
  const [categories] = await pool.query(
    'SELECT * FROM categories WHERE category_id = ?',
    [categoryId]
  );

  if (!Array.isArray(categories) || categories.length === 0) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Get all agencies mapped to this category
  const [mappings] = await pool.query(`
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
}); 