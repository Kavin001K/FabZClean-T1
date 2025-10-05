import { SQLiteStorage } from "./SQLiteStorage";
// Use SQLite as the primary database
export const db = new SQLiteStorage("./fabzclean.db");
// For compatibility with existing imports
export { db as storage };
// Initialize with some logging
console.log("🗄️  Using SQLite database: ./fabzclean.db");
//# sourceMappingURL=db.js.map