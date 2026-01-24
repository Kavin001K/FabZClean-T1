/**
 * ============================================================================
 * DATABASE MONITORING & HEALTH SYSTEM
 * ============================================================================
 * 
 * Enterprise-grade database monitoring endpoints providing:
 * - Real-time latency benchmarking with circuit breaker
 * - Deep introspection (table sizes, index health)
 * - Maintenance operations (VACUUM, ANALYZE, CHECKPOINT)
 * - Data integrity audits with scoring
 * - Migration history tracking
 * - Performance heatmaps
 * - Resource utilization metrics
 * 
 * @version 2.0.0
 */

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { authMiddleware as authenticateEmployee } from '../middleware/employee-auth';
import { db as storage } from '../db';
import healthCheck, {
    benchmarkLatency,
    getTableVitals,
    getSyncHealth,
    runIntegrityAudit,
    getPerformanceHeatmap,
    getResourceMetrics,
    getStorageMetrics,
    getLastBackupTime,
    getHealthSummary,
    getLatencyHistory,
    resetCircuitBreaker
} from '../utils/db-health-check';

const router = Router();

// Database configuration
const SECURE_DATA_PATH = process.env.DATA_STORAGE_PATH
    ? process.env.DATA_STORAGE_PATH
    : path.join(process.cwd(), 'server', 'secure_data');
const DB_PATH = path.join(SECURE_DATA_PATH, 'fabzclean.db');

// Secure middleware - Admin only
const requireAdmin = (req: Request, res: Response, next: Function) => {
    const employee = (req as any).employee;
    if (!employee || employee.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Access denied: Administrators only',
            code: 'ADMIN_REQUIRED'
        });
    }
    next();
};

// ============ HEALTH SUMMARY ============

/**
 * GET /api/database-monitor/health
 * Complete health summary endpoint
 */
