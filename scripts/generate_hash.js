import bcrypt from 'bcryptjs';

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
    console.log(`Hash for '${password}': ${hash}`);
}).catch(err => {
    console.error(err);
});
