import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/data";
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, Receipt, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface CustomerWalletHistoryProps {
    customerId: string;
}

export function CustomerWalletHistory({ customerId }: CustomerWalletHistoryProps) {
    const { data: historyResponse, isLoading, error } = useQuery({
        queryKey: ['customers', customerId, 'wallet-history'],
        enabled: !!customerId,
    });

    const transactions = (historyResponse as any)?.data || [];

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 flex justify-center items-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading wallet history...</span>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center text-red-500 gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>Failed to load wallet ledger history.</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Wallet Audit Ledger</CardTitle>
                <CardDescription>Comprehensive log of all credit additions and deductions</CardDescription>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                        No wallet transactions found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((tx: any) => {
                            // Standard mapping logic based on our enum and plan.
                            const isCreditIn = tx.type === 'CREDIT_IN' || tx.type === 'credit' || parseFloat(tx.amount) > 0;
                            const formattedType = (tx.type || 'UNKNOWN').replace('_', ' ');

                            return (
                                <div key={tx.id || tx.transactionDate} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${isCreditIn ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {isCreditIn ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm capitalize">{formattedType}</span>
                                                {tx.paymentMethod && (
                                                    <Badge variant="outline" className="text-[10px] h-5">{tx.paymentMethod}</Badge>
                                                )}
                                                {tx.orderId && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 flex gap-1 items-center">
                                                        <Receipt className="w-3 h-3" /> Order Payment
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex gap-2">
                                                <span>{tx.transactionDate ? format(new Date(tx.transactionDate), 'MMM d, yyyy h:mm a') : 'Unknown Date'}</span>
                                                {tx.recordedByName && <span>• by {tx.recordedByName}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${isCreditIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {isCreditIn ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(tx.amount || 0)))}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Balance: {formatCurrency(parseFloat(tx.balanceAfter || 0))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
