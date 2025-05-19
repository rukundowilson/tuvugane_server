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
exports.authenticateToken = void 0;
const auth_1 = require("../utils/auth");
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded || !decoded.user_id) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        // Add user info to request using the unified shape
        req.user = { id: decoded.user_id };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
exports.authenticateToken = authenticateToken;
