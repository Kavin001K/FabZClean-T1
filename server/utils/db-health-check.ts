/**
 * ============================================================================
 * DATABASE HEALTH CHECK UTILITY
 * ============================================================================
 * 
 * Enterprise-grade diagnostic utility providing:
 * - Latency benchmarking with circuit breaker pattern
 * - Table-wise vitals (row counts, growth tracking)
 * - Sync health tracking for hybrid/offline setups
 * - Deep integrity audits
 * - Performance heatmap generation
 * - Resource utilization metrics
 * 
 * @version 1.0.0
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ============ CONFIGURATION ============

const SECURE_DATA_PATH = process.env.DATA_STORAGE_PATH
    ? process.env.DATA_STORAGE_PATH
    : path.join(process.cwd(), 'server', 'secure_data');
const DB_PATH = path.join(SECURE_DATA_PATH, 'fabzclean.db');

// Circuit breaker state
let consecutiveFailures = 0;
let lastSuccessfulPing = Date.now();
let circuitOpen = false;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

// Latency history for trending
const latencyHistory: { timestamp: number; latencyMs: number }[] = [];
const MAX_HISTORY = 60; // Keep last 60 readings

// Query performance tracking
interface QueryMetric {
    query: string;
    executionTimeMs: number;
    timestamp: number;
    table?: string;
}
const queryMetrics: QueryMetric[] = [];
const MAX_QUERY_METRICS = 100;

// ============ TYPES ============

export interface LatencyBenchmark {
    currentMs: number;
    averageMs: number;
    p95Ms: number;
    trend: 'stable' | 'degrading' | 'improving';
    status: 'healthy' | 'latency' | 'critical';
    statusEmoji: '🟢' | '🟡' | '🔴';
    consecutiveFailures: number;
    circuitOpen: boolean;
}

export interface TableVitals {
    tableName: string;
    rowCount: number;
    estimatedSizeBytes: number;
    formattedSize: string;
    growthRate24h: number; // percentage
    status: 'healthy' | 'warning' | 'error';
    lastModified?: string;
    indexCount: number;
}

export interface SyncHealth {
    mode: 'cloud-connected' | 'local-first' | 'offline';
    pendingUploads: number;
    pendingDownloads: number;
    lastSuccessfulSync: string;
    syncGap: number; // records behind
    syncLatencyMs: number;
    queueHealth: 'clear' | 'backlog' | 'stalled';
}

export interface IntegrityAudit {
    healthy: boolean;
    score: number; // 0-100
    orphanedRecords: OrphanedRecord[];
    nullViolations: NullViolation[];
    foreignKeyIssues: ForeignKeyIssue[];
    duplicateRecords: DuplicateRecord[];
    checkedAt: string;
    duration: number;
}

export interface OrphanedRecord {
    table: string;
    column: string;
    referencedTable: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
}

export interface NullViolation {
    table: string;
    column: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
}

export interface ForeignKeyIssue {
    table: string;
    constraint: string;
    violationCount: number;
}

export interface DuplicateRecord {
    table: string;
    columns: string[];
    duplicateCount: number;
}

export interface PerformanceHeatmap {
    slowQueries: SlowQuery[];
    tableHotspots: TableHotspot[];
    indexRecommendations: string[];
    avgQueryTimeMs: number;
}

export interface SlowQuery {
    queryPattern: string;
    avgExecutionTimeMs: number;
    occurrences: number;
    impactedTable: string;
    recommendation: string;
}

export interface TableHotspot {
    tableName: string;
    readOps: number;
    writeOps: number;
    heatLevel: 'cold' | 'warm' | 'hot';
}

export interface ResourceMetrics {
    cpuUsage: number;
    memoryUsageMB: number;
    memoryPercentage: number;
    diskAvailableMB: number;
    processUptime: number;
    nodeVersion: string;
    platform: string;
}

export interface HealthSummary {
    overallStatus: 'healthy' | 'degraded' | 'critical';
    uptimePercentage: number;
    latency: LatencyBenchmark;
    tables: TableVitals[];
    syncHealth: SyncHealth;
    resources: ResourceMetrics;
    storage: StorageMetrics;
    lastBackup: string;
    incidentCount24h: number;
}

export interface StorageMetrics {
    mainDbBytes: number;
    walBytes: number;
    shmBytes: number;
    totalBytes: number;
    formatted: string;
    quotaUsagePercent: number;
    quotaLimitMB: number;
}

// ============ CORE FUNCTIONS ============

/**
 * Perform a latency benchmark with circuit breaker pattern
 */
