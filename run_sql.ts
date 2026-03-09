import fs from 'fs';
const sql = fs.readFileSync('payment_rpcs.sql', 'utf8');
console.log(sql);
