import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Search,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Download,
    Users,
    TrendingUp,
    History,
    CreditCard,
    RefreshCw,
    ExternalLink,
    MoreHorizontal,
    PlusCircle,
    FileText,
    AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/data-service";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { CustomerAutocomplete } from "@/components/customer-autocomplete";
import CustomerDialogs from "@/components/customers/customer-dialogs";
import { CreditsTable } from "@/components/credits/credits-table";
import { customersApi, ordersApi } from "@/lib/data-service";
import type { Customer, Order } from "@shared/schema";

// --- Zod Schemas for Validation ---
const creditTransactionSchema = z.object({
    customerId: z.string().min(1, "Customer is required"),
    type: z.enum(["payment", "credit", "adjustment"]),
    amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Amount must be a positive number",
    }),
    reason: z.string().min(3, "Description/Reason is required"),
    reference: z.string().optional(),
    paymentMethod: z.enum(["cash", "upi", "card", "bank_transfer"]).optional(),
});

export default function CreditsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { employee } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("transactions");
    const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
    const [selectedActionType, setSelectedActionType] = useState<"payment" | "credit" | "adjustment">("payment");

    // Customer popup state
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

    // Function to open customer popup
    const openCustomerPopup = async (customerId: string) => {
        try {
            const customer = await customersApi.getById(customerId);
            if (customer) {
                setSelectedCustomer(customer);
                // Fetch customer orders
                const orders = await ordersApi.getAll({ customerId });
                setCustomerOrders(orders);
                setIsCustomerDialogOpen(true);
            } else {
                toast({ title: "Error", description: "Customer not found", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load customer details", variant: "destructive" });
        }
    };

    // --- Role Access Control ---
    const canManageCredits = useMemo(() => {
        return employee?.role && ['admin', 'franchise_manager', 'manager'].includes(employee.role);
    }, [employee]);

    // --- Queries ---

    // Helper to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('employee_token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    // 1. Stats
    const { data: statsResponse, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
        queryKey: ["credit-stats"],
        queryFn: async () => {
            const res = await fetch("/api/credits/stats", {
                credentials: 'include',
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: 'Failed to fetch stats' }));
                throw new Error(error.message || error.error || 'Failed to fetch stats');
            }
            return res.json();
        },
        retry: 1,
        refetchOnWindowFocus: false
    });
    const creditStats = statsResponse?.data || {
        totalOutstanding: 0,
        activeCustomers: 0,
        monthlyCreditGiven: 0,
        monthlyPaymentsReceived: 0,
        franchiseBreakdown: [],
        isAdmin: false
    };

    // 2. Transactions
    const { data: transactionsResponse, isLoading: isLoadingTransactions, refetch: refetchTransactions, error: transactionsError } = useQuery({
        queryKey: ["credit-transactions", searchTerm, typeFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);
            if (typeFilter !== "all") params.append("type", typeFilter);
            const res = await fetch(`/api/credits/transactions?${params}`, {
                credentials: 'include',
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: 'Failed to fetch transactions' }));
                throw new Error(error.message || error.error || 'Failed to fetch transactions');
            }
            return res.json();
        },
        retry: 1,
        refetchOnWindowFocus: false
    });
    const transactions = transactionsResponse?.data || [];

    // 3. Customers with Balances
    const { data: customersResponse, isLoading: isLoadingCustomers, error: customersError, refetch: refetchCustomers } = useQuery({
        queryKey: ["credit-customers-report"],
        queryFn: async () => {
            const res = await fetch("/api/credits/report/outstanding", {
                credentials: 'include',
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: 'Failed to fetch customers' }));
                throw new Error(error.message || error.error || 'Failed to fetch customers');
            }
            return res.json();
        },
        enabled: activeTab === "balances",
        retry: 1,
        refetchOnWindowFocus: false
    });
    const customersWithCredit = customersResponse?.data?.customers || [];
    const outstandingTotal = customersResponse?.data?.totalOutstanding || 0;

    // --- Mutations ---

    const transactionMutation = useMutation({
        mutationFn: async (values: z.infer<typeof creditTransactionSchema>) => {
            // Determine endpoint based on type
            let endpoint = "";
            let body: any = {
                customerId: values.customerId,
                amount: values.amount,
            };

            if (values.type === "payment") {
                endpoint = `/api/credits/payment`;
                body.paymentMethod = values.paymentMethod;
                body.referenceNumber = values.reference;
                body.notes = values.reason;
            } else if (values.type === "adjustment") {
                endpoint = `/api/credits/adjustment`;
                body.reason = values.reason;
            } else {
                // Manual Credit Add
                endpoint = `/api/credits/add`;
                body.reason = values.reason;
                body.orderId = values.reference;
            }

            const res = await fetch(endpoint, {
                method: "POST",
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: 'Transaction failed' }));
                throw new Error(error.message || "Transaction failed");
            }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Transaction recorded successfully" });
            setIsActionDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["credit-stats"] });
            queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["credit-customers-report"] });
        },
        onError: (err) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    // --- Helpers ---

    const handleExport = () => {
        const csvData = transactions.map((tx: any) => ({
            Date: format(new Date(tx.createdAt), "yyyy-MM-dd HH:mm"),
            Customer: tx.customerName || 'Unknown',
            Phone: tx.customerPhone || '',
            Type: tx.type,
            Description: tx.description || '',
            Amount: tx.amount,
            'Balance After': tx.balanceAfter,
            'Recorded By': tx.recordedByName || 'System'
        }));

        const csv = [
            Object.keys(csvData[0] || {}).join(','),
            ...csvData.map((row: any) => Object.values(row).map(v => `"${v}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `credit_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'credit': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'payment': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'usage': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'adjustment': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-[1600px]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Financial Credits
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage customer store credits, outstanding balances, and settlements.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            refetchStats();
                            refetchTransactions();
                            if (activeTab === 'balances') refetchCustomers();
                        }}
                        disabled={statsLoading || isLoadingTransactions}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${statsLoading || isLoadingTransactions ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    {canManageCredits && (
                        <Button
                            onClick={() => { setSelectedActionType('payment'); setIsActionDialogOpen(true); }}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Transaction
                        </Button>
                    )}
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid gap-4 md:grid-cols-4">
                <KpiCard
                    title="Total Outstanding"
                    value={formatCurrency(creditStats.totalOutstanding)}
                    subtext={`${creditStats.activeCustomers} customers with debt`}
                    icon={Wallet}
                    color="text-orange-600"
                    borderColor="border-l-orange-500"
                />
                <KpiCard
                    title="Credits Issued (Mo)"
                    value={formatCurrency(creditStats.monthlyCreditGiven)}
                    subtext="Store credit given this month"
                    icon={ArrowUpRight}
                    color="text-emerald-600"
                    borderColor="border-l-emerald-500"
                />
                <KpiCard
                    title="Recovered (Mo)"
                    value={formatCurrency(creditStats.monthlyPaymentsReceived || 0)}
                    subtext="Payments & Usage this month"
                    icon={ArrowDownLeft}
                    color="text-blue-600"
                    borderColor="border-l-blue-500"
                />
                <KpiCard
                    title="Active Accounts"
                    value={creditStats.activeCustomers.toString()}
                    subtext="Customers with non-zero balance"
                    icon={Users}
                    color="text-purple-600"
                    borderColor="border-l-purple-500"
                />
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto bg-transparent">
                    <TabsTrigger
                        value="transactions"
                        className="rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background px-6 py-2"
                    >
                        <History className="mr-2 h-4 w-4" /> Transactions Log
                    </TabsTrigger>
                    <TabsTrigger
                        value="balances"
                        className="rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background px-6 py-2"
                    >
                        <CreditCard className="mr-2 h-4 w-4" /> Outstanding Balances
                    </TabsTrigger>
                </TabsList>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                                <CardTitle className="text-lg font-medium">Global Transaction History</CardTitle>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name, phone, or desc..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-[130px] h-9">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="credit">Credit Added</SelectItem>
                                            <SelectItem value="payment">Payments</SelectItem>
                                            <SelectItem value="usage">Usage</SelectItem>
                                            <SelectItem value="adjustment">Adjustments</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="border-t">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-[180px]">Date & Time</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="hidden md:table-cell">Description</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingTransactions ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">
                                                    Loading transactions...
                                                </TableCell>
                                            </TableRow>
                                        ) : transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                    No transactions found matching your criteria.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transactions.map((tx: any) => (
                                                <TableRow key={tx.id} className="group">
                                                    <TableCell>
                                                        <div className="font-medium text-sm">
                                                            {format(new Date(tx.createdAt), "MMM d, yyyy")}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {format(new Date(tx.createdAt), "h:mm a")}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{tx.customerName}</div>
                                                        <div className="text-xs text-muted-foreground">{tx.customerPhone}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`${getTypeStyles(tx.type)} capitalize`}>
                                                            {tx.type === 'usage' ? 'Spent' : tx.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell max-w-[300px]">
                                                        <span className="truncate block text-sm" title={tx.description}>
                                                            {tx.description}
                                                        </span>
                                                        {tx.referenceNumber && (
                                                            <span className="text-xs text-muted-foreground">Ref: {tx.referenceNumber}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={`font-semibold ${['credit', 'adjustment'].includes(tx.type) && parseFloat(tx.amount) > 0
                                                            ? 'text-emerald-600'
                                                            : 'text-rose-600'
                                                            }`}>
                                                            {['payment', 'usage'].includes(tx.type) ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-muted-foreground">
                                                        {formatCurrency(tx.balanceAfter)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => openCustomerPopup(tx.customerId)}>
                                                                    <Users className="mr-2 h-4 w-4" /> View Customer
                                                                </DropdownMenuItem>
                                                                {tx.orderId && (
                                                                    <DropdownMenuItem onClick={() => window.location.href = `/orders/${tx.orderId}`}>
                                                                        <FileText className="mr-2 h-4 w-4" /> View Order
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Balances Tab */}
                <TabsContent value="balances" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3 px-6">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Customer Outstanding Report
                            </CardTitle>
                            <CardDescription>
                                Detailed breakdown of customer credit balances and repayment status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CreditsTable
                                customers={customersWithCredit}
                                isLoading={isLoadingCustomers}
                                onViewCustomer={openCustomerPopup}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Transaction Action Dialog */}
            <TransactionDialog
                open={isActionDialogOpen}
                onOpenChange={setIsActionDialogOpen}
                type={selectedActionType}
                setType={setSelectedActionType}
                mutation={transactionMutation}
            />

            {/* Customer View Dialog */}
            <CustomerDialogs
                selectedCustomer={selectedCustomer}
                isViewDialogOpen={isCustomerDialogOpen}
                isEditDialogOpen={false}
                isCreateDialogOpen={false}
                isCreating={false}
                isUpdating={false}
                onCloseViewDialog={() => setIsCustomerDialogOpen(false)}
                onCloseEditDialog={() => { }}
                onCloseCreateDialog={() => { }}
                onEditCustomer={() => { }}
                onCreateCustomer={() => { }}
                orders={customerOrders}
            />
        </div>
    );
}

// --- Sub-Components ---

function KpiCard({ title, value, subtext, icon: Icon, color, borderColor }: any) {
    return (
        <Card className={`border-l-4 ${borderColor} shadow-sm`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            </CardContent>
        </Card>
    );
}

function TransactionDialog({ open, onOpenChange, type, setType, mutation }: any) {
    const form = useForm<z.infer<typeof creditTransactionSchema>>({
        resolver: zodResolver(creditTransactionSchema),
        defaultValues: {
            type: type,
            amount: "",
            reason: "",
            reference: "",
            paymentMethod: "cash"
        }
    });

    // Reset form when type changes or dialog opens
    // (Logic omitted for brevity, use useEffect if needed)

    const onSubmit = (values: z.infer<typeof creditTransactionSchema>) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>New Credit Transaction</DialogTitle>
                    <DialogDescription>Record a new financial transaction for a customer.</DialogDescription>
                </DialogHeader>

                <Tabs value={type} onValueChange={(v: any) => { setType(v); form.setValue('type', v); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="payment">Record Payment</TabsTrigger>
                        <TabsTrigger value="credit">Add Credit</TabsTrigger>
                        <TabsTrigger value="adjustment">Adjustment</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer</FormLabel>
                                    <FormControl>
                                        {/* Replace with your actual Autocomplete component */}
                                        <CustomerAutocomplete
                                            onSelect={(c: any) => field.onChange(c.id)}
                                            value={field.value}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {type === 'payment' && (
                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Method</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="upi">UPI / QR</SelectItem>
                                                    <SelectItem value="card">Card</SelectItem>
                                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description / Reason</FormLabel>
                                    <FormControl>
                                        <Input placeholder={type === 'payment' ? "Monthly settlement" : "Correction"} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reference / Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea className="resize-none" rows={2} placeholder="Cheque No, UPI Ref, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                {type === 'payment' ? 'Record Payment' : type === 'credit' ? 'Add Credit' : 'Adjust Balance'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
