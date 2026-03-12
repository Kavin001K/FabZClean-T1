const bcrypt = require('bcryptjs');
require('dotenv/config');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
    const { data: users, error } = await supabase.from('employees').select('id, employee_id, email, role');
    console.log('Users:', users);
    console.log('Error:', error);
}
main();
