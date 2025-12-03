import React, { useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
  DollarSign,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  AlertCircle,
  Receipt,
  Calculator
} from "lucide-react";
import { formatCurrency } from "@/lib/data";

interface OrderPaymentModalProps {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: string;
    advancePaid?: string;
    paymentStatus: 'pending' | 'paid' | 'partial' | 'failed';
    items: any[];
  };
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
    id: 'cash',
    name: 'Cash',
    icon: <Banknote className="w-5 h-5" />,
    type: 'cash'
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: <CreditCard className="w-5 h-5" />,
    type: 'card'
  },
  {
    id: 'upi',
    name: 'UPI',
    icon: <Smartphone className="w-5 h-5" />,
    type: 'upi'
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    icon: <Banknote className="w-5 h-5" />,
    type: 'bank_transfer'
  }
];

export default function OrderPaymentModal({ order, onPaymentUpdate }: OrderPaymentModalProps) {
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'advance' | 'delivery' | 'full'>('advance');
  const [selectedMethod, setSelectedMethod] = useState<string>('cash');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = parseFloat(order.totalAmount);
  const advancePaid = parseFloat(order.advancePaid || '0');
  const remainingAmount = totalAmount - advancePaid;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'partial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    if (paymentType === 'advance' && parseFloat(amount) >= totalAmount) {
      toast({
        title: "Invalid Amount",
        description: "Advance payment cannot be equal to or greater than total amount.",
        variant: "destructive",
      });
      return;
    }

    if (paymentType === 'delivery' && parseFloat(amount) > remainingAmount) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount cannot exceed remaining balance.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Update payment status
      let newPaymentStatus: string;
      if (paymentType === 'full' || (paymentType === 'delivery' && parseFloat(amount) >= remainingAmount)) {
        newPaymentStatus = 'paid';
      } else if (paymentType === 'advance' || (paymentType === 'delivery' && parseFloat(amount) < remainingAmount)) {
        newPaymentStatus = 'partial';
      } else {
        newPaymentStatus = 'partial';
      }

      const updatedAdvancePaid = paymentType === 'advance' ?
        (advancePaid + parseFloat(amount)).toString() :
        order.advancePaid;

      // Call API
      await apiRequest("PUT", `/api/orders/${order.id}`, {
        paymentStatus: newPaymentStatus,
        advancePaid: updatedAdvancePaid
      });

      const updatedOrder = {
        ...order,
        advancePaid: updatedAdvancePaid,
        paymentStatus: newPaymentStatus
      };

      onPaymentUpdate?.(order.id, updatedOrder);

      addNotification({
        type: 'success',
        title: 'Payment Processed Successfully!',
        message: `${formatCurrency(parseFloat(amount))} ${paymentType} payment received via ${paymentMethods.find(m => m.id === selectedMethod)?.name}`,
        actionUrl: '/orders',
        actionText: 'View Orders'
      });

      toast({
        title: "Payment Successful",
        description: `${formatCurrency(parseFloat(amount))} payment processed successfully.`,
      });

      // Reset form
      setAmount('');
      setTransactionId('');
      setNotes('');
      setIsOpen(false);

    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing the payment. Please try again.",
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
        return [
          { label: 'Remaining', value: remainingAmount.toString() },
          { label: '50% of Remaining', value: (remainingAmount * 0.5).toString() }
        ];
      case 'full':
        return [
          { label: 'Full Amount', value: totalAmount.toString() }
        ];
      default:
        return [];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="w-4 h-4 mr-2" />
          Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment for Order {order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Process payment for order #{order.orderNumber}. Choose payment type and method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                Delivery Payment
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
            <Label>Quick Amount Selection</Label>
            <div className="flex gap-2 flex-wrap">
              {calculateQuickAmounts().map((quickAmount, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.value)}
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

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount {paymentType === 'advance' ? '(Advance)' : paymentType === 'delivery' ? '(Delivery)' : '(Full)'}
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                max={paymentType === 'delivery' ? remainingAmount : totalAmount}
              />
            </div>
            {paymentType === 'delivery' && parseFloat(amount) > remainingAmount && (
              <p className="text-sm text-red-600">
                Amount cannot exceed remaining balance of {formatCurrency(remainingAmount)}
              </p>
            )}
          </div>

          {/* Transaction ID (for non-cash payments) */}
          {selectedMethod !== 'cash' && (
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

          {/* Payment Summary */}
          {amount && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4" />
                  <span className="font-medium">Payment Summary</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Payment Amount:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="font-medium">{paymentMethods.find(m => m.id === selectedMethod)?.name}</span>
                  </div>
                  {paymentType === 'advance' && (
                    <div className="flex justify-between">
                      <span>New Balance:</span>
                      <span className="font-medium">{formatCurrency(remainingAmount - parseFloat(amount))}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handlePayment}
              className="flex-1"
              disabled={isProcessing || !amount}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
