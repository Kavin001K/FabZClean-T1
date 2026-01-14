
import { db } from "./server/db";
import bcrypt from "bcryptjs";

async function checkUsers() {
    try {
        console.log("Checking users in database...");
        const employees = await db.listEmployees();
        console.log(`Found ${employees.length} employees.`);

        for (const emp of employees) {
            console.log(`--------------------------------------------------`);
            console.log(`User: ${emp.name} (ID: ${emp.id})`);
            console.log(`Username: ${emp.username || emp.employeeId}`);
            console.log(`Email: ${emp.email}`);
            console.log(`Role: ${emp.role}`);

            if (!emp.password) {
                console.log("❌ No password set!");
                continue;
            }

            // Test "Durai@2025"
            const isMatchDurai = await bcrypt.compare("Durai@2025", emp.password);
            if (isMatchDurai) {
                console.log("✅ Password matches: 'Durai@2025'");
            } else {
                // Test "password123"
                const isMatchDef = await bcrypt.compare("password123", emp.password);
                if (isMatchDef) {
                    console.log("✅ Password matches: 'password123'");
                } else {
                    console.log("❌ Password does NOT match known defaults.");
                }
            }
        }
    } catch (error) {
        console.error("Error checking users:", error);
    }
}

checkUsers();
