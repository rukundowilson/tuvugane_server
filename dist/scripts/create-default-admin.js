"use strict";
/**
 * Creates default admin credentials for testing/development
 * Run with: npx ts-node src/scripts/create-default-admin.ts
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
const createDefaultAdmins = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔐 Creating Default Admin Credentials...\n');
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
        // Create SuperAdmins table if it doesn't exist
        console.log('Checking/Creating SuperAdmins table...');
        yield connection.execute(`
      CREATE TABLE IF NOT EXISTS superadmins (
        super_admin_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        is_verified TINYINT(1) DEFAULT 0,
        verification_token VARCHAR(255),
        token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (super_admin_id)
      )
    `);
        console.log('✅ SuperAdmins table ready\n');
        // Create Admins table if it doesn't exist
        console.log('Checking/Creating Admins table...');
        yield connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        admin_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        agency_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (admin_id)
      )
    `);
        console.log('✅ Admins table ready\n');
        // Create Super Admin
        const superAdmin = {
            name: 'Super Admin',
            email: 'superadmin@tuvugane.com',
            password: 'admin123',
            phone: '+250788000000'
        };
        console.log('Creating Super Admin...');
        // Check if super admin exists
        const [existingSuperAdmins] = yield connection.execute('SELECT * FROM superadmins WHERE email = ?', [superAdmin.email]);
        if (Array.isArray(existingSuperAdmins) && existingSuperAdmins.length > 0) {
            console.log('Super Admin already exists. Updating password...');
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(superAdmin.password, salt);
            yield connection.execute('UPDATE superadmins SET password = ?, name = ?, phone = ? WHERE email = ?', [hashedPassword, superAdmin.name, superAdmin.phone, superAdmin.email]);
            console.log('✅ Updated Super Admin\n');
        }
        else {
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(superAdmin.password, salt);
            yield connection.execute('INSERT INTO superadmins (name, email, password, phone, is_verified) VALUES (?, ?, ?, ?, ?)', [superAdmin.name, superAdmin.email, hashedPassword, superAdmin.phone, 1]);
            console.log('✅ Created Super Admin\n');
        }
        // Try to create Agency Admin (only if agencies exist)
        let agencies = [];
        try {
            const [agencyResults] = yield connection.execute('SELECT agency_id, name FROM agencies ORDER BY agency_id LIMIT 1');
            agencies = Array.isArray(agencyResults) ? agencyResults : [];
        }
        catch (error) {
            // Agencies table doesn't exist, skip agency admin creation
            console.log('⚠️  Agencies table not found. Skipping Agency Admin creation.');
        }
        if (agencies.length > 0) {
            const agency = agencies[0];
            const agencyAdmin = {
                name: 'Agency Admin',
                email: 'agencyadmin@tuvugane.com',
                password: 'admin123',
                agency_id: agency.agency_id
            };
            console.log(`Creating Agency Admin for agency: ${agency.name}...`);
            // Check if agency admin exists
            const [existingAgencyAdmins] = yield connection.execute('SELECT * FROM admins WHERE email = ?', [agencyAdmin.email]);
            if (Array.isArray(existingAgencyAdmins) && existingAgencyAdmins.length > 0) {
                console.log('Agency Admin already exists. Updating password...');
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(agencyAdmin.password, salt);
                yield connection.execute('UPDATE admins SET password_hash = ?, name = ?, agency_id = ? WHERE email = ?', [hashedPassword, agencyAdmin.name, agencyAdmin.agency_id, agencyAdmin.email]);
                console.log('✅ Updated Agency Admin\n');
            }
            else {
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(agencyAdmin.password, salt);
                yield connection.execute('INSERT INTO admins (name, email, password_hash, agency_id) VALUES (?, ?, ?, ?)', [agencyAdmin.name, agencyAdmin.email, hashedPassword, agencyAdmin.agency_id]);
                console.log('✅ Created Agency Admin\n');
            }
            console.log('📋 Agency Admin Credentials:');
            console.log(`   Email: ${agencyAdmin.email}`);
            console.log(`   Password: ${agencyAdmin.password}`);
            console.log(`   Agency: ${agency.name}\n`);
        }
        else {
            console.log('⚠️  No agencies found. Skipping Agency Admin creation.');
            console.log('   Create an agency first, then run this script again.\n');
        }
        console.log('📋 Super Admin Credentials:');
        console.log(`   Email: ${superAdmin.email}`);
        console.log(`   Password: ${superAdmin.password}\n`);
        console.log('✅ Admin credentials created successfully!');
        console.log('\n💡 You can now login with these credentials.');
    }
    catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Database connection failed. Please check your .env file:');
            console.error('   Make sure DB_PASSWORD is set correctly in .env');
        }
        else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('\n💡 Database not found. Please create the database first.');
        }
        process.exit(1);
    }
    finally {
        if (connection) {
            yield connection.end();
        }
        process.exit(0);
    }
});
createDefaultAdmins();
