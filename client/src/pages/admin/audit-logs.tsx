import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Card,
    CardContent,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
    Building,
    Factory,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface AuditLog {
    id: string;
    employeeId: string;
    franchiseId?: string;
    employeeName?: string;
    action: string;
    entityType: string;
    entityId: string;
    details: any;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
}

// Convert action to human-readable description
const formatActionDescription = (log: AuditLog): string => {
    const { action, entityType, entityId, details } = log;
    const d = details || {};

    // Build human-readable descriptions
    switch (action) {
        // Authentication
        case 'login':
            return `Logged in successfully`;
        case 'logout':
            return `Logged out`;
        case 'failed_login':
            return `Failed login attempt for ${d.email || 'unknown user'}`;
        case 'password_change':
            return `Changed password`;

        // Orders
        case 'create_order':
            return `Created new order ${d.orderNumber || entityId} for ${d.customerName || 'customer'}`;
        case 'update_order':
            return `Updated order ${d.orderNumber || entityId}`;
        case 'delete_order':
            return `Deleted order ${entityId}`;
        case 'order_status_pending':
        case 'order_status_processing':
        case 'order_status_ready':
        case 'order_status_completed':
        case 'order_status_cancelled':
        case 'order_status_delivered':
            const status = action.replace('order_status_', '');
            return `Changed order ${d.orderNumber || entityId} status to ${status}`;

        // Payments
        case 'payment_received':
            const amount = d.amount ? `₹${d.amount}` : '';
            return `Received payment ${amount} for order ${d.orderNumber || entityId}`;
        case 'mark_paid':
            return `Marked order ${d.orderNumber || entityId} as paid`;
        case 'refund_issued':
            return `Issued refund of ₹${d.amount || 0} for order ${d.orderNumber || entityId}`;

        // Printing
        case 'print_invoice':
            return `Printed invoice for order ${d.orderNumber || entityId}`;
        case 'print_tags':
            return `Printed ${d.tagCount || ''} tags for order ${d.orderNumber || entityId}`;
        case 'print_document':
            return `Printed document: ${d.documentType || entityId}`;

        // Employees
        case 'create_employee':
            return `Created new user: ${d.username || d.fullName || entityId} (${d.role || 'staff'})`;
        case 'update_employee':
            return `Updated user profile: ${d.username || entityId}`;
        case 'delete_employee':
            return `Deactivated user: ${entityId}`;
        case 'revoke_access':
            return `Revoked access for user: ${entityId}`;
        case 'restore_access':
            return `Restored access for user: ${entityId}`;
        case 'role_change':
            return `Changed role for ${d.username || entityId} from ${d.oldRole} to ${d.newRole}`;

        // Customers
        case 'create_customer':
            return `Added new customer: ${d.name || d.customerName || entityId}`;
        case 'update_customer':
            return `Updated customer: ${d.name || entityId}`;
        case 'delete_customer':
            return `Removed customer: ${entityId}`;

        // Transit
        case 'create_transit':
            return `Created transit order ${d.transitId || entityId} with ${d.orderCount || 0} orders`;
        case 'update_transit':
            return `Updated transit ${d.transitId || entityId} status to ${d.status || 'updated'}`;
        case 'complete_transit':
            return `Completed transit ${d.transitId || entityId}`;
        case 'cancel_transit':
            return `Cancelled transit ${d.transitId || entityId}`;

        // Services
        case 'create_service':
            return `Added new service: ${d.name || entityId}`;
        case 'update_service':
            return `Updated service: ${d.name || entityId}`;
        case 'delete_service':
            return `Removed service: ${entityId}`;

        // Inventory
        case 'add_inventory':
            return `Added ${d.quantity || 0} units of ${d.productName || entityId} to inventory`;
        case 'update_inventory':
            return `Updated inventory for ${d.productName || entityId}`;
        case 'low_stock_alert':
            return `Low stock alert: ${d.productName || entityId} (${d.currentStock || 0} remaining)`;

        // Settings
        case 'settings_update':
            return `Updated ${d.settingKey || 'system'} settings`;
        case 'backup_created':
            return `Created system backup`;
        case 'data_export':
            return `Exported ${d.exportType || 'data'} report`;

        default:
            return `${action.replace(/_/g, ' ')} on ${entityType || 'system'}`;
    }
};

