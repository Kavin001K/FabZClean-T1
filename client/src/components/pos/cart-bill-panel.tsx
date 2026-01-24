/**
 * ============================================================================
 * CART BILL PANEL
 * ============================================================================
 * 
 * Right-side cart and bill panel for POS system.
 * Features:
 * - Customer info display with quick lookup
 * - Cart items with quantity controls
 * - Garment tag IDs per item
 * - Add-on suggestions
 * - Discount and charges
 * - Bill summary with GST
 * - Express order toggle
 * - Checkout button
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
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

// ============ COMPONENT ============

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
    const [showDiscount, setShowDiscount] = useState(false);
    const [showDelivery, setShowDelivery] = useState(false);
    const totals = calculateCartTotals(cart);

    const hasCustomer = !!cart.customer;
    const hasItems = cart.items.length > 0;
    const canCheckout = hasCustomer && hasItems;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Customer Section */}
            <div className="p-4 border-b">
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
                        className="w-full p-4 border-2 border-dashed rounded-xl text-center hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                        <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="font-medium">Add Customer</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">F1</kbd> to search
                        </p>
                    </button>
                )}
            </div>

            {/* Express Order Toggle */}
            <div className="px-4 py-3 border-b bg-amber-50 dark:bg-amber-950/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className={cn(
                            "h-5 w-5",
                            cart.isExpressOrder ? "text-amber-600" : "text-muted-foreground"
                        )} />
                        <div>
                            <p className="font-medium text-sm">Express Service</p>
                            <p className="text-xs text-muted-foreground">+50% • 2-day delivery</p>
                        </div>
                    </div>
                    <Switch
                        checked={cart.isExpressOrder}
                        onCheckedChange={(checked) => onUpdateCart({ isExpressOrder: checked })}
                    />
                </div>
                {cart.isExpressOrder && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-xs text-amber-800 dark:text-amber-200"
                    >
                        ⚡ Express surcharge: ₹{totals.expressSurcharge.toFixed(2)}
                    </motion.div>
                )}
            </div>

            {/* Cart Items */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {cart.items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Cart is empty</p>
                            <p className="text-xs mt-1">Click on services to add items</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {cart.items.map((item) => (
                                <CartItemCard
                                    key={item.id}
                                    item={item}
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
            <div className="border-t">
                <Collapsible open={showDiscount} onOpenChange={setShowDiscount}>
                    <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Discount & Coupon</span>
                        </div>
                        {showDiscount ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <Select
                                    value={cart.discountType}
                                    onValueChange={(v) => onUpdateCart({ discountType: v as any })}
                                >
                                    <SelectTrigger className="w-28">
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
                                        className="flex-1"
                                    />
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Coupon code"
                                    value={cart.couponCode}
                                    onChange={(e) => onUpdateCart({ couponCode: e.target.value })}
                                />
                                <Button variant="outline" size="sm">Apply</Button>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                <Collapsible open={showDelivery} onOpenChange={setShowDelivery}>
                    <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 border-t">
                        <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                Delivery ({cart.fulfillmentType === 'delivery' ? '₹' + cart.deliveryCharges : 'Pickup'})
                            </span>
                        </div>
                        {showDelivery ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                        <div className="flex gap-2 mb-3">
                            <Button
                                variant={cart.fulfillmentType === 'pickup' ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1"
                                onClick={() => onUpdateCart({ fulfillmentType: 'pickup' })}
                            >
                                Store Pickup
                            </Button>
                            <Button
                                variant={cart.fulfillmentType === 'delivery' ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1"
                                onClick={() => onUpdateCart({ fulfillmentType: 'delivery' })}
                            >
                                Home Delivery
                            </Button>
                        </div>
                        {cart.fulfillmentType === 'delivery' && (
                            <div className="space-y-2">
                                <Input
                                    placeholder="Street address"
                                    value={cart.deliveryAddress?.street || ''}
                                    onChange={(e) => onUpdateCart({
                                        deliveryAddress: { ...cart.deliveryAddress, street: e.target.value, city: cart.deliveryAddress?.city || '', zip: cart.deliveryAddress?.zip || '' }
                                    })}
                                />
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="City"
                                        value={cart.deliveryAddress?.city || ''}
                                        onChange={(e) => onUpdateCart({
                                            deliveryAddress: { ...cart.deliveryAddress, street: cart.deliveryAddress?.street || '', city: e.target.value, zip: cart.deliveryAddress?.zip || '' }
                                        })}
                                    />
                                    <Input
                                        placeholder="PIN"
                                        value={cart.deliveryAddress?.zip || ''}
                                        onChange={(e) => onUpdateCart({
                                            deliveryAddress: { ...cart.deliveryAddress, street: cart.deliveryAddress?.street || '', city: cart.deliveryAddress?.city || '', zip: e.target.value }
                                        })}
                                    />
                                </div>
                                <Input
                                    type="number"
                                    placeholder="Delivery charges"
                                    value={cart.deliveryCharges || ''}
                                    onChange={(e) => onUpdateCart({ deliveryCharges: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        )}
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {/* Bill Summary */}
            <div className="p-4 border-t bg-muted/30">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal ({totals.itemCount} items)</span>
                        <span>₹{totals.baseSubtotal.toFixed(2)}</span>
                    </div>

                    {totals.expressSurcharge > 0 && (
                        <div className="flex justify-between text-amber-600">
                            <span>Express Surcharge (+50%)</span>
                            <span>₹{totals.expressSurcharge.toFixed(2)}</span>
                        </div>
                    )}

                    {totals.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-₹{totals.discountAmount.toFixed(2)}</span>
                        </div>
                    )}

                    {totals.deliveryAmount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery</span>
                            <span>₹{totals.deliveryAmount.toFixed(2)}</span>
                        </div>
                    )}

                    {cart.enableGST && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">GST (18%)</span>
                            <span>₹{totals.gstAmount.toFixed(2)}</span>
                        </div>
                    )}

                    <Separator className="my-2" />

                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">₹{totals.total.toFixed(2)}</span>
                    </div>
                </div>

                {/* GST Toggle */}
                <div className="flex items-center justify-between mt-4 p-2 bg-background rounded-lg border">
                    <Label htmlFor="gst-toggle" className="text-xs cursor-pointer">
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
            <div className="p-4 border-t space-y-2">
                <Button
                    className="w-full h-12 text-lg font-bold"
                    disabled={!canCheckout || isCheckingOut}
                    onClick={onCheckout}
                >
                    {isCheckingOut ? (
                        <>Processing...</>
                    ) : (
                        <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            Pay ₹{totals.total.toFixed(2)}
                            <kbd className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">F2</kbd>
                        </>
                    )}
                </Button>

                {hasItems && (
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={onClearCart}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                // Save cart to localStorage as draft
                                localStorage.setItem('fabz_held_cart', JSON.stringify(cart));
                                onClearCart();
                            }}
                        >
                            <Receipt className="h-4 w-4 mr-2" />
                            Hold <kbd className="ml-1 px-1 bg-muted rounded text-[10px]">F4</kbd>
                        </Button>
                    </div>
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
        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold">{customer.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onRemove}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Credit Balance Warning */}
            {credit > 0 && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Credit balance due: ₹{credit.toLocaleString('en-IN')}
                </div>
            )}

            {/* Order History Stats */}
            {orderHistory && orderHistory.orderCount > 0 && (
                <div className="mt-2 flex gap-3 text-xs">
                    <Badge variant="secondary" className="font-normal">
                        {orderHistory.orderCount} orders
                    </Badge>
                    <Badge variant="secondary" className="font-normal">
                        ₹{orderHistory.totalSpent.toLocaleString('en-IN')} spent
                    </Badge>
                </div>
            )}
        </div>
    );
}

// ============ CART ITEM CARD ============

function CartItemCard({
    item,
    onUpdateQuantity,
    onRemove,
    onUpdate,
    onAddAddOn,
}: {
    item: CartItem;
    onUpdateQuantity: (qty: number) => void;
    onRemove: () => void;
    onUpdate: (updates: Partial<CartItem>) => void;
    onAddAddOn: (addOn: AddOn) => void;
}) {
    const [showDetails, setShowDetails] = useState(false);
    const [editingNote, setEditingNote] = useState(false);
    const [noteValue, setNoteValue] = useState(item.tagNote);

    const availableAddOns = getAddOnsForService(item.service.name);
    const addOnTotal = item.addOns.reduce((sum, a) => sum + a.price, 0);
    const itemTotal = item.subtotal + (addOnTotal * item.quantity);

    const handleSaveNote = () => {
        onUpdate({ tagNote: noteValue });
        setEditingNote(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="p-3 bg-muted/30 rounded-xl border"
        >
            <div className="flex items-start gap-3">
                {/* Quantity Controls */}
                <div className="flex flex-col items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onUpdateQuantity(item.quantity + 1)}
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-lg font-bold w-7 text-center">{item.quantity}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                            if (item.quantity > 1) {
                                onUpdateQuantity(item.quantity - 1);
                            } else {
                                onRemove();
                            }
                        }}
                    >
                        {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Minus className="h-3.5 w-3.5" />}
                    </Button>
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-medium">{item.customName}</p>
                            <p className="text-xs text-muted-foreground">
                                ₹{item.priceOverride.toFixed(0)} × {item.quantity}
                                {item.addOns.length > 0 && ` + ₹${addOnTotal} add-ons`}
                            </p>
                        </div>
                        <p className="font-bold text-primary shrink-0">₹{itemTotal.toFixed(0)}</p>
                    </div>

                    {/* Tag ID */}
                    <div className="flex items-center gap-2 mt-2">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                            {item.garmentBarcode}
                        </code>
                    </div>

                    {/* Add-ons Applied */}
                    {item.addOns.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {item.addOns.map((addOn) => (
                                <Badge key={addOn.id} variant="secondary" className="text-[10px]">
                                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                                    {addOn.name} +₹{addOn.price}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Tag Note */}
                    {item.tagNote && !editingNote && (
                        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-xs flex items-center gap-2">
                            <span className="flex-1">{item.tagNote}</span>
                            <button onClick={() => setEditingNote(true)}>
                                <Edit2 className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={onRemove}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Expandable Details */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger className="w-full mt-2 pt-2 border-t text-xs text-center text-muted-foreground hover:text-foreground">
                    {showDetails ? 'Hide details' : 'Add note / Add-ons'}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                    {/* Note Input */}
                    <div>
                        <Label className="text-xs">Tag Note (prints on garment tag)</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                placeholder="e.g., Likes light starch"
                                value={noteValue}
                                onChange={(e) => setNoteValue(e.target.value)}
                                className="text-sm"
                            />
                            <Button size="sm" onClick={handleSaveNote}>
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Available Add-ons */}
                    {availableAddOns.length > 0 && (
                        <div>
                            <Label className="text-xs">Quick Add-ons</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {availableAddOns.map((addOn) => {
                                    const isApplied = item.addOns.some(a => a.id === addOn.id);
                                    return (
                                        <Button
                                            key={addOn.id}
                                            variant={isApplied ? 'secondary' : 'outline'}
                                            size="sm"
                                            className="text-xs"
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
                        <Label className="text-xs">Custom Price</Label>
                        <Input
                            type="number"
                            value={item.priceOverride}
                            onChange={(e) => onUpdate({ priceOverride: parseFloat(e.target.value) || 0 })}
                            className="mt-1"
                        />
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </motion.div>
    );
}

export default CartBillPanel;
