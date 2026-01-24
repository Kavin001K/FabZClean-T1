import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    User,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    History,
    Settings,
    AlertTriangle,
    CheckCircle2,
    Clock,
    MessageSquare,
    Wallet
} from "lucide-react";
import type { Customer } from "@shared/schema";
import { customersApi } from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";

interface CustomerDetailsSheetProps {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (customer: Customer) => void;
}

export function CustomerDetailsSheet({
    customer,
    isOpen,
    onClose,
    onEdit,
}: CustomerDetailsSheetProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");

    // Fetch audit logs for ledger (mocking ledger via audit logs for now if credit_trans not available, 
    // but ideally should fetch credit transactions. I'll use audit logs as a fallback or if configured)
    // Actually, I'll try to fetch credit transactions if the endpoint exists, otherwise audit logs.
    // Assuming /api/credits/transactions exists (from routes list in step 373: app.use("/api/credits", creditsRouter);)

    const { data: transactions, isLoading: loadingTransactions } = useQuery({
        queryKey: ['credit-transactions', customer?.id],
        queryFn: async () => {
            if (!customer?.id) return [];
            const res = await fetch(`/api/credits/transactions?customerId=${customer.id}`);
            if (res.ok) return res.json();
            // Fallback to empty if endpoint fails (or not implemented yet)
            return [];
        },
        enabled: !!customer?.id && isOpen && activeTab === 'ledger',
    });

    const { data: auditLogs, isLoading: loadingAudit } = useQuery({
        queryKey: ['audit-logs', customer?.id],
        queryFn: async () => {
            if (!customer?.id) return { data: [] };
            const res = await fetch(`/api/audit-logs?entityType=customer&entityId=${customer.id}&limit=20`);
            if (res.ok) return res.json();
            return { data: [] };
        },
        enabled: !!customer?.id && isOpen && activeTab === 'ledger',
    });


    if (!customer) return null;

    const initials = customer.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const getTierColor = (tier?: string) => {
        switch (tier?.toLowerCase()) {
            case "platinum": return "bg-slate-800 text-white border-slate-600";
            case "gold": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "silver": return "bg-slate-100 text-slate-800 border-slate-200";
            default: return "bg-orange-50 text-orange-800 border-orange-200";
        }
    };

    const handleWhatsApp = () => {
        if (!customer.phone) return;
        const message = `Hello ${customer.name}, regarding your order at FabZClean...`;
        const url = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
                {/* Header */}
                <div className="p-6 pb-2 bg-muted/10 border-b">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-primary/10">
                                <AvatarFallback className="text-xl bg-primary/5 text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">{customer.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={getTierColor(customer.tier || 'Bronze')}>
                                        {customer.tier || 'Bronze'} Member
                                    </Badge>
                                    <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                                        {customer.status || 'Active'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => onEdit(customer)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-background rounded border">
                            <Wallet className="h-4 w-4 text-green-600" />
                            <span>Wallet: <strong className="text-foreground">₹{customer.walletBalance || '0.00'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-background rounded border">
                            <CreditCard className="h-4 w-4 text-orange-600" />
                            <span>Credit: <strong className="text-foreground">₹{customer.creditBalance || '0.00'}</strong></span>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden" value={activeTab} onValueChange={setActiveTab}>
                    <div className="px-6 border-b">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="ledger">Ledger</TabsTrigger>
                            <TabsTrigger value="preferences">Preferences</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6">

                            {/* TAB: OVERVIEW */}
                            <TabsContent value="overview" className="mt-0 space-y-6">

                                {/* Contact Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact Details</h3>
                                    <div className="grid gap-3">
                                        {customer.phone && (
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded bg-green-50 flex items-center justify-center">
                                                        <Phone className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    <span className="font-medium">{customer.phone}</span>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-8 text-green-600" onClick={handleWhatsApp}>
                                                    <MessageSquare className="h-4 w-4 mr-1" />
                                                    Msge
                                                </Button>
                                            </div>
                                        )}

                                        {customer.email && (
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center">
                                                    <Mail className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <span className="font-medium">{customer.email}</span>
                                            </div>
                                        )}

                                        {customer.address && (
                                            <div className="flex items-start gap-3">
                                                <div className="h-8 w-8 rounded bg-orange-50 flex items-center justify-center shrink-0">
                                                    <MapPin className="h-4 w-4 text-orange-600" />
                                                </div>
                                                <div className="text-sm">
                                                    {(customer.address as any).street}, {(customer.address as any).city} <br />
                                                    {(customer.address as any).zip}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* Health & Metrics */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Customer Health</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-muted/40 border text-center">
                                            <div className="text-2xl font-bold">₹{parseFloat(customer.totalSpent || '0').toFixed(0)}</div>
                                            <div className="text-xs text-muted-foreground">Lifetime Spend</div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/40 border text-center">
                                            <div className="text-2xl font-bold">{customer.totalOrders || 0}</div>
                                            <div className="text-xs text-muted-foreground">Total Orders</div>
                                        </div>
                                    </div>

                                    {/* Health Badge */}
                                    {(customer.totalOrders || 0) === 0 ? (
                                        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md border border-yellow-100">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>New Customer - No orders yet</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>Good Standing - Frequent Customer</span>
                                        </div>
                                    )}
                                </div>

                            </TabsContent>

                            {/* TAB: LEDGER */}
                            <TabsContent value="ledger" className="mt-0 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">Transaction History</h3>
                                    <Badge variant="outline">
                                        Balance: ₹{(parseFloat(customer.creditBalance || '0') - parseFloat(customer.walletBalance || '0')).toFixed(2)}
                                    </Badge>
                                </div>

                                {loadingTransactions || loadingAudit ? (
                                    <div className="py-8 text-center text-muted-foreground">Loading history...</div>
                                ) : (
                                    <div className="space-y-4">
                                        {transactions && transactions.length > 0 ? (
                                            transactions.map((tx: any) => (
                                                <div key={tx.id} className="flex items-start gap-4 p-3 rounded-lg border bg-card text-card-foreground">
                                                    <div className={`mt-0.5 rounded-full p-1.5 ${tx.type === 'payment' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {tx.type === 'payment' ? <CheckCircle2 className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium text-sm">{tx.description || tx.reason}</p>
                                                            <span className={`font-bold text-sm ${tx.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                                                                {tx.type === 'payment' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                            <span>{format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}</span>
                                                            <span>Ref: {tx.referenceNumber || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : auditLogs?.data?.length > 0 ? (
                                            <div className="space-y-4">
                                                <div className="text-xs text-center text-muted-foreground mb-2">Showing audit logs (Ledger empty)</div>
                                                {auditLogs.data.map((log: any) => (
                                                    <div key={log.id} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                                                        <History className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                        <div>
                                                            <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {format(new Date(log.createdAt), "PP p")} • by {log.employeeId}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                No transactions found.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB: PREFERENCES */}
                            <TabsContent value="preferences" className="mt-0 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Marketing Communications</Label>
                                            <div className="text-xs text-muted-foreground">Receive updates via SMS/WhatsApp</div>
                                        </div>
                                        <Switch checked={(customer as any).marketingOptIn !== false} disabled />
                                    </div>
                                    <Separator />

                                    {/* Mock Preferences UI - in real app would interact with backend */}
                                    <div className="space-y-3">
                                        <Label>Garment Care Preferences</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Starch Level</Label>
                                                <Select defaultValue={(customer.preferences as any)?.starch || 'medium'} disabled>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="medium">Medium</SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Packaging</Label>
                                                <Select defaultValue={(customer.preferences as any)?.hanger ? 'hanger' : 'fold'} disabled>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="hanger">Hanger</SelectItem>
                                                        <SelectItem value="fold">Folded</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Label className="text-xs text-muted-foreground">Allergy / Special Notes</Label>
                                            <div className="p-3 bg-red-50 text-red-800 text-sm rounded border border-red-100 mt-1 min-h-[60px]">
                                                {(customer.preferences as any)?.allergy || 'No specific allergies notes.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
