import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tuvugane',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
const connectDB = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log(`MySQL Connected: ${process.env.DB_HOST}`);
    connection.release();
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Execute SQL query with parameters
export const query = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error: any) {
    console.error(`Query error: ${error.message}`);
    throw error;
  }
};

export default connectDB; 