// Get icon for action type
const getActionIcon = (action: string) => {
    if (action.includes('login')) return <LogIn className="h-4 w-4" />;
    if (action.includes('logout')) return <LogOut className="h-4 w-4" />;
    if (action.includes('order') && action.includes('create')) return <ShoppingBag className="h-4 w-4" />;
    if (action.includes('order')) return <Package className="h-4 w-4" />;
    if (action.includes('payment') || action.includes('paid')) return <CreditCard className="h-4 w-4" />;
    if (action.includes('print')) return <Printer className="h-4 w-4" />;
    if (action.includes('employee') && action.includes('create')) return <UserPlus className="h-4 w-4" />;
    if (action.includes('employee') && action.includes('delete')) return <UserMinus className="h-4 w-4" />;
    if (action.includes('employee')) return <User className="h-4 w-4" />;
    if (action.includes('customer')) return <User className="h-4 w-4" />;
    if (action.includes('transit')) return <Truck className="h-4 w-4" />;
    if (action.includes('service')) return <Settings className="h-4 w-4" />;
    if (action.includes('inventory')) return <Package className="h-4 w-4" />;
    if (action.includes('settings')) return <Settings className="h-4 w-4" />;
    if (action.includes('revoke')) return <Shield className="h-4 w-4" />;
    if (action.includes('restore')) return <CheckCircle className="h-4 w-4" />;
    if (action.includes('delete') || action.includes('cancel')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('update') || action.includes('edit')) return <Edit className="h-4 w-4" />;
    if (action.includes('create') || action.includes('add')) return <Plus className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
};

