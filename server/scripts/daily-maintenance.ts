/**
 * Daily Maintenance Script
 * 
 * Handles database optimization, backup creation, and log cleanup.
 * Should be scheduled to run daily (e.g., at 3 AM).
 * 
 * Operations:
 * 1. VACUUM - Rebuilds the DB file for optimal size
 * 2. ANALYZE - Updates query optimization statistics
 * 3. Backup - Creates timestamped backup copy
 * 4. Log Cleanup - Archives old audit logs
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

// Path configuration
const SECURE_DATA_PATH = path.join(process.cwd(), "server", "secure_data");
const DB_PATH = path.join(SECURE_DATA_PATH, "fabzclean.db");
const BACKUPS_PATH = path.join(SECURE_DATA_PATH, "backups");
const LOGS_PATH = path.join(SECURE_DATA_PATH, "logs");

// Configuration
const LOG_RETENTION_DAYS = 365; // Keep logs for 1 year
const MAX_BACKUPS = 30; // Keep last 30 backups

interface MaintenanceResult {
    success: boolean;
    operations: {
        vacuum: boolean;
        analyze: boolean;
        backup: boolean;
        logCleanup: boolean;
        oldBackupCleanup: boolean;
    };
    errors: string[];
    stats: {
        dbSizeBefore: number;
        dbSizeAfter: number;
        logsDeleted: number;
        backupsDeleted: number;
    };
    timestamp: string;
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath: string): number {
    try {
        return fs.statSync(filePath).size;
    } catch {
        return 0;
    }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main optimization function
 */
