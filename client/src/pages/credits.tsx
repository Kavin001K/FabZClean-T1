import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
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
    ExternalLink
} from "lucide-react";
import { formatCurrency } from "@/lib/data-service";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function CreditsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { employee } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("transactions");

    // Check role access
    const canManageCredits = employee?.role && ['admin', 'factory_manager', 'franchise_manager'].includes(employee.role);

    // Fetch credit stats
    const { data: statsResponse } = useQuery({
        queryKey: ["credit-stats"],
        queryFn: async () => {
            const token = localStorage.getItem('employee_token');
            const res = await fetch("/api/credits/stats", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        }
    });
    const creditStats = statsResponse?.data || statsResponse;

    // Fetch transactions
    const { data: transactionsResponse, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery({
        queryKey: ["credit-transactions", searchTerm, typeFilter],
        queryFn: async () => {
            const token = localStorage.getItem('employee_token');
            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);
            if (typeFilter !== "all") params.append("type", typeFilter);

            const res = await fetch(`/api/credits/transactions?${params}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch transactions");
            return res.json();
        }
    });
    const transactions = transactionsResponse?.data || transactionsResponse || [];

    // Fetch customers with credit
    const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ["credit-customers"],
        queryFn: async () => {
            const token = localStorage.getItem('employee_token');
            const res = await fetch("/api/credits/report/outstanding", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch customers");
            return res.json();
        },
        enabled: activeTab === "balances"
    });
    const customersWithCredit = customersResponse?.data?.customers || customersResponse?.customers || [];

    const handleExport = () => {
        const csvData = transactions.map((tx: any) => ({
            Date: format(new Date(tx.createdAt), "yyyy-MM-dd HH:mm"),
            Customer: tx.customerName || 'Unknown',
            Phone: tx.customerPhone || '',
            Type: tx.type,
            Description: tx.description || '',
            Amount: tx.amount,
            'Balance After': tx.balanceAfter
        }));

        const csv = [
            Object.keys(csvData[0] || {}).join(','),
            ...csvData.map((row: any) => Object.values(row).map(v => `"${v}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `credit_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({ title: "Export Complete", description: "Credit transactions exported to CSV" });
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'credit':
            case 'deposit':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'payment':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'debit':
            case 'usage':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'adjustment':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'credit': return 'Added';
            case 'payment': return 'Paid';
            case 'debit': return 'Used';
            case 'deposit': return 'Deposit';
            case 'adjustment': return 'Adjusted';
            case 'usage': return 'Used';
            default: return type;
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Credit Management</h1>
                    <p className="text-muted-foreground">
                        Track customer store credits, outstanding balances, and transaction history.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetchTransactions()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="outline" onClick={handleExport} disabled={!transactions?.length}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                        <Wallet className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(creditStats?.totalOutstanding || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            From {creditStats?.activeCustomers || 0} customers
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credit Given (Month)</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(creditStats?.monthlyCreditGiven || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            New credit added this month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credit Used (Month)</CardTitle>
                        <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(creditStats?.monthlyCreditUsed || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Redeemed against orders
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Credit Customers</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {creditStats?.activeCustomers || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            With non-zero balance
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="transactions" className="flex items-center gap-2">
                        <History className="h-4 w-4" /> Transactions
                    </TabsTrigger>
                    <TabsTrigger value="balances" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Customer Balances
                    </TabsTrigger>
                </TabsList>

                {/* Transaction History Tab */}
                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Recent Transactions
                                    </CardTitle>
                                    <CardDescription>View all credit additions and deductions</CardDescription>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search customer..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 w-[200px]"
                                        />
                                    </div>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="credit">Added Credit</SelectItem>
                                            <SelectItem value="payment">Payments</SelectItem>
                                            <SelectItem value="debit">Used Credit</SelectItem>
                                            <SelectItem value="adjustment">Adjustments</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Date</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-right">Balance After</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingTransactions ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                        Loading transactions...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : transactions?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                    <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                    No transactions found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transactions?.map((tx: any) => (
                                                <TableRow key={tx.id} className="hover:bg-muted/50">
                                                    <TableCell className="font-medium">
                                                        <div>{format(new Date(tx.createdAt), "MMM d, yyyy")}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {format(new Date(tx.createdAt), "h:mm a")}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{tx.customerName || 'Unknown'}</div>
                                                        <div className="text-xs text-muted-foreground">{tx.customerPhone}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getTypeStyles(tx.type)}>
                                                            {getTypeLabel(tx.type)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px]">
                                                        <span className="truncate block" title={tx.description}>
                                                            {tx.description || (tx.orderId ? `Order #${tx.orderId}` : 'Manual')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className={`text-right font-bold ${tx.type === 'credit' || tx.type === 'deposit'
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                        }`}>
                                                        {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}
                                                        {formatCurrency(Math.abs(parseFloat(tx.amount)))}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-muted-foreground">
                                                        {formatCurrency(parseFloat(tx.balanceAfter))}
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

                {/* Customer Balances Tab */}
                <TabsContent value="balances">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        Customer Balances
                                    </CardTitle>
                                    <CardDescription>Customers with outstanding credit balances</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingCustomers ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <RefreshCw className="h-8 w-8 mb-4 animate-spin" />
                                    <p>Loading customers...</p>
                                </div>
                            ) : customersWithCredit.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Wallet className="h-12 w-12 mb-4 opacity-20" />
                                    <p>No customers with outstanding credit</p>
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead>Total Orders</TableHead>
                                                <TableHead className="text-right">Credit Balance</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customersWithCredit.map((customer: any) => (
                                                <TableRow key={customer.id} className="hover:bg-muted/50">
                                                    <TableCell>
                                                        <div className="font-medium">{customer.name}</div>
                                                        <div className="text-xs text-muted-foreground">ID: {customer.id.slice(0, 8)}...</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>{customer.phone}</div>
                                                        {customer.email && (
                                                            <div className="text-xs text-muted-foreground">{customer.email}</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{customer.totalOrders || 0} orders</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={`font-bold text-lg ${customer.creditBalance > 5000
                                                                ? 'text-red-600'
                                                                : customer.creditBalance > 1000
                                                                    ? 'text-orange-600'
                                                                    : 'text-green-600'
                                                            }`}>
                                                            {formatCurrency(customer.creditBalance)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => window.location.href = `/customers?id=${customer.id}`}
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
