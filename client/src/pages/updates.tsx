import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Loader2, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Filter,
  Sparkles,
  RefreshCw,
  Bell,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type OrderLite = {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  totalAmount?: string | number;
  createdAt?: string;
  priority?: "normal" | "high" | "urgent";
  isExpressOrder?: boolean;
};

const STATUS_OPTIONS = [
  "pending",
  "processing",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

const STATUS_SUGGESTIONS: Record<string, string[]> = {
  pending: ["processing", "ready_for_pickup"],
  processing: ["ready_for_pickup", "out_for_delivery", "completed"],
  ready_for_pickup: ["out_for_delivery", "completed"],
  out_for_delivery: ["completed"],
  completed: [],
  cancelled: [],
};

function getAuthHeaders() {
  const token = localStorage.getItem("employee_token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
}

export default function UpdatesPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<OrderLite[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderLite[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderLite | null>(null);
  const [nextStatus, setNextStatus] = useState<string>("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [activeTab, setActiveTab] = useState<"smart" | "search">("smart");
  const { toast } = useToast();

  // Smart Scoring Algorithm
  const calculateScore = (order: OrderLite) => {
    let score = 0;
    // Priority boost
    if (order.priority === 'urgent') score += 100;
    if (order.priority === 'high') score += 50;
    if (order.isExpressOrder) score += 40;
    
    // Status boost (actions needed)
    if (order.status === 'pending') score += 60;
    if (order.status === 'processing') score += 40;
    
    // Staleness logic
    const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const hoursSinceCreation = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    
    // Heavy boost for older orders
    score += Math.min(hoursSinceCreation * 3, 120);
    
    return score;
  };

  const smartSuggestions = useMemo(() => {
    return [...recentOrders]
      .filter(o => !['completed', 'cancelled'].includes(o.status))
      .sort((a, b) => calculateScore(b) - calculateScore(a))
      .slice(0, 15);
  }, [recentOrders]);

  const fetchRecentOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders?limit=50', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to load orders");
      const data = await response.json();
      const rows = Array.isArray(data) ? data : data.data || [];
      setRecentOrders(rows);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setActiveTab("search");
    try {
      const response = await fetch(`/api/orders/search?q=${encodeURIComponent(q)}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Unable to search orders");
      const rows = (await response.json()) as OrderLite[];
      setResults(Array.isArray(rows) ? rows : []);
      if (rows.length === 1) {
        setSelectedOrder(rows[0]);
      }
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error?.message || "Could not load matching orders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!selectedOrder || !nextStatus) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: nextStatus,
          cancellationReason: nextStatus === "cancelled" ? cancellationReason || "Cancelled from updates page" : undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || payload?.message || "Status update failed");
      }

      const updated = (payload?.data || payload?.order || {}) as Partial<OrderLite>;
      const mergedOrder: OrderLite = {
        ...selectedOrder,
        ...updated,
        status: String(updated?.status || nextStatus),
      };
      
      // Update local states
      setRecentOrders(prev => prev.map(o => o.id === mergedOrder.id ? mergedOrder : o));
      setResults(prev => prev.map(o => o.id === mergedOrder.id ? mergedOrder : o));
      setSelectedOrder(mergedOrder);
      setNextStatus("");
      setCancellationReason("");
      
      toast({
        title: "Status Updated",
        description: `${mergedOrder.orderNumber} moved to ${mergedOrder.status.replace(/_/g, " ")}.`,
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message || "Could not update order status.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderOrderCard = (order: OrderLite, isSelected: boolean) => {
    const score = calculateScore(order);
    const isUrgent = order.priority === 'urgent' || order.isExpressOrder;
    
    return (
      <motion.button
        key={order.id}
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          setSelectedOrder(order);
          setNextStatus("");
          setCancellationReason("");
        }}
        className={cn(
          "relative w-full rounded-3xl border p-5 text-left transition-all duration-500 overflow-hidden",
          isSelected 
            ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20 shadow-xl shadow-primary/5" 
            : "border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-black/5"
        )}
      >
        {/* Progress Glow for High Score */}
        {score > 100 && (
          <div className="absolute -left-1 top-0 bottom-0 w-1 bg-primary animate-pulse" />
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-black tracking-tight font-mono">{order.orderNumber}</span>
                {isUrgent && (
                  <div className="flex h-6 items-center px-2 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <TrendingUp className="mr-1 h-3 w-3" /> Critical
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground/90 uppercase tracking-tight">
                {order.customerName || "Walk-in Customer"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className={cn(
                  "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border-2",
                  order.status === 'pending' && "text-orange-500 border-orange-500/20 bg-orange-500/5",
                  order.status === 'processing' && "text-blue-500 border-blue-500/20 bg-blue-500/5",
                  order.status === 'ready_for_pickup' && "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
                )}>
                  {order.status.replace(/_/g, " ")}
                </Badge>
                <p className="text-[10px] font-medium text-muted-foreground">₹{Number(order.totalAmount || 0).toFixed(0)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 opacity-60" />
                {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : "Just now"}
              </span>
            </div>
            
            {score > 100 ? (
               <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase italic tracking-tighter">
                <Sparkles className="h-3 w-3" /> Priority Update
              </div>
            ) : (
                <ChevronRight className={cn("h-4 w-4 transition-transform", isSelected && "rotate-90 text-primary")} />
            )}
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-background/50 pb-32 lg:container-desktop lg:py-8 lg:pb-8">
      {/* Premium Glass Header */}
      <div className="sticky top-0 z-40 bg-background/60 px-5 py-6 backdrop-blur-xl border-b border-border/50 lg:static lg:bg-transparent lg:px-0 lg:py-0 lg:mb-10 lg:border-none">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
                <Bell className="h-5 w-5" />
                <h1 className="text-3xl font-black tracking-tighter uppercase italic">Updates</h1>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-70">Intelligent Logistics Engine</p>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchRecentOrders}
            className={cn("rounded-2xl border-2", loading && "animate-spin")}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>

        {/* Dynamic Search Box */}
        <div className="mt-8 relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl group-focus-within:bg-primary/10 transition-all" />
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Order ID, Name or Phone..."
                className="h-14 border-2 bg-card/50 pl-12 rounded-3xl ring-offset-background focus-visible:ring-primary/20 text-base font-medium"
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
              />
            </div>
            <Button onClick={runSearch} className="h-14 px-6 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">
              Go
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 px-5 lg:grid-cols-[1fr_420px] lg:px-0">
        {/* Smart Lists */}
        <div className="space-y-8">
          <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-2xl w-fit border border-border/50">
            <button 
              onClick={() => setActiveTab('smart')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'smart' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Smart Boost
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'search' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              All Results
            </button>
          </div>

          <div className="space-y-5">
            <AnimatePresence mode="popLayout">
              {loading && results.length === 0 && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground"
                >
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Synchronizing Live Data</p>
                </motion.div>
              )}

              {activeTab === 'smart' ? (
                smartSuggestions.length > 0 ? (
                  smartSuggestions.map(order => renderOrderCard(order, selectedOrder?.id === order.id))
                ) : (
                  !loading && (
                    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-[3rem] border-4 border-dashed border-muted/30 text-muted-foreground/40">
                      <CheckCircle2 className="h-16 w-16" />
                      <p className="text-sm font-black uppercase tracking-widest">System Clear</p>
                    </div>
                  )
                )
              ) : (
                results.length > 0 ? (
                  results.map(order => renderOrderCard(order, selectedOrder?.id === order.id))
                ) : (
                  !loading && (
                    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-[3rem] border-4 border-dashed border-muted/30 text-muted-foreground/40">
                      <Search className="h-16 w-16 opacity-30" />
                      <p className="text-sm font-black uppercase tracking-widest">Waiting for Input</p>
                    </div>
                  )
                )
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Interactive Update Interface */}
        <div className="lg:sticky lg:top-10">
          <AnimatePresence>
            {selectedOrder ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="relative"
              >
                {/* Background Decoration */}
                <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-[3rem] -z-10" />
                
                <Card className="border-2 border-primary/20 shadow-[0_32px_64px_-12px_rgba(var(--primary),0.1)] overflow-hidden rounded-[2.5rem]">
                  <div className="bg-primary/5 p-8 border-b border-primary/10 relative overflow-hidden">
                    {/* Decorative Element */}
                    <div className="absolute -right-10 -top-10 h-40 w-40 bg-primary/5 rounded-full blur-2xl" />
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Controller</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="h-10 w-10 rounded-full hover:bg-primary/10">
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                    <h3 className="text-4xl font-black tracking-tighter mb-1">{selectedOrder.orderNumber}</h3>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">{selectedOrder.customerName}</p>
                  </div>

                  <CardContent className="p-8 space-y-8">
                    {/* Progress Recommendations */}
                    {STATUS_SUGGESTIONS[selectedOrder.status]?.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-4 w-4" />
                            <Label className="text-[10px] font-black uppercase tracking-widest">Recommended Actions</Label>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {STATUS_SUGGESTIONS[selectedOrder.status].map((status) => (
                            <Button 
                              key={status} 
                              variant="outline" 
                              onClick={() => setNextStatus(status)}
                              className={cn(
                                "h-14 justify-between rounded-2xl border-2 px-5 text-sm font-black uppercase tracking-wider transition-all",
                                nextStatus === status ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              {status.replace(/_/g, " ")}
                              <ArrowRight className="h-4 w-4 opacity-50" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Manual Status</Label>
                        <Select value={nextStatus} onValueChange={setNextStatus}>
                          <SelectTrigger className="h-14 rounded-2xl border-2 bg-muted/20 focus:ring-primary/20 font-bold uppercase tracking-widest">
                            <SelectValue placeholder="Override status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-2">
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status} className="capitalize font-bold py-3">
                                {status.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <AnimatePresence>
                        {nextStatus === "cancelled" && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 overflow-hidden"
                          >
                            <Label className="text-[10px] font-black uppercase tracking-widest text-red-500">Incident Report / Reason</Label>
                            <Input
                              value={cancellationReason}
                              onChange={(e) => setCancellationReason(e.target.value)}
                              placeholder="Required for cancellation logs..."
                              className="h-14 rounded-2xl border-2 border-red-500/20 bg-red-500/5 focus-visible:ring-red-500/20 font-medium"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button 
                        onClick={updateStatus} 
                        disabled={!nextStatus || saving} 
                        className="w-full h-16 rounded-[1.5rem] text-lg font-black uppercase tracking-[0.1em] shadow-2xl shadow-primary/30 transition-transform active:scale-[0.98]"
                      >
                        {saving ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CheckCircle2 className="mr-2 h-6 w-6" />}
                        Execute Update
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
                <div className="hidden lg:flex h-[600px] flex-col items-center justify-center gap-4 rounded-[3rem] border-4 border-dashed border-muted/20">
                    <div className="p-6 rounded-full bg-muted/30">
                        <TrendingUp className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/30">Select item to engage</p>
                </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