export async function optimizeSystem(): Promise<MaintenanceResult> {
    console.log("\n🧹 Starting Daily Maintenance...");
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Database: ${DB_PATH}\n`);

    const result: MaintenanceResult = {
        success: true,
        operations: {
            vacuum: false,
            analyze: false,
            backup: false,
            logCleanup: false,
            oldBackupCleanup: false,
        },
        errors: [],
        stats: {
            dbSizeBefore: getFileSize(DB_PATH),
            dbSizeAfter: 0,
            logsDeleted: 0,
            backupsDeleted: 0,
        },
        timestamp: new Date().toISOString(),
    };

    // Open database directly for maintenance operations
    let db: Database.Database | null = null;

    try {
        if (!fs.existsSync(DB_PATH)) {
            throw new Error(`Database not found at ${DB_PATH}`);
        }

        db = new Database(DB_PATH);

        // 1. Run VACUUM to rebuild and compact the database
        console.log("   [1/5] Running VACUUM...");
        try {
            db.exec("VACUUM;");
            result.operations.vacuum = true;
            console.log("         ✅ VACUUM complete");
        } catch (err: any) {
            result.errors.push(`VACUUM failed: ${err.message}`);
            console.error("         ❌ VACUUM failed:", err.message);
        }

        // 2. Run ANALYZE for query optimization
        console.log("   [2/5] Running ANALYZE...");
        try {
            db.exec("ANALYZE;");
            result.operations.analyze = true;
            console.log("         ✅ ANALYZE complete");
        } catch (err: any) {
            result.errors.push(`ANALYZE failed: ${err.message}`);
            console.error("         ❌ ANALYZE failed:", err.message);
        }

        // 3. Create backup
        console.log("   [3/5] Creating backup...");
        try {
            if (!fs.existsSync(BACKUPS_PATH)) {
                fs.mkdirSync(BACKUPS_PATH, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `fabzclean_backup_${timestamp}.db`;
            const backupPath = path.join(BACKUPS_PATH, backupFileName);

            // Use SQLite backup API (returns a promise in newer versions)
            await db.backup(backupPath);

            result.operations.backup = true;
            console.log(`         ✅ Backup created: ${backupFileName}`);
        } catch (err: any) {
            result.errors.push(`Backup failed: ${err.message}`);
            console.error("         ❌ Backup failed:", err.message);
        }

        // 4. Clean old audit logs
        console.log("   [4/5] Archiving old logs...");
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);
            const cutoffStr = cutoffDate.toISOString();

            // Count logs to be deleted
            const countResult = db.prepare(`
        SELECT COUNT(*) as count FROM audit_logs 
        WHERE createdAt < ?
      `).get(cutoffStr) as any;

            const logsToDelete = countResult?.count || 0;

            if (logsToDelete > 0) {
                // Archive to file before deleting
                const archiveFileName = `audit_archive_${new Date().toISOString().split('T')[0]}.json`;
                const archivePath = path.join(LOGS_PATH, archiveFileName);

                const oldLogs = db.prepare(`
          SELECT * FROM audit_logs 
          WHERE createdAt < ?
        `).all(cutoffStr);

                fs.writeFileSync(archivePath, JSON.stringify(oldLogs, null, 2));

                // Delete old logs
                db.prepare(`
          DELETE FROM audit_logs 
          WHERE createdAt < ?
        `).run(cutoffStr);

                result.stats.logsDeleted = logsToDelete;
                console.log(`         ✅ Archived and deleted ${logsToDelete} old logs`);
            } else {
                console.log("         ✅ No old logs to archive");
            }

            result.operations.logCleanup = true;
        } catch (err: any) {
            result.errors.push(`Log cleanup failed: ${err.message}`);
            console.error("         ❌ Log cleanup failed:", err.message);
        }

        // 5. Clean old backups (keep only MAX_BACKUPS)
        console.log("   [5/5] Cleaning old backups...");
        try {
            if (fs.existsSync(BACKUPS_PATH)) {
                const backups = fs.readdirSync(BACKUPS_PATH)
                    .filter(f => f.endsWith('.db'))
                    .map(f => ({
                        name: f,
                        path: path.join(BACKUPS_PATH, f),
                        time: fs.statSync(path.join(BACKUPS_PATH, f)).mtime.getTime()
                    }))
                    .sort((a, b) => b.time - a.time); // Newest first

                if (backups.length > MAX_BACKUPS) {
                    const toDelete = backups.slice(MAX_BACKUPS);
                    for (const backup of toDelete) {
                        fs.unlinkSync(backup.path);
                        result.stats.backupsDeleted++;
                    }
                    console.log(`         ✅ Deleted ${toDelete.length} old backups`);
                } else {
                    console.log(`         ✅ Backup count OK (${backups.length}/${MAX_BACKUPS})`);
                }
            }
            result.operations.oldBackupCleanup = true;
        } catch (err: any) {
            result.errors.push(`Backup cleanup failed: ${err.message}`);
            console.error("         ❌ Backup cleanup failed:", err.message);
        }

        // Log the maintenance action itself
        try {
            db.prepare(`
        INSERT INTO audit_logs (
          id, franchiseId, employeeId, action, entityType, entityId, details, ipAddress, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                crypto.randomUUID(),
                'SYSTEM',
                'SYSTEM',
                'db_optimize',
                'system',
                'maintenance',
                JSON.stringify(result),
                'LOCALHOST',
                new Date().toISOString()
            );
        } catch {
            // Non-critical
        }

    } catch (err: any) {
        result.success = false;
        result.errors.push(`Critical error: ${err.message}`);
        console.error("❌ Critical maintenance error:", err.message);
    } finally {
        // Close database connection
        if (db) {
            db.close();
        }
    }

    // Update final size
    result.stats.dbSizeAfter = getFileSize(DB_PATH);

    // Summary
    console.log("\n📊 Maintenance Summary:");
    console.log(`   Database Size: ${formatBytes(result.stats.dbSizeBefore)} → ${formatBytes(result.stats.dbSizeAfter)}`);
    console.log(`   Logs Archived: ${result.stats.logsDeleted}`);
    console.log(`   Backups Cleaned: ${result.stats.backupsDeleted}`);
    console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
    }

    console.log("");

    return result;
}

// Run if executed directly (ESM compatible)
const currentFile = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === currentFile;

if (isMainModule) {
    optimizeSystem()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(err => {
            console.error("Fatal error:", err);
            process.exit(1);
        });
}

export default optimizeSystem;
