import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing VITE_SUPABASE_URL/SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('🗑️ Fetching existing services from Supabase...');
        const { data: existingServices, error: fetchError } = await supabase.from('services').select('id');

        if (fetchError) {
            console.error('Error fetching:', fetchError);
            return;
        }

        if (existingServices && existingServices.length > 0) {
            console.log(`🗑️ Deleting ${existingServices.length} old services...`);
            for (const service of existingServices) {
                await supabase.from('services').delete().eq('id', service.id);
            }
        } else {
            console.log('No existing services found to delete.');
        }

        const newServices = [
            { name: "Shirt", category: "Wash Service", description: "WS001 | 890100000001 | White/Color | Wash + Starch", price: 45, duration: "120 mins", status: "Active" },
            { name: "Pant", category: "Wash Service", description: "WS002 | 890100000002 | White/Color | Wash + Starch", price: 50, duration: "120 mins", status: "Active" },
            { name: "Dhoti", category: "Wash Service", description: "WS003 | 890100000003 | White/Color | Wash + Starch", price: 50, duration: "120 mins", status: "Active" },
            { name: "Shirt", category: "Wash Service", description: "WS004 | 890100000004 | Wash + Iron", price: 45, duration: "120 mins", status: "Active" },
            { name: "Pant", category: "Wash Service", description: "WS005 | 890100000005 | Wash + Iron", price: 45, duration: "120 mins", status: "Active" },
            { name: "Jeans", category: "Wash Service", description: "WS006 | 890100000006 | Wash + Iron", price: 45, duration: "120 mins", status: "Active" },

            { name: "Shirt / T-Shirt", category: "Premium Clothing", description: "PC001 | 890100000101", price: 90, duration: "120 mins", status: "Active" },
            { name: "Dhoti", category: "Premium Clothing", description: "PC002 | 890100000102", price: 90, duration: "120 mins", status: "Active" },
            { name: "Silk Shirt / Silk Dhoti", category: "Premium Clothing", description: "PC003 | 890100000103", price: 120, duration: "120 mins", status: "Active" },
            { name: "Coat / Blazer", category: "Premium Clothing", description: "PC004 | 890100000104", price: 255, duration: "120 mins", status: "Active" },
            { name: "Sherwani", category: "Premium Clothing", description: "PC005 | 890100000105", price: 400, duration: "120 mins", status: "Active" },

            { name: "Shirt / T-Shirt", category: "Regular Clothing", description: "RC001 | 890100000201", price: 75, duration: "120 mins", status: "Active" },
            { name: "Pant / Shorts", category: "Regular Clothing", description: "RC002 | 890100000202", price: 75, duration: "120 mins", status: "Active" },
            { name: "Dhoti", category: "Regular Clothing", description: "RC003 | 890100000203", price: 75, duration: "120 mins", status: "Active" },

            { name: "Bed Sheet (Single)", category: "Household Items", description: "HH001 | 890100000301", price: 90, duration: "120 mins", status: "Active" },
            { name: "Bed Sheet (Double)", category: "Household Items", description: "HH002 | 890100000302", price: 140, duration: "120 mins", status: "Active" },
            { name: "Sports Shoes / Sneakers", category: "Household Items", description: "HH003 | 890100000303", price: 300, duration: "120 mins", status: "Active" },
            { name: "Leather Shoe", category: "Household Items", description: "HH004 | 890100000304", price: 400, duration: "120 mins", status: "Active" }
        ];

        console.log(`⏳ Inserting ${newServices.length} new services into Supabase...`);
        const { error: insertError } = await supabase.from('services').insert(newServices);

        if (insertError) {
            console.error('Error inserting:', insertError);
        } else {
            console.log('✨ Services correctly updated in Supabase!');
        }
    } catch (error) {
        console.error('❌ Failed to update services:', error);
    }
}

run();
