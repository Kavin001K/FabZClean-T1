import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { History, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { InventoryItem } from '@/lib/data-service';

interface AuditLogEntry {
    id: string;
    date: string;
    action: 'purchase' | 'usage' | 'adjustment' | 'damage';
    quantityChange: number;
    reason: string;
    user: string;
}

// Mock data generator for demonstration
const generateMockAuditLog = (itemId: string): AuditLogEntry[] => {
    return [
        {
            id: '1',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            action: 'purchase',
            quantityChange: 50,
            reason: 'Regular Restock',
            user: 'Admin',
        },
        {
            id: '2',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
            action: 'usage',
            quantityChange: -5,
            reason: 'Order #1024 Production',
            user: 'System',
        },
        {
            id: '3',
            date: new Date().toISOString(), // Today
            action: 'damage',
            quantityChange: -1,
            reason: 'Spillage in storage',
            user: 'Manager',
        },
    ];
};

interface InventoryAuditProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItem: InventoryItem | null;
}

export const InventoryAudit: React.FC<InventoryAuditProps> = ({
    isOpen,
    onClose,
    selectedItem,
}) => {
    const logs = selectedItem ? generateMockAuditLog(selectedItem.id) : [];

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'purchase':
                return <ArrowUpRight className="h-4 w-4 text-green-500" />;
            case 'usage':
                return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
            case 'damage':
            case 'adjustment':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <History className="h-4 w-4" />;
        }
    };

    const getBadgeVariant = (action: string) => {
        switch (action) {
            case 'purchase':
                return 'success'; // You might need to define this variant or use standard ones
            case 'usage':
                return 'secondary';
            case 'damage':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Audit History
                    </SheetTitle>
                    <SheetDescription>
                        Transaction history for <span className="font-semibold text-foreground">{selectedItem?.name}</span>
                    </SheetDescription>
                </SheetHeader>

                <Separator className="my-6" />

                <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-2 border-b">
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div>
                                    <p className="text-xs text-muted-foreground">Current Stock</p>
                                    <p className="text-2xl font-bold">{selectedItem?.stock} {selectedItem?.unitType || 'units'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Value</p>
                                    <p className="text-2xl font-bold">₹{((selectedItem?.price || 0) * (selectedItem?.stock || 0)).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="flex gap-4 relative pl-4 border-l-2 border-muted hover:border-primary transition-colors py-2">
                                    <div className="absolute -left-[9px] top-3 h-4 w-4 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getActionIcon(log.action)}
                                                <span className="font-medium capitalize">{log.action}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(log.date), 'MMM d, h:mm a')}
                                            </span>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            {log.reason}
                                        </p>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <span>by {log.user}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-center">
                                        <Badge variant={log.quantityChange > 0 ? "default" : "secondary"} className={log.quantityChange < 0 ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-green-100 text-green-700 hover:bg-green-100"}>
                                            {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
