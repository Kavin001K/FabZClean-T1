/**
 * ============================================================================
 * POINT OF SALE (POS) - REDESIGNED
 * ============================================================================
 *
 * Enterprise-grade POS system for FabZClean laundry operations.
 *
 * Features:
 * - 3-Column Layout (Catalog | Quick Actions | Bill)
 * - Multi-cart support
 * - Simultaneous Print & Digital Invoice
 * - Unified Backend Integration
 *
 * @version 3.0.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
    Printer,
    Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { Order } from '@shared/schema';
import { ordersApi, customersApi, servicesApi } from '@/lib/data-service';

// POS Components
import { CartTabs } from '@/components/pos/cart-tabs';
import { ServiceCatalog } from '@/components/pos/service-catalog';
import { CartBillPanel } from '@/components/pos/cart-bill-panel';
import { QuickActionsPanel } from '@/components/pos/quick-actions-panel';
import { usePOSShortcuts } from '@/hooks/use-pos-shortcuts';
import {
    useCartManager,
} from '@/lib/cart-manager';

// Import existing confirmation dialog
import { OrderConfirmationDialog } from '@/components/orders/order-confirmation-dialog';

// ============ MAIN COMPONENT ============

export default function POSPage() {
    const { employee } = useAuth(); // Corrected useAuth usage
    const { toast } = useToast();

    // Dialog States
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [lastOrder, setLastOrder] = useState<Order | null>(null);
    const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    // Input States
    const [customItemDetails, setCustomItemDetails] = useState({ name: '', price: '' });

    // Cart Manager
    const {
        carts,
        activeCartId,
        activeCart,
        createCart,
        setActiveCart,
        deleteCart,
        addItem,
        updateItem,
        removeItem,
        updateItemQuantity,
        updateCart,
        renameCart,
        clearCart,
        maxCarts,
        totals, // Get totals from hook
    } = useCartManager();

    // Data Queries
    const { data: services = [], isLoading: servicesLoading } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            const data = await servicesApi.getAll();
            return data.filter((s: any) => s.status === 'Active');
        }
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: customersApi.getAll
    });

    const { data: customerStats } = useQuery({
        queryKey: ['customer-stats', activeCart?.customer?.id],
        queryFn: async () => {
            if (!activeCart?.customer?.id) return null;
            return {
                orderCount: 0, // In a real app, fetch from API
                totalSpent: 0,
                favoriteServiceIds: []
            };
        },
        enabled: !!activeCart?.customer?.id
    });

    // Mutations
    const createOrderMutation = useMutation({
        mutationFn: ordersApi.create,
        onSuccess: (response: any) => {
            // Validate response heavily as it's critical
            let order = response.data || response;
            if (!order || !order.orderNumber) {
                // Fallback if data structure is unexpected
                console.warn("Unexpected order response structure:", response);
                order = { ...activeCart, orderNumber: "ORD-PENDING", ...response };
            }

            setLastOrder(order);
            setShowConfirmation(true);

            // Simultaneous Actions
            handlePostOrderActions(order, activeCart?.enableGST || false);

            clearCart(activeCartId);
            toast({
                title: "Order Created Successfully",
                description: `Order #${order.orderNumber} placed.`,
                className: "bg-green-600 border-green-700 text-white",
                duration: 5000,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to Create Order",
                description: error.message || "Please check your network connection.",
                variant: "destructive",
            });
        }
    });

    // Helper: Simultaneous Print & Bill Logic
    const handlePostOrderActions = async (order: Order, enableGST: boolean) => {
        // 1. Tag Printing (Mocked for now, assumes thermal printer connected)
        console.log(`[POS] Auto-printing tags for order ${order.orderNumber}`);

        // 2. WhatsApp Invoice (Async)
        if (order.customerPhone) {
            toast({
                title: "Processing Actions",
                description: (
                    <div className="flex flex-col gap-1 mt-1 text-xs">
                        <span className="flex items-center gap-2"><Printer className="h-3 w-3" /> Printing Tags...</span>
                        <span className="flex items-center gap-2"><Zap className="h-3 w-3" /> Generating Invoice...</span>
                    </div>
                ),
                duration: 3000,
            });

            try {
                // Dynamic imports to save bundle size
                const { WhatsAppService } = await import('@/lib/whatsapp-service');
                const { PDFService } = await import('@/lib/pdf-service');

                // Generate PDF
                const pdfUrl = await PDFService.generateAndUploadBillPDF(order.orderNumber, enableGST);
                console.log('[POS] PDF Generated:', pdfUrl);

                // Calculate Amount safely
                const amount = typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : (order.totalAmount || 0);

                // Send WhatsApp
                const billUrl = `${window.location.origin}/bill/${order.orderNumber}`;
                await WhatsAppService.sendOrderBill(
                    order.customerPhone,
                    order.orderNumber,
                    order.customerName || "Customer",
                    amount,
                    billUrl,
                    pdfUrl
                );

                toast({
                    title: "Sent via WhatsApp",
                    description: `Invoice sent to ${order.customerPhone}`,
                    duration: 3000
                });

            } catch (e) {
                console.error("[POS] Failed to auto-send invoice:", e);
                // Don't show error to user, manual send is available in dialog
            }
        }
    };

    const handleCheckout = () => {
        if (!activeCart || !totals) return;

        if (activeCart.items.length === 0) {
            toast({ title: "Cart is empty", variant: "destructive" });
            return;
        }
        if (!activeCart.customer) {
            toast({ title: "Customer Required", description: "Select a customer.", variant: "destructive" });
            return;
        }

        const deliveryCharge = activeCart.fulfillmentType === 'delivery' ? activeCart.deliveryCharges : 0;

        const orderPayload: any = {
            franchiseId: employee?.franchiseId,
            customerId: activeCart.customer.id,
            customerName: activeCart.customer.name,
            customerPhone: activeCart.customer.phone,
            customerEmail: activeCart.customer.email,
            items: activeCart.items.map(item => ({
                serviceId: item.service.id,
                serviceName: item.service.name,
                quantity: item.quantity,
                price: item.priceOverride.toString(),
                subtotal: item.subtotal.toString(),
                modifiers: [],
                customName: item.customName,
                tagNote: item.tagNote || '',
                garmentBarcode: item.garmentBarcode
            })),
            totalAmount: totals.total.toString(), // Trust frontend calculation for init
            status: "pending",
            paymentStatus: activeCart.paymentStatus || "pending",

            // Flags
            isExpressOrder: activeCart.isExpressOrder,
            fulfillmentType: activeCart.fulfillmentType,
            deliveryCharges: deliveryCharge.toString(),

            // Notes
            specialInstructions: activeCart.specialInstructions,

            priority: activeCart.isExpressOrder ? "urgent" : "normal"
        };

        createOrderMutation.mutate(orderPayload);
    };

    // Quick Action Handlers
    const toggleExpress = () => {
        if (activeCart) {
            updateCart(activeCartId, { isExpressOrder: !activeCart.isExpressOrder });
        }
    };

    const toggleDelivery = () => {
        if (activeCart) {
            updateCart(activeCartId, { fulfillmentType: activeCart.fulfillmentType === 'delivery' ? 'pickup' : 'delivery' });
        }
    };

    // Custom Item Handlers
    const handleAddCustomItem = () => {
        if (customItemDetails.name && customItemDetails.price) {
            const customService: any = {
                id: `custom-${Date.now()}`,
                name: customItemDetails.name,
                price: customItemDetails.price,
                category: 'Custom',
                description: 'Custom Item',
                active: true,
                image: ''
            };

            addItem(customService);
            setIsCustomItemOpen(false);
            setCustomItemDetails({ name: '', price: '' });
        }
    };

    // Keyboard Shortcuts
    usePOSShortcuts({
        onNewOrder: createCart,
        onSwitchCart: (idx) => {
            if (idx < carts.length) setActiveCart(carts[idx].id);
        },
        onCheckout: handleCheckout,
        onToggleExpress: toggleExpress,
        onClearCart: () => {
            if (confirm("Clear current cart?")) clearCart(activeCartId);
        }
    });

    // Loading State
    if (!activeCart) return <div className="flex items-center justify-center h-screen text-slate-500 bg-slate-950">Loading POS...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-slate-950 overflow-hidden">
            {/* 1. Header & Tabs */}
            <div className="flex-none bg-slate-950 border-b border-white/5 z-30">
                <CartTabs
                    carts={carts}
                    activeCartId={activeCartId}
                    maxCarts={maxCarts}
                    onSelectCart={setActiveCart}
                    onCreateCart={createCart}
                    onDeleteCart={deleteCart}
                    onClearCart={clearCart}
                    onRenameCart={renameCart}
                />
            </div>

            {/* 2. Main 3-Column Layout */}
            <div className="flex-1 grid grid-cols-12 overflow-hidden">

                {/* LEFT: Service Catalog (60%) */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-7 h-full overflow-hidden border-r border-white/5 relative bg-slate-950">
                    <ServiceCatalog
                        services={services}
                        isLoading={servicesLoading}
                        onAddService={(service) => addItem(service)}
                        recentlyUsed={[]}
                        customerFavorites={customerStats?.favoriteServiceIds || []}
                    />
                </div>

                {/* MIDDLE: Quick Actions (15%) */}
                <div className="hidden lg:flex lg:col-span-2 xl:col-span-2 h-full overflow-hidden bg-slate-900/30 z-20 border-r border-white/5">
                    <QuickActionsPanel
                        cart={activeCart}
                        onToggleExpress={toggleExpress}
                        onToggleDelivery={toggleDelivery}
                        onAddCustomItem={() => setIsCustomItemOpen(true)}
                        onAddNote={() => setIsNotesOpen(true)}
                        onApplyCoupon={() => toast({ title: "Coupons", description: "Coming soon." })}
                        className="w-full"
                    />
                </div>

                {/* RIGHT: Bill Panel (25%) */}
                <div className="col-span-12 lg:col-span-3 xl:col-span-3 h-full overflow-hidden bg-slate-900 z-30 shadow-2xl">
                    <CartBillPanel
                        cart={activeCart}
                        onUpdateItem={(itemId, updates) => updateItem(itemId, updates)}
                        onUpdateQuantity={(itemId, qty) => updateItemQuantity(itemId, qty)}
                        onRemoveItem={(itemId) => removeItem(itemId)}
                        onAddItemAddOn={(itemId, addon) => { /* Addon logic */ }}
                        onUpdateCart={(updates) => updateCart(activeCartId, updates)}
                        onSearchCustomer={() => { /* Handled in panel */ }}
                        onCheckout={handleCheckout}
                        onClearCart={() => clearCart(activeCartId)}
                        isCheckingOut={createOrderMutation.isPending}
                        customerOrderHistory={customerStats ? {
                            orderCount: customerStats.orderCount || 0,
                            totalSpent: customerStats.totalSpent || 0,
                        } : undefined}
                    />
                </div>
            </div>

            {/* Modals */}
            <Dialog open={isCustomItemOpen} onOpenChange={setIsCustomItemOpen}>
                <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Add Custom Item</DialogTitle>
                        <DialogDescription className="text-slate-400">Add a non-catalog item.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Item Name</Label>
                            <Input
                                value={customItemDetails.name}
                                onChange={(e) => setCustomItemDetails(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-slate-950 border-white/10"
                                placeholder="Item Name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Price (₹)</Label>
                            <Input
                                type="number"
                                value={customItemDetails.price}
                                onChange={(e) => setCustomItemDetails(prev => ({ ...prev, price: e.target.value }))}
                                className="bg-slate-950 border-white/10"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCustomItemOpen(false)} className="border-white/10 hover:bg-white/5 hover:text-white">Cancel</Button>
                        <Button onClick={handleAddCustomItem} className="bg-primary text-primary-foreground hover:bg-primary/90">Add Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Order Instructions / Notes</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <textarea
                            className="w-full h-32 bg-slate-950 border border-white/10 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-slate-200"
                            placeholder="Add notes about stains, delivery instructions, etc."
                            value={activeCart.specialInstructions || ''}
                            onChange={(e) => updateCart(activeCartId, { specialInstructions: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsNotesOpen(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">Save Note</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Order Success Dialog */}
            {lastOrder && (
                <OrderConfirmationDialog
                    open={showConfirmation}
                    onOpenChange={setShowConfirmation}
                    order={lastOrder}
                    onClose={() => setShowConfirmation(false)}
                />
            )}
        </div>
    );
}
