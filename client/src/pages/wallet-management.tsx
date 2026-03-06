import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Wallet, RefreshCw, IndianRupee, AlertTriangle, CheckCircle2, HandCoins } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { authorizedFetch } from "@/lib/data-service";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FilterType = "all" | "clear" | "outstanding" | "prepaid" | "exceeded";

interface WalletCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  creditBalance?: number | string;
  creditLimit?: number | string;
  walletBalanceCache?: number | string;
}

const toNumber = (value: unknown, fallback = 0) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const fetchCustomers = async (): Promise<WalletCustomer[]> => {
  const res = await authorizedFetch("/customers?limit=500");
  if (!res.ok) throw new Error("Failed to load customers");
  const payload = await res.json();
  const rows = Array.isArray(payload) ? payload : payload?.data;
  return Array.isArray(rows) ? rows : [];
};

const walletApi = {
  recharge: async (customerId: string, payload: { amount: number; paymentMethod: string; notes?: string }) => {
    const res = await authorizedFetch(`/credits/${customerId}/payment`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to recharge wallet");
    return data;
  },
  refund: async (customerId: string, payload: { amount: number; reason: string; notes?: string }) => {
    const res = await authorizedFetch(`/credits/${customerId}/adjust`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to issue refund");
    return data;
  },
  adjust: async (customerId: string, payload: { amount: number; reason: string; notes?: string }) => {
    const res = await authorizedFetch(`/credits/${customerId}/adjust`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to adjust wallet");
    return data;
  },
};

export default function WalletManagementPage() {
  const { employee } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<WalletCustomer | null>(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const canAdjust = employee?.role === "admin";

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ["wallet-management", "customers"],
    queryFn: fetchCustomers,
    staleTime: 15000,
  });

  const { data: customerOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["customer-orders", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      const res = await authorizedFetch(`/orders/customer/${selectedCustomer.id}`);
      if (!res.ok) throw new Error("Failed to load customer orders");
      const payload = await res.json();
      return Array.isArray(payload.data) ? payload.data : [];
    },
    enabled: !!selectedCustomer && refundOpen,
  });

  const selectedOrder = customerOrders.find((o: any) => o.id === selectedOrderId);

  const refreshData = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["credits"] });
  };

  const resetDialogState = () => {
    setAmount("");
    setPaymentMethod("cash");
    setReason("");
    setNotes("");
    setSelectedOrderId("");
  };

  const rechargeMutation = useMutation({
    mutationFn: () => walletApi.recharge(selectedCustomer!.id, {
      amount: toNumber(amount, 0),
      paymentMethod,
      notes: `Recharge by ${employee?.fullName || employee?.username} (${employee?.employeeId}). ${notes || ""}`.trim(),
    }),
    onSuccess: () => {
      toast({ title: "Wallet recharged", description: "Customer wallet recharge recorded." });
      setRechargeOpen(false);
      resetDialogState();
      refreshData();
    },
    onError: (error: Error) => {
      toast({ title: "Recharge failed", description: error.message, variant: "destructive" });
    },
  });

  const refundMutation = useMutation({
    mutationFn: () => walletApi.refund(selectedCustomer!.id, {
      amount: -Math.abs(toNumber(amount, 0)), // Ensure debit for refund
      reason: `Refund for Order ${selectedOrder?.orderNumber || "manual"}: ${reason}`,
      notes: `Refund issued by ${employee?.fullName || employee?.username} (${employee?.employeeId}). Link: ${selectedOrderId || "N/A"}. ${notes || ""}`.trim(),
    }),
    onSuccess: () => {
      toast({ title: "Refund recorded", description: "Refund entry has been posted." });
      setRefundOpen(false);
      resetDialogState();
      refreshData();
    },
    onError: (error: Error) => {
      toast({ title: "Refund failed", description: error.message, variant: "destructive" });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: () => walletApi.adjust(selectedCustomer!.id, {
      amount: toNumber(amount, 0),
      reason: reason || "Manual adjustment",
      notes: `Adjustment by ${employee?.fullName || employee?.username} (${employee?.employeeId}). ${notes || ""}`.trim(),
    }),
    onSuccess: () => {
      toast({ title: "Wallet adjusted", description: "Manual adjustment posted successfully." });
      setAdjustOpen(false);
      resetDialogState();
      refreshData();
    },
    onError: (error: Error) => {
      toast({ title: "Adjustment failed", description: error.message, variant: "destructive" });
    },
  });

  const mappedRows = useMemo(() => {
    return customers.map((customer) => {
      const outstanding = Math.max(0, toNumber(customer.creditBalance, 0));
      const creditLimitAbs = Math.abs(toNumber(customer.creditLimit, -500));
      const walletBalance = toNumber(customer.walletBalanceCache, -outstanding);
      const isClear = outstanding === 0;
      const isExceeded = outstanding > creditLimitAbs;

      return {
        ...customer,
        outstanding,
        creditLimitAbs,
        walletBalance,
        isClear,
        isExceeded,
      };
    });
  }, [customers]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mappedRows.filter((row) => {
      const matchesSearch =
        !query ||
        row.name?.toLowerCase().includes(query) ||
        row.phone?.toLowerCase().includes(query) ||
        row.email?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      switch (filter) {
        case "clear":
          return row.isClear;
        case "outstanding":
          return row.outstanding > 0;
        case "prepaid":
          return row.walletBalance > 0;
        case "exceeded":
          return row.isExceeded;
        default:
          return true;
      }
    });
  }, [mappedRows, search, filter]);

  const totals = useMemo(() => {
    let totalOutstanding = 0;
    let totalPrepaid = 0;
    let exceededCount = 0;

    for (const row of mappedRows) {
      totalOutstanding += row.outstanding;
      if (row.walletBalance > 0) totalPrepaid += row.walletBalance;
      if (row.isExceeded) exceededCount += 1;
    }

    return {
      totalOutstanding,
      totalPrepaid,
      exceededCount,
      customers: mappedRows.length,
    };
  }, [mappedRows]);

  return (
    <PageTransition>
      <div className="container-desktop min-h-screen space-y-6 py-4 sm:space-y-8 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Wallet Management</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Recharge wallets, issue refunds, and monitor credit-limit risk in real time.
            </p>
          </div>
          <Button variant="outline" onClick={refreshData} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Customers</p>
              <p className="text-2xl font-bold">{totals.customers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-amber-500">₹{totals.totalOutstanding.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Prepaid Wallet</p>
              <p className="text-2xl font-bold text-emerald-500">₹{totals.totalPrepaid.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Limit Exceeded</p>
              <p className="text-2xl font-bold text-red-500">{totals.exceededCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Wallet Operations</CardTitle>
            <CardDescription>All customers with live wallet and credit status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  placeholder="Search customer by name / phone / email"
                />
              </div>
              <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="clear">Clear</SelectItem>
                  <SelectItem value="outstanding">Outstanding</SelectItem>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                  <SelectItem value="exceeded">Exceeded Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-[920px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Credit Limit</TableHead>
                    <TableHead className="text-right">Wallet Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        Loading customers...
                      </TableCell>
                    </TableRow>
                  ) : filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        No matching customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.phone || row.email || "No contact info"}</p>
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-semibold",
                          row.isExceeded ? "text-red-500" : row.isClear ? "text-emerald-500" : "text-amber-500",
                        )}>
                          ₹{row.outstanding.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">₹{row.creditLimitAbs.toFixed(2)}</TableCell>
                        <TableCell className={cn("text-right font-medium", row.walletBalance >= 0 ? "text-emerald-500" : "text-amber-500")}>
                          ₹{row.walletBalance.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {row.isExceeded ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Limit Exceeded
                            </Badge>
                          ) : row.isClear ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Clear
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                              Within Limit
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">Manage</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Wallet Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                resetDialogState();
                                setSelectedCustomer(row);
                                setRechargeOpen(true);
                              }}>
                                <Wallet className="mr-2 h-4 w-4" /> Recharge Wallet
                              </DropdownMenuItem>
                              {canAdjust && (
                                <DropdownMenuItem onClick={() => {
                                  resetDialogState();
                                  setSelectedCustomer(row);
                                  setRefundOpen(true);
                                  setReason("Wallet refund");
                                }}>
                                  <HandCoins className="mr-2 h-4 w-4" /> Issue Refund
                                </DropdownMenuItem>
                              )}
                              {canAdjust && (
                                <DropdownMenuItem onClick={() => {
                                  resetDialogState();
                                  setSelectedCustomer(row);
                                  setAdjustOpen(true);
                                }}>
                                  <IndianRupee className="mr-2 h-4 w-4" /> Manual Adjustment
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
      </div>

      <Dialog open={rechargeOpen} onOpenChange={setRechargeOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Recharge Wallet</DialogTitle>
            <DialogDescription>{selectedCustomer?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* Transaction performed by */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Transaction by:</span>
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                {employee?.fullName || employee?.username} ({employee?.employeeId})
              </span>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechargeOpen(false)}>Cancel</Button>
            <Button
              onClick={() => rechargeMutation.mutate()}
              disabled={rechargeMutation.isPending || toNumber(amount, 0) <= 0}
            >
              Recharge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
            <DialogDescription>{selectedCustomer?.name}</DialogDescription>
          </DialogHeader>
          {/* Transaction performed by */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Refund issued by:</span>
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
              {employee?.fullName || employee?.username} ({employee?.employeeId})
            </span>
          </div>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Old Order (Refund Target)</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder={ordersLoading ? "Loading orders..." : "Select an order"} />
                </SelectTrigger>
                <SelectContent>
                  {customerOrders.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No orders found</div>
                  ) : (
                    customerOrders.map((order: any) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.orderNumber} - ₹{parseFloat(order.totalAmount || "0").toFixed(2)} ({new Date(order.createdAt).toLocaleDateString()})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedOrder && (
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Max Refund: ₹{parseFloat(selectedOrder.totalAmount || "0").toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              {selectedOrder && toNumber(amount) > parseFloat(selectedOrder.totalAmount || "0") && (
                <p className="text-xs text-red-500 font-medium">Amount exceeds order value!</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reason (Required)</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Order Cancelled">Order Cancelled</SelectItem>
                  <SelectItem value="Double Payment">Double Payment</SelectItem>
                  <SelectItem value="Service Unsatisfactory">Service Unsatisfactory</SelectItem>
                  <SelectItem value="Promotional Adjustment">Promotional Adjustment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional details..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button
              onClick={() => refundMutation.mutate()}
              disabled={
                refundMutation.isPending ||
                toNumber(amount, 0) <= 0 ||
                !reason ||
                !selectedOrderId ||
                (selectedOrder && toNumber(amount) > parseFloat(selectedOrder.totalAmount || "0"))
              }
            >
              Post Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Wallet Adjustment</DialogTitle>
            <DialogDescription>{selectedCustomer?.name}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Adjustment by:</span>
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
              {employee?.fullName || employee?.username} ({employee?.employeeId})
            </span>
          </div>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Amount (+/-)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button
              onClick={() => adjustMutation.mutate()}
              disabled={adjustMutation.isPending || toNumber(amount, 0) === 0 || !reason.trim()}
            >
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
