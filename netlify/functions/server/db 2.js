"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.db = void 0;
const SQLiteStorage_1 = require("./SQLiteStorage");
// Use SQLite as the primary database
exports.db = new SQLiteStorage_1.SQLiteStorage("./fabzclean.db");
exports.storage = exports.db;
// Initialize with some logging
console.log("🗄️  Using SQLite database: ./fabzclean.db");
//# sourceMappingURL=db.js.map