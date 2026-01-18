
import { SQLiteStorage } from './server/SQLiteStorage';
import path from 'path';

const dbPath = path.resolve('./fabzclean.db');
const storage = new SQLiteStorage(dbPath);

async function checkEmployees() {
    console.log('Checking employees in DB...');
    try {
        const stmt = (storage as any).db.prepare('SELECT * FROM employees');
        const employees = stmt.all();
        console.log(`Found ${employees.length} employees:`);
        employees.forEach((emp: any) => {
            console.log(`- ID: ${emp.id}, Email: ${emp.email}, Username: ${emp.username || 'N/A'}, Role: ${emp.role}, PasswordHash: ${emp.password ? emp.password.substring(0, 10) + '...' : 'None'}`);
        });
    } catch (err) {
        console.error('Error querying employees:', err);
    }
}

checkEmployees();
