import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('fabzclean.db');
const password = 'admin123';
const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('Resetting admin password to:', password);

const stmt = db.prepare("UPDATE employees SET password = ? WHERE email = 'admin'");
const info = stmt.run(hash);

console.log('Changes:', info.changes);

if (info.changes === 0) {
    console.log('Admin user not found in SQLite DB.');
} else {
    console.log('Admin password updated successfully.');
}
