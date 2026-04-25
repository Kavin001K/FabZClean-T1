import React, { useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Smartphone, CreditCard, Banknote, RefreshCw, CheckCircle, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/data";

interface WalletRechargeModalProps {
    customerId: string;
    customerName: string;
    isOpen: boolean;
    onClose: () => void;
    onRechargeSuccess?: (newBalance: number) => void;
}

const paymentMethods = [
    { id: 'CASH', name: 'Cash', icon: <Banknote className="w-5 h-5" /> },
    { id: 'UPI', name: 'UPI', icon: <Smartphone className="w-5 h-5" /> },
    { id: 'CARD', name: 'Card', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: <Receipt className="w-5 h-5" /> }
];

export function WalletRechargeModal({ customerId, customerName, isOpen, onClose, onRechargeSuccess }: WalletRechargeModalProps) {
    const { toast } = useToast();
    const [amount, setAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('CASH');
    const [isProcessing, setIsProcessing] = useState(false);

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

        setIsProcessing(true);
        try {
            const res = await apiRequest("POST", `/api/wallet/recharge`, {
                customerId,
                amount: parsedAmount,
                paymentMethod: selectedMethod
            });

            const responseData = await res.json();

            toast({
                title: "Recharge Successful",
                description: `Successfully added ${formatCurrency(parsedAmount)} to ${customerName}'s wallet.`,
            });

            if (onRechargeSuccess && responseData.data?.newBalance !== undefined) {
                onRechargeSuccess(responseData.data.newBalance);
            }

            setAmount('');
            onClose();
        } catch (error: any) {
            toast({
                title: "Recharge Failed",
                description: error.message || "Failed to process wallet recharge.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const quickAmounts = [500, 1000, 2000, 5000];

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
                    <div className="bg-slate-50 p-3 rounded-lg border">
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
                            {quickAmounts.map((qAmount) => (
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

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                        <Button
                            onClick={handleRecharge}
                            disabled={isProcessing || !amount || parseFloat(amount) <= 0}
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