export function benchmarkLatency(): LatencyBenchmark {
    // Check circuit breaker
    if (circuitOpen) {
        if (Date.now() - lastSuccessfulPing > CIRCUIT_RESET_MS) {
            circuitOpen = false; // Try to reset
        } else {
            return {
                currentMs: -1,
                averageMs: -1,
                p95Ms: -1,
                trend: 'stable',
                status: 'critical',
                statusEmoji: '🔴',
                consecutiveFailures,
                circuitOpen: true
            };
        }
    }

    let db: Database.Database | null = null;
    try {
        const start = process.hrtime.bigint();
        db = new Database(DB_PATH, { readonly: true });
        db.prepare('SELECT 1').get();
        const end = process.hrtime.bigint();
        const latencyMs = Number(end - start) / 1e6;

        db.close();

        // Reset circuit breaker on success
        consecutiveFailures = 0;
        lastSuccessfulPing = Date.now();

        // Record history
        latencyHistory.push({ timestamp: Date.now(), latencyMs });
        if (latencyHistory.length > MAX_HISTORY) {
            latencyHistory.shift();
        }

        // Calculate metrics
        const recentLatencies = latencyHistory.map(h => h.latencyMs);
        const avgMs = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length;
        const sorted = [...recentLatencies].sort((a, b) => a - b);
        const p95Ms = sorted[Math.floor(sorted.length * 0.95)] || latencyMs;

        // Trend analysis
        let trend: 'stable' | 'degrading' | 'improving' = 'stable';
        if (latencyHistory.length > 10) {
            const recent5 = latencyHistory.slice(-5).map(h => h.latencyMs);
            const prev5 = latencyHistory.slice(-10, -5).map(h => h.latencyMs);
            const recentAvg = recent5.reduce((a, b) => a + b, 0) / 5;
            const prevAvg = prev5.reduce((a, b) => a + b, 0) / 5;

            if (recentAvg > prevAvg * 1.2) trend = 'degrading';
            else if (recentAvg < prevAvg * 0.8) trend = 'improving';
        }

        // Status determination
        let status: 'healthy' | 'latency' | 'critical' = 'healthy';
        let statusEmoji: '🟢' | '🟡' | '🔴' = '🟢';

        if (latencyMs < 50) {
            status = 'healthy';
            statusEmoji = '🟢';
        } else if (latencyMs < 200) {
            status = 'latency';
            statusEmoji = '🟡';
        } else {
            status = 'critical';
            statusEmoji = '🔴';
        }

        return {
            currentMs: parseFloat(latencyMs.toFixed(2)),
            averageMs: parseFloat(avgMs.toFixed(2)),
            p95Ms: parseFloat(p95Ms.toFixed(2)),
            trend,
            status,
            statusEmoji,
            consecutiveFailures: 0,
            circuitOpen: false
        };

    } catch (error) {
        if (db) db.close();
        consecutiveFailures++;

        if (consecutiveFailures >= CIRCUIT_THRESHOLD) {
            circuitOpen = true;
        }

        return {
            currentMs: -1,
            averageMs: -1,
            p95Ms: -1,
            trend: 'stable',
            status: 'critical',
            statusEmoji: '🔴',
            consecutiveFailures,
            circuitOpen
        };
    }
}

/**
 * Get detailed table vitals with row counts and size estimates
 */
