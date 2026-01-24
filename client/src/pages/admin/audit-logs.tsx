import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import {
    Calendar as CalendarIcon,
    Search,
    Filter,
    RefreshCw,
    Download,
    User,
    ShoppingBag,
    CreditCard,
    Printer,
    Shield,
    Package,
    Settings,
    UserPlus,
    UserMinus,
    LogIn,
    LogOut,
    Edit,
    Trash2,
    Eye,
    Plus,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Activity,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Building,
    Factory,
    Wifi,
    WifiOff,
    MessageSquare,
    ArrowUpRight,
    ArrowDownRight,
    Globe,
    Fingerprint,
    AlertOctagon,
    TrendingUp,
    Monitor,
    Zap,
    Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

// ============ TYPES ============

interface AuditLog {
    id: string;
    employeeId: string;
    franchiseId?: string;
    employeeName?: string;
    action: string;
    entityType: string;
    entityId: string;
    details: any;
    oldValue?: any;
    newValue?: any;
    category?: string;
    severity?: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
}

interface SurveillanceStats {
    highSeverityCount: number;
    communicationCount: number;
    totalToday: number;
    failedLogins: number;
    activeSessions: number;
    anomalyCount: number;
    anomalies: { employeeId: string; reason: string; timestamp: string }[];
    categoryBreakdown: Record<string, number>;
}

interface EmployeeInfo {
    id: string;
    fullName: string;
    username: string;
    role: string;
    franchiseId: string;
}

// ============ HELPER FUNCTIONS ============

const formatActionDescription = (log: AuditLog): string => {
    const { action, entityType, entityId, details } = log;
    const d = details || {};

    switch (action) {
        case 'login': return `Logged in successfully`;
        case 'logout': return `Logged out`;
        case 'failed_login': return `Failed login attempt for ${d.email || d.username || 'unknown user'}`;
        case 'password_change': return `Changed password`;
        case 'create_order': return `Created order ${d.orderNumber || entityId}`;
        case 'update_order': return `Updated order ${d.orderNumber || entityId}`;
        case 'delete_order': return `Deleted order ${entityId}`;
        case 'payment_received': return `Received payment ₹${d.amount || 0}`;
        case 'mark_paid': return `Marked order ${d.orderNumber || entityId} as paid`;
        case 'refund_issued': return `Issued refund of ₹${d.amount || 0}`;
        case 'print_invoice': return `Printed invoice for ${d.orderNumber || entityId}`;
        case 'create_employee': return `Created user: ${d.username || d.fullName || entityId}`;
        case 'update_employee': return `Updated user: ${d.username || entityId}`;
        case 'delete_employee': return `Deactivated user: ${entityId}`;
        case 'role_change': return `Changed role: ${d.oldRole} → ${d.newRole}`;
        case 'create_transit': return `Created transit with ${d.orderCount || 0} orders`;
        case 'update_transit': return `Updated transit status to ${d.status}`;
        case 'whatsapp_sent':
        case 'whatsapp_success': return `Sent WhatsApp to ${d.recipientPhone || 'customer'}`;
        case 'whatsapp_failed': return `WhatsApp failed: ${d.error || 'unknown error'}`;
        case 'data_export': return `Exported ${d.exportType || 'data'}`;
        case 'database_access': return `Accessed database monitor`;
        default:
            if (action.startsWith('order_status_')) {
                return `Order status → ${action.replace('order_status_', '')}`;
            }
            if (action.startsWith('HTTP_')) {
                return `${action.replace('HTTP_', '')} ${d.path || entityId}`;
            }
            return `${action.replace(/_/g, ' ')}`;
    }
};

const getActionIcon = (action: string, category?: string) => {
    if (action.includes('login')) return <LogIn className="h-4 w-4" />;
    if (action.includes('logout')) return <LogOut className="h-4 w-4" />;
    if (action.includes('whatsapp')) return <MessageSquare className="h-4 w-4" />;
    if (action.includes('order') && action.includes('create')) return <ShoppingBag className="h-4 w-4" />;
    if (action.includes('order')) return <Package className="h-4 w-4" />;
    if (action.includes('payment') || action.includes('paid') || action.includes('credit')) return <CreditCard className="h-4 w-4" />;
    if (action.includes('print')) return <Printer className="h-4 w-4" />;
    if (action.includes('employee') && action.includes('create')) return <UserPlus className="h-4 w-4" />;
    if (action.includes('employee') && action.includes('delete')) return <UserMinus className="h-4 w-4" />;
    if (action.includes('transit')) return <Truck className="h-4 w-4" />;
    if (action.includes('settings') || action.includes('database')) return <Settings className="h-4 w-4" />;
    if (action.includes('export')) return <Download className="h-4 w-4" />;
    if (action.includes('delete')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('update')) return <Edit className="h-4 w-4" />;
    if (action.includes('create')) return <Plus className="h-4 w-4" />;
    if (category === 'security') return <Shield className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
};

const getCategoryConfig = (category: string) => {
    const configs: Record<string, { bg: string; text: string; border: string; label: string; icon: React.ReactNode }> = {
        financial: {
            bg: 'bg-amber-500/10',
            text: 'text-amber-600',
            border: 'border-amber-500/30',
            label: 'Financial',
            icon: <CreditCard className="h-3 w-3" />
        },
        logistics: {
            bg: 'bg-cyan-500/10',
            text: 'text-cyan-600',
            border: 'border-cyan-500/30',
            label: 'Logistics',
            icon: <Truck className="h-3 w-3" />
        },
        security: {
            bg: 'bg-red-500/10',
            text: 'text-red-600',
            border: 'border-red-500/30',
            label: 'Security',
            icon: <Shield className="h-3 w-3" />
        },
        lifecycle: {
            bg: 'bg-blue-500/10',
            text: 'text-blue-600',
            border: 'border-blue-500/30',
            label: 'Lifecycle',
            icon: <RefreshCw className="h-3 w-3" />
        },
        communication: {
            bg: 'bg-green-500/10',
            text: 'text-green-600',
            border: 'border-green-500/30',
            label: 'Communication',
            icon: <MessageSquare className="h-3 w-3" />
        },
        api: {
            bg: 'bg-violet-500/10',
            text: 'text-violet-600',
            border: 'border-violet-500/30',
            label: 'API',
            icon: <Globe className="h-3 w-3" />
        },
        system: {
            bg: 'bg-purple-500/10',
            text: 'text-purple-600',
            border: 'border-purple-500/30',
            label: 'System',
            icon: <Settings className="h-3 w-3" />
        }
    };
    return configs[category] || configs.system;
};

const getSeverityConfig = (severity: string) => {
    const configs: Record<string, { color: string; label: string; pulse?: boolean }> = {
        critical: { color: 'bg-red-500', label: 'Critical', pulse: true },
        warning: { color: 'bg-amber-500', label: 'Warning' },
        info: { color: 'bg-blue-500', label: 'Info' }
    };
    return configs[severity] || configs.info;
};

// ============ COMPONENTS ============

// KPI Card Component
const KPICard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'blue',
    pulse = false
}: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: string;
    pulse?: boolean;
}) => (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50">
        <div className={cn(
            "absolute inset-0 opacity-5",
            color === 'red' && "bg-gradient-to-br from-red-500 to-red-600",
            color === 'green' && "bg-gradient-to-br from-green-500 to-green-600",
            color === 'amber' && "bg-gradient-to-br from-amber-500 to-amber-600",
            color === 'blue' && "bg-gradient-to-br from-blue-500 to-blue-600",
            color === 'purple' && "bg-gradient-to-br from-purple-500 to-purple-600"
        )} />
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {trendValue && (
                        <p className={cn(
                            "text-xs mt-1 flex items-center gap-1",
                            trend === 'up' ? 'text-green-600' : 'text-red-600'
                        )}>
                            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {trendValue}
                        </p>
                    )}
                </div>
                <div className={cn(
                    "p-3 rounded-xl",
                    color === 'red' && "bg-red-500/10 text-red-600",
                    color === 'green' && "bg-green-500/10 text-green-600",
                    color === 'amber' && "bg-amber-500/10 text-amber-600",
                    color === 'blue' && "bg-blue-500/10 text-blue-600",
                    color === 'purple' && "bg-purple-500/10 text-purple-600",
                    pulse && "animate-pulse"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </CardContent>
    </Card>
);

// Delta Diff View Component
const DeltaDiffView = ({ oldValue, newValue }: { oldValue: any; newValue: any }) => {
    if (!oldValue && !newValue) return null;

    const allKeys = new Set([
        ...Object.keys(oldValue || {}),
        ...Object.keys(newValue || {})
    ]);

    const changes = Array.from(allKeys).filter(key => {
        if (['id', 'createdAt', 'updatedAt'].includes(key)) return false;
        return JSON.stringify(oldValue?.[key]) !== JSON.stringify(newValue?.[key]);
    });

    if (changes.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">No changes detected</p>
        );
    }

    return (
        <div className="space-y-2">
            {changes.map(key => (
                <div key={key} className="flex items-start gap-2 text-xs">
                    <span className="font-medium text-muted-foreground min-w-[100px]">{key}:</span>
                    <div className="flex-1 flex items-center gap-2">
                        {oldValue?.[key] !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 line-through">
                                {String(oldValue[key])}
                            </span>
                        )}
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        {newValue?.[key] !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600">
                                {String(newValue[key])}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Employee Hover Card Component
const EmployeeHoverCard = ({ employeeId, children }: { employeeId: string; children: React.ReactNode }) => {
    const [info, setInfo] = useState<EmployeeInfo | null>(null);

    const fetchEmployeeInfo = async () => {
        if (info) return;
        try {
            const response = await fetch(`/api/audit-logs/employee/${employeeId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setInfo(data.data.employee);
            }
        } catch (error) {
            console.error('Failed to fetch employee info:', error);
        }
    };

    return (
        <HoverCard onOpenChange={(open) => open && fetchEmployeeInfo()}>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent className="w-64" side="right">
                {info ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">{info.fullName || info.username}</p>
                                <p className="text-xs text-muted-foreground">@{info.username}</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <p className="text-muted-foreground">Role</p>
                                <Badge variant="outline" className="mt-1">{info.role}</Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Franchise</p>
                                <p className="font-mono text-xs mt-1">{info.franchiseId || 'HQ'}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                )}
            </HoverCardContent>
        </HoverCard>
    );
};

// ============ MAIN COMPONENT ============

export default function AuditLogsPage() {
    const { toast } = useToast();
    const { employee: currentUser } = useAuth();
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLive, setIsLive] = useState(true);
    const [criticalOnly, setCriticalOnly] = useState(false);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    // Fetch surveillance stats
    const { data: statsData, refetch: refetchStats } = useQuery({
        queryKey: ['audit-stats'],
        queryFn: async () => {
            const response = await fetch('/api/audit-logs/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        },
        refetchInterval: isLive ? 10000 : false,
    });

    const stats: SurveillanceStats = statsData?.data || {
        highSeverityCount: 0,
        communicationCount: 0,
        totalToday: 0,
        failedLogins: 0,
        activeSessions: 0,
        anomalyCount: 0,
        anomalies: [],
        categoryBreakdown: {}
    };

    // Infinite query for logs with cursor pagination
    const {
        data: logsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch
    } = useInfiniteQuery({
        queryKey: ['audit-logs', actionFilter, categoryFilter, date, criticalOnly],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams({
                limit: '30',
                ...(pageParam && { cursor: pageParam }),
                ...(actionFilter !== 'all' && { action: actionFilter }),
                ...(categoryFilter !== 'all' && { category: categoryFilter }),
                ...(criticalOnly && { criticalOnly: 'true' }),
            });

            if (date) {
                const startDate = new Date(date);
                startDate.setHours(0, 0, 0, 0);
                params.append('startDate', startDate.toISOString());

                const endDate = new Date(date);
                endDate.setHours(23, 59, 59, 999);
                params.append('endDate', endDate.toISOString());
            }

            const response = await fetch(`/api/audit-logs?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch audit logs');
            return response.json();
        },
        getNextPageParam: (lastPage) => lastPage.pagination?.nextCursor,
        initialPageParam: undefined as string | undefined,
        refetchInterval: isLive ? 5000 : false,
    });

    // Flatten all pages into single log array
    const allLogs = useMemo(() => {
        return logsData?.pages.flatMap(page => page.data) || [];
    }, [logsData]);

    // Filter by search query
    const filteredLogs = useMemo(() => {
        if (!searchQuery.trim()) return allLogs;
        const query = searchQuery.toLowerCase();
        return allLogs.filter((log: AuditLog) => {
            const description = formatActionDescription(log).toLowerCase();
            return (
                description.includes(query) ||
                log.employeeId?.toLowerCase().includes(query) ||
                log.action.toLowerCase().includes(query) ||
                log.entityId?.toLowerCase().includes(query) ||
                log.ipAddress?.toLowerCase().includes(query)
            );
        });
    }, [allLogs, searchQuery]);

    // Infinite scroll handler
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    // Export handler
    const handleExport = async (formatType: 'csv' | 'json') => {
        if (!filteredLogs.length) {
            toast({
                title: "Nothing to export",
                description: "No logs available to export.",
                variant: "destructive"
            });
            return;
        }

        try {
            // Log export action on server
            await fetch('/api/audit-logs/export', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('employee_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    format: formatType,
                    startDate: date?.toISOString(),
                })
            });

            if (formatType === 'json') {
                const exportData = filteredLogs.map((log: AuditLog) => ({
                    time: log.createdAt,
                    user: log.employeeId,
                    action: log.action,
                    category: log.category,
                    severity: log.severity,
                    description: formatActionDescription(log),
                    entityType: log.entityType,
                    entityId: log.entityId,
                    ipAddress: log.ipAddress,
                }));

                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `surveillance-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                const headers = ['Time', 'User', 'Action', 'Category', 'Severity', 'Description', 'IP Address'];
                const csvRows = [
                    headers.join(','),
                    ...filteredLogs.map((log: AuditLog) => {
                        const row = [
                            format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                            log.employeeId,
                            log.action,
                            log.category || '',
                            log.severity || '',
                            `"${formatActionDescription(log).replace(/"/g, '""')}"`,
                            log.ipAddress
                        ];
                        return row.join(',');
                    })
                ];

                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `surveillance-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            toast({
                title: "Export Successful",
                description: `Surveillance logs exported as ${formatType.toUpperCase()}`,
            });
        } catch (error) {
            toast({
                title: "Export Failed",
                description: "Failed to export logs. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Role badge renderer
    const getRoleBadge = () => {
        if (!currentUser) return null;
        const role = currentUser.role;

        const badges: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
            admin: {
                bg: 'bg-purple-500/10',
                text: 'text-purple-600',
                icon: <Shield className="h-3 w-3" />,
                label: 'System Admin'
            },
            franchise_manager: {
                bg: 'bg-blue-500/10',
                text: 'text-blue-600',
                icon: <Building className="h-3 w-3" />,
                label: 'Franchise Manager'
            },
            factory_manager: {
                bg: 'bg-amber-500/10',
                text: 'text-amber-600',
                icon: <Factory className="h-3 w-3" />,
                label: 'Factory Manager'
            }
        };

        const badge = badges[role] || { bg: 'bg-gray-500/10', text: 'text-gray-600', icon: <User className="h-3 w-3" />, label: 'Staff' };

        return (
            <Badge variant="outline" className={cn(badge.bg, badge.text, "border-current/30")}>
                {badge.icon}
                <span className="ml-1">{badge.label}</span>
            </Badge>
        );
    };

    return (
        <TooltipProvider>
            <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                <Fingerprint className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                    Surveillance Hub
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    System accountability & security monitoring
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {getRoleBadge()}

                        {/* Live Toggle */}
                        <div className="flex items-center space-x-2 bg-card p-2 px-3 rounded-lg border">
                            <Switch
                                id="live-mode"
                                checked={isLive}
                                onCheckedChange={setIsLive}
                            />
                            <Label htmlFor="live-mode" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                {isLive ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <Wifi className="h-4 w-4 text-green-600" />
                                    </>
                                ) : (
                                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Label>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { refetch(); refetchStats(); }}
                            disabled={isLoading}
                        >
                            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                            Refresh
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleExport('csv')}>
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('json')}>
                                    Export as JSON
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Security Pulse KPI Ribbon */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <KPICard
                        title="High Severity"
                        value={stats.highSeverityCount}
                        icon={AlertOctagon}
                        color="red"
                        pulse={stats.highSeverityCount > 0}
                    />
                    <KPICard
                        title="Communications"
                        value={stats.communicationCount}
                        icon={MessageSquare}
                        color="green"
                    />
                    <KPICard
                        title="Active Sessions"
                        value={stats.activeSessions}
                        icon={Monitor}
                        color="blue"
                    />
                    <KPICard
                        title="Failed Logins"
                        value={stats.failedLogins}
                        icon={Shield}
                        color={stats.failedLogins > 0 ? 'amber' : 'blue'}
                    />
                    <KPICard
                        title="Total Today"
                        value={stats.totalToday}
                        icon={Activity}
                        color="purple"
                    />
                    <KPICard
                        title="Anomalies"
                        value={stats.anomalyCount}
                        icon={AlertTriangle}
                        color={stats.anomalyCount > 0 ? 'red' : 'blue'}
                        pulse={stats.anomalyCount > 0}
                    />
                </div>

                {/* Anomaly Alert */}
                {stats.anomalies.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-red-500/30 bg-red-500/5">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-red-500/10 animate-pulse">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-red-600">Security Anomalies Detected</p>
                                        <p className="text-sm text-muted-foreground">
                                            {stats.anomalies.map(a => `${a.employeeId}: ${a.reason}`).join(' • ')}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" className="border-red-500/30 text-red-600 hover:bg-red-500/10">
                                        Investigate
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Filters */}
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search logs by user, action, IP..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="financial">💰 Financial</SelectItem>
                                        <SelectItem value="logistics">🚚 Logistics</SelectItem>
                                        <SelectItem value="security">🔐 Security</SelectItem>
                                        <SelectItem value="lifecycle">🔄 Lifecycle</SelectItem>
                                        <SelectItem value="communication">💬 Communication</SelectItem>
                                        <SelectItem value="system">⚙️ System</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={actionFilter} onValueChange={setActionFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Actions</SelectItem>
                                        <SelectItem value="login">🔐 Login</SelectItem>
                                        <SelectItem value="order">📦 Orders</SelectItem>
                                        <SelectItem value="payment">💳 Payments</SelectItem>
                                        <SelectItem value="transit">🚚 Transit</SelectItem>
                                        <SelectItem value="employee">👤 Users</SelectItem>
                                        <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                                        <SelectItem value="export">📤 Exports</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[140px] justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "MMM d") : "Date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(d) => d > new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                {date && (
                                    <Button variant="ghost" size="icon" onClick={() => setDate(undefined)}>
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                )}

                                <div className="flex items-center space-x-2 bg-card p-2 px-3 rounded-lg border">
                                    <Switch
                                        id="critical-only"
                                        checked={criticalOnly}
                                        onCheckedChange={setCriticalOnly}
                                    />
                                    <Label htmlFor="critical-only" className="text-sm cursor-pointer">
                                        Critical Only
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card className="border shadow-sm overflow-hidden">
                    <CardHeader className="py-3 px-4 border-b bg-muted/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Activity Feed
                                <Badge variant="secondary" className="ml-2">
                                    {logsData?.pages[0]?.pagination?.total || 0} records
                                </Badge>
                            </CardTitle>
                            {hasNextPage && (
                                <Badge variant="outline" className="text-xs">
                                    Scroll for more
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <ScrollArea className="h-[calc(100vh-480px)] min-h-[400px]" onScroll={handleScroll as any}>
                        <div className="p-4">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex gap-4 p-3 rounded-lg border">
                                            <Skeleton className="w-10 h-10 rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="text-center py-10">
                                    <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                                    <p className="text-destructive font-medium">Failed to load activity logs</p>
                                    <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                                        Try Again
                                    </Button>
                                </div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="text-center py-10">
                                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No activities found</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    <div className="space-y-2">
                                        {filteredLogs.map((log: AuditLog, index: number) => {
                                            const categoryConfig = getCategoryConfig(log.category || 'system');
                                            const severityConfig = getSeverityConfig(log.severity || 'info');
                                            const isExpanded = expandedLog === log.id;

                                            return (
                                                <motion.div
                                                    key={log.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                                                    className={cn(
                                                        "relative group rounded-lg border p-3 transition-all cursor-pointer",
                                                        categoryConfig.bg,
                                                        categoryConfig.border,
                                                        isExpanded && "ring-2 ring-primary/20",
                                                        log.severity === 'critical' && "border-red-500/50"
                                                    )}
                                                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                                >
                                                    {/* Severity indicator */}
                                                    <div className={cn(
                                                        "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                                                        severityConfig.color,
                                                        severityConfig.pulse && "animate-pulse"
                                                    )} />

                                                    <div className="flex items-start gap-3 pl-2">
                                                        {/* Icon */}
                                                        <div className={cn(
                                                            "p-2 rounded-lg shrink-0",
                                                            categoryConfig.bg
                                                        )}>
                                                            <span className={categoryConfig.text}>
                                                                {getActionIcon(log.action, log.category)}
                                                            </span>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                                <p className={cn("font-medium text-sm", categoryConfig.text)}>
                                                                    {formatActionDescription(log)}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                                                                    <Clock className="h-3 w-3" />
                                                                    {format(new Date(log.createdAt), 'HH:mm:ss')}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={cn("text-xs", categoryConfig.bg, categoryConfig.text)}
                                                                >
                                                                    {categoryConfig.icon}
                                                                    <span className="ml-1">{categoryConfig.label}</span>
                                                                </Badge>

                                                                <EmployeeHoverCard employeeId={log.employeeId}>
                                                                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                                                        by <span className="font-medium">{log.employeeId}</span>
                                                                    </span>
                                                                </EmployeeHoverCard>

                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Globe className="h-3 w-3" />
                                                                            {log.ipAddress?.substring(0, 15) || 'unknown'}
                                                                        </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>IP: {log.ipAddress}</p>
                                                                        <p className="text-xs text-muted-foreground">{log.userAgent?.substring(0, 50)}...</p>
                                                                    </TooltipContent>
                                                                </Tooltip>

                                                                <span className="text-xs text-muted-foreground">
                                                                    • {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                                </span>
                                                            </div>

                                                            {/* Expanded Details */}
                                                            <AnimatePresence>
                                                                {isExpanded && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <Separator className="my-3" />

                                                                        {/* Delta View */}
                                                                        {(log.oldValue || log.newValue) && (
                                                                            <div className="mb-3">
                                                                                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                                                                    <Zap className="h-3 w-3" />
                                                                                    Change Delta
                                                                                </p>
                                                                                <div className="bg-background/50 rounded-lg p-3">
                                                                                    <DeltaDiffView
                                                                                        oldValue={log.oldValue}
                                                                                        newValue={log.newValue}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                                            <div>
                                                                                <p className="text-muted-foreground">Entity Type</p>
                                                                                <p className="font-medium capitalize">{log.entityType || 'System'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground">Entity ID</p>
                                                                                <p className="font-medium font-mono truncate">{log.entityId || 'N/A'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground">Severity</p>
                                                                                <Badge
                                                                                    className={cn(
                                                                                        "mt-1",
                                                                                        log.severity === 'critical' && "bg-red-500",
                                                                                        log.severity === 'warning' && "bg-amber-500",
                                                                                        log.severity === 'info' && "bg-blue-500"
                                                                                    )}
                                                                                >
                                                                                    {log.severity || 'info'}
                                                                                </Badge>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground">Timestamp</p>
                                                                                <p className="font-medium">{format(new Date(log.createdAt), 'PPpp')}</p>
                                                                            </div>
                                                                        </div>

                                                                        {log.details && Object.keys(log.details).length > 0 && (
                                                                            <div className="mt-3">
                                                                                <p className="text-muted-foreground text-xs mb-1">Raw Details</p>
                                                                                <div className="bg-background/50 rounded p-2 text-xs font-mono max-h-32 overflow-auto">
                                                                                    <pre className="whitespace-pre-wrap">
                                                                                        {JSON.stringify(log.details, null, 2)}
                                                                                    </pre>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>

                                                        {/* Expand indicator */}
                                                        <div className="shrink-0">
                                                            {isExpanded ? (
                                                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        {/* Loading more indicator */}
                                        {isFetchingNextPage && (
                                            <div className="flex items-center justify-center py-4">
                                                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                                <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                                            </div>
                                        )}
                                    </div>
                                </AnimatePresence>
                            )}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </TooltipProvider>
    );
}
