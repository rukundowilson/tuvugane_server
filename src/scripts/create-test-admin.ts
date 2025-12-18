/**
 * This script creates a test admin for login testing.
 * Run with: npx ts-node src/scripts/create-test-admin.ts
 */

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createTestAdmin = async () => {
  console.log('Starting test admin creation...');
  
  let connection;
  
  try {
    // Create a direct database connection
    connection = await mysql.createConnection({
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
    const [existingAdmins] = await connection.execute(
      'SELECT * FROM admins WHERE email = ?', 
      [admin.email]
    );
    
    if (Array.isArray(existingAdmins) && existingAdmins.length > 0) {
      console.log('Admin with this email already exists. Updating password...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admin.password, salt);
      
      // Update the existing admin's password
      await connection.execute(
        'UPDATE admins SET password_hash = ? WHERE email = ?',
        [hashedPassword, admin.email]
      );
      
      console.log(`Updated password for admin: ${admin.email}`);
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admin.password, salt);

      // Insert new admin
      const [result] = await connection.execute(
        'INSERT INTO admins (name, email, password_hash, agency_id) VALUES (?, ?, ?, ?)',
        [admin.name, admin.email, hashedPassword, admin.agency_id]
      );

      console.log(`Created new test admin with email: ${admin.email}`);
    }
    
    // Print plaintext password for testing
    console.log('\nLogin credentials:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${admin.password}`);
    
  } catch (error) {
    console.error('Error creating test admin:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
};

createTestAdmin();
