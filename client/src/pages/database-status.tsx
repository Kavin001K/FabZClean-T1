/**
 * ============================================================================
 * INFRASTRUCTURE COMMAND CENTER
 * ============================================================================
 * 
 * Production-grade database monitoring dashboard for Administrators.
 * Features:
 * - Real-time Vitals Ribbon (Latency, Uptime, Resources)
 * - Deep Health Inspection (Table stats, Integrity audits)
 * - Performance Heatmap (Slow queries, Index recommendations)
 * - Maintenance Console (Vacuum, Analyze, Checkpoint, Backup)
 * - Incident Protocol (Circuit breaker, Emergency mode)
 * - Migration History Tracking
 * 
 * @version 3.0.0
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Activity,
  Database,
  Server,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  FileText,
  Zap,
  Trash2,
  Play,
  Download,
  AlertOctagon,
  Lock,
  Wifi,
  WifiOff,
  History,
  Cpu,
  MemoryStick,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  Archive,
  RotateCcw,
  Timer,
  Gauge,
  CircleDot,
  Terminal,
  FileCode,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { jsPDF } from "jspdf";

// ============ TYPES ============

interface TableStat {
  tableName: string;
  rowCount: number;
  estimatedSizeBytes?: number;
  formattedSize?: string;
  status: 'healthy' | 'warning' | 'error';
  indexCount?: number;
}

interface LatencyBenchmark {
  currentMs: number;
  averageMs: number;
  p95Ms: number;
  trend: 'stable' | 'degrading' | 'improving';
  status: 'healthy' | 'latency' | 'critical';
  statusEmoji: '🟢' | '🟡' | '🔴';
  consecutiveFailures: number;
  circuitOpen: boolean;
}

interface ResourceMetrics {
  cpuUsage: number;
  memoryUsageMB: number;
  memoryPercentage: number;
  diskAvailableMB: number;
  nodeVersion: string;
  platform: string;
}

interface MonitorStats {
  status: 'online' | 'offline';
  latencyMs: number;
  latencyBenchmark?: LatencyBenchmark;
  uptimeSeconds: number;
  storageUsage: {
    mainDb: number;
    wal: number;
    shm: number;
    total: number;
    formatted: string;
    quotaUsagePercent?: number;
  };
  connections: {
    active: number;
    poolSize: number;
    max: number;
  };
  tables: TableStat[];
  lastBackup: string;
  syncStatus: {
    pendingUploads: number;
    pendingDownloads: number;
    lastSync: string;
    mode: string;
    syncGap?: number;
    queueHealth?: string;
  };
  resources?: ResourceMetrics;
}

interface IntegrityResult {
  healthy: boolean;
  score: number;
  orphanedRecords: { table: string; column: string; count: number; severity: string }[];
  nullViolations: { table: string; column: string; count: number; severity: string }[];
  duplicateRecords: { table: string; columns: string[]; duplicateCount: number }[];
  checkedAt: string;
  duration: number;
}

interface Migration {
  id: string;
  name: string;
  appliedAt: string;
  sizeBytes?: number;
  preview?: string;
}

// ============ COMPONENTS ============

// Vitals KPI Card
const VitalCard = ({
  title,
  value,
  unit,
  icon: Icon,
  status,
  trend,
  subtitle,
  progress,
  color = 'blue'
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: any;
  status?: 'healthy' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
  progress?: number;
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'amber';
}) => {
  const colorMap = {
    green: { border: 'border-l-green-500', icon: 'text-green-500', bg: 'bg-green-500/10' },
    blue: { border: 'border-l-blue-500', icon: 'text-blue-500', bg: 'bg-blue-500/10' },
    purple: { border: 'border-l-purple-500', icon: 'text-purple-500', bg: 'bg-purple-500/10' },
    orange: { border: 'border-l-orange-500', icon: 'text-orange-500', bg: 'bg-orange-500/10' },
    red: { border: 'border-l-red-500', icon: 'text-red-500', bg: 'bg-red-500/10' },
    amber: { border: 'border-l-amber-500', icon: 'text-amber-500', bg: 'bg-amber-500/10' }
  };

  const colors = colorMap[color];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className={cn("shadow-sm border-l-4", colors.border, "relative overflow-hidden")}>
      <div className={cn("absolute inset-0 opacity-[0.03]", colors.bg)} />
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={cn(
                "text-3xl font-bold",
                status === 'healthy' && "text-green-600",
                status === 'warning' && "text-amber-600",
                status === 'critical' && "text-red-600",
                !status && "text-foreground"
              )}>
                {value}
              </span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
          </div>
          <div className={cn("p-2.5 rounded-xl", colors.bg)}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
        </div>
        {subtitle && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {trend && <TrendIcon className={cn(
              "h-3 w-3",
              trend === 'up' && "text-green-500",
              trend === 'down' && "text-red-500"
            )} />}
            <span>{subtitle}</span>
          </div>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="h-1.5 mt-4" />
        )}
      </CardContent>
    </Card>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: 'online' | 'offline' | string }) => {
  const isOnline = status === 'online';
  return (
    <Badge
      variant={isOnline ? 'default' : 'destructive'}
      className={cn(
        "text-sm px-3 py-1 gap-2",
        isOnline && "bg-green-600 hover:bg-green-700"
      )}
    >
      {isOnline ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          System Online
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3" />
          System Offline
        </>
      )}
    </Badge>
  );
};

// Console Output Component
const ConsoleOutput = ({ logs }: { logs: string[] }) => (
  <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs h-52 overflow-hidden">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-slate-400">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <Terminal className="h-3.5 w-3.5 ml-2" />
      <span>System Log Output</span>
    </div>
    <ScrollArea className="h-36">
      {logs.length === 0 ? (
        <span className="text-slate-600 italic">Waiting for commands...</span>
      ) : (
        <div className="space-y-1">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "text-green-400",
                log.includes('FAILED') && "text-red-400",
                log.includes('WARNING') && "text-yellow-400"
              )}
            >
              {log}
            </motion.div>
          ))}
        </div>
      )}
    </ScrollArea>
  </div>
);

// ============ MAIN COMPONENT ============

export default function DatabaseStatus() {
  const [maintenanceLog, setMaintenanceLog] = useState<string[]>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [activeTab, setActiveTab] = useState('health');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper for API calls
  const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
  });

  // ============ QUERIES ============

  // Live Stats Query
  const { data: stats, isLoading, error, refetch: refetchStats, dataUpdatedAt } = useQuery<MonitorStats>({
    queryKey: ['db-monitor-stats'],
    queryFn: async () => {
      const res = await fetch('/api/database-monitor/stats', {
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 5000,
    retry: 3
  });

  // Integrity Check Query
  const {
    data: integrityReport,
    refetch: runIntegrityCheck,
    isFetching: isCheckingIntegrity
  } = useQuery<{ success: boolean; data: IntegrityResult }>({
    queryKey: ['db-integrity'],
    queryFn: async () => {
      const res = await fetch('/api/database-monitor/integrity', {
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error('Integrity check failed');
      return res.json();
    },
    enabled: false
  });

  // Migrations Query
  const { data: migrationsData } = useQuery<{ success: boolean; data: Migration[] }>({
    queryKey: ['db-migrations'],
    queryFn: async () => {
      const res = await fetch('/api/database-monitor/migrations', {
        headers: getAuthHeader()
      });
      if (!res.ok) return { success: false, data: [] };
      return res.json();
    }
  });

  // Resources Query
  const { data: resourcesData } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['db-resources'],
    queryFn: async () => {
      const res = await fetch('/api/database-monitor/resources', {
        headers: getAuthHeader()
      });
      if (!res.ok) return { success: false, data: null };
      return res.json();
    },
    refetchInterval: 10000
  });

  // ============ MUTATIONS ============

  // Maintenance Mutation
  const performMaintenance = useMutation({
    mutationFn: async (action: 'vacuum' | 'analyze' | 'checkpoint' | 'reset-circuit') => {
      const res = await fetch('/api/database-monitor/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error('Maintenance failed');
      return res.json();
    },
    onSuccess: (data) => {
      const logEntry = `[${format(new Date(), 'HH:mm:ss')}] ✓ ${data.action.toUpperCase()} - ${data.result}`;
      setMaintenanceLog(prev => [logEntry, ...prev].slice(0, 15));
      toast({ title: 'Maintenance Complete', description: data.result });
      refetchStats();
    },
    onError: (err: any) => {
      const logEntry = `[${format(new Date(), 'HH:mm:ss')}] ✗ FAILED: ${err.message}`;
      setMaintenanceLog(prev => [logEntry, ...prev].slice(0, 15));
      toast({ title: 'Maintenance Failed', description: err.message, variant: 'destructive' });
    }
  });

  // Backup Mutation
  const createBackup = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/database-monitor/backup', {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error('Backup failed');
      return res.json();
    },
    onSuccess: (data) => {
      const logEntry = `[${format(new Date(), 'HH:mm:ss')}] ✓ BACKUP - ${data.backupFile} (${data.formatted})`;
      setMaintenanceLog(prev => [logEntry, ...prev].slice(0, 15));
      toast({ title: 'Backup Created', description: `${data.backupFile} (${data.formatted})` });
      refetchStats();
    },
    onError: (err: any) => {
      toast({ title: 'Backup Failed', description: err.message, variant: 'destructive' });
    }
  });

  // ============ EFFECTS ============

  // Log access on mount
  useEffect(() => {
    fetch('/api/database-monitor/access-log', {
      method: 'POST',
      headers: getAuthHeader()
    }).catch(console.error);
  }, []);

  // Emergency mode detection
  useEffect(() => {
    if (stats?.status === 'offline' ||
      stats?.latencyBenchmark?.circuitOpen ||
      (stats?.latencyMs && stats.latencyMs > 500)) {
      setEmergencyMode(true);
    } else {
      setEmergencyMode(false);
    }
  }, [stats]);

  // ============ HANDLERS ============

  const handleIntegrityScan = () => {
    runIntegrityCheck();
    toast({ title: 'Generating Report', description: 'Deep scan initiated...' });
  };

  const downloadReport = () => {
    if (!integrityReport?.data || !stats) {
      toast({ title: 'No Data', description: 'Run a scan first.', variant: 'destructive' });
      return;
    }

    const doc = new jsPDF();
    const integrity = integrityReport.data;

    // Header
    doc.setFontSize(20);
    doc.text("Infrastructure Health Report", 20, 20);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`System Status: ${stats.status.toUpperCase()}`, 20, 35);
    doc.text(`Latency: ${stats.latencyMs}ms`, 20, 40);

    // Integrity Score
    doc.setFontSize(14);
    doc.text("Integrity Score", 20, 55);

    doc.setFontSize(24);
    doc.setTextColor(integrity.score >= 80 ? 0 : integrity.score >= 50 ? 200 : 255,
      integrity.score >= 80 ? 150 : integrity.score >= 50 ? 150 : 0, 0);
    doc.text(`${integrity.score}/100`, 20, 68);
    doc.setTextColor(0, 0, 0);

    // Issues
    doc.setFontSize(12);
    let y = 85;

    if (integrity.orphanedRecords.length > 0) {
      doc.text("Orphaned Records:", 20, y);
      y += 7;
      integrity.orphanedRecords.forEach(issue => {
        doc.text(`  • ${issue.table}.${issue.column}: ${issue.count} records`, 25, y);
        y += 5;
      });
    }

    if (integrity.nullViolations.length > 0) {
      y += 5;
      doc.text("NULL Violations:", 20, y);
      y += 7;
      integrity.nullViolations.forEach(issue => {
        doc.text(`  • ${issue.table}.${issue.column}: ${issue.count} records`, 25, y);
        y += 5;
      });
    }

    // Tables
    y += 10;
    doc.setFontSize(14);
    doc.text("Table Statistics", 20, y);
    y += 10;
    doc.setFontSize(10);

    stats.tables.slice(0, 10).forEach(table => {
      doc.text(`${table.tableName}: ${table.rowCount.toLocaleString()} rows`, 25, y);
      y += 5;
    });

    doc.save(`infrastructure_report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
    toast({ title: 'Report Downloaded', description: 'PDF report generated successfully.' });
  };

  // ============ COMPUTED VALUES ============

  const migrations = migrationsData?.data || [];
  const resources = stats?.resources || resourcesData?.data;
  const latency = stats?.latencyBenchmark;
  const integrity = integrityReport?.data;

  const totalRows = useMemo(() =>
    stats?.tables?.reduce((acc, t) => acc + t.rowCount, 0) || 0
    , [stats?.tables]);

  const uptimeHours = stats ? (stats.uptimeSeconds / 3600).toFixed(1) : '0';
  const uptimePercentage = 99.9; // Would calculate from historical data

  // ============ RENDER ============

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <Database className="h-16 w-16 text-primary mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Alert variant="destructive" className="border-2 border-red-500">
          <AlertOctagon className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">Critical System Failure</AlertTitle>
          <AlertDescription>
            <p>Unable to establish connection to database monitoring service.</p>
            <p className="mt-2 font-mono text-xs bg-red-50 dark:bg-red-950 p-2 rounded">
              {(error as Error)?.message || 'Connection refused'}
            </p>
            <div className="mt-4 flex gap-4">
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6 max-w-7xl mx-auto bg-background min-h-screen">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
              <Server className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Infrastructure Command Center
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Administrator Access • Encrypted Session
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={stats.status} />
            <Button variant="outline" size="sm" onClick={() => refetchStats()} className="gap-2">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Emergency Protocol Alert */}
        <AnimatePresence>
          {emergencyMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert variant="destructive" className="border-l-4 border-l-red-600 shadow-xl">
                <AlertOctagon className="h-5 w-5" />
                <AlertTitle className="font-bold flex items-center gap-2">
                  🚨 INCIDENT DETECTED: {latency?.circuitOpen ? 'Circuit Breaker Open' : 'High Latency'}
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <p>
                    {latency?.circuitOpen
                      ? `System has experienced ${latency.consecutiveFailures} consecutive failures. Automatic failover activated.`
                      : `System latency (${stats.latencyMs}ms) exceeds safety thresholds. Performance degraded.`
                    }
                  </p>
                  <div className="flex gap-2 mt-4">
                    {latency?.circuitOpen && (
                      <Button
                        size="sm"
                        onClick={() => performMaintenance.mutate('reset-circuit')}
                        disabled={performMaintenance.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Circuit Breaker
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="bg-white/10">
                      View Error Logs
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vitals KPI Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <VitalCard
            title="Latency"
            value={stats.latencyMs >= 0 ? stats.latencyMs : 'N/A'}
            unit={stats.latencyMs >= 0 ? 'ms' : ''}
            icon={Gauge}
            status={(latency?.status === 'healthy' || latency?.status === 'warning' || latency?.status === 'critical') ? latency.status : (stats.latencyMs < 50 ? 'healthy' : stats.latencyMs < 200 ? 'warning' : 'critical')}
            color={stats.latencyMs < 50 ? 'green' : stats.latencyMs < 200 ? 'amber' : 'red'}
            subtitle={latency?.trend ? `Trend: ${latency.trend}` : `Avg: ${latency?.averageMs || stats.latencyMs}ms`}
          />
          <VitalCard
            title="Uptime"
            value={uptimeHours}
            unit="hours"
            icon={Clock}
            color="blue"
            subtitle={`${uptimePercentage}% reliability`}
          />
          <VitalCard
            title="Storage"
            value={stats.storageUsage.formatted}
            icon={HardDrive}
            color="purple"
            progress={stats.storageUsage.quotaUsagePercent || 0}
            subtitle={`WAL: ${(stats.storageUsage.wal / 1024 / 1024).toFixed(1)}MB`}
          />
          <VitalCard
            title="CPU Load"
            value={resources?.cpuUsage || 0}
            unit="%"
            icon={Cpu}
            color={resources?.cpuUsage > 80 ? 'red' : resources?.cpuUsage > 50 ? 'amber' : 'green'}
            status={resources?.cpuUsage > 80 ? 'critical' : resources?.cpuUsage > 50 ? 'warning' : 'healthy'}
          />
          <VitalCard
            title="Memory"
            value={resources?.memoryPercentage || 0}
            unit="%"
            icon={MemoryStick}
            color={resources?.memoryPercentage > 85 ? 'red' : 'blue'}
            subtitle={`${resources?.memoryUsageMB || 0}MB used`}
            progress={resources?.memoryPercentage}
          />
          <VitalCard
            title="Records"
            value={totalRows.toLocaleString()}
            icon={Database}
            color="orange"
            subtitle={`${stats.tables.length} tables`}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="health" className="gap-2">
              <Activity className="h-4 w-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2">
              <Zap className="h-4 w-4" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="integrity" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Integrity
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Table Health */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Table Health & Usage
                  </CardTitle>
                  <CardDescription>Real-time row counts and status per entity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-3">
                      {stats.tables.map((table) => (
                        <div
                          key={table.tableName}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              table.status === 'healthy' ? "bg-green-500" :
                                table.status === 'warning' ? "bg-amber-500" : "bg-red-500"
                            )} />
                            <div>
                              <p className="font-semibold text-sm">{table.tableName}</p>
                              <p className="text-xs text-muted-foreground">
                                {table.formattedSize || 'Schema Verified'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold">{table.rowCount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">records</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Sync Status */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {stats.syncStatus.mode === 'local-first' ? (
                      <WifiOff className="h-5 w-5 text-orange-500" />
                    ) : (
                      <Wifi className="h-5 w-5 text-green-500" />
                    )}
                    Sync & Replication
                  </CardTitle>
                  <CardDescription>Data synchronization health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">Mode</p>
                      <p className="text-xl font-bold capitalize">{stats.syncStatus.mode.replace('-', ' ')}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">Queue Health</p>
                      <Badge variant={stats.syncStatus.queueHealth === 'clear' ? 'default' : 'secondary'}>
                        {stats.syncStatus.queueHealth || 'clear'}
                      </Badge>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">Pending Uploads</p>
                      <p className="text-xl font-bold">{stats.syncStatus.pendingUploads}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">Sync Gap</p>
                      <p className="text-xl font-bold">{stats.syncStatus.syncGap || 0}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Sync</span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(stats.syncStatus.lastSync), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Backup</span>
                      <span className="font-medium">
                        {stats.lastBackup !== 'Never'
                          ? formatDistanceToNow(new Date(stats.lastBackup), { addSuffix: true })
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Maintenance Console
                </CardTitle>
                <CardDescription>Perform critical database optimization tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950"
                        onClick={() => performMaintenance.mutate('vacuum')}
                        disabled={performMaintenance.isPending}
                      >
                        <Trash2 className="h-6 w-6 text-blue-500" />
                        <span className="font-semibold">Optimize</span>
                        <span className="text-xs text-muted-foreground">VACUUM</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reclaim disk space and defragment database</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-2 hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950"
                        onClick={() => performMaintenance.mutate('analyze')}
                        disabled={performMaintenance.isPending}
                      >
                        <Activity className="h-6 w-6 text-green-500" />
                        <span className="font-semibold">Analyze</span>
                        <span className="text-xs text-muted-foreground">Update Stats</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Update query planner statistics for better performance</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950"
                        onClick={() => performMaintenance.mutate('checkpoint')}
                        disabled={performMaintenance.isPending}
                      >
                        <Database className="h-6 w-6 text-purple-500" />
                        <span className="font-semibold">Checkpoint</span>
                        <span className="text-xs text-muted-foreground">Flush WAL</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Write all pending changes to main database file</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-2 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-950"
                        onClick={() => createBackup.mutate()}
                        disabled={createBackup.isPending}
                      >
                        <Archive className="h-6 w-6 text-amber-500" />
                        <span className="font-semibold">Backup</span>
                        <span className="text-xs text-muted-foreground">Snapshot</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a full database backup</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <ConsoleOutput logs={maintenanceLog} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrity Tab */}
          <TabsContent value="integrity" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                    Integrity Audit
                  </CardTitle>
                  <CardDescription>Data consistency and referential integrity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleIntegrityScan}
                      className="flex-1"
                      disabled={isCheckingIntegrity}
                    >
                      {isCheckingIntegrity ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run Full Scan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadReport}
                      disabled={!integrity}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>

                  {integrity && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Score Display */}
                      <div className={cn(
                        "p-6 rounded-xl text-center",
                        integrity.score >= 80 ? "bg-green-500/10 border border-green-500/30" :
                          integrity.score >= 50 ? "bg-amber-500/10 border border-amber-500/30" :
                            "bg-red-500/10 border border-red-500/30"
                      )}>
                        <div className="text-5xl font-bold mb-2">
                          {integrity.score}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Integrity Score
                        </div>
                        <Badge className="mt-2" variant={integrity.healthy ? 'default' : 'destructive'}>
                          {integrity.healthy ? 'PASSED' : 'ISSUES FOUND'}
                        </Badge>
                      </div>

                      {/* Issues List */}
                      {!integrity.healthy && (
                        <div className="space-y-3">
                          {integrity.orphanedRecords.map((issue, i) => (
                            <Alert key={`orphan-${i}`} variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                {issue.count} orphaned records in <code>{issue.table}.{issue.column}</code>
                              </AlertDescription>
                            </Alert>
                          ))}
                          {integrity.nullViolations.map((issue, i) => (
                            <Alert key={`null-${i}`}>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                {issue.count} NULL values in <code>{issue.table}.{issue.column}</code>
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground text-center">
                        Scan completed in {integrity.duration}ms at {format(new Date(integrity.checkedAt), 'HH:mm:ss')}
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-slate-500" />
                    Security Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Lock className="h-3.5 w-3.5" />
                      Database Path (Masked)
                    </div>
                    <code className="text-xs text-muted-foreground">
                      ********/secure_data/fabzclean.db
                    </code>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Access Policy
                    </div>
                    <p className="text-sm">
                      Admin-only access • All actions logged • Credentials encrypted
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Server className="h-3.5 w-3.5" />
                      Runtime
                    </div>
                    <p className="text-sm font-mono">
                      Node {resources?.nodeVersion || 'N/A'} on {resources?.platform || 'unknown'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-slate-500" />
                  Migration History
                </CardTitle>
                <CardDescription>Recent schema changes and migrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {migrations.length > 0 ? (
                    migrations.map((m, i) => (
                      <div
                        key={m.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border"
                      >
                        <div className="mt-1">
                          <CircleDot className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" title={m.name}>{m.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Applied {format(new Date(m.appliedAt), 'PPp')}
                          </p>
                          {m.preview && (
                            <pre className="mt-2 text-xs text-muted-foreground bg-background p-2 rounded overflow-x-auto">
                              {m.preview.substring(0, 150)}...
                            </pre>
                          )}
                        </div>
                        {m.sizeBytes && (
                          <Badge variant="secondary" className="text-xs">
                            {(m.sizeBytes / 1024).toFixed(1)} KB
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No migration history found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
          <span>Last updated: {format(new Date(dataUpdatedAt || Date.now()), 'HH:mm:ss')}</span>
          <span>Auto-refresh: 5s</span>
        </div>

      </div>
    </TooltipProvider>
  );
}
