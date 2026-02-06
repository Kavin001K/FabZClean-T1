
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Search, Trash2, Plus, Minus, Tag,
    CreditCard, ArrowRight, AlertCircle, ShoppingBag,
    Bike, UserPlus, FileText, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { Cart, CartItem, calculateCartTotals } from '@/lib/cart-manager';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CartBillPanelProps {
    cart: Cart;
    onUpdateItem: (itemId: string, updates: Partial<CartItem>) => void;
    onUpdateQuantity: (itemId: string, quantity: number) => void;
    onRemoveItem: (itemId: string) => void;
    onAddItemAddOn: (itemId: string, addOn: any) => void;
    onUpdateCart: (updates: Partial<Cart>) => void;
    onSearchCustomer: () => void;
    onCheckout: () => void;
    onClearCart: () => void;
    isCheckingOut: boolean;
    customerOrderHistory?: {
        orderCount: number;
        totalSpent: number;
        lastOrderDate?: string;
    };
}

export function CartBillPanel({
    cart,
    onUpdateItem,
    onUpdateQuantity,
    onRemoveItem,
    onUpdateCart,
    onSearchCustomer,
    onCheckout,
    onClearCart,
    isCheckingOut,
    customerOrderHistory
}: CartBillPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const totals = calculateCartTotals(cart);

    // Auto-scroll to bottom on new items
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [cart.items.length]);

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-white/10 shadow-xl z-20">
            {/* 1. Customer Header */}
            <div className="p-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                {cart.customer ? (
                    <div className="relative group p-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 shadow-inner">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-100">{cart.customer.name}</h3>
                                    <p className="text-xs text-slate-400 font-mono tracking-wide">{cart.customer.phone}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-white" onClick={onSearchCustomer}>
                                <UserPlus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Customer Stats */}
                        <div className="flex gap-4 text-xs mt-2 pt-2 border-t border-white/5 text-slate-400">
                            {customerOrderHistory ? (
                                <>
                                    <span><strong className="text-slate-200">{customerOrderHistory.orderCount}</strong> Orders</span>
                                    <span><strong className="text-slate-200">₹{customerOrderHistory.totalSpent.toFixed(0)}</strong> Spent</span>
                                </>
                            ) : (
                                <span>New Customer</span>
                            )}
                            <span className={cn("ml-auto font-medium", cart.customer.loyaltyPoints && Number(cart.customer.loyaltyPoints) > 0 ? "text-amber-500" : "")}>
                                {cart.customer.loyaltyPoints || 0} Points
                            </span>
                        </div>

                        {/* Remove Customer Button */}
                        <button
                            onClick={() => onUpdateCart({ customer: undefined })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm scale-75 hover:scale-100"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <Button
                        onClick={onSearchCustomer}
                        className="w-full h-16 border-dashed border-2 border-slate-700 bg-transparent hover:bg-slate-800/50 text-slate-400 gap-3"
                        variant="outline"
                    >
                        <UserPlus className="h-5 w-5" />
                        Assign Customer (F2)
                    </Button>
                )}
            </div>

            {/* 2. Order Settings Toggles (Compact) */}
            <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-white/5 bg-slate-900/50">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/30 border border-white/5">
                    <div className="flex items-center gap-2">
                        <Bike className="h-4 w-4 text-sky-500" />
                        <span className="text-xs font-medium text-slate-300">Delivery</span>
                    </div>
                    <Switch
                        checked={cart.fulfillmentType === 'delivery'}
                        onCheckedChange={(c) => onUpdateCart({
                            fulfillmentType: c ? 'delivery' : 'pickup',
                            deliveryCharges: c ? 50 : 0 // Default delivery charge
                        })}
                        className="scale-75"
                    />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/30 border border-white/5">
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs font-medium text-slate-300">Express</span>
                    </div>
                    <Switch
                        checked={cart.isExpressOrder}
                        onCheckedChange={(c) => onUpdateCart({ isExpressOrder: c })}
                        className="scale-75"
                    />
                </div>
            </div>

            {/* 3. Cart Items List */}
            <ScrollArea className="flex-1 bg-slate-950/30" ref={scrollRef}>
                <div className="p-4 space-y-3 pb-20">
                    <AnimatePresence initial={false}>
                        {cart.items.map((item) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                key={item.id}
                                className="group relative bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-3 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <h4 className="font-medium text-sm text-slate-200 truncate pr-2">
                                            {item.service.name}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.service.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold text-sm text-slate-200">
                                            ₹{(item.priceOverride * item.quantity).toFixed(0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 bg-slate-950 rounded-md border border-white/5 p-1">
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                            className="h-6 w-6 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="font-mono text-sm font-medium w-4 text-center text-slate-200">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                            className="h-6 w-6 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        {/* Notes Button */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn("h-8 w-8", item.tagNote ? "text-amber-500" : "text-slate-600")}
                                                    onClick={() => {
                                                        const note = prompt("Add Item Note/Tag", item.tagNote || "");
                                                        if (note !== null) onUpdateItem(item.id, { tagNote: note });
                                                    }}
                                                >
                                                    <Tag className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Add Garment Note</TooltipContent>
                                        </Tooltip>

                                        {/* Remove Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-600 hover:text-red-400 hover:bg-red-400/10"
                                            onClick={() => onRemoveItem(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {item.tagNote && (
                                    <div className="mt-2 text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-2">
                                        <Tag className="h-3 w-3" /> {item.tagNote}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {cart.items.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-600">
                            <ShoppingBag className="h-10 w-10 mb-3 opacity-20" />
                            <p className="text-sm">Cart is empty</p>
                            <p className="text-xs opacity-50">Select services from catalog</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* 4. Footer & checkout */}
            <div className="bg-slate-900 border-t border-white/10 p-4 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]">
                {/* Notes Input */}
                <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Textarea
                        placeholder="Order special instructions..."
                        value={cart.specialInstructions || ""}
                        onChange={(e) => onUpdateCart({ specialInstructions: e.target.value })}
                        className="pl-9 min-h-[40px] h-10 py-2 resize-none bg-slate-950 border-slate-800 focus:border-primary/50 text-xs"
                    />
                </div>

                {/* Bill Details */}
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-400">
                        <span>Subtotal ({cart.items.length} items)</span>
                        <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>

                    {cart.isExpressOrder && (
                        <div className="flex justify-between text-yellow-500">
                            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Express Charge</span>
                            <span>+ ₹{(totals.total - totals.subtotal - (cart.deliveryCharges || 0)).toFixed(2)}</span>
                        </div>
                    )}

                    {(cart.deliveryCharges || 0) > 0 && (
                        <div className="flex justify-between text-sky-500">
                            <span className="flex items-center gap-1"><Bike className="h-3 w-3" /> Delivery</span>
                            <span>+ ₹{cart.deliveryCharges}</span>
                        </div>
                    )}

                    <Separator className="bg-slate-700" />

                    <div className="flex justify-between items-end">
                        <span className="text-slate-300 font-medium pb-1">Total Amount</span>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white leading-none">
                                ₹{totals.total.toFixed(0)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                Including GST (18%)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checkout Button */}
                <div className="grid grid-cols-4 gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 border-slate-700 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-colors"
                        onClick={onClearCart}
                        disabled={cart.items.length === 0}
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>

                    <Button
                        size="lg"
                        className={cn(
                            "col-span-3 h-12 text-base font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98]",
                            isCheckingOut ? "opacity-80" : "hover:shadow-primary/40"
                        )}
                        disabled={cart.items.length === 0 || !cart.customer || isCheckingOut}
                        onClick={onCheckout}
                    >
                        {isCheckingOut ? (
                            "Processing..."
                        ) : (
                            <>
                                Pay & Print <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
