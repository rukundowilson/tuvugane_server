/**
 * Script to run database migrations
 * Usage: npx ts-node scripts/run-migration.ts <migration-file>
 * Example: npx ts-node scripts/run-migration.ts sql/migrations/increase_category_name_length.sql
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const runMigration = async () => {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Usage: npx ts-node scripts/run-migration.ts <migration-file>');
    console.error('Example: npx ts-node scripts/run-migration.ts sql/migrations/increase_category_name_length.sql');
    process.exit(1);
  }

  const filePath = path.join(process.cwd(), migrationFile);

  if (!fs.existsSync(filePath)) {
    console.error(`Migration file not found: ${filePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, 'utf-8');

  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tuvugane'
    });

    console.log('✅ Connected to database');
    console.log(`📄 Running migration: ${migrationFile}\n`);

    await connection.query(sql);

    console.log('✅ Migration completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Database connection failed. Please check your .env file:');
      console.error('   - DB_HOST');
      console.error('   - DB_USER');
      console.error('   - DB_PASSWORD');
      console.error('   - DB_NAME');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
};

runMigration();

