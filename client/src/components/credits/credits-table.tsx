import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/data-service";
import { AlertCircle, CreditCard, User, History } from "lucide-react";
import { SettleCreditDialog } from "./settle-credit-dialog";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/data-service";

interface CreditsTableProps {
    customers: any[];
    isLoading: boolean;
    onViewCustomer: (customerId: string) => void;
}

export function CreditsTable({ customers, isLoading, onViewCustomer }: CreditsTableProps) {
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isSettleOpen, setIsSettleOpen] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    // We need to fetch UNPAID orders for the customer when they want to settle
    const { data: unpaidOrders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ["unpaid-orders", selectedCustomerId],
        queryFn: () => ordersApi.getAll({
            customerId: selectedCustomerId!,
            paymentStatus: "credit"
        }),
        enabled: !!selectedCustomerId,
    });

    const handleSettleClick = (customerId: string) => {
        setSelectedCustomerId(customerId);
        // In a real implementation, we might want to show a list of unpaid orders first.
        // For now, if there's only one or we just want to trigger the dialog for the "oldest" credit order:
        if (unpaidOrders.length > 0) {
            setSelectedOrder(unpaidOrders[0]);
            setIsSettleOpen(true);
        } else {
            // If no orders found yet, we might need to wait or show a message
        }
    };

    React.useEffect(() => {
        if (!isLoadingOrders && selectedCustomerId && unpaidOrders.length > 0 && !isSettleOpen) {
            setSelectedOrder(unpaidOrders[0]);
            setIsSettleOpen(true);
        }
    }, [unpaidOrders, isLoadingOrders, selectedCustomerId]);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        <TableHead>Customer Details</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead className="text-right">Total Orders</TableHead>
                        <TableHead className="text-right">Outstanding Balance</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">Loading balances...</TableCell>
                        </TableRow>
                    ) : customers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                No customers with outstanding balance.
                            </TableCell>
                        </TableRow>
                    ) : (
                        customers.map((c: any) => (
                            <TableRow key={c.id}>
                                <TableCell>
                                    <div
                                        className="font-medium text-base text-primary hover:underline cursor-pointer flex items-center gap-2"
                                        onClick={() => onViewCustomer(c.id)}
                                    >
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {c.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground ml-6">{c.phone}</div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <History className="h-3 w-3" />
                                        {c.lastOrder ? formatDate(c.lastOrder) : "N/A"}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {c.totalOrders}
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`text-lg font-bold ${Number(c.creditBalance) > 5000 ? 'text-rose-600' : 'text-orange-600'}`}>
                                        {formatCurrency(c.creditBalance)}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                        onClick={() => handleSettleClick(c.id)}
                                    >
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Pay Bill
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {selectedOrder && (
                <SettleCreditDialog
                    order={selectedOrder}
                    open={isSettleOpen}
                    onOpenChange={(open) => {
                        setIsSettleOpen(open);
                        if (!open) {
                            setSelectedCustomerId(null);
                            setSelectedOrder(null);
                        }
                    }}
                />
            )}
        </div>
    );
}
