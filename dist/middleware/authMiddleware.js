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
exports.agencyAdminOnly = exports.superAdminOnly = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let token;
        // Check if token exists in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({ message: 'Not authorized, no token' });
            return;
        }
        try {
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            console.log('Token decoded:', decoded);
            // Add user to request with extended information
            req.user = {
                id: decoded.id,
                role: decoded.role,
                agency_id: decoded.agency_id
            };
            next();
        }
        catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.protect = protect;
// Middleware to check if a user is a Super Admin
const superAdminOnly = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authorized, no user found' });
            return;
        }
        // If role is included in the token, use it for faster verification
        if (req.user.role === 'super-admin') {
            next();
            return;
        }
        // Otherwise check database (backward compatibility)
        const superAdmins = yield (0, db_1.query)('SELECT * FROM SuperAdmins WHERE super_admin_id = ?', [req.user.id]);
        if (superAdmins.length === 0) {
            res.status(403).json({ message: 'Not authorized, super admin access required' });
            return;
        }
        // User is a super admin, proceed
        next();
    }
    catch (error) {
        console.error('Super admin check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.superAdminOnly = superAdminOnly;
// Middleware to check if a user is an Agency Admin
const agencyAdminOnly = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authorized, no user found' });
            return;
        }
        // If role is included in the token, use it for faster verification
        if (req.user.role === 'agency_admin') {
            next();
            return;
        }
        // Otherwise check database (backward compatibility)
        const admins = yield (0, db_1.query)('SELECT * FROM Admins WHERE admin_id = ?', [req.user.id]);
        if (admins.length === 0) {
            res.status(403).json({ message: 'Not authorized, agency admin access required' });
            return;
        }
        // User is an agency admin, proceed
        next();
    }
    catch (error) {
        console.error('Agency admin check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.agencyAdminOnly = agencyAdminOnly;
