import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Wallet, RefreshCw, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import {
  invalidateWalletQueries,
  rechargeWallet,
  WALLET_PAYMENT_METHODS,
  type WalletRechargeResult,
} from "@/lib/wallet-service";
import { printWalletTopUpReceipt } from "@/lib/wallet-receipt";
import { cn } from "@/lib/utils";

interface WalletRechargeModalProps {
    customerId: string;
    customerName: string;
    customerPhone?: string | null;
    isOpen: boolean;
    onClose: () => void;
    onRechargeSuccess?: (newBalance: number) => void;
}

const RECHARGE_QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export function WalletRechargeModal({
    customerId,
    customerName,
    customerPhone,
    isOpen,
    onClose,
    onRechargeSuccess,
}: WalletRechargeModalProps) {
    const { toast } = useToast();
    const { employee } = useAuth();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('CASH');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const showReceiptToast = (result: WalletRechargeResult, parsedAmount: number) => {
        const newBalance = Number(result.newBalance ?? 0);
        toast({
            title: "Wallet recharged",
            description: `Added ${formatCurrency(parsedAmount)} to ${customerName}'s wallet.`,
            action: (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        printWalletTopUpReceipt({
                            customer: { name: customerName, phone: customerPhone },
                            amount: parsedAmount,
                            paymentMethod: result.paymentMethod || selectedMethod,
                            referenceNumber: referenceNumber || undefined,
                            notes: notes || undefined,
                            balanceBefore: result.balanceBefore,
                            balanceAfter: newBalance,
                            transactionId: result.transactionId || result.id,
                            entryNo: result.entryNo,
                            staffName: employee?.fullName || employee?.username,
                        });
                    }}
                >
                    Print receipt
                </Button>
            ),
        });
    };

    const handleRecharge = async () => {
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid amount to recharge.",
                variant: "destructive",
            });
            return;
        }

        if (!notes.trim()) {
            toast({
                title: "Note required",
                description: "Add an internal note for this recharge.",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);
        try {
            const result = await rechargeWallet({
                customerId,
                amount: parsedAmount,
                paymentMethod: selectedMethod,
                referenceNumber: referenceNumber.trim() || undefined,
                notes: notes.trim(),
            });

            invalidateWalletQueries(queryClient, customerId);
            showReceiptToast(result, parsedAmount);

            if (onRechargeSuccess && result.newBalance !== undefined) {
                onRechargeSuccess(Number(result.newBalance));
            }

            setAmount('');
            setReferenceNumber('');
            setNotes('');
            onClose();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to process wallet recharge.";
            toast({
                title: "Recharge Failed",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                        Recharge Customer Wallet
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div className="bg-slate-50 p-3 rounded-lg border dark:bg-slate-900">
                        <span className="text-sm text-muted-foreground">Customer: </span>
                        <span className="font-semibold">{customerName}</span>
                    </div>

                    <div className="space-y-3">
                        <Label>Recharge Amount</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">Rs. </span>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-8 !text-lg !font-bold"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap pt-1">
                            {RECHARGE_QUICK_AMOUNTS.map((qAmount) => (
                                <Button
                                    key={qAmount}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAmount(qAmount.toString())}
                                    className="bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                                >
                                    +{formatCurrency(qAmount)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Payment Method</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {WALLET_PAYMENT_METHODS.map((method) => (
                                <Button
                                    key={method.id}
                                    variant={selectedMethod === method.id ? 'default' : 'outline'}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={cn("justify-start")}
                                >
                                    <span>{method.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Reference (optional)</Label>
                        <Input
                            placeholder="Transaction ID / receipt #"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Internal note (required)</Label>
                        <Input
                            placeholder="Additional context..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                        <Button
                            onClick={handleRecharge}
                            disabled={isProcessing || !amount || parseFloat(amount) <= 0 || !notes.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
                        >
                            {isProcessing ? (
                                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                            ) : (
                                <><CheckCircle className="mr-2 h-4 w-4" /> Add Funds</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
