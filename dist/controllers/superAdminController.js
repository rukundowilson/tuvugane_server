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
exports.resendVerification = exports.getAllSuperAdmins = exports.getSuperAdminProfile = exports.loginSuperAdmin = exports.verifySuperAdmin = exports.registerSuperAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../config/db");
const generateToken_1 = __importDefault(require("../utils/generateToken"));
// @desc    Register a new super admin
// @route   POST /api/super-admin/register
// @access  Public
const registerSuperAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, phone } = req.body;
    try {
        // Check if super admin exists
        const existingAdmins = yield (0, db_1.query)('SELECT * FROM SuperAdmins WHERE email = ?', [email]);
        if (existingAdmins.length > 0) {
            res.status(400).json({ message: 'Super Admin already exists with this email' });
            return;
        }
        // Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // Create super admin - set as verified by default
        const result = yield (0, db_1.query)('INSERT INTO SuperAdmins (name, email, password, phone, is_verified) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, phone || null, 1] // Set is_verified to 1
        );
        if (result.insertId) {
            // Return success response with token for immediate login
            const token = (0, generateToken_1.default)(result.insertId);
            res.status(201).json({
                message: 'Super Admin registered successfully.',
                super_admin_id: result.insertId,
                token
            });
        }
        else {
            res.status(400).json({ message: 'Invalid super admin data' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.registerSuperAdmin = registerSuperAdmin;
// @desc    Verify super admin email
// @route   GET /api/super-admin/verify/:token
// @access  Public
const verifySuperAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.params;
    try {
        // Find super admin with this verification token
        const admins = yield (0, db_1.query)('SELECT * FROM SuperAdmins WHERE verification_token = ? AND token_expiry > NOW()', [token]);
        if (admins.length === 0) {
            res.status(400).json({ message: 'Invalid or expired verification token' });
            return;
        }
        // Update super admin to verified
        yield (0, db_1.query)('UPDATE SuperAdmins SET is_verified = 1, verification_token = NULL, token_expiry = NULL WHERE super_admin_id = ?', [admins[0].super_admin_id]);
        res.status(200).json({ message: 'Email verified successfully. You can now login.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.verifySuperAdmin = verifySuperAdmin;
// @desc    Auth super admin & get token
// @route   POST /api/super-admin/login
// @access  Public
const loginSuperAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        // Find super admin by email
        const admins = yield (0, db_1.query)('SELECT * FROM SuperAdmins WHERE email = ?', [email]);
        if (admins.length === 0) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const admin = admins[0];
        // Check if password matches
        const isMatch = yield bcryptjs_1.default.compare(password, admin.password);
        if (isMatch) {
            const response = {
                super_admin_id: admin.super_admin_id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                token: (0, generateToken_1.default)(admin.super_admin_id)
            };
            res.json(response);
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
exports.loginSuperAdmin = loginSuperAdmin;
// @desc    Get super admin profile
// @route   GET /api/super-admin/profile
// @access  Private
const getSuperAdminProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore - req.user is added by the auth middleware
        const adminId = req.user.id;
        const admins = yield (0, db_1.query)('SELECT super_admin_id, name, email, phone, created_at FROM SuperAdmins WHERE super_admin_id = ?', [adminId]);
        if (admins.length === 0) {
            res.status(404).json({ message: 'Super Admin not found' });
            return;
        }
        res.json(admins[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getSuperAdminProfile = getSuperAdminProfile;
// @desc    Get all super admins
// @route   GET /api/super-admin
// @access  Private (Super Admin only)
const getAllSuperAdmins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const superAdmins = yield (0, db_1.query)('SELECT super_admin_id, name, email, phone, created_at FROM SuperAdmins ORDER BY name ASC');
        res.json(superAdmins);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getAllSuperAdmins = getAllSuperAdmins;
// @desc    Check verification status and resend token if needed
// @route   POST /api/super-admin/resend-verification
// @access  Public
const resendVerification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        // Find super admin by email
        const admins = yield (0, db_1.query)('SELECT * FROM SuperAdmins WHERE email = ?', [email]);
        if (admins.length === 0) {
            res.status(404).json({ message: 'No account found with this email' });
            return;
        }
        const admin = admins[0];
        if (admin.is_verified) {
            res.status(400).json({ message: 'This account is already verified' });
            return;
        }
        // Generate new verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours
        // Update verification token
        yield (0, db_1.query)('UPDATE SuperAdmins SET verification_token = ?, token_expiry = ? WHERE super_admin_id = ?', [verificationToken, tokenExpiry, admin.super_admin_id]);
        res.status(200).json({
            message: 'New verification token generated',
            verification_token: verificationToken
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.resendVerification = resendVerification;
