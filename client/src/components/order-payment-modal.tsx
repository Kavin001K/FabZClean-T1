import React, { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import {
  IndianRupee,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  Receipt,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface OrderPaymentModalProps {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerId?: string;
    totalAmount: string;
    advancePaid?: string;
    paymentStatus: 'pending' | 'paid' | 'partial' | 'failed' | 'credit';
    items: any[];
  };
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdate?: (orderId: string, paymentData: any) => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'cash' | 'card' | 'upi' | 'bank_transfer';
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'CASH',
    name: 'Cash',
    icon: <Banknote className="w-5 h-5" />,
    type: 'cash'
  },
  {
    id: 'CARD',
    name: 'Credit/Debit Card',
    icon: <CreditCard className="w-5 h-5" />,
    type: 'card'
  },
  {
    id: 'UPI',
    name: 'UPI / PhonePe / GPay',
    icon: <Smartphone className="w-5 h-5" />,
    type: 'upi'
  },
  {
    id: 'NET_BANKING',
    name: 'Net Banking',
    icon: <Banknote className="w-5 h-5" />,
    type: 'bank_transfer'
  },
  {
    id: 'CHEQUE',
    name: 'Cheque',
    icon: <CheckCircle className="w-5 h-5" />,
    type: 'cash'
  },
  {
    id: 'OTHER',
    name: 'Other',
    icon: <Receipt className="w-5 h-5" />,
    type: 'cash'
  }
];

import { Checkbox } from "@/components/ui/checkbox";

