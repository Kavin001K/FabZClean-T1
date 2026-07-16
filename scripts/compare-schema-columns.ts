import "../server/load-env";
import { createClient } from "@supabase/supabase-js";
import * as schema from "../shared/schema";
import fetch from "node-fetch";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Comparing shared/schema.ts columns with database columns...");
  
  // Find all Drizzle table definitions
  const tableKeys = Object.keys(schema).filter(key => {
    const obj = (schema as any)[key];
    return obj && typeof obj === 'object' && obj[Symbol.for('drizzle:Columns')];
  });
  
  for (const key of tableKeys) {
    const tableObj = (schema as any)[key];
    const dbTableName = tableObj[Symbol.for('drizzle:Name')] || tableObj[Symbol.for('drizzle:OriginalName')];
    const columnsObj = tableObj[Symbol.for('drizzle:Columns')];
    const schemaColumns = Object.keys(columnsObj).map(colKey => columnsObj[colKey].name);
    
    // Fetch 1 row or use OpenAPI definitions to get table columns
    const { data, error } = await supabase.from(dbTableName).select("*").limit(1);
    if (error) {
      console.log(`❌ Table "${dbTableName}": failed to query (${error.message})`);
      continue;
    }
    
    let dbColumns: string[] = [];
    if (data.length > 0) {
      dbColumns = Object.keys(data[0]);
    } else {
      // Fetch openapi schema to get the columns for empty tables
      try {
        const rootRes = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: { apikey: supabaseKey }
        });
        const openapi = await rootRes.json() as any;
        const definition = openapi.definitions[dbTableName];
        if (definition && definition.properties) {
          dbColumns = Object.keys(definition.properties);
        }
      } catch (err: any) {
        console.log(`⚠️ Failed to fetch OpenAPI properties for empty table "${dbTableName}":`, err.message);
      }
    }
    
    const missingInDb = schemaColumns.filter(c => !dbColumns.includes(c));
    const extraInDb = dbColumns.filter(c => !schemaColumns.includes(c));
    
    if (missingInDb.length > 0 || extraInDb.length > 0) {
      console.log(`📊 Table "${dbTableName}" (key: ${key}):`);
      if (missingInDb.length > 0) {
        console.log(`  ❌ Missing in DB (defined in schema):`, missingInDb);
      }
      if (extraInDb.length > 0) {
        console.log(`  ⚠️ Extra in DB (not in schema):`, extraInDb);
      }
    } else {
      console.log(`✅ Table "${dbTableName}" is in sync!`);
    }
  }
}

main().catch(console.error);
