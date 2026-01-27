/**
 * ============================================================================
 * CART BILL PANEL - OPTIMIZED VERSION
 * ============================================================================
 * 
 * Right-side cart and bill panel for POS system.
 * Features:
 * - Customer info display with quick lookup
 * - Cart items with quantity controls
 * - Garment tag IDs per item
 * - Add-on suggestions
 * - Discount and charges (working coupon system)
 * - Bill summary with GST
 * - Express order toggle
 * - Payment method selection
 * - Checkout with WhatsApp notification
 * 
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Phone,
    MapPin,
    Plus,
    Minus,
    Trash2,
    Tag,
    Zap,
    Percent,
    Gift,
    Truck,
    Calendar,
    CreditCard,
    Wallet,
    Banknote,
    Receipt,
    ShoppingBag,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Edit2,
    Check,
    X,
    Sparkles,
    Package,
    Clock,
    Store,
    MessageCircle,
    History,
    IndianRupee,
    QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import type { Customer } from '@shared/schema';
import { Cart, CartItem, calculateCartTotals, getAddOnsForService, AddOn } from '@/lib/cart-manager';
import { useToast } from '@/hooks/use-toast';

// ============ TYPES ============

interface CartBillPanelProps {
    cart: Cart;
    onUpdateItem: (itemId: string, updates: Partial<CartItem>) => void;
    onUpdateQuantity: (itemId: string, quantity: number) => void;
    onRemoveItem: (itemId: string) => void;
    onAddItemAddOn: (itemId: string, addOn: AddOn) => void;
    onUpdateCart: (updates: Partial<Cart>) => void;
    onSearchCustomer: () => void;
    onCheckout: () => void;
    onClearCart: () => void;
    isCheckingOut?: boolean;
    customerOrderHistory?: { orderCount: number; totalSpent: number; lastOrderDate?: string };
}

// ============ CONSTANTS ============

const PAYMENT_METHODS = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'upi', label: 'UPI', icon: QrCode },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'credit', label: 'Credit', icon: Receipt },
];

// ============ MAIN COMPONENT ============

export function CartBillPanel({
    cart,
    onUpdateItem,
    onUpdateQuantity,
    onRemoveItem,
    onAddItemAddOn,
    onUpdateCart,
    onSearchCustomer,
    onCheckout,
    onClearCart,
    isCheckingOut = false,
    customerOrderHistory,
}: CartBillPanelProps) {
    const { toast } = useToast();
    const [showDiscount, setShowDiscount] = useState(false);
    const [showDelivery, setShowDelivery] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

    // Use specific cart properties in dependency array for proper reactivity
    const totals = useMemo(() => {
        const calculated = calculateCartTotals(cart);
        return calculated;
    }, [cart.items, cart.isExpressOrder, cart.discountType, cart.discountValue, cart.extraCharges, cart.fulfillmentType, cart.deliveryCharges, cart.enableGST]);

    const hasCustomer = !!cart.customer;
    const hasItems = cart.items.length > 0;
    const canCheckout = hasCustomer && hasItems;

    // Handle coupon application
    const handleApplyCoupon = useCallback(async () => {
        if (!cart.couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        setCouponError(null);
        setCouponSuccess(null);

        try {
            // Check for hardcoded coupons first (demo)
            const code = cart.couponCode.toUpperCase().trim();

            // Demo coupons for testing
            const demoCoupons: Record<string, { type: 'percentage' | 'fixed'; value: number; minOrder?: number }> = {
                'WELCOME10': { type: 'percentage', value: 10, minOrder: 100 },
                'FLAT50': { type: 'fixed', value: 50, minOrder: 200 },
                'FIRST20': { type: 'percentage', value: 20, minOrder: 0 },
                'FABZ100': { type: 'fixed', value: 100, minOrder: 500 },
            };

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            if (demoCoupons[code]) {
                const coupon = demoCoupons[code];

                // Check minimum order
                if (coupon.minOrder && totals.baseSubtotal < coupon.minOrder) {
                    setCouponError(`Minimum order ₹${coupon.minOrder} required`);
                    setCouponLoading(false);
                    return;
                }

                onUpdateCart({
                    discountType: coupon.type,
                    discountValue: coupon.value,
                });
                setCouponSuccess(`Coupon applied: ${coupon.type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}`);
                toast({
                    title: 'Coupon Applied!',
                    description: coupon.type === 'percentage' ? `${coupon.value}% discount added` : `₹${coupon.value} discount added`,
                });
            } else {
                setCouponError('Invalid coupon code');
            }
        } catch (error) {
            setCouponError('Failed to apply coupon');
        } finally {
            setCouponLoading(false);
        }
    }, [cart.couponCode, onUpdateCart, totals.baseSubtotal, toast]);

    // Remove coupon
    const handleRemoveCoupon = useCallback(() => {
        onUpdateCart({
            couponCode: '',
            discountType: 'none',
            discountValue: 0,
        });
        setCouponSuccess(null);
        setCouponError(null);
    }, [onUpdateCart]);

    // Handle hold cart
    const handleHoldCart = useCallback(() => {
        localStorage.setItem('fabz_held_cart', JSON.stringify(cart));
        onClearCart();
        toast({
            title: 'Cart Held',
            description: 'Cart saved for later. Press F5 to restore.',
        });
    }, [cart, onClearCart, toast]);

    // Restore held cart
    const handleRestoreHeldCart = useCallback(() => {
        const heldCartData = localStorage.getItem('fabz_held_cart');
        if (heldCartData) {
            try {
                const heldCart = JSON.parse(heldCartData);
                onUpdateCart(heldCart);
                localStorage.removeItem('fabz_held_cart');
                toast({
                    title: 'Cart Restored',
                    description: 'Previously held cart has been restored.',
                });
            } catch (e) {
                toast({
                    title: 'Error',
                    description: 'Failed to restore cart.',
                    variant: 'destructive',
                });
            }
        }
    }, [onUpdateCart, toast]);

    // Check if there's a held cart
    const hasHeldCart = !!localStorage.getItem('fabz_held_cart');

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header with cart count */}
            <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                <span className="text-xs text-slate-400 font-medium">
                    {totals.itemCount > 0 ? `${totals.itemCount} item${totals.itemCount > 1 ? 's' : ''}` : 'No items'}
                </span>
                {hasHeldCart && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-amber-400 hover:text-amber-300"
                        onClick={handleRestoreHeldCart}
                    >
                        <History className="h-3 w-3 mr-1" />
                        Restore Held
                    </Button>
                )}
            </div>

            {/* Customer Section */}
            <div className="p-4 border-b border-slate-700">
                {hasCustomer ? (
                    <CustomerCard
                        customer={cart.customer!}
                        orderHistory={customerOrderHistory}
                        onRemove={() => onUpdateCart({ customer: null })}
                        creditBalance={cart.customer?.creditBalance}
                    />
                ) : (
                    <button
                        onClick={onSearchCustomer}
                        className="w-full p-4 border-2 border-dashed border-slate-600 rounded-xl text-center hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                    >
                        <User className="h-8 w-8 mx-auto mb-2 text-slate-500 group-hover:text-primary transition-colors" />
                        <p className="font-medium text-slate-300">Add Customer</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] font-mono">F1</kbd> to search
                        </p>
                    </button>
                )}
            </div>

            {/* Express Order Toggle */}
            <div className={cn(
                "px-4 py-3 border-b transition-colors",
                cart.isExpressOrder
                    ? "bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-amber-700/50"
                    : "bg-slate-800/30 border-slate-700"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg transition-colors",
                            cart.isExpressOrder ? "bg-amber-500/20" : "bg-slate-700/50"
                        )}>
                            <Zap className={cn(
                                "h-5 w-5 transition-colors",
                                cart.isExpressOrder ? "text-amber-400" : "text-slate-500"
                            )} />
                        </div>
                        <div>
                            <p className={cn(
                                "font-medium text-sm transition-colors",
                                cart.isExpressOrder ? "text-amber-300" : "text-slate-300"
                            )}>Express Service</p>
                            <p className="text-xs text-slate-500">+50% • 2-day delivery</p>
                        </div>
                    </div>
                    <Switch
                        checked={cart.isExpressOrder}
                        onCheckedChange={(checked) => onUpdateCart({ isExpressOrder: checked })}
                    />
                </div>
                <AnimatePresence>
                    {cart.isExpressOrder && totals.expressSurcharge > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2"
                        >
                            <Zap className="h-3 w-3" />
                            Express surcharge: ₹{totals.expressSurcharge.toFixed(2)}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Cart Items */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {cart.items.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                                <ShoppingBag className="h-8 w-8 opacity-50" />
                            </div>
                            <p className="font-medium text-slate-400">Cart is empty</p>
                            <p className="text-xs mt-1">Click on services to add items</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {cart.items.map((item, index) => (
                                <CartItemCard
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onUpdateQuantity={(qty) => onUpdateQuantity(item.id, qty)}
                                    onRemove={() => onRemoveItem(item.id)}
                                    onUpdate={(updates) => onUpdateItem(item.id, updates)}
                                    onAddAddOn={(addOn) => onAddItemAddOn(item.id, addOn)}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </ScrollArea>

            {/* Discount & Delivery Section */}
            <div className="border-t border-slate-700">
                {/* Discount & Coupon */}
                <Collapsible open={showDiscount} onOpenChange={setShowDiscount}>
                    <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-300">Discount & Coupon</span>
                            {totals.discountAmount > 0 && (
                                <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                                    -₹{totals.discountAmount.toFixed(0)}
                                </Badge>
                            )}
                        </div>
                        {showDiscount ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                        <div className="space-y-3">
                            {/* Manual Discount */}
                            <div className="flex gap-2">
                                <Select
                                    value={cart.discountType}
                                    onValueChange={(v) => onUpdateCart({ discountType: v as any })}
                                >
                                    <SelectTrigger className="w-28 bg-slate-800 border-slate-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="percentage">%</SelectItem>
                                        <SelectItem value="fixed">₹</SelectItem>
                                    </SelectContent>
                                </Select>
                                {cart.discountType !== 'none' && (
                                    <Input
                                        type="number"
                                        placeholder="Value"
                                        value={cart.discountValue || ''}
                                        onChange={(e) => onUpdateCart({ discountValue: parseFloat(e.target.value) || 0 })}
                                        className="flex-1 bg-slate-800 border-slate-600"
                                    />
                                )}
                            </div>

                            {/* Coupon Code */}
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter coupon code"
                                        value={cart.couponCode}
                                        onChange={(e) => {
                                            onUpdateCart({ couponCode: e.target.value.toUpperCase() });
                                            setCouponError(null);
                                        }}
                                        className="flex-1 bg-slate-800 border-slate-600 uppercase"
                                        disabled={!!couponSuccess}
                                    />
                                    {couponSuccess ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRemoveCoupon}
                                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleApplyCoupon}
                                            disabled={couponLoading || !cart.couponCode.trim()}
                                            className="border-slate-600"
                                        >
                                            {couponLoading ? '...' : 'Apply'}
                                        </Button>
                                    )}
                                </div>
                                {couponError && (
                                    <p className="text-xs text-red-400">{couponError}</p>
                                )}
                                {couponSuccess && (
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <Check className="h-3 w-3" />
                                        {couponSuccess}
                                    </p>
                                )}
                                <p className="text-xs text-slate-500">
                                    Try: WELCOME10, FLAT50, FIRST20
                                </p>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Delivery Options */}
                <Collapsible open={showDelivery} onOpenChange={setShowDelivery}>
                    <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 border-t border-slate-700 transition-colors">
                        <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-300">
                                Delivery ({cart.fulfillmentType === 'delivery' ? `₹${cart.deliveryCharges}` : 'Pickup'})
                            </span>
                        </div>
                        {showDelivery ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                        <div className="flex gap-2 mb-3">
                            <Button
                                variant={cart.fulfillmentType === 'pickup' ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    "flex-1 gap-2",
                                    cart.fulfillmentType === 'pickup'
                                        ? "bg-primary"
                                        : "border-slate-600 hover:bg-slate-800"
                                )}
                                onClick={() => onUpdateCart({ fulfillmentType: 'pickup' })}
                            >
                                <Store className="h-4 w-4" />
                                Store Pickup
                            </Button>
                            <Button
                                variant={cart.fulfillmentType === 'delivery' ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    "flex-1 gap-2",
                                    cart.fulfillmentType === 'delivery'
                                        ? "bg-primary"
                                        : "border-slate-600 hover:bg-slate-800"
                                )}
                                onClick={() => onUpdateCart({ fulfillmentType: 'delivery' })}
                            >
                                <Truck className="h-4 w-4" />
                                Delivery
                            </Button>
                        </div>
                        <AnimatePresence>
                            {cart.fulfillmentType === 'delivery' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2"
                                >
                                    <Input
                                        placeholder="Street address"
                                        value={cart.deliveryAddress?.street || ''}
                                        onChange={(e) => onUpdateCart({
                                            deliveryAddress: {
                                                ...cart.deliveryAddress,
                                                street: e.target.value,
                                                city: cart.deliveryAddress?.city || '',
                                                zip: cart.deliveryAddress?.zip || ''
                                            }
                                        })}
                                        className="bg-slate-800 border-slate-600"
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="City"
                                            value={cart.deliveryAddress?.city || ''}
                                            onChange={(e) => onUpdateCart({
                                                deliveryAddress: {
                                                    ...cart.deliveryAddress,
                                                    street: cart.deliveryAddress?.street || '',
                                                    city: e.target.value,
                                                    zip: cart.deliveryAddress?.zip || ''
                                                }
                                            })}
                                            className="bg-slate-800 border-slate-600"
                                        />
                                        <Input
                                            placeholder="PIN"
                                            value={cart.deliveryAddress?.zip || ''}
                                            onChange={(e) => onUpdateCart({
                                                deliveryAddress: {
                                                    ...cart.deliveryAddress,
                                                    street: cart.deliveryAddress?.street || '',
                                                    city: cart.deliveryAddress?.city || '',
                                                    zip: e.target.value
                                                }
                                            })}
                                            className="w-24 bg-slate-800 border-slate-600"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-slate-400 whitespace-nowrap">Delivery:</Label>
                                        <Input
                                            type="number"
                                            placeholder="Charges"
                                            value={cart.deliveryCharges || ''}
                                            onChange={(e) => onUpdateCart({ deliveryCharges: parseFloat(e.target.value) || 0 })}
                                            className="w-24 bg-slate-800 border-slate-600"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CollapsibleContent>
                </Collapsible>

                {/* Payment Method */}
                <Collapsible open={showPayment} onOpenChange={setShowPayment}>
                    <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 border-t border-slate-700 transition-colors">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-300">
                                Payment ({PAYMENT_METHODS.find(p => p.id === cart.paymentMethod)?.label || 'Cash'})
                            </span>
                        </div>
                        {showPayment ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                        <div className="grid grid-cols-5 gap-2">
                            {PAYMENT_METHODS.map((method) => (
                                <Button
                                    key={method.id}
                                    variant={cart.paymentMethod === method.id ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        "flex-col h-auto py-2 gap-1",
                                        cart.paymentMethod === method.id
                                            ? "bg-primary"
                                            : "border-slate-600 hover:bg-slate-800"
                                    )}
                                    onClick={() => onUpdateCart({ paymentMethod: method.id })}
                                >
                                    <method.icon className="h-4 w-4" />
                                    <span className="text-[10px]">{method.label}</span>
                                </Button>
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {/* Bill Summary */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Subtotal ({totals.itemCount} items)</span>
                        <span className="text-slate-300">₹{totals.baseSubtotal.toFixed(2)}</span>
                    </div>

                    <AnimatePresence>
                        {totals.expressSurcharge > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex justify-between text-amber-400"
                            >
                                <span className="flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    Express (+50%)
                                </span>
                                <span>₹{totals.expressSurcharge.toFixed(2)}</span>
                            </motion.div>
                        )}

                        {totals.discountAmount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex justify-between text-green-400"
                            >
                                <span>Discount</span>
                                <span>-₹{totals.discountAmount.toFixed(2)}</span>
                            </motion.div>
                        )}

                        {totals.deliveryAmount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex justify-between"
                            >
                                <span className="text-slate-400">Delivery</span>
                                <span className="text-slate-300">₹{totals.deliveryAmount.toFixed(2)}</span>
                            </motion.div>
                        )}

                        {cart.enableGST && totals.gstAmount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex justify-between"
                            >
                                <span className="text-slate-400">GST (18%)</span>
                                <span className="text-slate-300">₹{totals.gstAmount.toFixed(2)}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Separator className="my-2 bg-slate-700" />

                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-green-400">₹{totals.total.toFixed(2)}</span>
                    </div>
                </div>

                {/* GST Toggle */}
                <div className="flex items-center justify-between mt-4 p-2 bg-slate-800 rounded-lg border border-slate-700">
                    <Label htmlFor="gst-toggle" className="text-xs cursor-pointer text-slate-400">
                        Include GST (18%)
                    </Label>
                    <Switch
                        id="gst-toggle"
                        checked={cart.enableGST}
                        onCheckedChange={(checked) => onUpdateCart({ enableGST: checked })}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-slate-700 space-y-2">
                <Button
                    className={cn(
                        "w-full h-12 text-lg font-bold transition-all",
                        canCheckout
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/25"
                            : "bg-slate-700 text-slate-400"
                    )}
                    disabled={!canCheckout || isCheckingOut}
                    onClick={onCheckout}
                >
                    {isCheckingOut ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </motion.div>
                    ) : (
                        <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            Pay ₹{totals.total.toFixed(2)}
                            <kbd className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono">F2</kbd>
                        </>
                    )}
                </Button>

                {hasItems && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 border-slate-600 hover:bg-slate-800 hover:border-red-500/50 hover:text-red-400"
                            onClick={onClearCart}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 border-slate-600 hover:bg-slate-800"
                            onClick={handleHoldCart}
                        >
                            <Receipt className="h-4 w-4 mr-2" />
                            Hold
                            <kbd className="ml-1 px-1 bg-slate-700 rounded text-[10px] font-mono">F4</kbd>
                        </Button>
                    </div>
                )}

                {/* WhatsApp info */}
                {hasCustomer && (
                    <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                        <MessageCircle className="h-3 w-3 text-green-500" />
                        WhatsApp bill will be sent automatically
                    </p>
                )}
            </div>
        </div>
    );
}

