import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Printer,
    CheckCircle2,
    RefreshCw,
    Tag,
    Search,
    Filter,
    FileText,
    Calendar as CalendarIcon,
    X,
    Receipt,
    Package,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInvoicePrint } from "@/hooks/use-invoice-print";
import { ordersApi, formatCurrency } from "@/lib/data-service";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Order } from "@shared/schema";

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "delivered", label: "Delivered" },
];

const PAYMENT_OPTIONS = [
    { value: "all", label: "All Payments" },
    { value: "pending", label: "Unpaid" },
    { value: "paid", label: "Paid" },
    { value: "credit", label: "Credit" },
];

const statusColor = (s: string) => {
    switch (s) {
        case "pending": return "bg-yellow-500/15 text-yellow-700 border-yellow-300";
        case "processing": return "bg-blue-500/15 text-blue-700 border-blue-300";
        case "completed": return "bg-green-500/15 text-green-700 border-green-300";
        case "delivered": return "bg-emerald-500/15 text-emerald-700 border-emerald-300";
        case "cancelled": return "bg-red-500/15 text-red-700 border-red-300";
        default: return "bg-gray-500/15 text-gray-700 border-gray-300";
    }
};

// ── Component ────────────────────────────────────────────────────────────────

export default function PrintTags() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [showFilters, setShowFilters] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    // Invoice print hook
    const { printInvoice } = useInvoicePrint({
        onSuccess: () => toast({ title: "Bill printed successfully" }),
        onError: () =>
            toast({ title: "Print failed", variant: "destructive" }),
    });

    // ── Data fetching ────────────────────────────────────────────────────────

    const {
        data: orders = [],
        isLoading,
    } = useQuery({
        queryKey: ["orders"],
        queryFn: ordersApi.getAll,
        staleTime: 60_000,
    });

    // Mark tags as printed
    const markPrintedMutation = useMutation({
        mutationFn: async (orderId: string) => {
            const token = localStorage.getItem("employee_token");
            const res = await fetch(`/api/orders/${orderId}/tags-printed`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error("Failed to mark as printed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            toast({ title: "Marked as printed" });
        },
        onError: () =>
            toast({
                title: "Error",
                description: "Could not update print status",
                variant: "destructive",
            }),
    });

    // ── Filtering ────────────────────────────────────────────────────────────

    const filteredOrders = useMemo(() => {
        const q = search.toLowerCase();
        return orders.filter((o: Order) => {
            if (q && !(
                o.orderNumber.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                ((o as any).customerPhone || "").toLowerCase().includes(q)
            )) return false;

            if (statusFilter !== "all" && o.status !== statusFilter) return false;
            if (paymentFilter !== "all" && ((o as any).paymentStatus || "pending") !== paymentFilter) return false;

            if (dateFrom) {
                const d = new Date(o.createdAt || 0);
                if (d < dateFrom) return false;
            }
            if (dateTo) {
                const d = new Date(o.createdAt || 0);
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                if (d > end) return false;
            }
            return true;
        }).sort((a: Order, b: Order) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
    }, [orders, search, statusFilter, paymentFilter, dateFrom, dateTo]);

    // ── Stats ────────────────────────────────────────────────────────────────

    const stats = useMemo(() => {
        const total = filteredOrders.length;
        const tagsPending = filteredOrders.filter((o: any) => !o.tagsPrinted).length;
        const tagsDone = total - tagsPending;
        return { total, tagsPending, tagsDone };
    }, [filteredOrders]);

    // ── Selection ────────────────────────────────────────────────────────────

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }, []);

    const selectAll = useCallback(() => {
        if (selectedIds.length === filteredOrders.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredOrders.map((o: Order) => o.id));
        }
    }, [selectedIds.length, filteredOrders]);

    const clearFilters = useCallback(() => {
        setSearch("");
        setStatusFilter("all");
        setPaymentFilter("all");
        setDateFrom(undefined);
        setDateTo(undefined);
    }, []);

    const hasActiveFilters = search || statusFilter !== "all" || paymentFilter !== "all" || dateFrom || dateTo;

    // ── Print handlers ───────────────────────────────────────────────────────

    /** Print garment tags for one or many orders in a single popup */
    const handlePrintTags = useCallback((targetOrders: Order[]) => {
        if (targetOrders.length === 0) {
            toast({ title: "No orders selected", variant: "destructive" });
            return;
        }

        const tagWindow = window.open("", "_blank", "width=420,height=700");
        if (!tagWindow) {
            toast({ title: "Popup blocked", description: "Please allow popups", variant: "destructive" });
            return;
        }

        const allTags = targetOrders
            .map((order) => {
                const items = Array.isArray(order.items) ? order.items : [];
                return items
                    .map(
                        (item: any, idx: number) => `
        <div class="tag">
          <div class="tag-header">Fab Clean</div>
          <div class="tag-order">${order.orderNumber}</div>
          <div class="tag-customer">${order.customerName}</div>
          <div class="tag-row"><span class="lbl">Item:</span><span class="val">${item.garmentType || item.name || `Item ${idx + 1}`}</span></div>
          <div class="tag-row"><span class="lbl">Qty:</span><span class="val">${item.quantity || 1}</span></div>
          ${item.service ? `<div class="tag-row"><span class="lbl">Service:</span><span class="val">${item.service}</span></div>` : ""}
          ${item.notes ? `<div class="tag-row"><span class="lbl">Note:</span><span class="val">${item.notes}</span></div>` : ""}
          <div class="tag-row"><span class="lbl">Date:</span><span class="val">${new Date(order.createdAt || 0).toLocaleDateString("en-IN")}</span></div>
        </div>`
                    )
                    .join("");
            })
            .join('<div class="page-break"></div>');

        tagWindow.document.write(`<!DOCTYPE html><html><head>
      <title>Tags</title>
      <style>
        @media print { @page { size: 60mm auto; margin: 2mm; } .no-print { display:none !important; } }
        * { box-sizing:border-box; }
        body { font-family:'Courier New',monospace; margin:0; padding:4px; }
        .tag { border:1px dashed #333; padding:8px; margin-bottom:8px; page-break-inside:avoid; }
        .tag-header { font-size:14px; font-weight:bold; text-align:center; border-bottom:1px solid #666; padding-bottom:4px; margin-bottom:6px; }
        .tag-order { font-size:16px; font-weight:bold; text-align:center; margin:4px 0; letter-spacing:1px; }
        .tag-customer { text-align:center; font-size:12px; margin:2px 0; }
        .tag-row { display:flex; justify-content:space-between; font-size:11px; margin:2px 0; }
        .lbl { color:#666; } .val { font-weight:bold; }
        .page-break { page-break-after:always; margin:12px 0; border-top:2px dashed #999; }
        .print-bar { position:sticky; top:0; background:#fff; padding:8px; text-align:center; border-bottom:1px solid #ccc; }
        .print-bar button { padding:8px 24px; background:#16a34a; color:#fff; border:none; border-radius:6px; font-size:14px; cursor:pointer; }
      </style>
    </head><body>
      <div class="print-bar no-print"><button onclick="window.print()">🖨️ Print All Tags</button></div>
      ${allTags}
      <script>window.onload=function(){window.print();}<\/script>
    </body></html>`);
        tagWindow.document.close();

        toast({
            title: "Tags generated",
            description: `${targetOrders.length} order(s) sent to print`,
        });
    }, [toast]);

    /** Print bill/invoice for a single order */
    const handlePrintBill = useCallback(
        (order: Order) => {
            printInvoice(order);
        },
        [printInvoice]
    );

    /** Print selected orders' tags */
    const handlePrintSelectedTags = useCallback(() => {
        const selected = filteredOrders.filter((o: Order) => selectedIds.includes(o.id));
        handlePrintTags(selected);
    }, [filteredOrders, selectedIds, handlePrintTags]);

    /** Mark selected as printed */
    const handleMarkSelectedPrinted = useCallback(() => {
        selectedIds.forEach((id) => markPrintedMutation.mutate(id));
        setSelectedIds([]);
    }, [selectedIds, markPrintedMutation]);

    // ── Render ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container-desktop min-h-screen py-8 space-y-8 gradient-mesh">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Print Queue
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Print garment tags & bills for your orders
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["orders"] })}
                    >
                        <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <Card className="glass border-none shadow-xl">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Package className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Displayed</p>
                                <h3 className="text-2xl font-bold">{stats.total}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass border-none shadow-xl">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Tag className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tags Not Printed</p>
                                <h3 className="text-2xl font-bold text-amber-500">{stats.tagsPending}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass border-none shadow-xl">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tags Printed</p>
                                <h3 className="text-2xl font-bold text-emerald-500">{stats.tagsDone}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Search + Filter toggle ─────────────────────────────────── */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search order # or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                    {search && (
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            onClick={() => setSearch("")}
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    )}
                </div>
                <Button
                    variant={showFilters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="shrink-0"
                >
                    <Filter className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Filters</span>
                    {hasActiveFilters && (
                        <span className="ml-1 bg-primary-foreground text-primary rounded-full h-4 w-4 text-[10px] flex items-center justify-center">
                            !
                        </span>
                    )}
                </Button>
            </div>

            {/* ── Filters panel ──────────────────────────────────────────── */}
            {showFilters && (
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Payment" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 justify-start text-sm font-normal">
                                        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                        {dateFrom ? format(dateFrom, "dd MMM") : "From"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 justify-start text-sm font-normal">
                                        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                        {dateTo ? format(dateTo, "dd MMM") : "To"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {hasActiveFilters && (
                            <div className="mt-2 flex justify-end">
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="h-3.5 w-3.5 mr-1" /> Clear All
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── Batch actions bar ──────────────────────────────────────── */}
            {selectedIds.length > 0 && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-3 flex flex-wrap items-center gap-2 justify-between">
                        <span className="text-sm font-medium">
                            {selectedIds.length} order(s) selected
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button size="sm" onClick={handlePrintSelectedTags}>
                                <Printer className="h-4 w-4 mr-1" /> Print All Tags
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleMarkSelectedPrinted}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Printed
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedIds([])}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Select-all row ─────────────────────────────────────────── */}
            {filteredOrders.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                    <Checkbox
                        checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={selectAll}
                    />
                    <span className="text-xs text-muted-foreground">
                        Select all {filteredOrders.length} orders
                    </span>
                </div>
            )}

            {/* ── Orders list ────────────────────────────────────────────── */}
            {filteredOrders.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold">No orders found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {hasActiveFilters
                                ? "Try adjusting your filters."
                                : "Create a new order to get started."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredOrders.map((order: any) => {
                        const items = Array.isArray(order.items) ? order.items : [];
                        const isSelected = selectedIds.includes(order.id);
                        const isExpanded = expandedOrder === order.id;
                        const tagsPrinted = !!order.tagsPrinted;

                        return (
                            <Card
                                key={order.id}
                                className={cn(
                                    "transition-all",
                                    isSelected && "ring-2 ring-primary/50 bg-primary/5"
                                )}
                            >
                                <CardContent className="p-3 sm:p-4">
                                    {/* Main row */}
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelect(order.id)}
                                            className="mt-1 shrink-0"
                                        />

                                        {/* Info */}
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() =>
                                                setExpandedOrder(isExpanded ? null : order.id)
                                            }
                                        >
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-base">
                                                    {order.orderNumber}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] px-1.5 py-0", statusColor(order.status))}
                                                >
                                                    {order.status}
                                                </Badge>
                                                {tagsPrinted && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] px-1.5 py-0 bg-green-500/15 text-green-700 border-green-300"
                                                    >
                                                        <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                                        Printed
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {order.customerName} · {items.length} item{items.length !== 1 ? "s" : ""} ·{" "}
                                                {formatCurrency(parseFloat(order.totalAmount || "0"))}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>

                                        {/* Actions — always visible */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 px-2 text-xs"
                                                onClick={() => handlePrintTags([order])}
                                                title="Print garment tags"
                                            >
                                                <Tag className="h-3.5 w-3.5 sm:mr-1" />
                                                <span className="hidden sm:inline">Tags</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 px-2 text-xs"
                                                onClick={() => handlePrintBill(order)}
                                                title="Print bill / invoice"
                                            >
                                                <Receipt className="h-3.5 w-3.5 sm:mr-1" />
                                                <span className="hidden sm:inline">Bill</span>
                                            </Button>
                                            {!tagsPrinted && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-xs text-green-600"
                                                    onClick={() => markPrintedMutation.mutate(order.id)}
                                                    disabled={markPrintedMutation.isPending}
                                                    title="Mark as printed"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <button
                                                className="p-1 text-muted-foreground"
                                                onClick={() =>
                                                    setExpandedOrder(isExpanded ? null : order.id)
                                                }
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded items */}
                                    {isExpanded && items.length > 0 && (
                                        <div className="mt-3 ml-8 border-t pt-3 space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Items
                                            </p>
                                            {items.map((item: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between text-sm py-1 border-b border-dashed last:border-0"
                                                >
                                                    <div>
                                                        <span className="font-medium">
                                                            {item.garmentType || item.name || `Item ${idx + 1}`}
                                                        </span>
                                                        {item.service && (
                                                            <span className="text-muted-foreground ml-2 text-xs">
                                                                ({item.service})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        × {item.quantity || 1}
                                                        {item.price && ` · ${formatCurrency(parseFloat(item.price))}`}
                                                    </div>
                                                </div>
                                            ))}
                                            {items.some((it: any) => it.notes) && (
                                                <p className="text-xs text-muted-foreground italic mt-1">
                                                    Notes: {items.filter((it: any) => it.notes).map((it: any) => it.notes).join(", ")}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