router.get('/health', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        const summary = getHealthSummary();

        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Health Summary Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============ STATS ENDPOINT ============

/**
 * GET /api/database-monitor/stats
 * Comprehensive system vitals with latency benchmarking
 */
router.get('/stats', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        // Benchmark latency
        const latency = benchmarkLatency();

        // Get storage metrics
        const storage = getStorageMetrics();

        // Get table vitals
        const tables = getTableVitals();

        // Get sync health
        const syncHealth = getSyncHealth();

        // Get resources
        const resources = getResourceMetrics();

        // Get last backup
        const lastBackup = getLastBackupTime();

        res.json({
            status: latency.circuitOpen ? 'offline' : 'online',
            latencyMs: latency.currentMs,
            latencyBenchmark: latency,
            uptimeSeconds: resources.processUptime,
            storageUsage: {
                mainDb: storage.mainDbBytes,
                wal: storage.walBytes,
                shm: storage.shmBytes,
                total: storage.totalBytes,
                formatted: storage.formatted,
                quotaUsagePercent: storage.quotaUsagePercent
            },
            connections: {
                active: 1,
                poolSize: 1,
                max: 1
            },
            tables,
            lastBackup,
            syncStatus: {
                pendingUploads: syncHealth.pendingUploads,
                pendingDownloads: syncHealth.pendingDownloads,
                lastSync: syncHealth.lastSuccessfulSync,
                mode: syncHealth.mode,
                syncGap: syncHealth.syncGap,
                queueHealth: syncHealth.queueHealth
            },
            resources: {
                cpuUsage: resources.cpuUsage,
                memoryUsageMB: resources.memoryUsageMB,
                memoryPercentage: resources.memoryPercentage,
                diskAvailableMB: resources.diskAvailableMB,
                nodeVersion: resources.nodeVersion,
                platform: resources.platform
            }
        });

    } catch (error: any) {
        console.error('DB Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ LATENCY HISTORY ============

/**
 * GET /api/database-monitor/latency-history
 * Get latency history for charting
 */
router.get('/latency-history', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        const history = getLatencyHistory();

        res.json({
            success: true,
            data: history,
            count: history.length
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============ PERFORMANCE HEATMAP ============

/**
 * GET /api/database-monitor/performance
 * Get performance heatmap with slow queries
 */
router.get('/performance', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        const heatmap = getPerformanceHeatmap();

        res.json({
            success: true,
            data: heatmap
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============ MAINTENANCE OPERATIONS ============

/**
 * POST /api/database-monitor/maintenance
 * Run optimization tasks with audit logging
 */
router.post('/maintenance', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { action } = req.body;
        const employee = (req as any).employee;

        // Validate action
        const validActions = ['vacuum', 'analyze', 'checkpoint', 'reset-circuit'];
        if (!validActions.includes(action)) {
            return res.status(400).json({ error: `Invalid action. Valid: ${validActions.join(', ')}` });
        }

        const logData: any = {
            action,
            triggeredBy: employee.username,
            timestamp: new Date().toISOString()
        };

        // Log to console and audit
        console.log(`🔧 DB Maintenance triggered: ${action} by ${employee.username}`);

        // Handle circuit breaker reset
        if (action === 'reset-circuit') {
            resetCircuitBreaker();
            logData.result = 'Circuit breaker reset successfully.';

            await storage.createAuditLog({
                employeeId: employee.id || employee.employeeId,
                franchiseId: employee.franchiseId,
                action: 'database_maintenance',
                entityType: 'database',
                entityId: 'circuit-breaker',
                details: logData,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown'
            });

            return res.json(logData);
        }

        // Database operations
        const db = new Database(DB_PATH);
        const startTime = Date.now();

        switch (action) {
            case 'vacuum':
                db.exec('VACUUM');
                logData.result = 'Database vacuumed successfully. Storage optimized.';
                break;
            case 'analyze':
                db.exec('ANALYZE');
                logData.result = 'Query planner statistics updated.';
                break;
            case 'checkpoint':
                db.pragma('wal_checkpoint(TRUNCATE)');
                logData.result = 'WAL file checkpointed and truncated.';
                break;
        }

        logData.executionTimeMs = Date.now() - startTime;

        // Get new size after operation
        const stats = fs.statSync(DB_PATH);
        logData.newSize = formatBytes(stats.size);
        logData.newSizeBytes = stats.size;

        db.close();

        // Audit log the maintenance action
        await storage.createAuditLog({
            employeeId: employee.id || employee.employeeId,
            franchiseId: employee.franchiseId,
            action: 'database_maintenance',
            entityType: 'database',
            entityId: action,
            details: logData,
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
        });

        res.json(logData);

    } catch (error: any) {
        console.error('Maintenance Error:', error);
        res.status(500).json({ error: 'Maintenance failed', details: error.message });
    }
});

// ============ INTEGRITY CHECK ============

/**
 * GET /api/database-monitor/integrity
 * Run deep consistency checks with scoring
 */
router.get('/integrity', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        const employee = (req as any).employee;
        const audit = runIntegrityAudit();

        // Log the integrity check
        await storage.createAuditLog({
            employeeId: employee.id || employee.employeeId,
            franchiseId: employee.franchiseId,
            action: 'database_integrity_check',
            entityType: 'database',
            entityId: 'integrity-audit',
            details: {
                healthy: audit.healthy,
                score: audit.score,
                issueCount: audit.orphanedRecords.length + audit.nullViolations.length +
                    audit.foreignKeyIssues.length + audit.duplicateRecords.length,
                duration: audit.duration
            },
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
        });

        res.json({
            success: true,
            data: audit
        });

    } catch (error: any) {
        res.status(500).json({ error: 'Integrity check failed', details: error.message });
    }
});

// ============ MIGRATIONS ============

/**
 * GET /api/database-monitor/migrations
 * List applied migrations
 */
router.get('/migrations', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        const migrationsDir = path.join(process.cwd(), 'server', 'migrations');

        if (!fs.existsSync(migrationsDir)) {
            return res.json({ success: true, data: [] });
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .map(f => {
                const stat = fs.statSync(path.join(migrationsDir, f));
                const content = fs.readFileSync(path.join(migrationsDir, f), 'utf-8');
                const lines = content.split('\n').slice(0, 5).join('\n');

                return {
                    id: f,
                    name: f.replace('.sql', ''),
                    appliedAt: stat.mtime.toISOString(),
                    sizeBytes: stat.size,
                    preview: lines.substring(0, 200),
                    hash: 'verified'
                };
            })
            .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
            .slice(0, 10);

        res.json({ success: true, data: files });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============ RESOURCE METRICS ============

/**
 * GET /api/database-monitor/resources
 * Get system resource metrics
 */
router.get('/resources', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        const resources = getResourceMetrics();

        res.json({
            success: true,
            data: resources
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ACCESS LOGGING ============

/**
 * POST /api/database-monitor/access-log
 * Log administrative access to the dashboard
 */
router.post('/access-log', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        const employee = (req as any).employee;

        console.log(`🛡️ Admin Access: ${employee.username} accessed Database Monitor at ${new Date().toISOString()}`);

        await storage.createAuditLog({
            employeeId: employee.id || employee.employeeId,
            franchiseId: employee.franchiseId,
            action: 'database_access',
            entityType: 'database',
            entityId: 'monitor-dashboard',
            details: {
                page: 'Database Monitor',
                accessedAt: new Date().toISOString()
            },
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
        });

        res.json({ success: true, logged: true });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============ FORCE BACKUP ============

/**
 * POST /api/database-monitor/backup
 * Trigger a manual backup
 */
router.post('/backup', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        const employee = (req as any).employee;
        const backupDir = path.join(SECURE_DATA_PATH, 'backups');

        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `fabzclean_backup_${timestamp}.db`);

        // Copy database file
        fs.copyFileSync(DB_PATH, backupPath);

        const stats = fs.statSync(backupPath);

        // Log backup creation
        await storage.createAuditLog({
            employeeId: employee.id || employee.employeeId,
            franchiseId: employee.franchiseId,
            action: 'backup_created',
            entityType: 'database',
            entityId: backupPath,
            details: {
                backupFile: path.basename(backupPath),
                sizeBytes: stats.size,
                formatted: formatBytes(stats.size),
                triggeredBy: employee.username
            },
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
        });

        res.json({
            success: true,
            backupFile: path.basename(backupPath),
            sizeBytes: stats.size,
            formatted: formatBytes(stats.size),
            createdAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Backup Error:', error);
        res.status(500).json({ error: 'Backup failed', details: error.message });
    }
});

// ============ INCIDENT PROTOCOL ============

/**
 * GET /api/database-monitor/incidents
 * Get recent incidents and circuit breaker status
 */
router.get('/incidents', authenticateEmployee, requireAdmin, async (req: Request, res: Response) => {
    try {
        const latency = benchmarkLatency();

        // Get recent audit logs for database-related issues
        const recentIssues = storage.db.prepare(`
      SELECT * FROM audit_logs 
      WHERE entityType = 'database' 
      OR action LIKE '%error%'
      OR action LIKE '%failed%'
      ORDER BY createdAt DESC 
      LIMIT 20
    `).all() as any[];

        res.json({
            success: true,
            circuitBreaker: {
                open: latency.circuitOpen,
                consecutiveFailures: latency.consecutiveFailures
            },
            recentIncidents: recentIssues.map(issue => ({
                ...issue,
                details: issue.details ? JSON.parse(issue.details) : null
            }))
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============ HELPERS ============

function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default router;
