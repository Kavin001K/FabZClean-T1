/**
 * FIX ADMIN ACCOUNT SCRIPT
 * Run on EC2: npx tsx server/fix-admin.ts
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'server', 'secure_data', 'fabzclean.db');

console.log('🔧 Fixing Admin Account...\n');

if (!fs.existsSync(DB_PATH)) {
  console.log('❌ Database not found. Run: npm run db:setup');
  process.exit(1);
}

const db = new Database(DB_PATH);
const now = new Date().toISOString();
const passwordHash = bcrypt.hashSync('Durai@2025', 10);

// Delete any existing admin
db.prepare("DELETE FROM employees WHERE employeeId = 'myfabclean' OR employeeId = 'admin'").run();

// Create proper admin account
db.prepare(`
  INSERT INTO employees (
    id, franchiseId, employeeId, firstName, lastName, email, phone,
    position, department, salary, role, password, status, hireDate, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'admin-user-id',
  null,  // Admin sees ALL franchises
  'admin@myfabclean.com',  // This is both the employeeId AND email
  'System',
  'Admin',
  'admin@myfabclean.com',
  '9999999999',
  'Administrator',
  'Management',
  '100000.00',
  'admin',
  passwordHash,
  'active',  // EXPLICITLY set to active
  now,
  now,
  now
);

console.log('✅ Admin account created!\n');
console.log('='.repeat(50));
console.log('🔑 LOGIN CREDENTIALS:');
console.log('='.repeat(50));
console.log('');
console.log('   Username: admin@myfabclean.com');
console.log('   Password: Durai@2025');
console.log('');
console.log('='.repeat(50));

// Verify
const admin = db.prepare("SELECT * FROM employees WHERE email = 'admin@myfabclean.com'").get() as any;
if (admin) {
  console.log('\n✅ Verified admin exists:');
  console.log(`   ID: ${admin.id}`);
  console.log(`   EmployeeId: ${admin.employeeId}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Status: ${admin.status}`);
  console.log(`   Has Password: ${!!admin.password}`);
}

db.close();
console.log('\n🚀 Now restart your server: pm2 restart all');
