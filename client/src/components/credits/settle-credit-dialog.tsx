import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/data-service";
import { Loader2, AlertCircle } from "lucide-react";

interface SettleCreditDialogProps {
    order: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettleCreditDialog({ order, open, onOpenChange }: SettleCreditDialogProps) {
    const { toast } = useToast();
    const [amountPaid, setAmountPaid] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("");

    const totalAmount = Number(order?.totalAmount || 0);
    const alreadyPaid = Number(order?.amountPaid || 0);
    const remainingBalance = totalAmount - alreadyPaid;

    // Real-time calculation logic
    const paymentValue = Number(amountPaid) || 0;
    const balanceAfterPayment = remainingBalance - paymentValue;
    const isOverpaying = balanceAfterPayment < -0.01;

    const settleMutation = useMutation({
        mutationFn: async () => {
            // API expects PATCH /api/credits/:id/settle based on our implementation
            return await apiRequest("PATCH", `/api/credits/${order.id}/settle`, {
                amountPaid: paymentValue,
                paymentMethod,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            toast({ title: "Success", description: "Payment recorded successfully" });
            onOpenChange(false);
            setAmountPaid("");
            setPaymentMethod("");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to record payment",
                variant: "destructive"
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settle Credit - Order #{order?.orderNumber}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="rounded-lg bg-muted p-3 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Total Bill:</span>
                            <span className="font-medium">{formatCurrency(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Previously Paid:</span>
                            <span>{formatCurrency(alreadyPaid)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-1 mt-1">
                            <span>Current Balance:</span>
                            <span>{formatCurrency(remainingBalance)}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Payment Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount to pay"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            className={isOverpaying ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {isOverpaying && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Amount exceeds balance
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="upi">UPI / Scanner</SelectItem>
                                <SelectItem value="wallet">Customer Wallet</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border p-3 bg-slate-50">
                        <div className="flex justify-between text-sm font-semibold">
                            <span>Remaining After Payment:</span>
                            <span className={balanceAfterPayment <= 0.01 && balanceAfterPayment >= -0.01 ? "text-green-600" : ""}>
                                {formatCurrency(Math.max(0, balanceAfterPayment))}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={() => settleMutation.mutate()}
                        disabled={!amountPaid || !paymentMethod || isOverpaying || settleMutation.isPending}
                    >
                        {settleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
