import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    Search,
    RefreshCcw,
    Activity,
    Loader2
} from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/auth-context';

interface AuditLog {
    id: string;
    employeeId: string;
    username: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    createdAt: string;
}

export default function SystemLogs() {
    const { employee: currentUser } = useAuth();

    // State for filtering & pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [searchEmployeeId, setSearchEmployeeId] = useState("");

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['audit-logs', page, actionFilter, searchEmployeeId],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            if (actionFilter !== "all") {
                params.append('action', actionFilter);
            }
            if (searchEmployeeId.trim()) {
                params.append('employeeId', searchEmployeeId.trim());
            }

            const res = await fetch(`/api/audit-logs?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch logs");
            return res.json();
        },
        enabled: currentUser?.role === 'admin'
    });

    const { data: actionsResponse } = useQuery({
        queryKey: ['audit-actions'],
        queryFn: async () => {
            const res = await fetch('/api/audit-logs/actions');
            if (!res.ok) return { data: [] };
            return res.json();
        },
        enabled: currentUser?.role === 'admin'
    });

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground mt-2">You need administrator privileges to view system logs.</p>
            </div>
        );
    }

    const logs = data?.data || [];
    const total = data?.meta?.total || 0;
    const hasMore = data?.meta?.hasMore || false;
    const knownActions = actionsResponse?.data || [];

    const getActionBadgeVariant = (action: string) => {
        const act = action.toLowerCase();
        if (act.includes('delete') || act.includes('fail') || act.includes('cancel') || act.includes('revoke')) return 'destructive';
        if (act.includes('create') || act.includes('success') || act.includes('add') || act.includes('restore')) return 'default';
        if (act.includes('update') || act.includes('change') || act.includes('refund')) return 'secondary';
        if (act.includes('login') || act.includes('logout')) return 'outline';
        return 'outline';
    };

    const getLogDetailsText = (log: AuditLog) => {
        if (!log.details) return '-';
        try {
            if (typeof log.details === 'string') return log.details;

            const parts = [];
            if (log.details.orderNumber) parts.push(`Order: ${log.details.orderNumber}`);
            if (log.details.amount) parts.push(`Amount: ₹${log.details.amount}`);
            if (log.details.method) parts.push(`Method: ${log.details.method}`);
            if (log.details.role) parts.push(`Role: ${log.details.role}`);
            if (log.details.from && log.details.to) parts.push(`Changed from ${log.details.from} to ${log.details.to}`);

            if (parts.length > 0) return parts.join(' | ');
            return JSON.stringify(log.details).substring(0, 100) + (JSON.stringify(log.details).length > 100 ? '...' : '');
        } catch (e) {
            return 'Complex Data';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div className="space-y-1 block">
                    <h2 className="text-2xl font-bold tracking-tight">System Logs</h2>
                    <p className="text-muted-foreground">Comprehensive audit trail of all actions performed in the platform.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search User ID (e.g. FZCEM001)"
                            value={searchEmployeeId}
                            onChange={(e) => setSearchEmployeeId(e.target.value)}
                            className="pl-8 w-full sm:w-[250px]"
                        />
                    </div>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Actions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            {knownActions.map((action: string) => (
                                <SelectItem key={action} value={action}>{action.replace(/_/g, ' ')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
                        <RefreshCcw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5 text-primary" />
                        Audit Trail
                    </CardTitle>
                    <CardDescription>
                        Showing {logs.length} logs {total > 0 ? `out of ${total} total` : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md border-0 overflow-x-auto w-full scrollbar-thin">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead className="w-[150px]">User</TableHead>
                                    <TableHead className="w-[180px]">Action</TableHead>
                                    <TableHead className="w-[150px]">Entity</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                                                Loading logs...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No logs found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log: AuditLog) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium whitespace-nowrap text-xs">
                                                {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{log.username}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{log.employeeId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getActionBadgeVariant(log.action)} className="capitalize rounded-sm text-xs font-medium">
                                                    {log.action.replace(/_/g, ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log.entityType ? (
                                                    <div className="flex flex-col">
                                                        <span className="capitalize">{log.entityType.replace(/_/g, ' ')}</span>
                                                        {log.entityId && log.entityId !== 'active' && (
                                                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]" title={log.entityId}>
                                                                {log.entityId.substring(0, 8)}...
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="text-sm max-w-[300px] truncate" title={JSON.stringify(log.details)}>
                                                {getLogDetailsText(log)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Page {page}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!hasMore}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
