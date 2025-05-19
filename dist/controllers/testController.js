"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = void 0;
const testConnection = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Connection successful',
        timestamp: new Date().toISOString(),
        serverInfo: {
            node: process.version,
            environment: process.env.NODE_ENV
        }
    });
};
exports.testConnection = testConnection;
