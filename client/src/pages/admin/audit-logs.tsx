import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, Filter, RefreshCw, FileText, Printer, ShieldAlert, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Skeleton, { TableSkeleton } from "@/components/ui/loading-skeleton";

interface AuditLog {
    id: string;
    employee_id: string;
    employee_username: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

export default function AuditLogsPage() {
    const { toast } = useToast();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch logs
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['audit-logs', page, limit, actionFilter, date],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (actionFilter && actionFilter !== 'all') {
                params.append('action', actionFilter);
            }

            if (date) {
                // Set start of day
                const startDate = new Date(date);
                startDate.setHours(0, 0, 0, 0);
                params.append('startDate', startDate.toISOString());

                // Set end of day
                const endDate = new Date(date);
                endDate.setHours(23, 59, 59, 999);
                params.append('endDate', endDate.toISOString());
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
        }
    });

    const getActionColor = (action: string) => {
        if (action.includes('create')) return 'bg-green-100 text-green-800 border-green-200';
        if (action.includes('delete')) return 'bg-red-100 text-red-800 border-red-200';
        if (action.includes('update')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (action.includes('print')) return 'bg-purple-100 text-purple-800 border-purple-200';
        if (action.includes('login')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getActionIcon = (action: string) => {
        if (action.includes('print')) return <Printer className="h-4 w-4" />;
        if (action.includes('login')) return <User className="h-4 w-4" />;
        if (action.includes('create')) return <FileText className="h-4 w-4" />;
        return <Clock className="h-4 w-4" />;
    };

    const formatDetails = (details: any) => {
        if (!details) return 'No details';
        return (
            <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto">
                {JSON.stringify(details, null, 2)}
            </pre>
        );
    };

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        Track and monitor all system activities and user actions.
                    </p>
                </div>
                <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" />
                        System Activity
                    </CardTitle>
                    <CardDescription>
                        View detailed logs of who did what and when.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by employee or entity ID..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="login">Login</SelectItem>
                                <SelectItem value="create_order">Create Order</SelectItem>
                                <SelectItem value="update_order">Update Order</SelectItem>
                                <SelectItem value="delete_order">Delete Order</SelectItem>
                                <SelectItem value="print_document">Print Document</SelectItem>
                                <SelectItem value="payment_received">Payment Received</SelectItem>
                            </SelectContent>
                        </Select>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {(date || actionFilter !== 'all') && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setDate(undefined);
                                    setActionFilter('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="space-y-2">
                            <TableSkeleton rows={5} />
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500">
                            Failed to load audit logs. Please try again.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Entity</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.data?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                No logs found matching your criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data?.map((log: AuditLog) => (
                                            <React.Fragment key={log.id}>
                                                <TableRow className="group">
                                                    <TableCell className="whitespace-nowrap">
                                                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {log.employee_username}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={cn("flex w-fit items-center gap-1", getActionColor(log.action))}>
                                                            {getActionIcon(log.action)}
                                                            <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="capitalize text-sm font-medium">{log.entity_type}</span>
                                                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">
                                                                {log.entity_id}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {log.ip_address}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Accordion type="single" collapsible>
                                                            <AccordionItem value="details" className="border-none">
                                                                <AccordionTrigger className="py-0 hover:no-underline">
                                                                    <span className="sr-only">Toggle details</span>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="absolute left-0 right-0 bg-muted/50 p-4 mt-2 border-t border-b z-10">
                                                                    <div className="max-w-4xl mx-auto">
                                                                        <h4 className="text-sm font-semibold mb-2">Action Details</h4>
                                                                        {formatDetails(log.details)}
                                                                        <div className="mt-2 text-xs text-muted-foreground">
                                                                            User Agent: {log.user_agent}
                                                                        </div>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        </Accordion>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                        >
                            Previous
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            Page {page}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={!data?.hasMore || isLoading}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
