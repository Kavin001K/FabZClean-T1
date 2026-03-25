import { useCallback, useEffect, useMemo, useRef, useState, type WheelEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Wallet, RefreshCw, IndianRupee, AlertTriangle, CheckCircle2, HandCoins, Users, Banknote, Smartphone, CreditCard, Building, FileText, Printer } from "lucide-react";
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
  const allCustomers: WalletCustomer[] = [];
  let page = 1;
  const batchSize = 500;
  let hasMore = true;

  while (hasMore) {
    const res = await authorizedFetch(`/customers?limit=${batchSize}&page=${page}`);
    if (!res.ok) throw new Error("Failed to load customers");
    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : payload?.data;
    const batch = Array.isArray(rows) ? rows : [];
    allCustomers.push(...batch);

    // If we got fewer than batchSize, we've reached the end
    if (batch.length < batchSize) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allCustomers;
};

const walletApi = {
  recharge: async (customerId: string, payload: { amount: number; paymentMethod: string; referenceNumber?: string; notes?: string }) => {
    const res = await authorizedFetch(`/wallet/recharge`, {
      method: "POST",
      body: JSON.stringify({
        customerId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        referenceNumber: payload.referenceNumber,
        notes: payload.notes,
      }),
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
  payCredit: async (customerId: string, payload: { amount: number; paymentMethod: string; referenceNumber?: string; notes?: string }) => {
    const res = await authorizedFetch(`/credits/${customerId}/payment`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to record credit payment");
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
  useEffect(() => {
    document.title = "Wallet | FabzClean";
  }, []);

  const { employee } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<WalletCustomer | null>(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [creditPaymentOpen, setCreditPaymentOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const canAdjust = employee?.role === "admin";

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ["wallet-management", "customers"],
    queryFn: fetchCustomers,
    staleTime: 15000,
  });

  const { data: customerHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["customer-credits", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      const res = await authorizedFetch(`/credits/${selectedCustomer.id}`);
      if (!res.ok) throw new Error("Failed to load history");
      const payload = await res.json();
      return Array.isArray(payload.data?.history) ? payload.data.history : [];
    },
    enabled: !!selectedCustomer && historyOpen,
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

  const getLedgerDirection = useCallback((tx: any) => {
    const rawAmount = toNumber(tx?.amount, 0);
    const normalizedType = String(tx?.type || '').toLowerCase();
    const isCredit = rawAmount < 0 || normalizedType === 'payment' || normalizedType === 'deposit';
    return {
      isCredit,
      absoluteAmount: Math.abs(rawAmount),
      signedAmount: rawAmount,
    };
  }, []);

  const ledgerSummary = useMemo(() => {
    return customerHistory.reduce((summary: { creditIn: number; debitOut: number; count: number }, tx: any) => {
      const direction = getLedgerDirection(tx);
      if (direction.isCredit) {
        summary.creditIn += direction.absoluteAmount;
      } else {
        summary.debitOut += direction.absoluteAmount;
      }
      summary.count += 1;
      return summary;
    }, { creditIn: 0, debitOut: 0, count: 0 });
  }, [customerHistory, getLedgerDirection]);


  const printLedgerEntry = useCallback((tx: any) => {
    const escapeHtml = (value: unknown) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const direction = getLedgerDirection(tx);
    const createdAt = tx?.createdAt || tx?.transactionDate;
    const transactionTime = createdAt ? new Date(createdAt).toLocaleString() : '-';
    const customerName = selectedCustomer?.name || 'Customer';
    const orderRef = tx?.orderId || tx?.referenceNumber || '-';
    const balanceAfter = toNumber(tx?.balanceAfter, 0);
    const notesText = tx?.description || tx?.notes || tx?.reason || '-';

    const receiptWindow = window.open('', '_blank', 'width=900,height=700');
    if (!receiptWindow) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to print the ledger receipt.",
        variant: "destructive",
      });
      return;
    }

    const title = `Ledger-${customerName}-${tx?.transactionId || tx?.id || Date.now()}`;
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: auto; margin: 5mm; }
    body { 
      font-family: 'Inter', -apple-system, sans-serif; 
      padding: 0; 
      margin: 0;
      color: #1a1a1a;
      background: #fff;
    }
    .receipt {
      max-width: 80mm;
      margin: 0 auto;
      padding: 15px;
      border: 1px dashed #ccc;
    }
    .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -1px; margin: 0; }
    .title { font-size: 14px; text-transform: uppercase; font-weight: 600; margin-top: 5px; color: #666; }
    
    .customer-box { background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 13px; }
    .customer-name { font-weight: 700; font-size: 15px; margin-bottom: 2px; }
    
    .details { margin-bottom: 15px; }
    .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 13px; line-height: 1.4; }
    .label { color: #555; }
    .value { font-weight: 600; text-align: right; }
    
    .amount-box { 
      border-top: 1px solid #000; 
      border-bottom: 1px solid #000; 
      padding: 10px 0; 
      margin: 15px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .amount-label { font-weight: 700; font-size: 16px; }
    .amount-value { font-size: 20px; font-weight: 800; }
    .credit { color: #059669; }
    .debit { color: #dc2626; }
    
    .footer { text-align: center; font-size: 11px; color: #666; margin-top: 20px; }
    .footer-msg { font-weight: 600; margin-bottom: 4px; color: #333; }
    
    @media print {
      body { padding: 0; }
      .receipt { border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1 class="logo">FAB CLEAN</h1>
      <div class="title">Transaction Receipt</div>
    </div>

    <div class="customer-box">
      <div class="customer-name">${escapeHtml(customerName)}</div>
      <div style="color: #666;">Date: ${escapeHtml(transactionTime)}</div>
    </div>

    <div class="details">
      <div class="row"><span class="label">Type</span><span class="value">${escapeHtml(String(tx?.type || 'Adjustment'))}</span></div>
      <div class="row"><span class="label">Reference</span><span class="value">${escapeHtml(String(orderRef))}</span></div>
      <div class="row"><span class="label">Payment Mode</span><span class="value">${escapeHtml(String(tx?.paymentMethod || 'SYSTEM'))}</span></div>
      <div class="row" style="margin-top: 10px; font-style: italic; color: #666;">
        <span class="label">Notes</span>
        <span class="value" style="font-weight: 400;">${escapeHtml(String(notesText))}</span>
      </div>
    </div>

    <div class="amount-box">
      <span class="amount-label">TOTAL AMOUNT</span>
      <span class="amount-value ${direction.isCredit ? 'credit' : 'debit'}">
        ${direction.isCredit ? '₹' : '-₹'}${direction.absoluteAmount.toFixed(2)}
      </span>
    </div>

    <div class="row" style="background: #f3f4f6; padding: 6px; border-radius: 4px;">
      <span class="label">Balance After</span>
      <span class="value">₹${balanceAfter.toFixed(2)}</span>
    </div>

    <div class="footer">
      <div class="footer-msg">Thank you for choosing Fab Clean!</div>
      <div>This is a computer generated receipt.</div>
      <div style="margin-top: 8px; font-size: 10px;">ID: ${escapeHtml(String(tx?.transactionId || tx?.id || '-'))}</div>
    </div>
  </div>
</body>
</html>`;

    receiptWindow.document.open();
    receiptWindow.document.write(html);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  }, [getLedgerDirection, selectedCustomer?.name, toast]);

  const refreshData = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["credits"] });
  };

  const resetDialogState = () => {
    setAmount("");
    setPaymentMethod("cash");
    setReferenceNumber("");
    setReason("");
    setNotes("");
    setSelectedOrderId("");
  };

  const rechargeMutation = useMutation({
    mutationFn: () => walletApi.recharge(selectedCustomer!.id, {
      amount: toNumber(amount, 0),
      paymentMethod,
      referenceNumber,
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

  const creditPaymentMutation = useMutation({
    mutationFn: () => walletApi.payCredit(selectedCustomer!.id, {
      amount: toNumber(amount, 0),
      paymentMethod,
      referenceNumber,
      notes: `Credit payment by ${employee?.fullName || employee?.username} (${employee?.employeeId}). ${notes || ""}`.trim(),
    }),
    onSuccess: () => {
      toast({ title: "Credit payment recorded", description: "Outstanding credit has been reduced." });
      setCreditPaymentOpen(false);
      resetDialogState();
      refreshData();
    },
    onError: (error: Error) => {
      toast({ title: "Payment failed", description: error.message, variant: "destructive" });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: () => walletApi.adjust(selectedCustomer!.id, {
      amount: toNumber(amount, 0),
      reason: reason || "Manual adjustment",
      notes: `Adjustment by ${employee?.fullName || employee?.username} (${employee?.employeeId}). ${notes || ""}`.trim(),
    }),
    onSuccess: () => {
      toast({ title: "Balance adjusted", description: "Manual adjustment posted successfully." });
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
      const creditLimit = Math.max(0, toNumber(customer.creditLimit, 1000));
      const walletBalance = Math.max(0, toNumber(customer.walletBalanceCache, 0));
      const isClear = outstanding === 0;
      const isExceeded = outstanding > creditLimit;

      return {
        ...customer,
        outstanding,
        creditLimit,
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
      <div className="container-desktop min-h-screen space-y-6 py-4 sm:space-y-8 sm:py-8 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-primary/10 px-1">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-4">
                <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                Wallet & Ledger
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl font-medium">
                Manage customer balances, monitor credit risks, and process transactions with real-time financial tracking.
              </p>
            </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData} className="flex-1 sm:w-auto shadow-sm hover:shadow-md transition-all">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Data
            </Button>
          </div>
        </div>

        {/* Dashboard Summary Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
          <Card className="glass border-muted border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Customers</p>
                  <h3 className="text-2xl font-black tracking-tight text-blue-600">{totals.customers}</h3>
                  <div className="mt-1 text-[10px] text-slate-400 font-medium italic">Active managed wallets</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-muted border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <IndianRupee className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Outstanding</p>
                  <h3 className="text-2xl font-black tracking-tight text-amber-600">₹{totals.totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                  <div className="mt-1 text-[10px] text-amber-500/60 font-medium italic">Total receivables</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-muted border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Wallet className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prepaid</p>
                  <h3 className="text-2xl font-black tracking-tight text-emerald-600">₹{totals.totalPrepaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                  <div className="mt-1 text-[10px] text-emerald-500/60 font-medium italic">Available balances</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-muted border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Risk</p>
                  <h3 className="text-2xl font-black tracking-tight text-rose-600">{totals.exceededCount}</h3>
                  <div className="mt-1 text-[10px] text-rose-500/60 font-medium italic">Over-limit accounts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl font-bold">Ledger Operations</CardTitle>
            <CardDescription>Live search and transaction management for all customer wallets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1 lg:max-w-xl group">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 text-sm border-muted focus-visible:ring-primary/20 transition-all bg-muted/5 group-hover:bg-muted/10 font-medium"
                  placeholder="Search customer by name / phone / email"
                />
              </div>
              <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                <SelectTrigger className="w-full sm:w-44 h-11 border-muted bg-transparent focus:ring-primary/20">
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

            <div className="hidden md:block overflow-x-auto rounded-lg border">
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
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          resetDialogState();
                          setSelectedCustomer(row);
                          setHistoryOpen(true);
                        }}
                      >
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
                        <TableCell className="text-right">₹{row.creditLimit.toFixed(2)}</TableCell>
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
                              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>Manage</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuLabel>Wallet Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                resetDialogState();
                                setSelectedCustomer(row);
                                setRechargeOpen(true);
                              }}>
                                <Wallet className="mr-2 h-4 w-4" /> Recharge Wallet
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                resetDialogState();
                                setSelectedCustomer(row);
                                setCreditPaymentOpen(true);
                              }}>
                                <IndianRupee className="mr-2 h-4 w-4" /> Receive Credit Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                resetDialogState();
                                setSelectedCustomer(row);
                                setHistoryOpen(true);
                              }}>
                                <RefreshCw className="mr-2 h-4 w-4" /> View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
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
            
            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading customers...</div>
              ) : filteredRows.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No matching customers found.</div>
              ) : (
                filteredRows.map((row) => (
                  <Card 
                    key={row.id} 
                    className="overflow-hidden border-muted shadow-sm active:scale-[0.98] transition-transform"
                    onClick={() => {
                      resetDialogState();
                      setSelectedCustomer(row);
                      setHistoryOpen(true);
                    }}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-base">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.phone || row.email || "No contact info"}</p>
                        </div>
                        {row.isExceeded ? (
                          <Badge className="bg-red-50 text-red-700 border-red-100 px-1">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Risk
                          </Badge>
                        ) : row.isClear ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-1">
                            Clear
                          </Badge>
                        ) : null}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 py-2 border-y border-dashed">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Outstanding</p>
                          <p className={cn(
                            "text-sm font-black",
                            row.isExceeded ? "text-red-600" : row.isClear ? "text-emerald-600" : "text-amber-600",
                          )}>₹{row.outstanding.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Wallet</p>
                          <p className={cn("text-sm font-black text-emerald-600")}>₹{row.walletBalance.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-1">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 h-9 font-bold text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetDialogState();
                            setSelectedCustomer(row);
                            setRechargeOpen(true);
                          }}
                        >
                          <Wallet className="mr-1.5 h-3.5 w-3.5" /> Recharge
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 px-3" onClick={(e) => e.stopPropagation()}>
                              More
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              resetDialogState();
                              setSelectedCustomer(row);
                              setCreditPaymentOpen(true);
                            }}>
                              <IndianRupee className="mr-2 h-4 w-4" /> Receive Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              resetDialogState();
                              setSelectedCustomer(row);
                              setHistoryOpen(true);
                            }}>
                              <RefreshCw className="mr-2 h-4 w-4" /> View History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canAdjust && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                resetDialogState();
                                setSelectedCustomer(row);
                                setRefundOpen(true);
                                setReason("Wallet refund");
                              }}>
                                <HandCoins className="mr-2 h-4 w-4" /> Issue Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div >

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
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', name: 'Cash', icon: <Banknote className="w-4 h-4" /> },
                  { id: 'upi', name: 'UPI', icon: <Smartphone className="w-4 h-4" /> },
                  { id: 'card', name: 'Card', icon: <CreditCard className="w-4 h-4" /> },
                  { id: 'net_banking', name: 'Net Banking', icon: <Building className="w-4 h-4" /> },
                  { id: 'cheque', name: 'Cheque', icon: <FileText className="w-4 h-4" /> },
                  { id: 'other', name: 'Other', icon: <Search className="w-4 h-4" /> }
                ].map((method) => (
                  <Button
                    key={method.id}
                    type="button"
                    variant={paymentMethod === method.id ? "default" : "outline"}
                    className={cn(
                      "justify-start gap-2 h-10 transition-all duration-200",
                      paymentMethod === method.id ? "ring-2 ring-primary ring-offset-1" : "hover:bg-accent/50"
                    )}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    {method.icon}
                    <span className="text-sm">{method.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                placeholder="Transaction ID / Receipt #"
                className="bg-muted/50"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Internal Note</Label>
              <Input placeholder="Additional context..." value={notes} onChange={(e) => setNotes(e.target.value)} />
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
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
            <div className="bg-primary/20 p-2 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Processed By</p>
              <p className="text-sm font-semibold text-primary">
                {employee?.fullName || employee?.username} <span className="text-muted-foreground text-xs">({employee?.employeeId})</span>
              </p>
            </div>
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

      <Dialog open={creditPaymentOpen} onOpenChange={setCreditPaymentOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Receive Credit Payment</DialogTitle>
            <DialogDescription>{selectedCustomer?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Processed by:</span>
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                {employee?.fullName || employee?.username} ({employee?.employeeId})
              </span>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', name: 'Cash', icon: <Banknote className="w-4 h-4" /> },
                  { id: 'upi', name: 'UPI', icon: <Smartphone className="w-4 h-4" /> },
                  { id: 'card', name: 'Card', icon: <CreditCard className="w-4 h-4" /> },
                  { id: 'net_banking', name: 'Net Banking', icon: <Building className="w-4 h-4" /> },
                  { id: 'cheque', name: 'Cheque', icon: <FileText className="w-4 h-4" /> },
                  { id: 'other', name: 'Other', icon: <Search className="w-4 h-4" /> }
                ].map((method) => (
                  <Button
                    key={method.id}
                    type="button"
                    variant={paymentMethod === method.id ? "default" : "outline"}
                    className={cn(
                      "justify-start gap-2 h-10 transition-all duration-200",
                      paymentMethod === method.id ? "ring-2 ring-primary ring-offset-1" : "hover:bg-accent/50"
                    )}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    {method.icon}
                    <span className="text-sm">{method.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                placeholder="Transaction ID / Receipt #"
                className="bg-muted/50"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Internal Note</Label>
              <Input placeholder="Additional context..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditPaymentOpen(false)}>Cancel</Button>
            <Button
              onClick={() => creditPaymentMutation.mutate()}
              disabled={creditPaymentMutation.isPending || toNumber(amount, 0) <= 0}
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Balance Adjustment</DialogTitle>
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

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          <div className="p-6 pb-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Transaction History</DialogTitle>
              <DialogDescription className="text-slate-300">
                Wallet activity for <span className="text-white font-semibold">{selectedCustomer?.name}</span>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Entries</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{ledgerSummary.count}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Credit In</p>
              <p className="text-sm font-bold text-emerald-600">₹{ledgerSummary.creditIn.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Debit Out</p>
              <p className="text-sm font-bold text-amber-600">₹{ledgerSummary.debitOut.toFixed(2)}</p>
            </div>
          </div>

          <div
            className="flex-1 max-h-[calc(85vh-220px)] overflow-y-auto overscroll-contain p-0 [scrollbar-gutter:stable]"
          >
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <RefreshCw className="h-8 w-8 text-slate-300 animate-spin mb-3" />
                <p className="text-sm text-slate-400">Loading ledger data...</p>
              </div>
            ) : customerHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                  <Wallet className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium">No Transactions Found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  This customer hasn't had any wallet activity yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {customerHistory.map((tx: any) => {
                  const direction = getLedgerDirection(tx);
                  const isCredit = direction.isCredit;
                  return (
                    <div key={tx.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                            isCredit ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                          )}>
                            {isCredit ? <CheckCircle2 className="h-5 w-5" /> : <IndianRupee className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm capitalize flex items-center flex-wrap gap-2">
                              {tx.type}
                              {tx.orderId && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
                                  Order: {typeof tx.orderId === 'string' ? tx.orderId.substring(0, 8) : tx.orderId}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5 flex items-center flex-wrap gap-x-1">
                              {new Date(tx.createdAt || tx.transactionDate).toLocaleString()}
                              {tx.recordedByName && (
                                <>
                                  <span className="opacity-50">•</span>
                                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                                    {tx.staffId ? `[${tx.staffId}] ` : ''}{tx.recordedByName}
                                  </span>
                                </>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                              Credit ID: {tx.creditId || selectedCustomer?.id || "-"}
                              {tx.transactionId ? ` • Txn: ${tx.transactionId}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn("font-bold text-base", isCredit ? "text-emerald-600" : "text-amber-600")}>
                            {isCredit ? "+" : "-"}₹{direction.absoluteAmount.toFixed(2)}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5">Bal: ₹{toNumber(tx.balanceAfter).toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-7 px-2 text-[10px] text-slate-600 hover:text-slate-900"
                            onClick={() => printLedgerEntry(tx)}
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>
                      {(tx.description || tx.notes || tx.referenceNumber || tx.reason) && (
                        <div className="ml-12 mt-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                          {tx.reason && <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{tx.reason}</p>}
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {tx.description || tx.notes}
                          </p>
                          {tx.referenceNumber && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Ref: {tx.referenceNumber}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-slate-50 dark:bg-slate-900/20 flex justify-end">
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>Close Statement</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition >
  );
}
