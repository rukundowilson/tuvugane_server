"use strict";
/**
 * Script to create admin credentials (Super Admin or Agency Admin)
 *
 * Usage:
 *   Super Admin: npx ts-node src/scripts/create-admin.ts super
 *   Agency Admin: npx ts-node src/scripts/create-admin.ts agency
 *   Interactive: npx ts-node src/scripts/create-admin.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const readline = __importStar(require("readline"));
dotenv_1.default.config();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const question = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};
const createSuperAdmin = (connection) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n=== Creating Super Admin ===\n');
    const name = yield question('Name: ');
    const email = yield question('Email: ');
    const password = yield question('Password: ');
    const phone = (yield question('Phone (optional, press Enter to skip): ')) || null;
    if (!name || !email || !password) {
        console.error('Name, email, and password are required!');
        return;
    }
    // Check if super admin exists
    const [existingAdmins] = yield connection.execute('SELECT * FROM superadmins WHERE email = ?', [email]);
    if (Array.isArray(existingAdmins) && existingAdmins.length > 0) {
        console.log('\nSuper Admin with this email already exists. Updating password...');
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        yield connection.execute('UPDATE superadmins SET password = ?, name = ?, phone = ? WHERE email = ?', [hashedPassword, name, phone, email]);
        console.log(`\n✅ Updated Super Admin: ${email}`);
    }
    else {
        // Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // Insert new super admin
        yield connection.execute('INSERT INTO superadmins (name, email, password, phone, is_verified) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, phone, 1]);
        console.log(`\n✅ Created Super Admin: ${email}`);
    }
    console.log('\n📋 Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
});
const createAgencyAdmin = (connection) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n=== Creating Agency Admin ===\n');
    // List available agencies
    const [agencies] = yield connection.execute('SELECT agency_id, name FROM agencies ORDER BY name');
    if (!Array.isArray(agencies) || agencies.length === 0) {
        console.error('\n❌ No agencies found in the database!');
        console.log('Please create an agency first before creating an agency admin.');
        return;
    }
    console.log('\nAvailable Agencies:');
    agencies.forEach((agency) => {
        console.log(`   ${agency.agency_id}. ${agency.name}`);
    });
    const agencyIdInput = yield question('\nAgency ID: ');
    const agencyId = parseInt(agencyIdInput);
    if (!agencyId || isNaN(agencyId)) {
        console.error('Invalid agency ID!');
        return;
    }
    // Verify agency exists
    const [agencyCheck] = yield connection.execute('SELECT * FROM agencies WHERE agency_id = ?', [agencyId]);
    if (!Array.isArray(agencyCheck) || agencyCheck.length === 0) {
        console.error('Agency not found!');
        return;
    }
    const name = yield question('Name: ');
    const email = yield question('Email: ');
    const password = yield question('Password: ');
    if (!name || !email || !password) {
        console.error('Name, email, and password are required!');
        return;
    }
    // Check if admin exists
    const [existingAdmins] = yield connection.execute('SELECT * FROM admins WHERE email = ?', [email]);
    if (Array.isArray(existingAdmins) && existingAdmins.length > 0) {
        console.log('\nAdmin with this email already exists. Updating password and agency...');
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        yield connection.execute('UPDATE admins SET password_hash = ?, name = ?, agency_id = ? WHERE email = ?', [hashedPassword, name, agencyId, email]);
        console.log(`\n✅ Updated Agency Admin: ${email}`);
    }
    else {
        // Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // Insert new admin
        yield connection.execute('INSERT INTO admins (name, email, password_hash, agency_id) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, agencyId]);
        console.log(`\n✅ Created Agency Admin: ${email}`);
    }
    console.log('\n📋 Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Agency: ${agencyCheck[0].name}`);
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('🔐 Admin Credentials Creator\n');
    let connection = null;
    try {
        // Create database connection
        connection = yield promise_1.default.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tuvugane'
        });
        console.log('✅ Connected to database\n');
        // Get admin type from command line or prompt
        const args = process.argv.slice(2);
        let adminType = (_a = args[0]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (!adminType || (adminType !== 'super' && adminType !== 'agency')) {
            adminType = yield question('Admin type (super/agency): ');
        }
        if (adminType === 'super') {
            yield createSuperAdmin(connection);
        }
        else if (adminType === 'agency') {
            yield createAgencyAdmin(connection);
        }
        else {
            console.error('Invalid admin type! Use "super" or "agency"');
        }
    }
    catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Database connection failed. Please check your .env file:');
            console.error('   - DB_HOST');
            console.error('   - DB_USER');
            console.error('   - DB_PASSWORD');
            console.error('   - DB_NAME');
        }
    }
    finally {
        if (connection) {
            yield connection.end();
        }
        rl.close();
        process.exit(0);
    }
});
main();
