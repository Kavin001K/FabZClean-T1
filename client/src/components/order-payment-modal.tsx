import React, { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0">
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

        <div className="p-6 pt-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                <span className="text-muted-foreground">Remaining Balance</span>
                <span className="font-bold text-red-600">{formatCurrency(remainingAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
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
            <Label>Payment Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentType === 'advance' ? 'default' : 'outline'}
                onClick={() => setPaymentType('advance')}
                disabled={order.paymentStatus === 'paid'}
              >
                Advance Payment
              </Button>
              <Button
                variant={paymentType === 'delivery' ? 'default' : 'outline'}
                onClick={() => setPaymentType('delivery')}
                disabled={remainingAmount <= 0}
              >
                Balance Payment
              </Button>
              <Button
                variant={paymentType === 'full' ? 'default' : 'outline'}
                onClick={() => setPaymentType('full')}
              >
                Full Payment
              </Button>
            </div>
          </div>

          {/* Quick Amount Selection */}
          <div className="space-y-3">
            <Label>Quick Cash Amount</Label>
            <div className="flex gap-2 flex-wrap">
              {calculateQuickAmounts().map((quickAmount, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setCashCollected(quickAmount.value)}
                >
                  {quickAmount.label} ({formatCurrency(parseFloat(quickAmount.value))})
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <Button
                  key={method.id}
                  variant={selectedMethod === method.id ? 'default' : 'outline'}
                  onClick={() => setSelectedMethod(method.id)}
                  className="justify-start"
                >
                  {method.icon}
                  <span className="ml-2">{method.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Cash Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="cashCollected">
              Cash / Manual Payment Collected
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="cashCollected"
                type="number"
                placeholder="0.00"
                value={cashCollected}
                onChange={(e) => setCashCollected(e.target.value)}
                className="pl-10"
                max={remainingAfterWallet}
              />
            </div>
            {parsedCash > remainingAfterWallet && (
              <p className="text-sm text-red-600">
                Amount cannot exceed remaining balance after wallet.
              </p>
            )}
          </div>

          {/* Transaction ID (for non-cash payments) */}
          {selectedMethod !== 'CASH' && (
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="Enter transaction reference"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
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
            />
          </div>

          {/* Split Payment / Wallet Section */}
          <div className="space-y-3 pt-2">
            <Label className="text-base">Wallet & Credit Split</Label>

            <div className={cn(
              "flex items-start space-x-3 p-4 rounded-xl border transition-all",
              useWallet
                ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                : "bg-slate-50 border-border dark:bg-slate-900"
            )}>
                <Checkbox
                  id="useWallet"
                  checked={useWallet}
                  onCheckedChange={(c) => setUseWallet(!!c)}
                  disabled={walletBalance <= 0 || !customerId}
                  className="mt-1"
                />
              <div className="flex-1">
                <Label htmlFor="useWallet" className="text-base font-medium cursor-pointer">
                  Apply Wallet Balance
                </Label>
                <div className="text-sm text-muted-foreground mt-1">
                  Available: <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {isLoadingWalletBalance ? 'Loading...' : formatCurrency(walletBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {useWallet && walletApplied > 0 && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center dark:bg-emerald-950/30 dark:border-emerald-900/50">
                  <span className="text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-1">Wallet Deduction</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 text-xl">-{formatCurrency(walletApplied)}</span>
                </div>
              )}

              {parsedCash > 0 && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col justify-center dark:bg-amber-950/30 dark:border-amber-900/50">
                  <span className="text-amber-800 dark:text-amber-400 text-sm font-medium mb-1">Received Now</span>
                  <span className="font-bold text-amber-900 dark:text-amber-300 text-xl">{formatCurrency(parsedCash)}</span>
                </div>
              )}

              {creditRequired > 0 && (
                <div className={cn(
                  "p-4 rounded-xl border flex flex-col justify-center",
                  useWallet && walletApplied > 0 && parsedCash > 0 ? "sm:col-span-2" : "",
                  "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-800 dark:text-red-400 text-sm font-medium">Auto-Credit (Added to Dues)</span>
                    <Badge variant="outline" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200">Pending</Badge>
                  </div>
                  <span className="font-bold text-red-900 dark:text-red-300 text-xl">{formatCurrency(creditRequired)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mt-8">
            <Button variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button
              disabled={isProcessing || (parsedCash > 0 && selectedMethod === 'OTHER' && !transactionId)}
              onClick={handlePayment}
              className="gap-2 px-8"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Complete Payment
                </>
              )}
            </Button>
          </div>

          {engineResult && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Engine Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Final Status</span>
                  <Badge>{engineResult.paymentStatus}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Cash Applied</span>
                  <span>{formatCurrency(engineResult.split.cashApplied)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wallet Debited</span>
                  <span>{formatCurrency(engineResult.split.walletDebited)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit Assigned</span>
                  <span>{formatCurrency(engineResult.split.creditAssigned)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit ID</span>
                  <span className="font-mono text-xs">{engineResult.creditId || customerId || "-"}</span>
                </div>
                {(engineResult.transactionIds.walletTransactionId || engineResult.transactionIds.creditTransactionId) && (
                  <>
                    <Separator />
                    {engineResult.transactionIds.walletTransactionId && (
                      <div className="flex justify-between">
                        <span>Wallet Txn ID</span>
                        <span className="font-mono text-xs">{engineResult.transactionIds.walletTransactionId}</span>
                      </div>
                    )}
                    {engineResult.transactionIds.creditTransactionId && (
                      <div className="flex justify-between">
                        <span>Credit Txn ID</span>
                        <span className="font-mono text-xs">{engineResult.transactionIds.creditTransactionId}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
