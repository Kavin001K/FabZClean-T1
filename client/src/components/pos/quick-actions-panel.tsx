import React from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    FileText,
    Truck,
    Ticket,
    PlusSquare,
    Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Cart } from '@/lib/cart-manager';

interface QuickActionsPanelProps {
    cart: Cart;
    onToggleExpress: () => void;
    onToggleDelivery: () => void;
    onAddCustomItem: () => void;
    onAddNote: () => void;
    onApplyCoupon: () => void;
    className?: string;
}

export function QuickActionsPanel({
    cart,
    onToggleExpress,
    onToggleDelivery,
    onAddCustomItem,
    onAddNote,
    onApplyCoupon,
    className
}: QuickActionsPanelProps) {
    // Map Cart properties to local flags
    const isExpress = cart.isExpressOrder;
    const isDelivery = cart.fulfillmentType === 'delivery';
    const hasNotes = !!cart.specialInstructions;
    const hasCoupon = !!cart.couponCode;

    const ActionButton = ({
        icon: Icon,
        label,
        colorClass,
        isActive,
        onClick
    }: {
        icon: any,
        label: string,
        colorClass: string,
        isActive?: boolean,
        onClick: () => void
    }) => (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 w-full aspect-square shadow-sm",
                isActive
                    ? cn("border-transparent shadow-md ring-1 ring-white/20", colorClass.replace('bg-', 'bg-').replace('/10', '/90').replace('text-', 'text-white '))
                    : cn("bg-slate-900/50 border-white/5 hover:bg-slate-800/80 text-slate-400 hover:text-white", colorClass.replace('bg-', 'hover:bg-').replace('text-', 'hover:text-'))
            )}
        >
            <Icon className={cn("h-6 w-6 lg:h-7 lg:w-7 mb-2", isActive ? "text-white" : "text-current")} />
            <span className={cn("text-[10px] lg:text-xs font-semibold tracking-wide", isActive ? "text-white" : "text-current")}>{label}</span>
        </motion.button>
    );

    return (
        <div className={cn("flex flex-col gap-3 p-3 h-full bg-slate-950/30 border-r border-white/5", className)}>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 px-1">Quick Actions</div>

            <div className="grid grid-cols-1 gap-2.5">
                <ActionButton
                    icon={PlusSquare}
                    label="Custom Item"
                    colorClass="bg-blue-500/10 text-blue-500"
                    onClick={onAddCustomItem}
                />

                <ActionButton
                    icon={FileText}
                    label="Notes"
                    colorClass="bg-amber-500/10 text-amber-500"
                    isActive={hasNotes}
                    onClick={onAddNote}
                />

                <div className="h-px bg-white/5 my-0.5" />

                <ActionButton
                    icon={Zap}
                    label="Express"
                    colorClass="bg-orange-500/10 text-orange-500"
                    isActive={isExpress}
                    onClick={onToggleExpress}
                />

                <ActionButton
                    icon={Truck}
                    label="Delivery"
                    colorClass="bg-rose-500/10 text-rose-500"
                    isActive={isDelivery}
                    onClick={onToggleDelivery}
                />

                <ActionButton
                    icon={Ticket}
                    label="Coupon"
                    colorClass="bg-purple-500/10 text-purple-500"
                    isActive={hasCoupon}
                    onClick={onApplyCoupon}
                />
            </div>

            <div className="mt-auto pt-3 space-y-3">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-1 text-emerald-400">
                        <Printer className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase">Auto-Print</span>
                    </div>
                    <div className="text-[9px] text-slate-500 leading-tight">
                        Tags will print automatically on order creation.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuickActionsPanel;
