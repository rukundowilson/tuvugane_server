"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const generateToken = (id, role, agency_id) => {
    const payload = { id };
    if (role) {
        payload.role = role;
    }
    if (agency_id) {
        payload.agency_id = agency_id;
    }
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '30d',
    });
};
exports.default = generateToken;
