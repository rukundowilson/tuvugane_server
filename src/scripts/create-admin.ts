/**
 * Script to create admin credentials (Super Admin or Agency Admin)
 * 
 * Usage:
 *   Super Admin: npx ts-node src/scripts/create-admin.ts super
 *   Agency Admin: npx ts-node src/scripts/create-admin.ts agency
 *   Interactive: npx ts-node src/scripts/create-admin.ts
 */

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

const createSuperAdmin = async (connection: mysql.Connection) => {
  console.log('\n=== Creating Super Admin ===\n');
  
  const name = await question('Name: ');
  const email = await question('Email: ');
  const password = await question('Password: ');
  const phone = await question('Phone (optional, press Enter to skip): ') || null;

  if (!name || !email || !password) {
    console.error('Name, email, and password are required!');
    return;
  }

  // Check if super admin exists
  const [existingAdmins] = await connection.execute(
    'SELECT * FROM superadmins WHERE email = ?',
    [email]
  );

  if (Array.isArray(existingAdmins) && existingAdmins.length > 0) {
    console.log('\nSuper Admin with this email already exists. Updating password...');
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await connection.execute(
      'UPDATE superadmins SET password = ?, name = ?, phone = ? WHERE email = ?',
      [hashedPassword, name, phone, email]
    );
    
    console.log(`\n✅ Updated Super Admin: ${email}`);
  } else {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new super admin
    await connection.execute(
      'INSERT INTO superadmins (name, email, password, phone, is_verified) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, 1]
    );

    console.log(`\n✅ Created Super Admin: ${email}`);
  }

  console.log('\n📋 Credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
};

const createAgencyAdmin = async (connection: mysql.Connection) => {
  console.log('\n=== Creating Agency Admin ===\n');

  // List available agencies
  const [agencies] = await connection.execute(
    'SELECT agency_id, name FROM agencies ORDER BY name'
  ) as [any[], any];

  if (!Array.isArray(agencies) || agencies.length === 0) {
    console.error('\n❌ No agencies found in the database!');
    console.log('Please create an agency first before creating an agency admin.');
    return;
  }

  console.log('\nAvailable Agencies:');
  agencies.forEach((agency: any) => {
    console.log(`   ${agency.agency_id}. ${agency.name}`);
  });

  const agencyIdInput = await question('\nAgency ID: ');
  const agencyId = parseInt(agencyIdInput);

  if (!agencyId || isNaN(agencyId)) {
    console.error('Invalid agency ID!');
    return;
  }

  // Verify agency exists
  const [agencyCheck] = await connection.execute(
    'SELECT * FROM agencies WHERE agency_id = ?',
    [agencyId]
  ) as [any[], any];

  if (!Array.isArray(agencyCheck) || agencyCheck.length === 0) {
    console.error('Agency not found!');
    return;
  }

  const name = await question('Name: ');
  const email = await question('Email: ');
  const password = await question('Password: ');

  if (!name || !email || !password) {
    console.error('Name, email, and password are required!');
    return;
  }

  // Check if admin exists
  const [existingAdmins] = await connection.execute(
    'SELECT * FROM admins WHERE email = ?',
    [email]
  ) as [any[], any];

  if (Array.isArray(existingAdmins) && existingAdmins.length > 0) {
    console.log('\nAdmin with this email already exists. Updating password and agency...');
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await connection.execute(
      'UPDATE admins SET password_hash = ?, name = ?, agency_id = ? WHERE email = ?',
      [hashedPassword, name, agencyId, email]
    );
    
    console.log(`\n✅ Updated Agency Admin: ${email}`);
  } else {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new admin
    await connection.execute(
      'INSERT INTO admins (name, email, password_hash, agency_id) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, agencyId]
    );

    console.log(`\n✅ Created Agency Admin: ${email}`);
  }

  console.log('\n📋 Credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Agency: ${agencyCheck[0].name}`);
};

const main = async () => {
  console.log('🔐 Admin Credentials Creator\n');

  let connection: mysql.Connection | null = null;

  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tuvugane'
    });

    console.log('✅ Connected to database\n');

    // Get admin type from command line or prompt
    const args = process.argv.slice(2);
    let adminType = args[0]?.toLowerCase();

    if (!adminType || (adminType !== 'super' && adminType !== 'agency')) {
      adminType = await question('Admin type (super/agency): ');
    }

    if (adminType === 'super') {
      await createSuperAdmin(connection);
    } else if (adminType === 'agency') {
      await createAgencyAdmin(connection);
    } else {
      console.error('Invalid admin type! Use "super" or "agency"');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Database connection failed. Please check your .env file:');
      console.error('   - DB_HOST');
      console.error('   - DB_USER');
      console.error('   - DB_PASSWORD');
      console.error('   - DB_NAME');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
    rl.close();
    process.exit(0);
  }
};

main();

