/**
 * ============================================================================
 * POINT OF SALE (POS) - PRODUCTION VERSION
 * ============================================================================
 * 
 * Enterprise-grade POS system for FabZClean laundry operations.
 * 
 * Features:
 * - Multi-cart support (up to 5 simultaneous carts)
 * - Split-screen layout: Service catalog (left) | Cart/Bill (right)
 * - Keyboard shortcuts (F1-F8, Esc, Ctrl+1-5)
 * - Smart customer lookup with order history
 * - Auto-generated garment tag IDs for tracking
 * - Express order toggle with surcharge
 * - Add-on suggestions per service type
 * - GST and discount calculations
 * - Abandoned cart recovery
 * 
 * @version 2.0.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
    Search,
    Keyboard,
    HelpCircle,
    Receipt,
    User,
    Phone,
    ChevronRight,
    Clock,
    Star,
    TrendingUp,
    CreditCard,
    Zap,
    X,
    Plus,
    History,
    Settings,
    Home,
    Minimize2,
    Maximize2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { format, formatDistanceToNow } from 'date-fns';
import type { Service, Customer, Order } from '@shared/schema';
import { ordersApi, customersApi, servicesApi } from '@/lib/data-service';

// POS Components
import { CartTabs, CartSwitcherMobile } from '@/components/pos/cart-tabs';
import { ServiceCatalog } from '@/components/pos/service-catalog';
import { CartBillPanel } from '@/components/pos/cart-bill-panel';
import { usePOSShortcuts, ShortcutHelp, SHORTCUT_INFO } from '@/hooks/use-pos-shortcuts';
import {
    useCartManager,
    Cart,
    CartItem,
    AddOn,
    calculateCartTotals,
} from '@/lib/cart-manager';

// Import existing confirmation dialog
import { OrderConfirmationDialog } from '@/components/orders/order-confirmation-dialog';

// ============ MAIN COMPONENT ============

export default function POSPage() {
    const { toast } = useToast();
    const { employee: currentUser } = useAuth();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();

    // Cart Manager Hook
    const {
        carts,
        activeCart,
        activeCartId,
        totals,
        maxCarts,
        canCreateCart,
        setActiveCart,
        createCart,
        deleteCart,
        clearCart,
        renameCart,
        updateCart,
        addItem,
        updateItem,
        updateItemQuantity,
        removeItem,
        addItemAddOn,
        setCustomer,
        markAsProcessed,
    } = useCartManager();

    // UI State
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [showShortcutHelp, setShowShortcutHelp] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');

    const [isFullScreen, setIsFullScreen] = useState(false);

    // Toggle Full Screen
    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => {
                console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, []);

    // Listen for full screen changes
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullScreen) {
                // Browser handles exit, just need to ensure state sync if needed
                // But if we want to ensure it exits:
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullScreen]);

    // Go Home and Exit Full Screen
    const handleGoHome = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error(err));
        }
        setLocation('/');
    }, [setLocation]);


    // Order Creation State
    const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ============ QUERIES ============

    // Fetch services
    const { data: servicesData, isLoading: servicesLoading } = useQuery<Service[]>({
        queryKey: ['services'],
        queryFn: async () => {
            const all = await servicesApi.getAll();
            return all.filter((s: Service) => s.status?.toLowerCase() === 'active');
        },
    });

    const services = servicesData || [];

    // Fetch all customers for search
    const { data: customersData } = useQuery<Customer[]>({
        queryKey: ['customers'],
        queryFn: () => customersApi.getAll(),
    });

    const customers = customersData || [];

    // Fetch customer's order history when customer is set
    const { data: customerOrdersData } = useQuery<Order[]>({
        queryKey: ['customer-orders', activeCart?.customer?.id],
        queryFn: async () => {
            if (!activeCart?.customer?.phone) return [];
            const orders = await ordersApi.search(activeCart.customer.phone);
            return orders
                .filter((o: Order) => o.customerId === activeCart.customer!.id)
                .sort((a: Order, b: Order) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                )
                .slice(0, 10);
        },
        enabled: !!activeCart?.customer?.id,
    });

    const customerOrders = customerOrdersData || [];

    // Calculate customer stats
    const customerStats = useMemo(() => {
        if (!customerOrders.length) return null;

        const totalSpent = customerOrders.reduce((sum, o) =>
            sum + parseFloat(o.totalAmount || '0'), 0);
        const orderCount = customerOrders.length;
        const lastOrderDate = customerOrders[0]?.createdAt;

        // Extract favorite services
        const serviceCounts: Record<string, number> = {};
        customerOrders.forEach(order => {
            (order.items as any[])?.forEach(item => {
                const name = item.serviceName || item.productName;
                if (name) serviceCounts[name] = (serviceCounts[name] || 0) + 1;
            });
        });

        const favoriteServiceIds = Object.entries(serviceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => services.find(s => s.name === name)?.id)
            .filter(Boolean) as string[];

        return { orderCount, totalSpent, lastOrderDate, favoriteServiceIds };
    }, [customerOrders, services]);


    // ============ MUTATIONS ============

    // Create order mutation
    const createOrderMutation = useMutation({
        mutationKey: ['createOrder'],
        mutationFn: async (orderData: Partial<Order>) => {
            return await ordersApi.create(orderData);
        },
        onSuccess: async (responseOrder) => {
            if (responseOrder) {
                // Normalize order data
                const order: any = { ...responseOrder };
                if (!order.items && activeCart) {
                    order.items = activeCart.items.map(item => ({
                        productId: item.service.id,
                        productName: item.service.name,
                        serviceName: item.service.name,
                        quantity: item.quantity,
                        price: item.priceOverride,
                        tagNote: item.tagNote,
                        garmentBarcode: item.garmentBarcode,
                    }));
                }
                if (!order.customerPhone && activeCart?.customer) {
                    order.customerPhone = activeCart.customer.phone;
                }
                if (!order.customerName && activeCart?.customer) {
                    order.customerName = activeCart.customer.name;
                }

                setCreatedOrder(order);
                setIsModalOpen(true);

                // Invalidate queries
                queryClient.invalidateQueries({ queryKey: ['orders'] });
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard/metrics'] });

                // Clear the cart
                markAsProcessed();

                toast({
                    title: activeCart?.isExpressOrder ? '⚡ Express Order Created!' : 'Order Created!',
                    description: `Order ${order.orderNumber} saved successfully.`,
                });
            }
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: 'Failed to create order. Please try again.',
                variant: 'destructive',
            });
            console.error('Order creation failed:', error);
        },
    });

    // ============ HANDLERS ============

    const handleCheckout = useCallback(() => {
        if (!activeCart || !activeCart.customer || activeCart.items.length === 0) {
            toast({
                title: 'Cannot Checkout',
                description: 'Please add a customer and items to the cart.',
                variant: 'destructive',
            });
            return;
        }

        const cartTotals = calculateCartTotals(activeCart);

        // Build order data - use 'as any' since the API is more permissive than schema types
        const orderData: any = {
            customerId: activeCart.customer.id,
            customerName: activeCart.customer.name,
            customerPhone: activeCart.customer.phone,
            customerEmail: activeCart.customer.email,
            status: 'pending',
            items: activeCart.items.map(item => ({
                serviceId: item.service.id,
                productId: item.service.id,
                productName: item.service.name,
                serviceName: item.service.name,
                quantity: item.quantity,
                price: item.priceOverride.toString(),
                subtotal: item.subtotal.toString(),
                customName: item.customName,
                tagNote: item.tagNote,
                garmentBarcode: item.garmentBarcode,
            })),
            totalAmount: cartTotals.total.toString(),
            specialInstructions: activeCart.specialInstructions,
            isExpressOrder: activeCart.isExpressOrder,
            fulfillmentType: activeCart.fulfillmentType,
            deliveryAddress: activeCart.deliveryAddress || null,
            deliveryCharges: activeCart.fulfillmentType === 'delivery'
                ? activeCart.deliveryCharges.toString()
                : '0',
            paymentMethod: activeCart.paymentMethod,
            paymentStatus: activeCart.paymentStatus,
            discountType: activeCart.discountType !== 'none' ? activeCart.discountType : undefined,
            discountValue: activeCart.discountValue > 0 ? activeCart.discountValue.toString() : undefined,
            couponCode: activeCart.couponCode || undefined,
            gstEnabled: activeCart.enableGST,
            pickupDate: activeCart.pickupDate,
        };

        createOrderMutation.mutate(orderData);
    }, [activeCart, createOrderMutation, toast]);

    const handleSearchCustomer = useCallback(() => {
        setShowCustomerSearch(true);
        setCustomerSearchQuery('');
    }, []);

    const handleSelectCustomer = useCallback((customer: Customer) => {
        setCustomer(customer);
        setShowCustomerSearch(false);
        toast({
            title: 'Customer Selected',
            description: `${customer.name} added to cart.`,
        });
    }, [setCustomer, toast]);

    const handleSwitchCart = useCallback((index: number) => {
        if (carts[index]) {
            setActiveCart(carts[index].id);
            toast({
                title: `Switched to ${carts[index].name}`,
                duration: 1500,
            });
        }
    }, [carts, setActiveCart, toast]);

    const handleCreateCart = useCallback(() => {
        const newCart = createCart();
        if (newCart) {
            toast({ title: 'New cart created', duration: 1500 });
        } else {
            toast({
                title: 'Cart limit reached',
                description: `Maximum ${maxCarts} carts allowed.`,
                variant: 'destructive',
            });
        }
    }, [createCart, maxCarts, toast]);

    const handleToggleExpress = useCallback(() => {
        if (activeCartId) {
            updateCart(activeCartId, { isExpressOrder: !activeCart?.isExpressOrder });
            toast({
                title: activeCart?.isExpressOrder ? 'Express disabled' : '⚡ Express enabled',
                duration: 1500,
            });
        }
    }, [activeCartId, activeCart, updateCart, toast]);

    // ============ KEYBOARD SHORTCUTS ============

    usePOSShortcuts({
        onSearchCustomer: handleSearchCustomer,
        onCheckout: handleCheckout,
        onNewCart: handleCreateCart,
        onSaveDraft: () => {
            if (activeCart && activeCartId) {
                localStorage.setItem('fabz_held_cart', JSON.stringify(activeCart));
                clearCart(activeCartId);
                toast({ title: 'Cart held', description: 'Cart saved and cleared for next customer.' });
            }
        },
        onToggleExpress: handleToggleExpress,
        onClearCart: () => {
            if (activeCartId) clearCart(activeCartId);
            toast({ title: 'Cart cleared' });
        },
        onPrintReceipt: () => toast({ title: 'Print initiated...' }),
        onApplyDiscount: () => setShowDiscountModal(true),
        onCancel: () => {
            setShowCustomerSearch(false);
            setShowShortcutHelp(false);
            setShowDiscountModal(false);
        },
        onSwitchCart: handleSwitchCart,
    });

    // ============ FILTERED CUSTOMERS ============

    const filteredCustomers = useMemo(() => {
        if (!customerSearchQuery.trim()) return customers.slice(0, 10);

        const query = customerSearchQuery.toLowerCase();
        return customers
            .filter(c =>
                c.name?.toLowerCase().includes(query) ||
                c.phone?.includes(query) ||
                c.email?.toLowerCase().includes(query)
            )
            .slice(0, 15);
    }, [customers, customerSearchQuery]);

    // ============ RECENT SERVICES ============

    const recentServiceIds = useMemo(() => {
        const recent = localStorage.getItem('fabz_recent_services');
        if (recent) {
            try {
                return JSON.parse(recent).slice(0, 8);
            } catch {
                return [];
            }
        }
        return [];
    }, []);

    // Track service usage
    const handleAddServiceWithTracking = useCallback((service: Service) => {
        addItem(service);

        // Track recent
        const recent = localStorage.getItem('fabz_recent_services');
        let recentIds: string[] = [];
        try {
            recentIds = recent ? JSON.parse(recent) : [];
        } catch { }

        recentIds = [service.id, ...recentIds.filter(id => id !== service.id)].slice(0, 20);
        localStorage.setItem('fabz_recent_services', JSON.stringify(recentIds));

        toast({
            title: `Added: ${service.name}`,
            description: `₹${parseFloat(service.price || '0').toFixed(0)}`,
            duration: 1500,
        });
    }, [addItem, toast]);

    // ============ RENDER ============

    if (!activeCart) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Initializing POS...</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="h-screen flex flex-col bg-background overflow-hidden relative">

                {/* Top Bar - Hidden in Full Screen */}
                {!isFullScreen && (
                    <header className="h-14 border-b bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Receipt className="h-6 w-6 text-primary" />
                                <h1 className="text-lg font-bold hidden md:block">Point of Sale</h1>
                            </div>

                            {/* Mobile Cart Switcher */}
                            <div className="md:hidden">
                                <CartSwitcherMobile
                                    carts={carts}
                                    activeCartId={activeCartId}
                                    onSelectCart={setActiveCart}
                                    onCreateCart={handleCreateCart}
                                    maxCarts={maxCarts}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Full Screen Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleFullScreen}
                                className="hidden md:flex gap-2"
                            >
                                <Maximize2 className="h-4 w-4" />
                                Full Screen
                            </Button>

                            {/* Keyboard Shortcuts Help */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowShortcutHelp(true)}
                                className="hidden md:flex gap-2"
                            >
                                <Keyboard className="h-4 w-4" />
                                Shortcuts
                            </Button>

                            {/* Current User */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span className="hidden md:inline">{currentUser?.fullName || 'Staff'}</span>
                            </div>
                        </div>
                    </header>
                )}

                {/* Minimal Home Button for Full Screen */}
                {isFullScreen && (
                    <div className="absolute top-0 left-0 right-0 z-50 flex justify-center p-2 pointer-events-none">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleGoHome}
                            className="shadow-md bg-white/90 hover:bg-white backdrop-blur-sm pointer-events-auto rounded-full px-4 gap-2 border"
                        >
                            <Home className="h-4 w-4" />
                            <span className="text-xs font-semibold">Home</span>
                        </Button>
                    </div>
                )}

                {/* Cart Tabs (Desktop) */}
                <div className="hidden md:block shrink-0">
                    <CartTabs
                        carts={carts}
                        activeCartId={activeCartId}
                        maxCarts={maxCarts}
                        onSelectCart={setActiveCart}
                        onCreateCart={handleCreateCart}
                        onDeleteCart={deleteCart}
                        onClearCart={clearCart}
                        onRenameCart={renameCart}
                    />
                </div>

                {/* Main Content - Split Screen */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left Panel - Service Catalog */}
                    <div className="flex-1 border-r overflow-hidden">
                        <ServiceCatalog
                            services={services}
                            isLoading={servicesLoading}
                            onAddService={handleAddServiceWithTracking}
                            recentlyUsed={recentServiceIds}
                            customerFavorites={customerStats?.favoriteServiceIds || []}
                        />
                    </div>

                    {/* Right Panel - Cart/Bill */}
                    <div className="w-full md:w-[400px] lg:w-[450px] shrink-0 overflow-hidden">
                        <CartBillPanel
                            cart={activeCart}
                            onUpdateItem={(itemId, updates) => updateItem(itemId, updates)}
                            onUpdateQuantity={(itemId, qty) => updateItemQuantity(itemId, qty)}
                            onRemoveItem={(itemId) => removeItem(itemId)}
                            onAddItemAddOn={(itemId, addOn) => addItemAddOn(itemId, addOn)}
                            onUpdateCart={(updates) => {
                                if (activeCartId) updateCart(activeCartId, updates);
                            }}
                            onSearchCustomer={handleSearchCustomer}
                            onCheckout={handleCheckout}
                            onClearCart={() => {
                                if (activeCartId) clearCart(activeCartId);
                            }}
                            isCheckingOut={createOrderMutation.isPending}
                            customerOrderHistory={customerStats ? {
                                orderCount: customerStats.orderCount,
                                totalSpent: customerStats.totalSpent,
                                lastOrderDate: customerStats.lastOrderDate ? new Date(customerStats.lastOrderDate).toISOString() : undefined,
                            } : undefined}
                        />
                    </div>
                </div>

                {/* Customer Search Dialog */}
                <Dialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Find Customer
                            </DialogTitle>
                            <DialogDescription>
                                Search by name, phone, or email
                            </DialogDescription>
                        </DialogHeader>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Type phone number or name..."
                                value={customerSearchQuery}
                                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                        </div>

                        <ScrollArea className="h-[300px] -mx-4 px-4 mt-2">
                            {filteredCustomers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>No customers found</p>
                                    <Button variant="link" className="mt-2">
                                        + Create New Customer
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredCustomers.map((customer) => (
                                        <button
                                            key={customer.id}
                                            onClick={() => handleSelectCustomer(customer)}
                                            className="w-full p-3 flex items-center gap-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{customer.name}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Phone className="h-3 w-3" />
                                                    {customer.phone}
                                                </p>
                                            </div>
                                            {customer.loyaltyPoints && Number(customer.loyaltyPoints) > 0 && (
                                                <Badge variant="secondary" className="shrink-0">
                                                    <Star className="h-3 w-3 mr-1 text-amber-500" />
                                                    {customer.loyaltyPoints} pts
                                                </Badge>
                                            )}
                                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </DialogContent>
                </Dialog>

                {/* Keyboard Shortcuts Help */}
                <ShortcutHelp
                    visible={showShortcutHelp}
                    onClose={() => setShowShortcutHelp(false)}
                />

                {/* Order Confirmation Dialog */}
                {createdOrder && (
                    <OrderConfirmationDialog
                        order={createdOrder}
                        open={isModalOpen}
                        onOpenChange={(open) => {
                            setIsModalOpen(open);
                            if (!open) setCreatedOrder(null);
                        }}
                        onClose={() => {
                            setIsModalOpen(false);
                            setCreatedOrder(null);
                        }}
                    />
                )}

                {/* Floating Shortcut Hint */}
                <div className="fixed bottom-4 left-4 hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/80 backdrop-blur-sm px-3 py-2 rounded-full border shadow-sm">
                    <Keyboard className="h-3.5 w-3.5" />
                    <span>Press <kbd className="px-1 py-0.5 bg-background rounded border text-[10px]">?</kbd> for shortcuts</span>
                </div>
            </div>
        </TooltipProvider>
    );
}
