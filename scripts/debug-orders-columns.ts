import "../server/load-env";
import axios from "axios";
import * as schema from "../shared/schema";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

async function main() {
  try {
    const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });

    const openApiSchema = response.data;
    const dbTable = openApiSchema.definitions.orders;
    const dbColumns = Object.keys(dbTable.properties);

    const tableObj = (schema as any).orders;
    const drizzleColumns = Object.keys(tableObj._.columns).map(col => {
      return tableObj._.columns[col].name;
    });

    console.log("Drizzle 'orders' columns:", drizzleColumns);
    console.log("Database 'orders' columns:", dbColumns);
    
    const missing = drizzleColumns.filter(c => !dbColumns.includes(c));
    console.log("Missing in DB:", missing);
    process.exit(0);
  } catch (error: any) {
    console.error(error);
    process.exit(1);
  }
}

main();
