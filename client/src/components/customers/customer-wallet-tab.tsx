import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Wallet,
    Plus,
    Minus,
    Loader2,
    TrendingUp,
    TrendingDown,
    History,
    RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/data-service';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';

interface CustomerWalletTabProps {
    customer: any;
}

export function CustomerWalletTab({ customer }: CustomerWalletTabProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { employee } = useAuth();
    const [creditAmount, setCreditAmount] = useState('');
    const [creditNote, setCreditNote] = useState('');
    const [creditAction, setCreditAction] = useState<'credit' | 'debit'>('credit');

    const canAdjustCredit = employee?.role && ['admin', 'franchise_manager'].includes(employee.role);

    // Fetch credit history
    const { data: historyResponse, isLoading: isLoadingHistory, refetch } = useQuery({
        queryKey: ['customer-credit-history', customer?.id],
        queryFn: async () => {
            if (!customer?.id) return [];
            const token = localStorage.getItem('employee_token');
            const res = await fetch(`/api/credits/history/${customer.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch history');
            return res.json();
        },
        enabled: !!customer?.id
    });
    const creditHistory = historyResponse?.data || historyResponse || [];

    // Adjust credit mutation
    const adjustMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('employee_token');
            const amount = parseFloat(creditAmount);

            const res = await fetch(`/api/credits/${customer.id}/adjust`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: creditAction === 'credit' ? amount : -amount,
                    reason: creditAction === 'credit' ? 'goodwill' : 'correction',
                    notes: creditNote || `Manual ${creditAction === 'credit' ? 'credit' : 'debit'} adjustment`
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to adjust credit');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer-credit-history', customer?.id] });
            toast({
                title: 'Success',
                description: `Credit ${creditAction === 'credit' ? 'added' : 'deducted'} successfully`
            });
            setCreditAmount('');
            setCreditNote('');
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to adjust credit',
                variant: 'destructive'
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(creditAmount);

        if (!creditAmount || isNaN(amount) || amount <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a valid positive amount', variant: 'destructive' });
            return;
        }

        adjustMutation.mutate();
    };

    const currentBalance = parseFloat(customer?.creditBalance || '0');

    const getTypeStyles = (type: string, amount: number) => {
        if (type === 'deposit' || type === 'payment' || (type === 'adjustment' && amount < 0)) {
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        }
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    };

    return (
        <div className="space-y-6">
            {/* Balance & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Balance Card */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                        <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                        Current Balance
                    </span>
                    <span className={`text-4xl font-bold mt-2 ${currentBalance > 0 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                        {formatCurrency(currentBalance)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-2">
                        {currentBalance > 0 ? 'Outstanding credit due' : 'Available for next order'}
                    </p>
                </div>

                {/* Adjust Balance Form */}
                {canAdjustCredit && (
                    <div className="md:col-span-2 border rounded-xl p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Adjust Wallet Balance
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label>Action</Label>
                                    <div className="flex gap-2 mt-1.5">
                                        <Button
                                            type="button"
                                            variant={creditAction === 'credit' ? 'default' : 'outline'}
                                            className="flex-1"
                                            onClick={() => setCreditAction('credit')}
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Add Credit
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={creditAction === 'debit' ? 'destructive' : 'outline'}
                                            className="flex-1"
                                            onClick={() => setCreditAction('debit')}
                                        >
                                            <Minus className="w-4 h-4 mr-1" /> Deduct
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <Label>Amount (₹)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="mt-1.5"
                                        min="0"
                                        step="0.01"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Reason / Note</Label>
                                <Textarea
                                    placeholder="e.g., Refund for Order #123, Goodwill credit..."
                                    className="mt-1.5 h-16"
                                    value={creditNote}
                                    onChange={(e) => setCreditNote(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={adjustMutation.isPending || !creditAmount}
                                className="w-full"
                            >
                                {adjustMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Confirm {creditAction === 'credit' ? 'Credit' : 'Deduction'}
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                )}

                {!canAdjustCredit && (
                    <div className="md:col-span-2 border rounded-xl p-6 flex items-center justify-center text-muted-foreground">
                        <p>Credit adjustments require manager or admin access.</p>
                    </div>
                )}
            </div>

            {/* Transaction History */}
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        Transaction History
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingHistory ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading history...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : creditHistory.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    No transaction history yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            creditHistory.map((item: any) => {
                                const amount = parseFloat(item.amount || '0');
                                const isPositive = item.type === 'credit' || item.type === 'deposit' || amount > 0;

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-sm">
                                            <div>{format(new Date(item.createdAt), 'MMM d, yyyy')}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(item.createdAt), 'h:mm a')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getTypeStyles(item.type, amount)}>
                                                {item.type?.toUpperCase() || 'CREDIT'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[200px] truncate">
                                            {item.description || item.referenceId || 'Credit adjustment'}
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {isPositive ? (
                                                    <TrendingUp className="w-3 h-3" />
                                                ) : (
                                                    <TrendingDown className="w-3 h-3" />
                                                )}
                                                {isPositive ? '+' : '-'}{formatCurrency(Math.abs(amount))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            {formatCurrency(parseFloat(item.balanceAfter || '0'))}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default CustomerWalletTab;
