/**
 * Credit Management Page
 * 
 * Features:
 * - View all customers with credit balances
 * - Role-based access control (Admin, Factory Manager, Franchise Manager)
 * - Franchise isolation for non-admin users
 * - Record payments to clear credit
 * - Weekly report generation
 * - Analytics and statistics
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";
import {
    CreditCard,
    Users,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Search,
    Filter,
    Download,
    RefreshCw,
    Plus,
    ChevronDown,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowUpDown,
    Phone,
    Mail,
    Calendar,
    Receipt,
    FileText,
    Wallet,
    BarChart3,
    PieChart,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/page-transition";
import { authorizedFetch } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface CreditCustomer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    creditBalance: number;
    totalOrders?: number;
    lastOrder?: string;
    franchiseId?: string;
}

interface CreditTransaction {
    id: string;
    customerId: string;
    amount: string;
    type: 'credit' | 'payment' | 'adjustment' | 'usage' | 'deposit';
    description: string;
    referenceId?: string;
    balanceAfter: string;
    createdBy?: string;
    createdAt: string;
}

interface CreditSummary {
    totalCredited: number;
    totalPaid: number;
    pendingBalance: number;
}

// API functions
const creditsApi = {
    getOutstandingReport: async () => {
        const res = await authorizedFetch('/credits/report/outstanding');
        if (!res.ok) throw new Error('Failed to fetch outstanding report');
        const data = await res.json();
        return data.data;
    },

    getCustomerCredit: async (customerId: string) => {
        const res = await authorizedFetch(`/credits/${customerId}`);
        if (!res.ok) throw new Error('Failed to fetch customer credit');
        const data = await res.json();
        return data.data;
    },

    recordPayment: async (customerId: string, payload: { amount: number; paymentMethod: string; referenceNumber?: string; notes?: string }) => {
        const res = await authorizedFetch(`/credits/${customerId}/payment`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to record payment');
        }
        return res.json();
    },

    adjustCredit: async (customerId: string, payload: { amount: number; reason: string; notes?: string }) => {
        const res = await authorizedFetch(`/credits/${customerId}/adjust`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to adjust credit');
        }
        return res.json();
    },
};

export default function CreditsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"balance" | "name" | "lastOrder">("balance");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selectedCustomer, setSelectedCustomer] = useState<CreditCustomer | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paymentRef, setPaymentRef] = useState("");
    const [adjustAmount, setAdjustAmount] = useState("");
    const [adjustReason, setAdjustReason] = useState("");
    const [adjustNotes, setAdjustNotes] = useState("");

    // Check role access
    const canManageCredits = user?.role && ['admin', 'factory_manager', 'franchise_manager'].includes(user.role);
    const isAdmin = user?.role === 'admin';

    // Fetch outstanding credits
    const { data: outstandingData, isLoading, refetch } = useQuery({
        queryKey: ['credits', 'outstanding'],
        queryFn: creditsApi.getOutstandingReport,
        staleTime: 30000,
    });

    // Fetch customer credit history
    const { data: customerCredit, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['credits', 'customer', selectedCustomer?.id],
        queryFn: () => selectedCustomer ? creditsApi.getCustomerCredit(selectedCustomer.id) : null,
        enabled: !!selectedCustomer && isHistoryDialogOpen,
    });

    // Payment mutation
    const paymentMutation = useMutation({
        mutationFn: ({ customerId, payload }: { customerId: string; payload: any }) =>
            creditsApi.recordPayment(customerId, payload),
        onSuccess: (data) => {
            toast({
                title: "Payment Recorded",
                description: `Payment of ₹${paymentAmount} recorded successfully`,
            });
            setIsPaymentDialogOpen(false);
            setPaymentAmount("");
            setPaymentMethod("cash");
            setPaymentRef("");
            queryClient.invalidateQueries({ queryKey: ['credits'] });
        },
        onError: (error: Error) => {
            toast({
                title: "Payment Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Adjustment mutation
    const adjustMutation = useMutation({
        mutationFn: ({ customerId, payload }: { customerId: string; payload: any }) =>
            creditsApi.adjustCredit(customerId, payload),
        onSuccess: () => {
            toast({
                title: "Credit Adjusted",
                description: "Credit balance adjusted successfully",
            });
            setIsAdjustDialogOpen(false);
            setAdjustAmount("");
            setAdjustReason("");
            setAdjustNotes("");
            queryClient.invalidateQueries({ queryKey: ['credits'] });
        },
        onError: (error: Error) => {
            toast({
                title: "Adjustment Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Filter and sort customers
    const filteredCustomers = useMemo(() => {
        if (!outstandingData?.customers) return [];

        let customers = [...outstandingData.customers];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            customers = customers.filter((c: CreditCustomer) =>
                c.name?.toLowerCase().includes(query) ||
                c.phone?.includes(query) ||
                c.email?.toLowerCase().includes(query)
            );
        }

        // Sort
        customers.sort((a: CreditCustomer, b: CreditCustomer) => {
            let comparison = 0;
            switch (sortBy) {
                case "balance":
                    comparison = a.creditBalance - b.creditBalance;
                    break;
                case "name":
                    comparison = (a.name || "").localeCompare(b.name || "");
                    break;
                case "lastOrder":
                    comparison = new Date(a.lastOrder || 0).getTime() - new Date(b.lastOrder || 0).getTime();
                    break;
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return customers;
    }, [outstandingData?.customers, searchQuery, sortBy, sortOrder]);

    // Weekly stats
    const weeklyStats = useMemo(() => {
        if (!customerCredit?.history) return null;

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

        const thisWeekTransactions = customerCredit.history.filter((t: CreditTransaction) =>
            isWithinInterval(new Date(t.createdAt), { start: weekStart, end: weekEnd })
        );

        const lastWeekTransactions = customerCredit.history.filter((t: CreditTransaction) =>
            isWithinInterval(new Date(t.createdAt), { start: lastWeekStart, end: lastWeekEnd })
        );

        const thisWeekCredits = thisWeekTransactions
            .filter((t: CreditTransaction) => t.type === 'credit' || t.type === 'usage')
            .reduce((sum: number, t: CreditTransaction) => sum + Math.abs(parseFloat(t.amount)), 0);

        const thisWeekPayments = thisWeekTransactions
            .filter((t: CreditTransaction) => t.type === 'payment')
            .reduce((sum: number, t: CreditTransaction) => sum + Math.abs(parseFloat(t.amount)), 0);

        return {
            thisWeekCredits,
            thisWeekPayments,
            thisWeekNet: thisWeekCredits - thisWeekPayments,
            transactionCount: thisWeekTransactions.length,
        };
    }, [customerCredit?.history]);

    // Handle payment submit
    const handlePaymentSubmit = useCallback(() => {
        if (!selectedCustomer || !paymentAmount) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid payment amount",
                variant: "destructive",
            });
            return;
        }

        paymentMutation.mutate({
            customerId: selectedCustomer.id,
            payload: {
                amount,
                paymentMethod,
                referenceNumber: paymentRef || undefined,
            },
        });
    }, [selectedCustomer, paymentAmount, paymentMethod, paymentRef, paymentMutation, toast]);

    // Handle adjustment submit
    const handleAdjustSubmit = useCallback(() => {
        if (!selectedCustomer || !adjustAmount || !adjustReason) return;

        const amount = parseFloat(adjustAmount);
        if (isNaN(amount)) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid adjustment amount",
                variant: "destructive",
            });
            return;
        }

        adjustMutation.mutate({
            customerId: selectedCustomer.id,
            payload: {
                amount,
                reason: adjustReason,
                notes: adjustNotes || undefined,
            },
        });
    }, [selectedCustomer, adjustAmount, adjustReason, adjustNotes, adjustMutation, toast]);

    // Export report
    const handleExportReport = useCallback(() => {
        if (!filteredCustomers.length) return;

        const headers = ['Customer Name', 'Phone', 'Email', 'Credit Balance', 'Total Orders'];
        const rows = filteredCustomers.map((c: CreditCustomer) => [
            c.name,
            c.phone,
            c.email || '',
            `₹${c.creditBalance.toLocaleString('en-IN')}`,
            c.totalOrders || 0,
        ]);

        const csvContent = [
            `Credit Outstanding Report - ${format(new Date(), 'dd MMM yyyy')}`,
            `Total Outstanding: ₹${outstandingData?.totalOutstanding?.toLocaleString('en-IN') || 0}`,
            `Total Customers: ${outstandingData?.totalCustomers || 0}`,
            '',
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `credit-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Report Exported",
            description: "Credit report has been downloaded",
        });
    }, [filteredCustomers, outstandingData, toast]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    };

    return (
        <PageTransition>
            <div className="container-desktop min-h-screen py-8 space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                            Credit Management
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Manage customer credit balances, payments, and outstanding dues
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button onClick={handleExportReport} disabled={!filteredCustomers.length}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                                    <p className="text-3xl font-bold mt-2 text-orange-600">
                                        {formatCurrency(outstandingData?.totalOutstanding || 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Pending credit dues
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Wallet className="h-7 w-7 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Customers with Credit</p>
                                    <p className="text-3xl font-bold mt-2 text-blue-600">
                                        {outstandingData?.totalCustomers || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Active credit accounts
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Users className="h-7 w-7 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Average Credit</p>
                                    <p className="text-3xl font-bold mt-2 text-green-600">
                                        {formatCurrency(
                                            outstandingData?.totalCustomers
                                                ? outstandingData.totalOutstanding / outstandingData.totalCustomers
                                                : 0
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Per customer
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <BarChart3 className="h-7 w-7 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Highest Balance</p>
                                    <p className="text-3xl font-bold mt-2 text-purple-600">
                                        {formatCurrency(
                                            filteredCustomers.length > 0
                                                ? Math.max(...filteredCustomers.map((c: CreditCustomer) => c.creditBalance))
                                                : 0
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Maximum credit due
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <TrendingUp className="h-7 w-7 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="shadow-xl">
                        <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl flex items-center gap-2">
                                        <CreditCard className="h-6 w-6 text-orange-500" />
                                        Outstanding Credits
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Customers with pending credit balances
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            {/* Search and Filters */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, phone, or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="balance">Credit Balance</SelectItem>
                                        <SelectItem value="name">Customer Name</SelectItem>
                                        <SelectItem value="lastOrder">Last Order</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                >
                                    <ArrowUpDown className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Customers Table */}
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
                                </div>
                            ) : filteredCustomers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                    <CheckCircle className="h-16 w-16 mb-4 text-green-500" />
                                    <p className="text-lg font-medium">No Outstanding Credits</p>
                                    <p className="text-sm">All customers have cleared their balances</p>
                                </div>
                            ) : (
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead className="text-right">Credit Balance</TableHead>
                                                <TableHead className="text-center">Orders</TableHead>
                                                <TableHead className="text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredCustomers.map((customer: CreditCustomer) => (
                                                <TableRow key={customer.id} className="hover:bg-muted/50">
                                                    <TableCell>
                                                        <div className="font-medium">{customer.name}</div>
                                                        {customer.lastOrder && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Last order: {format(new Date(customer.lastOrder), 'dd MMM yyyy')}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Phone className="h-3 w-3" /> {customer.phone}
                                                            </div>
                                                            {customer.email && (
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <Mail className="h-3 w-3" /> {customer.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className={cn(
                                                            "text-sm font-bold",
                                                            customer.creditBalance > 5000
                                                                ? "bg-red-100 text-red-700 dark:bg-red-900/50"
                                                                : customer.creditBalance > 1000
                                                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50"
                                                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50"
                                                        )}>
                                                            {formatCurrency(customer.creditBalance)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-sm text-muted-foreground">
                                                            {customer.totalOrders || 0}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    Actions <ChevronDown className="h-4 w-4 ml-1" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Manage Credit</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setSelectedCustomer(customer);
                                                                        setIsHistoryDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <FileText className="h-4 w-4 mr-2" />
                                                                    View History
                                                                </DropdownMenuItem>
                                                                {canManageCredits && (
                                                                    <>
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                setSelectedCustomer(customer);
                                                                                setPaymentAmount(customer.creditBalance.toString());
                                                                                setIsPaymentDialogOpen(true);
                                                                            }}
                                                                            className="text-green-600"
                                                                        >
                                                                            <DollarSign className="h-4 w-4 mr-2" />
                                                                            Record Payment
                                                                        </DropdownMenuItem>
                                                                        {isAdmin && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => {
                                                                                    setSelectedCustomer(customer);
                                                                                    setIsAdjustDialogOpen(true);
                                                                                }}
                                                                                className="text-blue-600"
                                                                            >
                                                                                <Receipt className="h-4 w-4 mr-2" />
                                                                                Adjust Balance
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Payment Dialog */}
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-500" />
                                Record Payment
                            </DialogTitle>
                            <DialogDescription>
                                Record a payment from {selectedCustomer?.name} to reduce their credit balance.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="flex justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <span className="text-sm text-muted-foreground">Current Balance:</span>
                                <span className="font-bold text-orange-600">
                                    {formatCurrency(selectedCustomer?.creditBalance || 0)}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Amount (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Reference Number (Optional)</Label>
                                <Input
                                    placeholder="Transaction ID or reference"
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                />
                            </div>

                            {parseFloat(paymentAmount) > 0 && (
                                <div className="flex justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <span className="text-sm text-muted-foreground">New Balance:</span>
                                    <span className="font-bold text-green-600">
                                        {formatCurrency(Math.max(0, (selectedCustomer?.creditBalance || 0) - parseFloat(paymentAmount || "0")))}
                                    </span>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePaymentSubmit}
                                disabled={paymentMutation.isPending || !paymentAmount}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {paymentMutation.isPending ? "Recording..." : "Record Payment"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Adjust Dialog (Admin Only) */}
                <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-blue-500" />
                                Adjust Credit Balance
                            </DialogTitle>
                            <DialogDescription>
                                Adjust {selectedCustomer?.name}'s credit balance. This action is logged.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <span className="text-sm text-muted-foreground">Current Balance:</span>
                                <span className="font-bold text-blue-600">
                                    {formatCurrency(selectedCustomer?.creditBalance || 0)}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <Label>Adjustment Amount (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="Positive to add, negative to reduce"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                    step="0.01"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use negative values to reduce the balance
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Reason *</Label>
                                <Select value={adjustReason} onValueChange={setAdjustReason}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="correction">Balance Correction</SelectItem>
                                        <SelectItem value="dispute_resolved">Dispute Resolved</SelectItem>
                                        <SelectItem value="goodwill">Goodwill Adjustment</SelectItem>
                                        <SelectItem value="system_error">System Error Fix</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Input
                                    placeholder="Additional details"
                                    value={adjustNotes}
                                    onChange={(e) => setAdjustNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAdjustSubmit}
                                disabled={adjustMutation.isPending || !adjustAmount || !adjustReason}
                            >
                                {adjustMutation.isPending ? "Adjusting..." : "Apply Adjustment"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* History Dialog */}
                <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-orange-500" />
                                Credit History - {selectedCustomer?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Complete transaction history for this customer's credit account
                            </DialogDescription>
                        </DialogHeader>

                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto">
                                {/* Summary */}
                                {customerCredit?.summary && (
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                                            <p className="text-xs text-muted-foreground">Total Credited</p>
                                            <p className="text-lg font-bold text-orange-600">
                                                {formatCurrency(customerCredit.summary.totalCredited)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                            <p className="text-xs text-muted-foreground">Total Paid</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {formatCurrency(customerCredit.summary.totalPaid)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                            <p className="text-xs text-muted-foreground">Current Balance</p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {formatCurrency(customerCredit.summary.pendingBalance)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Transaction List */}
                                <div className="space-y-2">
                                    {customerCredit?.history?.length > 0 ? (
                                        customerCredit.history.map((transaction: CreditTransaction) => (
                                            <div
                                                key={transaction.id}
                                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-full flex items-center justify-center",
                                                        transaction.type === 'payment' || transaction.type === 'deposit'
                                                            ? "bg-green-100 text-green-600"
                                                            : transaction.type === 'adjustment'
                                                                ? "bg-blue-100 text-blue-600"
                                                                : "bg-orange-100 text-orange-600"
                                                    )}>
                                                        {transaction.type === 'payment' || transaction.type === 'deposit' ? (
                                                            <TrendingDown className="h-5 w-5" />
                                                        ) : transaction.type === 'adjustment' ? (
                                                            <Receipt className="h-5 w-5" />
                                                        ) : (
                                                            <TrendingUp className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{transaction.description}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(transaction.createdAt), 'dd MMM yyyy, hh:mm a')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={cn(
                                                        "font-bold",
                                                        parseFloat(transaction.amount) < 0 ? "text-green-600" : "text-orange-600"
                                                    )}>
                                                        {parseFloat(transaction.amount) < 0 ? '-' : '+'}
                                                        {formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Bal: {formatCurrency(parseFloat(transaction.balanceAfter))}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No transaction history found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </PageTransition>
    );
}