// ============ CUSTOMER CARD ============

function CustomerCard({
    customer,
    orderHistory,
    onRemove,
    creditBalance,
}: {
    customer: Customer;
    orderHistory?: { orderCount: number; totalSpent: number; lastOrderDate?: string };
    onRemove: () => void;
    creditBalance?: number | string | null;
}) {
    const credit = parseFloat(String(creditBalance || 0));

    return (
        <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-white">{customer.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Credit Balance Warning */}
            {credit > 0 && (
                <div className="mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Credit due: ₹{credit.toLocaleString('en-IN')}
                </div>
            )}

            {/* Order History Stats */}
            {orderHistory && orderHistory.orderCount > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="font-normal bg-slate-700/50 text-slate-300">
                        <History className="h-3 w-3 mr-1" />
                        {orderHistory.orderCount} orders
                    </Badge>
                    <Badge variant="secondary" className="font-normal bg-slate-700/50 text-slate-300">
                        <IndianRupee className="h-3 w-3 mr-1" />
                        {orderHistory.totalSpent.toLocaleString('en-IN')} spent
                    </Badge>
                </div>
            )}
        </div>
    );
}

// ============ CART ITEM CARD ============

function CartItemCard({
    item,
    index,
    onUpdateQuantity,
    onRemove,
    onUpdate,
    onAddAddOn,
}: {
    item: CartItem;
    index: number;
    onUpdateQuantity: (qty: number) => void;
    onRemove: () => void;
    onUpdate: (updates: Partial<CartItem>) => void;
    onAddAddOn: (addOn: AddOn) => void;
}) {
    const [showDetails, setShowDetails] = useState(false);
    const [editingNote, setEditingNote] = useState(false);
    const [noteValue, setNoteValue] = useState(item.tagNote);

    const availableAddOns = useMemo(() => getAddOnsForService(item.service.name), [item.service.name]);
    const addOnTotal = useMemo(() => item.addOns.reduce((sum, a) => sum + a.price, 0), [item.addOns]);
    const itemTotal = item.subtotal + (addOnTotal * item.quantity);

    const handleSaveNote = useCallback(() => {
        onUpdate({ tagNote: noteValue });
        setEditingNote(false);
    }, [noteValue, onUpdate]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
        >
            <div className="flex items-start gap-3">
                {/* Quantity Controls */}
                <div className="flex flex-col items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 border-slate-600 hover:bg-primary hover:border-primary hover:text-white"
                        onClick={() => onUpdateQuantity(item.quantity + 1)}
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-lg font-bold w-7 text-center text-white">{item.quantity}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-7 w-7 p-0 border-slate-600",
                            item.quantity === 1
                                ? "hover:bg-red-500 hover:border-red-500 hover:text-white"
                                : "hover:bg-slate-700"
                        )}
                        onClick={() => {
                            if (item.quantity > 1) {
                                onUpdateQuantity(item.quantity - 1);
                            } else {
                                onRemove();
                            }
                        }}
                    >
                        {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5 text-red-400" /> : <Minus className="h-3.5 w-3.5" />}
                    </Button>
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-medium text-white">{item.customName}</p>
                            <p className="text-xs text-slate-400">
                                ₹{item.priceOverride.toFixed(0)} × {item.quantity}
                                {item.addOns.length > 0 && (
                                    <span className="text-purple-400"> + ₹{addOnTotal} add-ons</span>
                                )}
                            </p>
                        </div>
                        <p className="font-bold text-green-400 shrink-0">₹{itemTotal.toFixed(0)}</p>
                    </div>

                    {/* Tag ID */}
                    <div className="flex items-center gap-2 mt-2">
                        <Tag className="h-3 w-3 text-slate-500" />
                        <code className="text-[10px] bg-slate-700/50 px-1.5 py-0.5 rounded font-mono text-slate-400">
                            {item.garmentBarcode}
                        </code>
                    </div>

                    {/* Add-ons Applied */}
                    {item.addOns.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {item.addOns.map((addOn) => (
                                <Badge key={addOn.id} variant="secondary" className="text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/30">
                                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                                    {addOn.name} +₹{addOn.price}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Tag Note */}
                    {item.tagNote && !editingNote && (
                        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs flex items-center gap-2 text-yellow-300">
                            <span className="flex-1">{item.tagNote}</span>
                            <button onClick={() => setEditingNote(true)} className="hover:text-yellow-200">
                                <Edit2 className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                    onClick={onRemove}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Expandable Details */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger className="w-full mt-2 pt-2 border-t border-slate-700 text-xs text-center text-slate-500 hover:text-slate-300 transition-colors">
                    {showDetails ? 'Hide details' : 'Add note / Add-ons'}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                    {/* Note Input */}
                    <div>
                        <Label className="text-xs text-slate-400">Tag Note (prints on garment tag)</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                placeholder="e.g., Likes light starch"
                                value={noteValue}
                                onChange={(e) => setNoteValue(e.target.value)}
                                className="text-sm bg-slate-800 border-slate-600"
                            />
                            <Button size="sm" onClick={handleSaveNote} className="bg-primary hover:bg-primary/80">
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Available Add-ons */}
                    {availableAddOns.length > 0 && (
                        <div>
                            <Label className="text-xs text-slate-400">Quick Add-ons</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {availableAddOns.map((addOn) => {
                                    const isApplied = item.addOns.some(a => a.id === addOn.id);
                                    return (
                                        <Button
                                            key={addOn.id}
                                            variant={isApplied ? 'secondary' : 'outline'}
                                            size="sm"
                                            className={cn(
                                                "text-xs",
                                                isApplied
                                                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                                    : "border-slate-600 hover:bg-slate-700"
                                            )}
                                            disabled={isApplied}
                                            onClick={() => onAddAddOn(addOn)}
                                        >
                                            {addOn.name} {addOn.price > 0 && `+₹${addOn.price}`}
                                            {isApplied && <Check className="h-3 w-3 ml-1" />}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Price Override */}
                    <div>
                        <Label className="text-xs text-slate-400">Custom Price</Label>
                        <Input
                            type="number"
                            value={item.priceOverride}
                            onChange={(e) => onUpdate({ priceOverride: parseFloat(e.target.value) || 0 })}
                            className="mt-1 bg-slate-800 border-slate-600"
                        />
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </motion.div>
    );
}

export default CartBillPanel;
