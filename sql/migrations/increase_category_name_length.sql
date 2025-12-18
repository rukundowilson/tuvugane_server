-- Migration: Increase category name column length
-- This migration increases the VARCHAR length for the 'name' column in the categories table
-- to accommodate longer category names (up to 255 characters)

ALTER TABLE categories MODIFY COLUMN name VARCHAR(255) NOT NULL;

