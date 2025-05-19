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
exports.deleteAgency = exports.updateAgency = exports.getAgencyById = exports.getAgencies = exports.createAgency = void 0;
const db_1 = require("../config/db");
// @desc    Create a new agency
// @route   POST /api/agencies
// @access  Private (Super Admin only)
const createAgency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, phone, address, description } = req.body;
        // Validate required fields
        if (!name) {
            res.status(400).json({ message: 'Agency name is required' });
            return;
        }
        // Check if agency with the same name already exists
        const existingAgencies = yield (0, db_1.query)('SELECT * FROM Agencies WHERE name = ?', [name]);
        if (existingAgencies.length > 0) {
            res.status(400).json({ message: 'An agency with this name already exists' });
            return;
        }
        // Insert the new agency
        const result = yield (0, db_1.query)('INSERT INTO Agencies (name, email, phone, address, description) VALUES (?, ?, ?, ?, ?)', [name, email || null, phone || null, address || null, description || null]);
        if (result.insertId) {
            // Fetch the newly created agency
            const agencies = yield (0, db_1.query)('SELECT * FROM Agencies WHERE agency_id = ?', [result.insertId]);
            res.status(201).json({
                message: 'Agency created successfully',
                agency: agencies[0]
            });
        }
        else {
            res.status(400).json({ message: 'Failed to create agency' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.createAgency = createAgency;
// @desc    Get all agencies
// @route   GET /api/agencies
// @access  Private
const getAgencies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agencies = yield (0, db_1.query)('SELECT * FROM Agencies ORDER BY name ASC');
        res.json(agencies);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getAgencies = getAgencies;
// @desc    Get agency by ID
// @route   GET /api/agencies/:id
// @access  Private
const getAgencyById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const agencies = yield (0, db_1.query)('SELECT * FROM Agencies WHERE agency_id = ?', [id]);
        if (agencies.length === 0) {
            res.status(404).json({ message: 'Agency not found' });
            return;
        }
        res.json(agencies[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getAgencyById = getAgencyById;
// @desc    Update agency
// @route   PUT /api/agencies/:id
// @access  Private (Super Admin only)
const updateAgency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, email, phone, address, description } = req.body;
        // Check if agency exists
        const agencies = yield (0, db_1.query)('SELECT * FROM Agencies WHERE agency_id = ?', [id]);
        if (agencies.length === 0) {
            res.status(404).json({ message: 'Agency not found' });
            return;
        }
        // Check if name is being changed and if it already exists
        if (name && name !== agencies[0].name) {
            const nameCheck = yield (0, db_1.query)('SELECT * FROM Agencies WHERE name = ? AND agency_id != ?', [name, id]);
            if (nameCheck.length > 0) {
                res.status(400).json({ message: 'An agency with this name already exists' });
                return;
            }
        }
        // Build the update query dynamically
        const updateFields = [];
        const updateValues = [];
        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email || null);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone || null);
        }
        if (address !== undefined) {
            updateFields.push('address = ?');
            updateValues.push(address || null);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description || null);
        }
        // Only update if there are fields to update
        if (updateFields.length === 0) {
            res.status(400).json({ message: 'No fields to update' });
            return;
        }
        // Add the agency ID to values array
        updateValues.push(id);
        // Execute the update query
        yield (0, db_1.query)(`UPDATE Agencies SET ${updateFields.join(', ')} WHERE agency_id = ?`, updateValues);
        // Fetch the updated agency
        const updatedAgencies = yield (0, db_1.query)('SELECT * FROM Agencies WHERE agency_id = ?', [id]);
        res.json({
            message: 'Agency updated successfully',
            agency: updatedAgencies[0]
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.updateAgency = updateAgency;
const deleteAgency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Check if agency exists
        const agencies = yield (0, db_1.query)('SELECT * FROM Agencies WHERE agency_id = ?', [id]);
        if (agencies.length === 0) {
            res.status(404).json({ message: 'Agency not found' });
            return;
        }
        // Check if agency has associated admins
        const admins = yield (0, db_1.query)('SELECT * FROM admins WHERE agency_id = ?', [id]);
        // Warn if agency has associated admins but proceed with deletion
        const hasAdmins = admins.length > 0;
        // Delete the agency (Admins will be handled by ON DELETE CASCADE)
        yield (0, db_1.query)('DELETE FROM agencies WHERE agency_id = ?', [id]);
        res.json({
            message: hasAdmins
                ? 'Agency and its associated admins deleted successfully'
                : 'Agency deleted successfully'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.deleteAgency = deleteAgency;