// Get color scheme for action type
const getActionColorScheme = (action: string) => {
    if (action.includes('create') || action.includes('add'))
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500' };
    if (action.includes('delete') || action.includes('cancel') || action.includes('failed'))
        return { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', dot: 'bg-red-500' };
    if (action.includes('update') || action.includes('edit') || action.includes('change'))
        return { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', dot: 'bg-blue-500' };
    if (action.includes('payment') || action.includes('paid'))
        return { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', dot: 'bg-amber-500' };
    if (action.includes('print'))
        return { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20', dot: 'bg-purple-500' };
    if (action.includes('login') || action.includes('logout'))
        return { bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/20', dot: 'bg-indigo-500' };
    if (action.includes('transit'))
        return { bg: 'bg-cyan-500/10', text: 'text-cyan-600', border: 'border-cyan-500/20', dot: 'bg-cyan-500' };
    return { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20', dot: 'bg-gray-500' };
};

// Get category label
const getActionCategory = (action: string): string => {
    if (action.includes('login') || action.includes('logout') || action.includes('password')) return 'Authentication';
    if (action.includes('order')) return 'Orders';
    if (action.includes('payment') || action.includes('paid') || action.includes('refund')) return 'Payments';
    if (action.includes('print')) return 'Printing';
    if (action.includes('employee') || action.includes('access') || action.includes('role')) return 'Users';
    if (action.includes('customer')) return 'Customers';
    if (action.includes('transit')) return 'Transit';
    if (action.includes('service')) return 'Services';
    if (action.includes('inventory')) return 'Inventory';
    if (action.includes('settings') || action.includes('backup') || action.includes('export')) return 'System';
    return 'Activity';
};

export default function AuditLogsPage() {
    const { toast } = useToast();
    const { employee: currentUser } = useAuth();
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLive, setIsLive] = useState(true);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());

    // Determine franchise isolation based on role
    const franchiseFilter = useMemo(() => {
        if (!currentUser) return '';
        // Admins see all
        if (currentUser.role === 'admin') return '';
        // Franchise managers see their franchise only
        if (currentUser.role === 'franchise_manager' && currentUser.franchiseId) {
            return currentUser.franchiseId;
        }
        // Others see only their own actions
        return `user:${currentUser.employeeId}`;
    }, [currentUser]);

    // Fetch logs
    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ['audit-logs', page, limit, actionFilter, date, franchiseFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });

            if (actionFilter && actionFilter !== 'all') {
                params.append('action', actionFilter);
            }

            if (date) {
                const startDate = new Date(date);
                startDate.setHours(0, 0, 0, 0);
                params.append('startDate', startDate.toISOString());

                const endDate = new Date(date);
                endDate.setHours(23, 59, 59, 999);
                params.append('endDate', endDate.toISOString());
            }

            // Add franchise filter for isolation
            if (franchiseFilter && !franchiseFilter.startsWith('user:')) {
                params.append('franchiseId', franchiseFilter);
            } else if (franchiseFilter.startsWith('user:')) {
                params.append('employeeId', franchiseFilter.replace('user:', ''));
            }

            const response = await fetch(`/api/audit-logs?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch audit logs');
            }

            return response.json();
        },
        refetchInterval: isLive ? 3000 : false,
    });

    // Track new logs for animation
    const [previousLogIds, setPreviousLogIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (data?.data) {
            const currentIds = new Set(data.data.map((log: AuditLog) => log.id));
            const newIds = new Set<string>();

            currentIds.forEach((id: string) => {
                if (!previousLogIds.has(id)) {
                    newIds.add(id);
                }
            });

            if (newIds.size > 0 && previousLogIds.size > 0) {
                setNewLogIds(newIds);
                // Clear new indicators after animation
                setTimeout(() => setNewLogIds(new Set()), 3000);
            }

            setPreviousLogIds(currentIds);
        }
    }, [data?.data]);

    // Filter logs by search query
    const filteredLogs = useMemo(() => {
        if (!data?.data) return [];
        if (!searchQuery.trim()) return data.data;

        const query = searchQuery.toLowerCase();
        return data.data.filter((log: AuditLog) => {
            const description = formatActionDescription(log).toLowerCase();
            return (
                description.includes(query) ||
                log.employeeId?.toLowerCase().includes(query) ||
                log.action.toLowerCase().includes(query) ||
                log.entityId?.toLowerCase().includes(query)
            );
        });
    }, [data?.data, searchQuery]);

    // Group logs by date
    const groupedLogs = useMemo(() => {
        const groups: { [key: string]: AuditLog[] } = {};

        filteredLogs.forEach((log: AuditLog) => {
            const dateKey = format(new Date(log.createdAt), 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(log);
        });

        return groups;
    }, [filteredLogs]);

    const handleExport = (formatType: 'csv' | 'json') => {
        if (!filteredLogs.length) {
            toast({
                title: "Nothing to export",
                description: "No logs available to export.",
                variant: "destructive"
            });
            return;
        }

        if (formatType === 'json') {
            const exportData = filteredLogs.map((log: AuditLog) => ({
                time: new Date(log.createdAt).toISOString(),
                user: log.employeeId,
                action: log.action,
                description: formatActionDescription(log),
                entityType: log.entityType,
                entityId: log.entityId,
                ipAddress: log.ipAddress,
            }));

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            const headers = ['Time', 'User', 'Action', 'Description', 'IP Address'];
            const csvRows = [
                headers.join(','),
                ...filteredLogs.map((log: AuditLog) => {
                    const row = [
                        format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                        log.employeeId,
                        log.action,
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
            a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        toast({
            title: "Export Successful",
            description: `Audit logs exported as ${formatType.toUpperCase()}`,
        });
    };

    const getRoleBadge = () => {
        if (!currentUser) return null;
        const role = currentUser.role;

        if (role === 'admin') {
            return (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                    <Shield className="h-3 w-3 mr-1" />
                    System Admin View
                </Badge>
            );
        }
        if (role === 'franchise_manager') {
            return (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    <Building className="h-3 w-3 mr-1" />
                    Franchise View
                </Badge>
            );
        }
        if (role === 'factory_manager') {
            return (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <Factory className="h-3 w-3 mr-1" />
                    Factory View
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30">
                <User className="h-3 w-3 mr-1" />
                My Activity
            </Badge>
        );
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Activity Log</h1>
                        {getRoleBadge()}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Real-time system activities and security events
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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
                                    Live
                                </>
                            ) : (
                                <span className="text-muted-foreground">Paused</span>
                            )}
                        </Label>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading || isRefetching}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
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

            {/* Filters */}
            <Card className="border shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search activities..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="All Actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="login">Authentication</SelectItem>
                                    <SelectItem value="create_order">Order Creation</SelectItem>
                                    <SelectItem value="update_order">Order Updates</SelectItem>
                                    <SelectItem value="payment">Payments</SelectItem>
                                    <SelectItem value="print">Printing</SelectItem>
                                    <SelectItem value="employee">User Management</SelectItem>
                                    <SelectItem value="transit">Transit</SelectItem>
                                </SelectContent>
                            </Select>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-[160px] justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "MMM d, yyyy") : "Pick date"}
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
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card className="border shadow-sm overflow-hidden">
                <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
                    <div className="p-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="animate-pulse flex gap-4">
                                        <div className="w-10 h-10 bg-muted rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-muted rounded w-3/4" />
                                            <div className="h-3 bg-muted rounded w-1/2" />
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
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                                <AnimatePresence mode="popLayout">
                                    {Object.entries(groupedLogs).map(([dateKey, logs]) => (
                                        <div key={dateKey} className="mb-6">
                                            {/* Date Header */}
                                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="text-sm font-semibold text-foreground">
                                                    {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                                                </span>
                                            </div>

                                            {/* Logs for this date */}
                                            <div className="space-y-2 ml-5 pl-8 border-l border-border">
                                                {logs.map((log: AuditLog) => {
                                                    const colors = getActionColorScheme(log.action);
                                                    const isNew = newLogIds.has(log.id);
                                                    const isExpanded = expandedLog === log.id;

                                                    return (
                                                        <motion.div
                                                            key={log.id}
                                                            layout
                                                            initial={isNew ? { opacity: 0, x: -20, scale: 0.95 } : { opacity: 1 }}
                                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                                            className={cn(
                                                                "relative rounded-lg border p-3 cursor-pointer transition-all duration-200",
                                                                colors.bg,
                                                                colors.border,
                                                                isExpanded && "ring-2 ring-primary/20",
                                                                isNew && "ring-2 ring-green-500/50 animate-pulse"
                                                            )}
                                                            onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                                        >
                                                            {/* Timeline dot */}
                                                            <div className={cn(
                                                                "absolute -left-[41px] top-4 w-3 h-3 rounded-full border-2 border-background",
                                                                colors.dot
                                                            )} />

                                                            <div className="flex items-start gap-3">
                                                                {/* Icon */}
                                                                <div className={cn(
                                                                    "p-2 rounded-lg shrink-0",
                                                                    colors.bg
                                                                )}>
                                                                    <span className={colors.text}>
                                                                        {getActionIcon(log.action)}
                                                                    </span>
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                                        <p className={cn("font-medium text-sm", colors.text)}>
                                                                            {formatActionDescription(log)}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                                                                            <Clock className="h-3 w-3" />
                                                                            {format(new Date(log.createdAt), 'HH:mm:ss')}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {getActionCategory(log.action)}
                                                                        </Badge>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            by {log.employeeId}
                                                                        </span>
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
                                                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                                                    <div>
                                                                                        <p className="text-muted-foreground">Entity Type</p>
                                                                                        <p className="font-medium capitalize">{log.entityType || 'System'}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-muted-foreground">Entity ID</p>
                                                                                        <p className="font-medium font-mono truncate">{log.entityId || 'N/A'}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-muted-foreground">IP Address</p>
                                                                                        <p className="font-medium font-mono">{log.ipAddress || 'Unknown'}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-muted-foreground">Timestamp</p>
                                                                                        <p className="font-medium">{format(new Date(log.createdAt), 'PPpp')}</p>
                                                                                    </div>
                                                                                </div>
                                                                                {log.details && Object.keys(log.details).length > 0 && (
                                                                                    <div className="mt-3">
                                                                                        <p className="text-muted-foreground text-xs mb-1">Additional Details</p>
                                                                                        <div className="bg-background/50 rounded p-2 text-xs font-mono">
                                                                                            {Object.entries(log.details).map(([key, value]) => (
                                                                                                <div key={key} className="flex gap-2">
                                                                                                    <span className="text-muted-foreground">{key}:</span>
                                                                                                    <span className="truncate">{String(value)}</span>
                                                                                                </div>
                                                                                            ))}
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
                                            </div>
                                        </div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Pagination */}
                {data?.pagination && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredLogs.length} of {data.pagination.total || 0} activities
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground px-2">
                                Page {page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={!data?.pagination?.hasMore || isLoading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
