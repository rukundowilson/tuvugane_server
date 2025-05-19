import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const adminEmail = 'taja@tuvugane.com';
const newPassword = 'password123';

async function updatePassword() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tuvugane'
    });
    
    console.log('Connected to MySQL database');
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password in the database
    const [result] = await connection.execute(
      'UPDATE SuperAdmins SET password = ? WHERE email = ?',
      [hashedPassword, adminEmail]
    );
    
    console.log('Password Update:');
    console.log('-----------------');
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`New Plain Password: ${newPassword}`);
    console.log(`New Hashed Password: ${hashedPassword}`);
    console.log(`Update Result:`, result);
    console.log('\nPassword has been updated successfully!');
    
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

updatePassword(); 