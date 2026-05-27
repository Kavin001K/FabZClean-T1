import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/data";
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, Receipt, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { fetchWalletHistory, WALLET_QUERY_KEYS } from '@/lib/wallet-service';
import { formatPaymentMethodLabel, getLedgerDirection } from '@/lib/wallet-ledger';

interface CustomerWalletHistoryProps {
    customerId: string;
}

export function CustomerWalletHistory({ customerId }: CustomerWalletHistoryProps) {
    const { data: transactions = [], isLoading, error } = useQuery({
        queryKey: WALLET_QUERY_KEYS.history(customerId),
        queryFn: () => fetchWalletHistory(customerId),
        enabled: !!customerId,
    });

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
                <CardDescription>Prepaid wallet credits and debits from wallet_transactions</CardDescription>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                        No wallet transactions found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((tx) => {
                            const { isCredit, absoluteAmount } = getLedgerDirection(tx);
                            const formattedType = (tx.transactionType || tx.type || 'UNKNOWN').replace(/_/g, ' ');
                            const when = tx.createdAt || tx.transactionDate;

                            return (
                                <div key={tx.id || tx.transactionId || String(when)} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {isCredit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm capitalize">{formattedType}</span>
                                                {tx.paymentMethod && (
                                                    <Badge variant="outline" className="text-[10px] h-5">
                                                        {formatPaymentMethodLabel(tx.paymentMethod)}
                                                    </Badge>
                                                )}
                                                {tx.orderId && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 flex gap-1 items-center">
                                                        <Receipt className="w-3 h-3" /> Order
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex gap-2">
                                                <span>{when ? format(new Date(when), 'MMM d, yyyy h:mm a') : 'Unknown date'}</span>
                                                {tx.recordedByName && <span>• by {tx.recordedByName}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {isCredit ? '+' : '-'}{formatCurrency(absoluteAmount)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Balance: {formatCurrency(Number(tx.balanceAfter ?? 0))}
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
