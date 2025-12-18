"use strict";
/**
 * This script creates a test admin for login testing.
 * Run with: npx ts-node src/scripts/create-test-admin.ts
 */
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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const createTestAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Starting test admin creation...');
    let connection;
    try {
        // Create a direct database connection
        connection = yield promise_1.default.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tuvugane'
        });
        console.log('Connected to database');
        // Test admin details
        const admin = {
            name: 'Agency Admin User',
            email: 'agency@example.com',
            password: 'password123',
            agency_id: 4 // Make sure this agency exists
        };
        // Check if admin with this email already exists
        const [existingAdmins] = yield connection.execute('SELECT * FROM admins WHERE email = ?', [admin.email]);
        if (Array.isArray(existingAdmins) && existingAdmins.length > 0) {
            console.log('Admin with this email already exists. Updating password...');
            // Hash password
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(admin.password, salt);
            // Update the existing admin's password
            yield connection.execute('UPDATE admins SET password_hash = ? WHERE email = ?', [hashedPassword, admin.email]);
            console.log(`Updated password for admin: ${admin.email}`);
        }
        else {
            // Hash password
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(admin.password, salt);
            // Insert new admin
            const [result] = yield connection.execute('INSERT INTO admins (name, email, password_hash, agency_id) VALUES (?, ?, ?, ?)', [admin.name, admin.email, hashedPassword, admin.agency_id]);
            console.log(`Created new test admin with email: ${admin.email}`);
        }
        // Print plaintext password for testing
        console.log('\nLogin credentials:');
        console.log(`Email: ${admin.email}`);
        console.log(`Password: ${admin.password}`);
    }
    catch (error) {
        console.error('Error creating test admin:', error);
    }
    finally {
        if (connection) {
            yield connection.end();
            console.log('Database connection closed');
        }
        process.exit(0);
    }
});
createTestAdmin();