export default function OrderPaymentModal({ order, isOpen, onClose, onPaymentUpdate }: OrderPaymentModalProps) {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const [paymentType, setPaymentType] = useState<'advance' | 'delivery' | 'full'>('advance');
  const [selectedMethod, setSelectedMethod] = useState<string>('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [engineResult, setEngineResult] = useState<{
    paymentStatus: string;
    split: { cashApplied: number; walletDebited: number; creditAssigned: number };
    transactionIds: { walletTransactionId?: string | null; creditTransactionId?: string | null };
    creditId?: string | null;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEngineResult(null);
    }
  }, [isOpen, order.id]);

  const [useWallet, setUseWallet] = useState(true); // Default to true based on req
  const [cashCollected, setCashCollected] = useState(''); // New explicit cash input

  const totalAmount = parseFloat(order.totalAmount);
  const advancePaid = parseFloat(order.advancePaid || '0');
  const remainingAmount = Math.max(0, totalAmount - advancePaid);

  const customerId = order.customerId || (order as any).customerId;

  // Fetch wallet and credit summaries (separate sources)
  const { data: creditDetails, isLoading: isLoadingCredit } = useQuery({
    queryKey: ["credits", customerId],
    enabled: isOpen && !!customerId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/credits/${customerId}`);
      const payload = await res.json();
      return payload?.data || null;
    },
  });

  const { data: customerDetails, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ["customer", customerId],
    enabled: isOpen && !!customerId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/customers/${customerId}`);
      const payload = await res.json();
      return payload?.data || null;
    },
  });

  const walletBalance = Number((customerDetails as any)?.walletBalanceCache || 0);
  const outstandingCredit = Number((creditDetails as any)?.summary?.pendingBalance || (customerDetails as any)?.creditBalance || 0);
  const isLoadingWalletBalance = isLoadingCredit || isLoadingCustomer;
  const parsedCash = parseFloat(cashCollected || '0');

  // Auto-calculation magic for Split Payments
  // If useWallet is true, we apply as much wallet as possible to the remaining amount.
  const walletDebitRequested = useWallet ? remainingAmount : 0;
  const walletApplied = useWallet ? Math.min(walletDebitRequested, walletBalance) : 0;

  // The amount still owed after wallet is applied
  const remainingAfterWallet = remainingAmount - walletApplied;

  // The credit required is whatever is not covered by wallet and cash
  const creditRequired = Math.max(0, remainingAfterWallet - parsedCash);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'partial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handlePayment = async () => {
    if (parsedCash < 0 || Number.isNaN(parsedCash)) {
      toast({
        title: "Invalid Amount",
        description: "Enter a valid cash amount.",
        variant: "destructive",
      });
      return;
    }

    if (parsedCash > remainingAfterWallet) {
      toast({
        title: "Invalid Amount",
        description: "Cash amount exceeds remaining amount after wallet debit.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Canonical flow: all payment operations go through checkout engine.
      const res = await apiRequest("POST", `/api/orders/${order.id}/checkout`, {
        customerId,
        cashAmount: parsedCash,
        useWallet,
        walletDebitRequested,
        walletAmount: walletDebitRequested, // legacy compatibility alias
        paymentMethod: selectedMethod,
      });

      const responseData = await res.json();
      const data = responseData?.data || {};
      const updatedOrder = data.order || data;

      setEngineResult({
        paymentStatus: data.paymentStatus || data.payment_status || updatedOrder.paymentStatus || 'pending',
        split: {
          cashApplied: Number(data.split?.cashApplied || 0),
          walletDebited: Number(data.split?.walletDebited || 0),
          creditAssigned: Number(data.split?.creditAssigned || 0),
        },
        transactionIds: data.transactionIds || {},
        creditId: data.creditId || customerId || null,
      });

      onPaymentUpdate?.(order.id, updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["credits", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });

      addNotification({
        type: 'success',
        title: 'Payment Processed Successfully!',
        message: `${formatCurrency(Number(data.split?.cashApplied || 0) + Number(data.split?.walletDebited || 0))} settled`,
        actionUrl: '/orders',
        actionText: 'View Orders'
      });

      toast({
        title: "Payment Successful",
        description: `Payment processed successfully.`,
      });

      // Reset form
      setCashCollected('');
      setTransactionId('');
      setNotes('');

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error?.message || "There was an error processing the payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateQuickAmounts = () => {
    switch (paymentType) {
      case 'advance':
        return [
          { label: '25%', value: (totalAmount * 0.25).toString() },
          { label: '50%', value: (totalAmount * 0.5).toString() },
          { label: '75%', value: (totalAmount * 0.75).toString() }
        ];
      case 'delivery':
      case 'full':
        return [
          { label: 'Remaining Cash', value: remainingAfterWallet.toString() }
        ];
      default:
        return [];
    }
  };

  return (
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh]">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shrink-0 border-b">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Process Payment
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 mt-1">
                Order #{order.orderNumber} • {order.customerName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 pt-4 space-y-6 overflow-y-auto flex-1 scroll-smooth">
          {/* Order Summary */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 bg-slate-50/50">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-bold">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Advance Paid</span>
                <span className="font-medium text-green-600">{formatCurrency(advancePaid)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Remaining Balance</span>
                <span className="font-black text-red-600 text-xl">{formatCurrency(remainingAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge className={cn("px-3 py-1", getPaymentStatusColor(order.paymentStatus))}>
                  {order.paymentStatus.toUpperCase()}
                </Badge>
              </div>
              {customerId && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Wallet Available</span>
                    <span className="font-medium text-emerald-600">
                      {isLoadingWalletBalance ? 'Loading...' : formatCurrency(walletBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Outstanding Credit</span>
                    <span className="font-medium text-amber-600">{formatCurrency(outstandingCredit)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Payment Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentType === 'advance' ? 'default' : 'outline'}
                onClick={() => setPaymentType('advance')}
                disabled={order.paymentStatus === 'paid'}
                className="transition-all"
              >
                Advance
              </Button>
              <Button
                variant={paymentType === 'delivery' ? 'default' : 'outline'}
                onClick={() => setPaymentType('delivery')}
                disabled={remainingAmount <= 0}
                className="transition-all"
              >
                Balance
              </Button>
              <Button
                variant={paymentType === 'full' ? 'default' : 'outline'}
                onClick={() => setPaymentType('full')}
                className="transition-all"
              >
                Full
              </Button>
            </div>
          </div>

          {/* Quick Amount Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Cash Amount</Label>
            <div className="flex gap-2 flex-wrap">
              {calculateQuickAmounts().map((quickAmount, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setCashCollected(quickAmount.value)}
                  className="rounded-full px-4 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {quickAmount.label} ({formatCurrency(parseFloat(quickAmount.value))})
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <Button
                  key={method.id}
                  variant={selectedMethod === method.id ? 'default' : 'outline'}
                  onClick={() => setSelectedMethod(method.id)}
                  className="justify-start h-12 shadow-sm transition-all"
                >
                  {method.icon}
                  <span className="ml-2 font-medium">{method.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Cash Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="cashCollected" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Cash / Manual Payment Collected
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="cashCollected"
                type="number"
                placeholder="0.00"
                value={cashCollected}
                onChange={(e) => setCashCollected(e.target.value)}
                className="pl-10 h-12 text-lg font-bold"
                max={remainingAfterWallet}
              />
            </div>
            {parsedCash > remainingAfterWallet && (
              <p className="text-sm text-red-600 font-medium">
                Amount cannot exceed remaining balance after wallet.
              </p>
            )}
          </div>

          {/* Transaction ID (for non-cash payments) */}
          {selectedMethod !== 'CASH' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="Enter transaction reference"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="h-10"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Split Payment / Wallet Section */}
          <div className="space-y-4 pt-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Wallet & Credit Split</Label>

            <div className={cn(
              "flex items-start space-x-3 p-5 rounded-2xl border-2 transition-all duration-300",
              useWallet
                ? "bg-emerald-50/50 border-emerald-500/20 shadow-sm dark:bg-emerald-950/20 dark:border-emerald-500/10"
                : "bg-slate-50 border-transparent dark:bg-slate-900"
            )}>
              <div className="relative flex items-center h-6">
                <Checkbox
                  id="useWallet"
                  checked={useWallet}
                  onCheckedChange={(c) => setUseWallet(!!c)}
                  disabled={walletBalance <= 0 || !customerId}
                  className="w-5 h-5 border-2"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="useWallet" className="text-lg font-bold cursor-pointer block">
                  Apply Wallet Balance
                </Label>
                <div className="text-sm text-muted-foreground mt-1 font-medium">
                  Available: <span className="text-emerald-600 dark:text-emerald-400">
                    {isLoadingWalletBalance ? 'Loading...' : formatCurrency(walletBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {useWallet && walletApplied > 0 && (
                <div className="bg-emerald-50 p-5 rounded-2xl border-l-4 border-emerald-500 flex flex-col justify-center dark:bg-emerald-950/30">
                  <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Wallet Deduction</span>
                  <span className="font-black text-emerald-800 dark:text-emerald-300 text-2xl">-{formatCurrency(walletApplied)}</span>
                </div>
              )}

              {parsedCash > 0 && (
                <div className="bg-blue-50 p-5 rounded-2xl border-l-4 border-blue-500 flex flex-col justify-center dark:bg-blue-950/30">
                  <span className="text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Received Now</span>
                  <span className="font-black text-blue-800 dark:text-blue-300 text-2xl">{formatCurrency(parsedCash)}</span>
                </div>
              )}

              {creditRequired > 0 && (
                <div className={cn(
                  "p-5 rounded-2xl border-l-4 flex flex-col justify-center",
                  useWallet && walletApplied > 0 && parsedCash > 0 ? "sm:col-span-2" : "",
                  "bg-orange-50 border-orange-500 dark:bg-orange-950/30 dark:border-orange-500"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-orange-800 dark:text-orange-400 text-xs font-bold uppercase tracking-widest">Auto-Credit (Added to Dues)</span>
                    <Badge variant="outline" className="text-[10px] bg-white text-orange-700 border-orange-200 uppercase font-black px-2">Pending</Badge>
                  </div>
                  <span className="font-black text-orange-900 dark:text-orange-300 text-2xl">{formatCurrency(creditRequired)}</span>
                </div>
              )}
            </div>
          </div>

          {engineResult && (
            <Card className="mt-6 border-emerald-200 bg-emerald-50/50 shadow-inner">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Status</span>
                  <Badge className="bg-emerald-600 font-bold px-3 uppercase">{engineResult.paymentStatus}</Badge>
                </div>
                <div className="flex justify-between border-t border-emerald-100 pt-2">
                  <span className="text-muted-foreground">Cash Applied</span>
                  <span>{formatCurrency(engineResult.split.cashApplied)}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-100 pt-2">
                  <span className="text-muted-foreground">Wallet Debited</span>
                  <span>{formatCurrency(engineResult.split.walletDebited)}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-100 pt-2 font-bold text-orange-700">
                  <span>Credit Assigned</span>
                  <span>{formatCurrency(engineResult.split.creditAssigned)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extra padding at bottom of scroll to ensure buttons don't block last element */}
          <div className="h-10 shrink-0" />
        </div>

        <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-900 border-t shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="flex w-full gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => onClose()} className="h-12 px-8 font-semibold flex-1 sm:flex-none border-2">
              Cancel
            </Button>
            <Button
              disabled={isProcessing || (parsedCash > 0 && selectedMethod === 'OTHER' && !transactionId)}
              onClick={handlePayment}
              className="h-12 gap-2 px-10 font-bold flex-1 sm:flex-none bg-primary hover:bg-primary/95 shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[0] transition-all"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Payment
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
