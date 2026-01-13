/**
 * RESET ADMIN PASSWORD SCRIPT
 * Run this on EC2 to reset the admin password if login fails
 * 
 * Usage: npx ts-node server/reset-admin-password.ts
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(__dirname, 'fabzclean.db');

console.log('🔧 FabZClean Admin Password Reset');
console.log('==================================\n');

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
    console.log(`❌ Database not found at: ${DB_PATH}`);
    console.log('');
    console.log('Run this command first to create the database:');
    console.log('   npm run db:setup');
    process.exit(1);
}

const db = new Database(DB_PATH);

// Check if employees table exists
try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'").get();
    if (!tables) {
        console.log('❌ employees table does not exist');
        console.log('Run: npm run db:setup');
        process.exit(1);
    }
} catch (err) {
    console.log('❌ Error checking database:', err);
    process.exit(1);
}

// List all employees
console.log('📋 Current employees in database:');
const employees = db.prepare("SELECT id, employeeId, email, role, status FROM employees").all();

if (employees.length === 0) {
    console.log('   (No employees found - database needs seeding)');
    console.log('');
    console.log('Run: npm run db:setup');
    process.exit(1);
}

employees.forEach((e: any) => {
    console.log(`   - ${e.employeeId || 'N/A'} | ${e.email || 'N/A'} | Role: ${e.role} | Status: ${e.status}`);
});

// Reset admin password
const newPassword = 'Durai@2025';
const passwordHash = bcrypt.hashSync(newPassword, 10);

console.log('\n🔐 Resetting password for all admin/manager users...\n');

// Update admin user
const adminResult = db.prepare(`
  UPDATE employees 
  SET password = ?, status = 'active', updatedAt = ?
  WHERE employeeId = 'myfabclean' OR role = 'admin'
`).run(passwordHash, new Date().toISOString());

console.log(`   ✓ Updated ${adminResult.changes} admin user(s)`);

// Also update managers with default password
const mgrPasswordHash = bcrypt.hashSync('password123', 10);
const mgrResult = db.prepare(`
  UPDATE employees 
  SET password = ?, status = 'active', updatedAt = ?
  WHERE role = 'franchise_manager' OR role = 'manager'
`).run(mgrPasswordHash, new Date().toISOString());

console.log(`   ✓ Updated ${mgrResult.changes} manager user(s)`);

// Verify the admin exists
const admin = db.prepare("SELECT * FROM employees WHERE employeeId = 'myfabclean'").get() as any;

if (admin) {
    console.log('\n✅ Admin user verified:');
    console.log(`   Employee ID: ${admin.employeeId}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Password hash set: ${admin.password ? 'Yes' : 'No'}`);
} else {
    console.log('\n⚠️ Admin user "myfabclean" not found. Creating it now...');

    const insertAdmin = db.prepare(`
    INSERT INTO employees (id, employeeId, firstName, lastName, email, phone, position, department, salary, role, password, status, hireDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const now = new Date().toISOString();
    insertAdmin.run(
        'admin-user-id',
        'myfabclean',
        'System',
        'Admin',
        'admin@myfabclean.com',
        '9999999999',
        'Administrator',
        'Management',
        '100000.00',
        'admin',
        passwordHash,
        'active',
        now,
        now,
        now
    );

    console.log('   ✓ Admin user created');
}

console.log('\n' + '='.repeat(50));
console.log('🔑 LOGIN CREDENTIALS:');
console.log('='.repeat(50));
console.log('');
console.log('   ADMIN (Full Access):');
console.log('   ├─ Employee ID: myfabclean');
console.log('   └─ Password: Durai@2025');
console.log('');
console.log('   MANAGERS (Franchise Access):');
console.log('   ├─ mgr-pollachi / password123');
console.log('   └─ mgr-kin / password123');
console.log('');
console.log('='.repeat(50));
console.log('✅ Password reset complete!');
console.log('');
console.log('Now restart your server:');
console.log('   pm2 restart all');
console.log('   # or');
console.log('   npm run dev');
console.log('');

db.close();