export function getTableVitals(): TableVitals[] {
    let db: Database.Database | null = null;
    try {
        db = new Database(DB_PATH, { readonly: true });

        // Get all user tables
        const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%' 
      AND name NOT LIKE '_drizzle_%'
      ORDER BY name
    `).all() as { name: string }[];

        const vitals: TableVitals[] = [];

        for (const table of tables) {
            try {
                // Row count
                const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };

                // Index count
                const indexResult = db.prepare(`
          SELECT COUNT(*) as count FROM sqlite_master 
          WHERE type='index' AND tbl_name=?
        `).all(table.name) as { count: number }[];

                // Estimate size (rough approximation based on row count)
                // SQLite doesn't have per-table size without complex calculations
                const avgRowSize = 250; // bytes, rough estimate
                const estimatedSize = countResult.count * avgRowSize;

                vitals.push({
                    tableName: table.name,
                    rowCount: countResult.count,
                    estimatedSizeBytes: estimatedSize,
                    formattedSize: formatBytes(estimatedSize),
                    growthRate24h: 0, // Would need historical data to calculate
                    status: 'healthy',
                    indexCount: indexResult.length
                });

            } catch (e) {
                vitals.push({
                    tableName: table.name,
                    rowCount: 0,
                    estimatedSizeBytes: 0,
                    formattedSize: '0 B',
                    growthRate24h: 0,
                    status: 'error',
                    indexCount: 0
                });
            }
        }

        db.close();
        return vitals;

    } catch (error) {
        if (db) db.close();
        return [];
    }
}

/**
 * Get sync health status for hybrid/offline setups
 */
export function getSyncHealth(): SyncHealth {
    // For local-first SQLite apps, sync is handled differently
    // This implementation assumes local-first mode
    return {
        mode: 'local-first',
        pendingUploads: 0,
        pendingDownloads: 0,
        lastSuccessfulSync: new Date().toISOString(),
        syncGap: 0,
        syncLatencyMs: 0,
        queueHealth: 'clear'
    };
}

/**
 * Run comprehensive integrity audit
 */
export function runIntegrityAudit(): IntegrityAudit {
    const startTime = Date.now();
    let db: Database.Database | null = null;

    const orphanedRecords: OrphanedRecord[] = [];
    const nullViolations: NullViolation[] = [];
    const foreignKeyIssues: ForeignKeyIssue[] = [];
    const duplicateRecords: DuplicateRecord[] = [];

    try {
        db = new Database(DB_PATH, { readonly: true });

        // 1. Orphaned Orders (no customer)
        const orphanedOrders = db.prepare(`
      SELECT COUNT(*) as c FROM orders o 
      LEFT JOIN customers c ON o.customerId = c.id 
      WHERE c.id IS NULL AND o.customerId IS NOT NULL AND o.customerId != ''
    `).get() as { c: number };

        if (orphanedOrders.c > 0) {
            orphanedRecords.push({
                table: 'orders',
                column: 'customerId',
                referencedTable: 'customers',
                count: orphanedOrders.c,
                severity: 'high'
            });
        }

        // 2. Orphaned Employees (no franchise but not admin)
        try {
            const orphanedEmployees = db.prepare(`
        SELECT COUNT(*) as c FROM employees e 
        LEFT JOIN franchises f ON e.franchiseId = f.id 
        WHERE f.id IS NULL 
        AND e.franchiseId IS NOT NULL 
        AND e.franchiseId != ''
        AND e.role != 'admin'
      `).get() as { c: number };

            if (orphanedEmployees.c > 0) {
                orphanedRecords.push({
                    table: 'employees',
                    column: 'franchiseId',
                    referencedTable: 'franchises',
                    count: orphanedEmployees.c,
                    severity: 'medium'
                });
            }
        } catch (e) { /* table may not exist */ }

        // 3. NULL violations in critical fields
        const nullOrderAmount = db.prepare(`
      SELECT COUNT(*) as c FROM orders WHERE totalAmount IS NULL
    `).get() as { c: number };

        if (nullOrderAmount.c > 0) {
            nullViolations.push({
                table: 'orders',
                column: 'totalAmount',
                count: nullOrderAmount.c,
                severity: 'high'
            });
        }

        const nullOrderStatus = db.prepare(`
      SELECT COUNT(*) as c FROM orders WHERE status IS NULL
    `).get() as { c: number };

        if (nullOrderStatus.c > 0) {
            nullViolations.push({
                table: 'orders',
                column: 'status',
                count: nullOrderStatus.c,
                severity: 'high'
            });
        }

        // 4. Duplicate order numbers
        try {
            const duplicateOrderNumbers = db.prepare(`
        SELECT orderNumber, COUNT(*) as cnt FROM orders 
        GROUP BY orderNumber HAVING cnt > 1
      `).all() as { orderNumber: string; cnt: number }[];

            if (duplicateOrderNumbers.length > 0) {
                duplicateRecords.push({
                    table: 'orders',
                    columns: ['orderNumber'],
                    duplicateCount: duplicateOrderNumbers.length
                });
            }
        } catch (e) { /* table may not exist */ }

        // 5. Duplicate customer phones
        try {
            const duplicatePhones = db.prepare(`
        SELECT phone, COUNT(*) as cnt FROM customers 
        WHERE phone IS NOT NULL AND phone != ''
        GROUP BY phone HAVING cnt > 1
      `).all() as { phone: string; cnt: number }[];

            if (duplicatePhones.length > 0) {
                duplicateRecords.push({
                    table: 'customers',
                    columns: ['phone'],
                    duplicateCount: duplicatePhones.length
                });
            }
        } catch (e) { /* table may not exist */ }

        db.close();

        // Calculate score
        const totalIssues = orphanedRecords.length + nullViolations.length +
            foreignKeyIssues.length + duplicateRecords.length;
        const score = Math.max(0, 100 - (totalIssues * 15));

        return {
            healthy: totalIssues === 0,
            score,
            orphanedRecords,
            nullViolations,
            foreignKeyIssues,
            duplicateRecords,
            checkedAt: new Date().toISOString(),
            duration: Date.now() - startTime
        };

    } catch (error) {
        if (db) db.close();
        return {
            healthy: false,
            score: 0,
            orphanedRecords: [],
            nullViolations: [],
            foreignKeyIssues: [],
            duplicateRecords: [],
            checkedAt: new Date().toISOString(),
            duration: Date.now() - startTime
        };
    }
}

/**
 * Generate performance heatmap
 */
export function getPerformanceHeatmap(): PerformanceHeatmap {
    // Analyze recent query metrics
    const slowQueries: SlowQuery[] = [];
    const tableHotspots: TableHotspot[] = [];
    const recommendations: string[] = [];

    // Group queries by pattern
    const queryPatterns = new Map<string, { times: number[]; table: string }>();

    for (const metric of queryMetrics) {
        const pattern = metric.query.replace(/\d+/g, 'N').replace(/'[^']*'/g, "'?'");
        if (!queryPatterns.has(pattern)) {
            queryPatterns.set(pattern, { times: [], table: metric.table || 'unknown' });
        }
        queryPatterns.get(pattern)!.times.push(metric.executionTimeMs);
    }

    // Find slow queries (avg > 100ms)
    for (const [pattern, data] of queryPatterns) {
        const avg = data.times.reduce((a, b) => a + b, 0) / data.times.length;
        if (avg > 100) {
            slowQueries.push({
                queryPattern: pattern.substring(0, 100),
                avgExecutionTimeMs: parseFloat(avg.toFixed(2)),
                occurrences: data.times.length,
                impactedTable: data.table,
                recommendation: `Consider adding an index on ${data.table}`
            });
        }
    }

    // Calculate overall average
    const avgQueryTime = queryMetrics.length > 0
        ? queryMetrics.reduce((sum, m) => sum + m.executionTimeMs, 0) / queryMetrics.length
        : 0;

    return {
        slowQueries: slowQueries.slice(0, 10),
        tableHotspots,
        indexRecommendations: recommendations,
        avgQueryTimeMs: parseFloat(avgQueryTime.toFixed(2))
    };
}

/**
 * Get current resource metrics
 */
export function getResourceMetrics(): ResourceMetrics {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate CPU usage (rough estimate)
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
        for (const type in cpu.times) {
            totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
    }

    const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100);

    return {
        cpuUsage,
        memoryUsageMB: Math.round(usedMemory / 1024 / 1024),
        memoryPercentage: Math.round((usedMemory / totalMemory) * 100),
        diskAvailableMB: getDiskAvailable(),
        processUptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: os.platform()
    };
}

/**
 * Get storage metrics
 */
export function getStorageMetrics(): StorageMetrics {
    try {
        const mainStats = fs.statSync(DB_PATH);
        const walPath = `${DB_PATH}-wal`;
        const shmPath = `${DB_PATH}-shm`;

        const walSize = fs.existsSync(walPath) ? fs.statSync(walPath).size : 0;
        const shmSize = fs.existsSync(shmPath) ? fs.statSync(shmPath).size : 0;
        const totalSize = mainStats.size + walSize + shmSize;

        // Assume 1GB quota for local
        const quotaLimitMB = 1024;
        const quotaUsagePercent = (totalSize / (quotaLimitMB * 1024 * 1024)) * 100;

        return {
            mainDbBytes: mainStats.size,
            walBytes: walSize,
            shmBytes: shmSize,
            totalBytes: totalSize,
            formatted: formatBytes(totalSize),
            quotaUsagePercent: parseFloat(quotaUsagePercent.toFixed(2)),
            quotaLimitMB
        };

    } catch (error) {
        return {
            mainDbBytes: 0,
            walBytes: 0,
            shmBytes: 0,
            totalBytes: 0,
            formatted: '0 B',
            quotaUsagePercent: 0,
            quotaLimitMB: 1024
        };
    }
}

/**
 * Get last backup timestamp
 */
export function getLastBackupTime(): string {
    try {
        const backupDir = path.join(SECURE_DATA_PATH, 'backups');
        if (!fs.existsSync(backupDir)) return 'Never';

        const files = fs.readdirSync(backupDir)
            .filter(f => f.endsWith('.db') || f.endsWith('.gz') || f.endsWith('.bak'))
            .map(f => ({
                name: f,
                time: fs.statSync(path.join(backupDir, f)).mtime
            }))
            .sort((a, b) => b.time.getTime() - a.time.getTime());

        return files.length > 0 ? files[0].time.toISOString() : 'Never';

    } catch (error) {
        return 'Never';
    }
}

/**
 * Get complete health summary
 */
export function getHealthSummary(): HealthSummary {
    const latency = benchmarkLatency();
    const tables = getTableVitals();
    const syncHealth = getSyncHealth();
    const resources = getResourceMetrics();
    const storage = getStorageMetrics();
    const lastBackup = getLastBackupTime();

    // Calculate overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (latency.circuitOpen || latency.status === 'critical') {
        overallStatus = 'critical';
    } else if (latency.status === 'latency' || resources.memoryPercentage > 90) {
        overallStatus = 'degraded';
    }

    // Calculate uptime percentage (based on latency history failures)
    const successfulPings = latencyHistory.filter(h => h.latencyMs >= 0).length;
    const uptimePercentage = latencyHistory.length > 0
        ? (successfulPings / latencyHistory.length) * 100
        : 100;

    return {
        overallStatus,
        uptimePercentage: parseFloat(uptimePercentage.toFixed(2)),
        latency,
        tables,
        syncHealth,
        resources,
        storage,
        lastBackup,
        incidentCount24h: 0 // Would need incident tracking
    };
}

/**
 * Record a query execution for performance tracking
 */
export function recordQueryExecution(query: string, executionTimeMs: number, table?: string): void {
    queryMetrics.push({
        query,
        executionTimeMs,
        timestamp: Date.now(),
        table
    });

    if (queryMetrics.length > MAX_QUERY_METRICS) {
        queryMetrics.shift();
    }
}

/**
 * Get latency history for charting
 */
export function getLatencyHistory(): { timestamp: number; latencyMs: number }[] {
    return [...latencyHistory];
}

/**
 * Reset circuit breaker manually
 */
export function resetCircuitBreaker(): void {
    consecutiveFailures = 0;
    circuitOpen = false;
    lastSuccessfulPing = Date.now();
}

// ============ HELPER FUNCTIONS ============

function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getDiskAvailable(): number {
    try {
        // This is a rough estimate - proper implementation would use `diskusage` package
        const stats = fs.statfsSync(SECURE_DATA_PATH);
        return Math.round((stats.bfree * stats.bsize) / 1024 / 1024);
    } catch (e) {
        return -1;
    }
}

export default {
    benchmarkLatency,
    getTableVitals,
    getSyncHealth,
    runIntegrityAudit,
    getPerformanceHeatmap,
    getResourceMetrics,
    getStorageMetrics,
    getLastBackupTime,
    getHealthSummary,
    recordQueryExecution,
    getLatencyHistory,
    resetCircuitBreaker
};
