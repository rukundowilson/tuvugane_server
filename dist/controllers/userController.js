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
exports.getUserTickets = exports.getUserDashboard = exports.getProfile = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const auth_1 = require("../utils/auth");
// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, phone } = req.body;
    try {
        // Check if user exists
        const existingUsers = yield (0, db_1.query)('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            res.status(400).json({ message: 'User already exists with this email' });
            return;
        }
        // Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // Create user
        const result = yield (0, db_1.query)('INSERT INTO users (name, email, password, phone, is_anonymous) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, phone || null, 0]);
        if (result.insertId) {
            const [user] = yield (0, db_1.query)('SELECT * FROM users WHERE user_id = ?', [result.insertId]);
            res.status(201).json({
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                token: (0, generateToken_1.default)(user.user_id),
            });
        }
        else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.registerUser = registerUser;
// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        // Find user by email
        const users = yield (0, db_1.query)('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const user = users[0];
        // Check if password matches
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (isMatch) {
            res.json({
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                token: (0, generateToken_1.default)(user.user_id),
            });
        }
        else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.loginUser = loginUser;
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get user ID from the authenticated token
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded || !decoded.user_id) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        // Query the database for user profile using MySQL syntax
        const users = yield (0, db_1.query)(`SELECT 
        user_id,
        name,
        email,
        phone,
        created_at
      FROM users 
      WHERE user_id = ?`, [decoded.user_id]);
        if (users.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Return user profile without sensitive information
        const userProfile = users[0];
        res.json(userProfile);
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getProfile = getProfile;
// @desc    Get user profile and complaints
// @route   GET /api/users/dashboard
// @access  Private
const getUserDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get user ID from request
        if (!req.user || !req.user.id) {
            console.error('Dashboard access attempted without user ID in request');
            res.status(401).json({ message: 'Not authorized, missing user ID' });
            return;
        }
        const userId = req.user.id;
        console.log('Fetching dashboard data for user ID:', userId);
        // Get user profile
        const users = yield (0, db_1.query)('SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) {
            console.error(`User with ID ${userId} not found in database`);
            res.status(404).json({ message: 'User not found' });
            return;
        }
        console.log(`Found user: ${users[0].name} (${users[0].email})`);
        // Get user's tickets with category names and assignment details
        const tickets = yield (0, db_1.query)(`
      SELECT 
        t.ticket_id,
        t.subject,
        t.description,
        t.location,
        t.photo_url,
        t.status,
        t.created_at,
        t.updated_at,
        t.is_anonymous,
        c.name as category_name,
        c.category_id,
        a.name as assigned_agency_name,
        a.agency_id
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.category_id
      LEFT JOIN ticketassignments ta ON t.ticket_id = ta.ticket_id
      LEFT JOIN admins ad ON ta.admin_id = ad.admin_id
      LEFT JOIN agencies a ON ad.agency_id = a.agency_id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [userId]);
        console.log(`Found ${tickets.length} tickets for user`);
        // Get statistics
        const stats = yield (0, db_1.query)(`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tickets,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets
      FROM tickets
      WHERE user_id = ?
    `, [userId]);
        console.log('Dashboard data retrieved successfully');
        res.json({
            user: users[0],
            tickets,
            statistics: stats[0]
        });
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getUserDashboard = getUserDashboard;
// @desc    Get user tickets
// @route   GET /api/users/tickets
// @access  Private
const getUserTickets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        // Get user's tickets with category names
        const tickets = yield (0, db_1.query)(`
      SELECT 
        t.*,
        c.name as category_name,
        a.name as assigned_agency_name
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.category_id
      LEFT JOIN ticketassignments ta ON t.ticket_id = ta.ticket_id
      LEFT JOIN admins adm ON ta.admin_id = adm.admin_id
      LEFT JOIN agencies a ON adm.agency_id = a.agency_id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [user_id]);
        res.status(200).json({ tickets });
    }
    catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getUserTickets = getUserTickets;
