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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminProfile = exports.loginAdmin = exports.deleteAdmin = exports.updateAdmin = exports.getAdminById = exports.getAdminsByAgency = exports.getAdmins = exports.createAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const generateToken_1 = __importDefault(require("../utils/generateToken"));
// @desc    Create a new admin for an agency
// @route   POST /api/admins
// @access  Private (Super Admin only)
const createAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, agency_id } = req.body;
        // Validate required fields
        if (!name || !email || !password || !agency_id) {
            res.status(400).json({ message: 'All fields are required: name, email, password, agency_id' });
            return;
        }
        // Check if admin with the same email already exists
        const existingAdmins = yield (0, db_1.query)('SELECT * FROM admins WHERE email = ?', [email]);
        if (existingAdmins.length > 0) {
            res.status(400).json({ message: 'An admin with this email already exists' });
            return;
        }
        // Check if the agency exists
        const agencies = yield (0, db_1.query)('SELECT * FROM agencies WHERE agency_id = ?', [agency_id]);
        if (agencies.length === 0) {
            res.status(400).json({ message: 'The specified agency does not exist' });
            return;
        }
        // Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // Insert the new admin
        const result = yield (0, db_1.query)('INSERT INTO admins (name, email, password_hash, agency_id) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, agency_id]);
        if (result.insertId) {
            // Fetch the newly created admin
            const admins = yield (0, db_1.query)('SELECT admin_id, name, email, agency_id, created_at FROM admins WHERE admin_id = ?', [result.insertId]);
            // Generate token for the new admin with role information
            const token = (0, generateToken_1.default)(admins[0].admin_id, 'agency_admin', admins[0].agency_id);
            const response = Object.assign(Object.assign({}, admins[0]), { token, role: 'agency_admin' });
            res.status(201).json({
                message: 'Admin created successfully',
                admin: response
            });
        }
        else {
            res.status(400).json({ message: 'Failed to create admin' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.createAdmin = createAdmin;
// @desc    Get all admins
// @route   GET /api/admins
// @access  Private (Super Admin only)
const getAdmins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Join with Agencies table to get agency name
        const admins = yield (0, db_1.query)(`
      SELECT a.admin_id, a.name, a.email, a.agency_id, a.created_at, ag.name as agency_name
      FROM admins a
      LEFT JOIN agencies ag ON a.agency_id = ag.agency_id
      ORDER BY a.name ASC
    `);
        res.json(admins);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getAdmins = getAdmins;
// @desc    Get admins by agency
// @route   GET /api/admins/agency/:agencyId
// @access  Private (Super Admin and Agency Admins)
const getAdminsByAgency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { agencyId } = req.params;
        // Check if the agency exists
        const agencies = yield (0, db_1.query)('SELECT * FROM agencies WHERE agency_id = ?', [agencyId]);
        if (agencies.length === 0) {
            res.status(404).json({ message: 'Agency not found' });
            return;
        }
        const admins = yield (0, db_1.query)(`
      SELECT admin_id, name, email, agency_id, created_at
      FROM admins
      WHERE agency_id = ?
      ORDER BY name ASC
    `, [agencyId]);
        res.json(admins);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getAdminsByAgency = getAdminsByAgency;
// @desc    Get admin by ID
// @route   GET /api/admins/:id
// @access  Private (Super Admin and Same Agency Admins)
const getAdminById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Join with Agencies table to get agency name
        const admins = yield (0, db_1.query)(`
      SELECT a.admin_id, a.name, a.email, a.agency_id, a.created_at, ag.name as agency_name
      FROM admins a
      LEFT JOIN agencies ag ON a.agency_id = ag.agency_id
      WHERE a.admin_id = ?
    `, [id]);
        if (admins.length === 0) {
            res.status(404).json({ message: 'Admin not found' });
            return;
        }
        res.json(admins[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getAdminById = getAdminById;
// @desc    Update admin
// @route   PUT /api/admins/:id
// @access  Private (Super Admin and Same Admin)
const updateAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, email, password, agency_id } = req.body;
        // Check if admin exists
        const admins = yield (0, db_1.query)('SELECT * FROM admins WHERE admin_id = ?', [id]);
        if (admins.length === 0) {
            res.status(404).json({ message: 'Admin not found' });
            return;
        }
        // Check if email is being changed and if it already exists
        if (email && email !== admins[0].email) {
            const emailCheck = yield (0, db_1.query)('SELECT * FROM admins WHERE email = ? AND admin_id != ?', [email, id]);
            if (emailCheck.length > 0) {
                res.status(400).json({ message: 'An admin with this email already exists' });
                return;
            }
        }
        // Check if agency_id is provided and exists
        if (agency_id) {
            const agencies = yield (0, db_1.query)('SELECT * FROM agencies WHERE agency_id = ?', [agency_id]);
            if (agencies.length === 0) {
                res.status(400).json({ message: 'The specified agency does not exist' });
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
            updateValues.push(email);
        }
        if (password !== undefined) {
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
            updateFields.push('password_hash = ?');
            updateValues.push(hashedPassword);
        }
        if (agency_id !== undefined) {
            updateFields.push('agency_id = ?');
            updateValues.push(agency_id);
        }
        // Only update if there are fields to update
        if (updateFields.length === 0) {
            res.status(400).json({ message: 'No fields to update' });
            return;
        }
        // Add the admin ID to values array
        updateValues.push(id);
        // Execute the update query
        yield (0, db_1.query)(`UPDATE admins SET ${updateFields.join(', ')} WHERE admin_id = ?`, updateValues);
        // Fetch the updated admin with agency name
        const updatedAdmins = yield (0, db_1.query)(`
      SELECT a.admin_id, a.name, a.email, a.agency_id, a.created_at, ag.name as agency_name
      FROM admins a
      LEFT JOIN agencies ag ON a.agency_id = ag.agency_id
      WHERE a.admin_id = ?
    `, [id]);
        res.json({
            message: 'Admin updated successfully',
            admin: updatedAdmins[0]
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.updateAdmin = updateAdmin;
// @desc    Delete admin
// @route   DELETE /api/admins/:id
// @access  Private (Super Admin only)
const deleteAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Check if admin exists
        const admins = yield (0, db_1.query)('SELECT * FROM admins WHERE admin_id = ?', [id]);
        if (admins.length === 0) {
            res.status(404).json({ message: 'Admin not found' });
            return;
        }
        // Delete the admin
        yield (0, db_1.query)('DELETE FROM admins WHERE admin_id = ?', [id]);
        res.json({ message: 'Admin deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.deleteAdmin = deleteAdmin;
// @desc    Admin login
// @route   POST /api/admins/login
// @access  Public
const loginAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Login attempt with:', { email: req.body.email });
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        // Find admin by email
        const admins = yield (0, db_1.query)('SELECT * FROM admins WHERE email = ?', [email]);
        console.log('Admin found:', admins.length > 0 ? 'Yes' : 'No');
        if (admins.length === 0) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const admin = admins[0];
        console.log('Admin db record:', {
            admin_id: admin.admin_id,
            email: admin.email,
            has_password: !!admin.password_hash,
            agency_id: admin.agency_id
        });
        // Check if password matches
        try {
            console.log('Comparing password with hash...');
            const isMatch = yield bcryptjs_1.default.compare(password, admin.password_hash);
            console.log('Password match result:', isMatch);
            if (!isMatch) {
                res.status(401).json({ message: 'Invalid email or password' });
                return;
            }
        }
        catch (err) {
            console.error('Error comparing passwords:', err);
            res.status(500).json({ message: 'Error validating credentials' });
            return;
        }
        // Check if admin belongs to an agency
        if (!admin.agency_id) {
            res.status(403).json({ message: 'This account is not associated with an agency' });
            return;
        }
        // Get agency name
        const agencies = yield (0, db_1.query)('SELECT name FROM agencies WHERE agency_id = ?', [admin.agency_id]);
        const agencyName = agencies.length > 0 ? agencies[0].name : null;
        if (!agencyName) {
            res.status(403).json({ message: 'Associated agency not found' });
            return;
        }
        // Generate token with admin_id and role
        const token = (0, generateToken_1.default)(admin.admin_id, 'agency_admin', admin.agency_id);
        console.log('Generated token payload:', {
            id: admin.admin_id,
            role: 'agency_admin',
            agency_id: admin.agency_id
        });
        const response = {
            admin_id: admin.admin_id,
            name: admin.name,
            email: admin.email,
            agency_id: admin.agency_id,
            created_at: admin.created_at,
            token,
            role: 'agency_admin'
        };
        res.json(Object.assign(Object.assign({}, response), { agency_name: agencyName }));
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.loginAdmin = loginAdmin;
// @desc    Get admin profile
// @route   GET /api/admins/profile
// @access  Private
const getAdminProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore - req.user is added by the auth middleware
        const adminId = req.user.id;
        // Join with Agencies table to get agency name
        const admins = yield (0, db_1.query)(`
      SELECT a.admin_id, a.name, a.email, a.agency_id, a.created_at, ag.name as agency_name
      FROM admins a
      LEFT JOIN agencies ag ON a.agency_id = ag.agency_id
      WHERE a.admin_id = ?
    `, [adminId]);
        if (admins.length === 0) {
            res.status(404).json({ message: 'Admin not found' });
            return;
        }
        res.json(admins[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getAdminProfile = getAdminProfile;
