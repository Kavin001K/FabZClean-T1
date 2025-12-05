
import bcrypt from "bcryptjs";
import { storage } from "./server/storage";

async function verifyPass() {
    console.log("Checking admin password...");
    const employee = await storage.getEmployeeByEmail("admin");

    if (!employee) {
        console.log("❌ Admin employee not found!");
        process.exit(1);
    }

    console.log("Found employee:", employee.email);
    const hash = employee.password;
    console.log("Hash in DB:", hash);

    const password = "admin123";
    const isValid = await bcrypt.compare(password, hash);
    console.log("Password 'admin123' match:", isValid);
}

verifyPass();
