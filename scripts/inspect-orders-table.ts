import * as schema from "../shared/schema";

async function main() {
  console.log("Keys of schema.orders:", Object.keys(schema.orders));
  // In Drizzle, the columns are typically stored under schema.orders[Symbol.for('drizzle:Columns')] or schema.orders._.columns
  // Let's print the entire schema.orders object structure safely (avoiding circular structures)
  console.log("Type of schema.orders:", typeof schema.orders);
  const keys = Object.getOwnPropertyNames(schema.orders);
  console.log("Property names of schema.orders:", keys);
  const symbols = Object.getOwnPropertySymbols(schema.orders);
  console.log("Symbols of schema.orders:", symbols);
  
  // Let's print the keys of the columns object if it exists
  const table = schema.orders as any;
  const columns = table[Symbol.for('drizzle:Columns')] || (table._ ? table._.columns : null);
  if (columns) {
    console.log("Found columns:", Object.keys(columns));
  } else {
    console.log("Could not find columns directly.");
  }
}

main();
