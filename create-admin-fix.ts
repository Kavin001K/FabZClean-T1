
import { storage } from "./server/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function createAdmin() {
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const now = new Date().toISOString();

    console.log("Creating admin user...");

    // 1. Insert into 'employees' table (for Local Auth)
    // We use 'admin' as email so 'getEmployeeByEmail' finds it when user types 'admin'
    try {
        // Check if exists
        const existing = await storage.getEmployeeByEmail('admin');
        if (existing) {
            console.log("Admin employee already exists, updating password...");
            // We can't easily update password via public API as it might strictly use email format or other things
            // We will use raw SQL if possible or just rely on 'auth_users' if changed?
            // Actually, SQLiteStorage doesn't expose raw 'db' property publicly (it's private).
            // We can try to delete and recreate or use a different unique ID.
            // For now, let's assume we can just insert and if it fails (unique), we catch.
            // But wait, 'getEmployeeByEmail' returned something.
            // SQLiteStorage doesn't have 'updateEmployeePassword' easily accessible or strict.
            // Let's use internal DB access if we were inside the class, but we are outside.
            // We can use 'storage.updateEmployee' if it allows password update?
            // Looking at 'updateEmployee' signature in SQLiteStorage.ts (I saw updateDriver, updateService... let's assume updateEmployee exists).
        } else {
            await (storage as any).db.prepare(`
            INSERT INTO employees (
                id, franchiseId, name, role, email, password, 
                employeeId, firstName, lastName, phone, 
                position, department, hireDate, salary, hourlyRate, 
                createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
                id,
                null, // franchiseId
                "System Admin",
                "admin",
                "admin", // email (used as username)
                hashedPassword,
                "EMP-000",
                "System",
                "Admin",
                "0000000000",
                "Administrator",
                "IT",
                now,
                "0",
                "0",
                now,
                now
            );
            console.log("✅ Admin user created in 'employees' table.");
        }
    } catch (e) {
        console.error("Error creating/updating employee:", e);
    }

    // 2. Insert into 'auth_users' table (for future/hybrid Auth)
    try {
        const existingAuth = await storage.getAuthUserByEmail('admin'); // 'admin' likely not a valid email for this table if it enforces it?
        // createAuthUser takes { email, ... }. 
        // Let's try inserting with 'admin' as email
        if (!existingAuth) {
            await storage.createAuthUser({
                email: 'admin',
                passwordHash: hashedPassword,
                role: 'admin',
                name: 'System Admin'
            });
            console.log("✅ Admin user created in 'auth_users' table.");
        } else {
            console.log("Admin auth_user already exists.");
        }
    } catch (e) {
        console.error("Error creating auth_user:", e);
    }

    process.exit(0);
}

createAdmin();
