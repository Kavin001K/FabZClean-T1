import { useState, useMemo, useCallback, useEffect } from "react";
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
import type { Order, OrderItem } from "@shared/schema";
import { buildThermalTagPrintHtml, prepareThermalTags } from "@/lib/garment-tag-layout";
import {
    ORDER_STORE_OPTIONS,
    getOrderStoreLabel,
    resolveOrderStoreCodeFromOrder,
} from "@/lib/order-store";

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
    useEffect(() => {
        document.title = "Print Tags | FabzClean";
    }, []);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [storeFilter, setStoreFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [showFilters, setShowFilters] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

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
        queryKey: ["print-queue"],
        queryFn: ordersApi.getPrintQueue,
        staleTime: 10_000,
        refetchOnWindowFocus: true,
        refetchInterval: 15_000,
    });

    const {
        data: historyOrders = [],
        isLoading: isLoadingHistory,
    } = useQuery({
        queryKey: ["print-history"],
        queryFn: ordersApi.getPrintHistory,
        staleTime: 10_000,
        refetchOnWindowFocus: true,
        refetchInterval: 60_000,
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
            queryClient.invalidateQueries({ queryKey: ["print-queue"] });
            queryClient.invalidateQueries({ queryKey: ["print-history"] });
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
        const baseOrders = activeTab === "pending" ? orders : historyOrders;
        
        return baseOrders.filter((o: Order) => {
            if (q && !(
                o.orderNumber.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                ((o as any).customerPhone || "").toLowerCase().includes(q) ||
                getOrderStoreLabel(resolveOrderStoreCodeFromOrder(o)).toLowerCase().includes(q)
            )) return false;

            if (statusFilter !== "all" && o.status !== statusFilter) return false;
            if (paymentFilter !== "all" && ((o as any).paymentStatus || "pending") !== paymentFilter) return false;
            if (storeFilter !== "all" && resolveOrderStoreCodeFromOrder(o) !== storeFilter) return false;

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
    }, [orders, historyOrders, activeTab, search, statusFilter, paymentFilter, storeFilter, dateFrom, dateTo]);

    // ── Stats ────────────────────────────────────────────────────────────────

    const stats = useMemo(() => {
        const tagsPending = orders.length;
        const tagsDone = historyOrders.length;
        const total = tagsPending + tagsDone;
        return { total, tagsPending, tagsDone };
    }, [orders, historyOrders]);

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
        setStoreFilter("all");
        setDateFrom(undefined);
        setDateTo(undefined);
    }, []);

    const hasActiveFilters = search || statusFilter !== "all" || paymentFilter !== "all" || storeFilter !== "all" || dateFrom || dateTo;

    // ── Print handlers ───────────────────────────────────────────────────────

    /** Print garment tags for one or many orders in a single popup */
    const handlePrintTags = useCallback((targetOrders: Order[]) => {
        if (targetOrders.length === 0) {
            toast({ title: "No orders selected", variant: "destructive" });
            return;
        }

        const preparedTags = targetOrders.flatMap((order) => prepareThermalTags({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            franchiseId: (order as any).franchiseId || (order as any).franchise_id || null,
            storeCode: resolveOrderStoreCodeFromOrder(order),
            commonNote: (order as any).specialInstructions || (order as any).special_instructions || undefined,
            dueDate: (order as any).pickupDate
                ? String((order as any).pickupDate)
                : (order as any).dueDate
                    ? String((order as any).dueDate)
                    : undefined,
            items: (Array.isArray(order.items) ? order.items : []).map((item: OrderItem) => ({
                orderNumber: order.orderNumber,
                serviceName: item.serviceName || item.customName || "Item",
                tagNote: item.tagNote || "",
                quantity: item.quantity || 1,
                customerName: order.customerName,
            })),
        }));

        if (preparedTags.length === 0) {
            toast({ title: "No printable tags", description: "The selected orders do not contain any tag items.", variant: "destructive" });
            return;
        }

        const tagWindow = window.open("", "_blank", "width=600,height=800");
        if (!tagWindow) {
            toast({ title: "Popup blocked", description: "Please allow popups", variant: "destructive" });
            return;
        }

        tagWindow.document.write(buildThermalTagPrintHtml(preparedTags, `Garment Tags - ${targetOrders.length} Orders`));
        tagWindow.document.close();
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                        <Printer className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
                            Print Queue
                        </h1>
                        <div className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Garment tags and bills for active processing
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 gap-2 border-white/10 hover:bg-white/5 text-sm font-semibold transition-all rounded-xl"
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ["print-queue"] });
                            queryClient.invalidateQueries({ queryKey: ["print-history"] });
                            queryClient.invalidateQueries({ queryKey: ["orders"] });
                        }}
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">Refresh Sync</span>
                    </Button>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────────── */}
            <div className="flex bg-muted/50 p-1 rounded-xl w-full max-w-[400px] mb-2 border border-white/5">
                <button 
                   onClick={() => { setActiveTab('pending'); setSelectedIds([]); }} 
                   className={cn("flex-1 text-sm font-semibold py-2 rounded-lg transition-all", activeTab === 'pending' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  Pending Queue
                </button>
                <button 
                   onClick={() => { setActiveTab('history'); setSelectedIds([]); }} 
                   className={cn("flex-1 text-sm font-semibold py-2 rounded-lg transition-all", activeTab === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  Print History
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 px-1">
                <Card className="glass border-muted border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                                <Tag className="h-7 w-7 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Tags Pending</p>
                                <h3 className="text-3xl font-black tracking-tight text-amber-600">{stats.tagsPending}</h3>
                                <p className="text-[10px] text-amber-500/60 font-medium italic">Require labeling</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass border-muted border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Labelled</p>
                                <h3 className="text-3xl font-black tracking-tight text-emerald-600">{stats.tagsDone}</h3>
                                <p className="text-[10px] text-emerald-500/60 font-medium italic">Ready for factory</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Search + Filter toggle ─────────────────────────────────── */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 lg:max-w-xl group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search order # or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 text-sm border-muted focus-visible:ring-primary/20 transition-all bg-muted/5 group-hover:bg-muted/10 font-medium"
                    />
                    {search && (
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                            onClick={() => setSearch("")}
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    )}
                </div>
                <Button
                    variant={showFilters ? "default" : "outline"}
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-11 border-muted bg-transparent focus:ring-primary/20 px-6 shrink-0"
                >
                    <Filter className="h-4 w-4 mr-2" />
                    <span>Filters</span>
                    {hasActiveFilters && (
                        <span className="ml-2 bg-primary-foreground text-primary rounded-full h-5 w-5 text-[10px] flex items-center justify-center font-bold">
                            !
                        </span>
                    )}
                </Button>
            </div>

            {/* ── Filters panel ──────────────────────────────────────────── */}
            {showFilters && (
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

                            <Select value={storeFilter} onValueChange={setStoreFilter}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Store" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stores</SelectItem>
                                    {ORDER_STORE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
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
                <Card className="border-primary/50 bg-primary/5 animate-in slide-in-from-top-4">
                    <CardContent className="p-3 flex flex-wrap items-center gap-2 justify-between">
                        <span className="text-sm font-bold ml-2">
                            {selectedIds.length} order(s) selected
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button size="sm" onClick={handlePrintSelectedTags} className="font-bold">
                                <Printer className="h-4 w-4 mr-2" /> {activeTab === 'pending' ? 'Print All Tags' : 'Reprint All Tags'}
                            </Button>
                            {activeTab === 'pending' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="font-bold gap-2 border-primary/20"
                                    onClick={handleMarkSelectedPrinted}
                                >
                                    <CheckCircle2 className="h-4 w-4" /> Mark Printed
                                </Button>
                            )}
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
                <div className="flex items-center gap-3 px-2 py-1 bg-white/5 rounded-lg border border-white/5 w-fit">
                    <Checkbox
                        checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={selectAll}
                        className="h-4 w-4"
                    />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Check All ({filteredOrders.length})
                    </span>
                </div>
            )}

            {/* ── Orders list ────────────────────────────────────────────── */}
            {filteredOrders.length === 0 ? (
                <Card className="glass border-muted border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-20">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">Queue is Clear</h3>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">
                            {hasActiveFilters
                                ? "Adjust your search filters to see other orders."
                                : "You're all caught up! No active orders in queue."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4 px-1">
                    {filteredOrders.map((order: any) => {
                        const items = Array.isArray(order.items) ? order.items : [];
                        const isSelected = selectedIds.includes(order.id);
                        const isExpanded = expandedOrder === order.id;
                        const tagsPrinted = !!order.tagsPrinted;
                        const orderStoreCode = resolveOrderStoreCodeFromOrder(order);

                        return (
                            <Card
                                key={order.id}
                                className={cn(
                                    "transition-all duration-300 border-white/5 overflow-hidden group",
                                    isSelected ? "ring-2 ring-primary bg-primary/5 border-primary/20" : "hover:bg-white/5"
                                )}
                            >
                                <CardContent className="p-4 sm:p-5">
                                    {/* Main row */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelect(order.id)}
                                                className="shrink-0 h-5 w-5 rounded-md border-muted data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />

                                            {/* Info */}
                                            <div
                                                className="flex-1 min-w-0 cursor-pointer group/info"
                                                onClick={() =>
                                                    setExpandedOrder(isExpanded ? null : order.id)
                                                }
                                            >
                                                <div className="flex items-center gap-3 flex-wrap mb-1">
                                                    <span className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">
                                                        {order.orderNumber}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn("text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider", statusColor(order.status))}
                                                        >
                                                            {order.status}
                                                        </Badge>
                                                        {tagsPrinted ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                            >
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                Labelled
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse"
                                                            >
                                                                <Tag className="h-3 w-3 mr-1" />
                                                                No Tag
                                                            </Badge>
                                                        )}
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider",
                                                                order.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                                order.paymentStatus === 'credit' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                                "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                            )}
                                                        >
                                                            {order.paymentStatus || 'pending'}
                                                        </Badge>
                                                        {orderStoreCode && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider bg-slate-900 text-white border-slate-800"
                                                            >
                                                                {orderStoreCode}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-muted-foreground">
                                                    <span className="text-foreground font-bold">{order.customerName}</span>
                                                    <span className="opacity-20">•</span>
                                                    <span>{getOrderStoreLabel(orderStoreCode)}</span>
                                                    <span className="opacity-20">•</span>
                                                    <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                                                    <span className="opacity-20">•</span>
                                                    <span className="text-primary font-bold">{formatCurrency(parseFloat(order.totalAmount || "0"))}</span>
                                                    <span className="opacity-20">•</span>
                                                    <span className="text-xs opacity-70">
                                                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions — always visible */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="hidden sm:flex items-center gap-2 bg-muted/20 p-1 rounded-xl border border-white/5">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-9 px-3 gap-2 text-xs font-bold hover:bg-amber-500/10 hover:text-amber-500 transition-all"
                                                    onClick={() => handlePrintTags([order])}
                                                    title={activeTab === 'pending' ? "Print garment tags" : "Reprint garment tags"}
                                                >
                                                    <Tag className="h-4 w-4" />
                                                    <span>{activeTab === 'pending' ? 'Tags' : 'Reprint'}</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-9 px-3 gap-2 text-xs font-bold hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                                                    onClick={() => handlePrintBill(order)}
                                                    title="Print bill / invoice"
                                                >
                                                    <Receipt className="h-4 w-4" />
                                                    <span>Bill</span>
                                                </Button>
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                                {!tagsPrinted && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-10 w-10 text-emerald-500 hover:bg-emerald-500/10 rounded-xl"
                                                        onClick={() => markPrintedMutation.mutate(order.id)}
                                                        disabled={markPrintedMutation.isPending}
                                                        title="Mark as printed"
                                                    >
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-10 w-10 text-muted-foreground hover:bg-white/5 rounded-xl"
                                                    onClick={() =>
                                                        setExpandedOrder(isExpanded ? null : order.id)
                                                    }
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded items */}
                                    {isExpanded && items.length > 0 && (
                                        <div className="mt-4 ml-8 border-t border-white/5 pt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest pl-1">
                                                Items in Order
                                            </p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {items.map((item: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-sm leading-none truncate">
                                                                    {item.serviceName || item.customName || `Item ${idx + 1}`}
                                                                </p>
                                                                {item.tagNote && (
                                                                    <p className="text-primary text-[10px] font-bold mt-1 uppercase tracking-wider">
                                                                        {item.tagNote}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-center gap-4 shrink-0">
                                                            <p className="text-sm font-black">× {item.quantity || 1}</p>
                                                            {item.price && <p className="text-sm font-semibold text-muted-foreground">{formatCurrency(parseFloat(item.price))}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {items.some((it: any) => it.tagNote) && (
                                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2">
                                                    <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                    <p className="text-xs text-foreground/80 font-medium">
                                                        <span className="font-bold text-primary mr-1">Notes:</span> 
                                                        {items.filter((it: any) => it.tagNote).map((it: any) => it.tagNote).join(", ")}
                                                    </p>
                                                </div>
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
