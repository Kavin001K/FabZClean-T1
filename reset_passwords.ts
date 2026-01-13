
import { SQLiteStorage } from './server/SQLiteStorage';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve('./fabzclean.db');
const storage = new SQLiteStorage(dbPath);

async function resetPasswords() {
    console.log('Resetting passwords...');
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const stmt = (storage as any).db.prepare('UPDATE employees SET password = ?');
        const result = stmt.run(hashedPassword);
        console.log(`Updated ${result.changes} employees with password: ${password}`);
    } catch (err) {
        console.error('Error updating passwords:', err);
    }
}

resetPasswords();
