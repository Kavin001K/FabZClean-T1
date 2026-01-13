// Generate correct bcrypt hash for Admin@123
import bcrypt from 'bcryptjs';

const password = 'Admin@123';
const hash = await bcrypt.hash(password, 10);

console.log('Password hash for Admin@123:');
console.log(hash);
