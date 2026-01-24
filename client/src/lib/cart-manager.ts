/**
 * ============================================================================
 * POS MULTI-CART MANAGER
 * ============================================================================
 * 
 * Production-grade cart management system supporting:
 * - Multiple simultaneous carts (up to 5 active)
 * - Cart persistence across sessions
 * - Quick cart switching with tabs
 * - Draft auto-save
 * 
 * @version 1.0.0
 */

import type { Service, Customer, Order } from '@shared/schema';

// ============ TYPES ============

export interface CartItem {
    id: string; // Unique item ID within cart
    service: Service;
    quantity: number;
    priceOverride: number;
    subtotal: number;
    customName: string;
    tagNote: string;
    garmentBarcode: string; // Auto-generated tag ID
    addOns: AddOn[];
}

export interface AddOn {
    id: string;
    name: string;
    price: number;
}

export interface Cart {
    id: string;
    name: string;
    color: string;
    customer: Customer | null;
    items: CartItem[];
    specialInstructions: string;
    isExpressOrder: boolean;
    fulfillmentType: 'pickup' | 'delivery';
    deliveryAddress: {
        street: string;
        city: string;
        zip: string;
    } | null;
    discountType: 'percentage' | 'fixed' | 'none';
    discountValue: number;
    couponCode: string;
    extraCharges: number;
    extraChargesLabel: string;
    deliveryCharges: number;
    pickupDate: Date | null;
    paymentMethod: string;
    paymentStatus: string;
    enableGST: boolean;
    gstNumber: string;
    advancePayment: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CartManager {
    carts: Cart[];
    activeCartId: string;
    maxCarts: number;
}

// ============ CONSTANTS ============

const STORAGE_KEY = 'fabzclean_multicart_v1';
const MAX_CARTS = 5;
const CART_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
];

// ============ UTILITY FUNCTIONS ============

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a garment barcode/tag ID
 * Format: ORD-{orderNum}-{itemIndex}
 */
export function generateGarmentBarcode(cartId: string, itemIndex: number): string {
    const cartNum = cartId.substring(0, 4).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `TAG-${cartNum}-${timestamp}-${String(itemIndex + 1).padStart(2, '0')}`;
}

/**
 * Create a new empty cart
 */
export function createEmptyCart(index: number = 0): Cart {
    const id = generateId();
    return {
        id,
        name: `Cart ${index + 1}`,
        color: CART_COLORS[index % CART_COLORS.length],
        customer: null,
        items: [],
        specialInstructions: '',
        isExpressOrder: false,
        fulfillmentType: 'pickup',
        deliveryAddress: null,
        discountType: 'none',
        discountValue: 0,
        couponCode: '',
        extraCharges: 0,
        extraChargesLabel: '',
        deliveryCharges: 50,
        pickupDate: null,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        enableGST: false,
        gstNumber: '',
        advancePayment: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(cart: Cart): {
    baseSubtotal: number;
    expressSurcharge: number;
    subtotal: number;
    discountAmount: number;
    gstAmount: number;
    deliveryAmount: number;
    total: number;
    itemCount: number;
} {
    const baseSubtotal = cart.items.reduce((sum, item) => {
        const addOnTotal = item.addOns.reduce((a, addon) => a + addon.price, 0);
        return sum + item.subtotal + (addOnTotal * item.quantity);
    }, 0);

    const expressSurcharge = cart.isExpressOrder ? baseSubtotal * 0.5 : 0;
    const subtotal = baseSubtotal + expressSurcharge;

    let discountAmount = 0;
    if (cart.discountType === 'percentage') {
        discountAmount = (subtotal * cart.discountValue) / 100;
    } else if (cart.discountType === 'fixed') {
        discountAmount = cart.discountValue;
    }

    const afterDiscount = subtotal - discountAmount + cart.extraCharges;
    const deliveryAmount = cart.fulfillmentType === 'delivery' ? cart.deliveryCharges : 0;
    const beforeGST = afterDiscount + deliveryAmount;
    const gstAmount = cart.enableGST ? beforeGST * 0.18 : 0;
    const total = Math.max(0, beforeGST + gstAmount);

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
        baseSubtotal,
        expressSurcharge,
        subtotal,
        discountAmount,
        gstAmount,
        deliveryAmount,
        total: Math.round(total * 100) / 100, // Round to 2 decimal places
        itemCount,
    };
}

// ============ CART MANAGER CLASS ============

class CartManagerService {
    private state: CartManager;
    private listeners: Set<(state: CartManager) => void>;

    constructor() {
        this.listeners = new Set();
        this.state = this.loadFromStorage();
    }

    private loadFromStorage(): CartManager {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Restore dates
                parsed.carts = parsed.carts.map((cart: any) => ({
                    ...cart,
                    createdAt: new Date(cart.createdAt),
                    updatedAt: new Date(cart.updatedAt),
                    pickupDate: cart.pickupDate ? new Date(cart.pickupDate) : null,
                }));
                return parsed;
            }
        } catch (e) {
            console.error('Failed to load cart state:', e);
        }

        // Default state with one empty cart
        const defaultCart = createEmptyCart(0);
        return {
            carts: [defaultCart],
            activeCartId: defaultCart.id,
            maxCarts: MAX_CARTS,
        };
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save cart state:', e);
        }
    }

    private notify(): void {
        this.listeners.forEach(listener => listener(this.state));
        this.saveToStorage();
    }

    // ============ PUBLIC API ============

    subscribe(listener: (state: CartManager) => void): () => void {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    getState(): CartManager {
        return this.state;
    }

    getActiveCart(): Cart | undefined {
        return this.state.carts.find(c => c.id === this.state.activeCartId);
    }

    setActiveCart(cartId: string): void {
        if (this.state.carts.some(c => c.id === cartId)) {
            this.state.activeCartId = cartId;
            this.notify();
        }
    }

    createCart(): Cart | null {
        if (this.state.carts.length >= MAX_CARTS) {
            return null;
        }

        const newCart = createEmptyCart(this.state.carts.length);
        this.state.carts.push(newCart);
        this.state.activeCartId = newCart.id;
        this.notify();
        return newCart;
    }

    deleteCart(cartId: string): void {
        if (this.state.carts.length <= 1) {
            // Cannot delete last cart, just clear it
            this.clearCart(cartId);
            return;
        }

        const index = this.state.carts.findIndex(c => c.id === cartId);
        if (index === -1) return;

        this.state.carts.splice(index, 1);

        // If deleted active cart, switch to another
        if (this.state.activeCartId === cartId) {
            this.state.activeCartId = this.state.carts[Math.max(0, index - 1)].id;
        }

        this.notify();
    }

    clearCart(cartId: string): void {
        const cart = this.state.carts.find(c => c.id === cartId);
        if (!cart) return;

        const index = this.state.carts.findIndex(c => c.id === cartId);
        const clearedCart = createEmptyCart(index);
        clearedCart.id = cartId;
        clearedCart.name = cart.name;
        clearedCart.color = cart.color;

        this.state.carts[index] = clearedCart;
        this.notify();
    }

    renameCart(cartId: string, name: string): void {
        const cart = this.state.carts.find(c => c.id === cartId);
        if (cart) {
            cart.name = name;
            cart.updatedAt = new Date();
            this.notify();
        }
    }

    updateCart(cartId: string, updates: Partial<Cart>): void {
        const cart = this.state.carts.find(c => c.id === cartId);
        if (cart) {
            Object.assign(cart, updates, { updatedAt: new Date() });
            this.notify();
        }
    }

    // ============ ITEM OPERATIONS ============

    addItem(cartId: string, service: Service): CartItem {
        const cart = this.state.carts.find(c => c.id === cartId);
        if (!cart) throw new Error('Cart not found');

        // Check if service already exists
        const existingIndex = cart.items.findIndex(item => item.service.id === service.id);

        if (existingIndex >= 0) {
            // Increment quantity
            cart.items[existingIndex].quantity += 1;
            cart.items[existingIndex].subtotal =
                cart.items[existingIndex].quantity * cart.items[existingIndex].priceOverride;
            cart.updatedAt = new Date();
            this.notify();
            return cart.items[existingIndex];
        }

        // Add new item
        const newItem: CartItem = {
            id: generateId(),
            service,
            quantity: 1,
            priceOverride: parseFloat(service.price || '0'),
            subtotal: parseFloat(service.price || '0'),
            customName: service.name,
            tagNote: '',
            garmentBarcode: generateGarmentBarcode(cartId, cart.items.length),
            addOns: [],
        };

        cart.items.push(newItem);
        cart.updatedAt = new Date();
        this.notify();
        return newItem;
    }

    updateItem(cartId: string, itemId: string, updates: Partial<CartItem>): void {
        const cart = this.state.carts.find(c => c.id === cartId);
        if (!cart) return;

        const item = cart.items.find(i => i.id === itemId);
        if (!item) return;

        Object.assign(item, updates);

        // Recalculate subtotal if quantity or price changed
        if (updates.quantity !== undefined || updates.priceOverride !== undefined) {
            item.subtotal = item.quantity * item.priceOverride;
        }

        cart.updatedAt = new Date();
        this.notify();
    }

    updateItemQuantity(cartId: string, itemId: string, quantity: number): void {
        if (quantity <= 0) {
            this.removeItem(cartId, itemId);
            return;
        }

        const cart = this.state.carts.find(c => c.id === cartId);
        if (!cart) return;

        const item = cart.items.find(i => i.id === itemId);
        if (!item) return;

        item.quantity = quantity;
        item.subtotal = quantity * item.priceOverride;
        cart.updatedAt = new Date();
        this.notify();
    }

    removeItem(cartId: string, itemId: string): void {
        const cart = this.state.carts.find(c => c.id === cartId);
        if (!cart) return;

        cart.items = cart.items.filter(i => i.id !== itemId);
        cart.updatedAt = new Date();
        this.notify();
    }

    addItemAddOn(cartId: string, itemId: string, addOn: AddOn): void {
        const cart = this.state.carts.find(c => c.id === cartId);
        if (!cart) return;

        const item = cart.items.find(i => i.id === itemId);
        if (!item) return;

        // Check if add-on already exists
        if (!item.addOns.some(a => a.id === addOn.id)) {
            item.addOns.push(addOn);
            cart.updatedAt = new Date();
            this.notify();
        }
    }

    removeItemAddOn(cartId: string, itemId: string, addOnId: string): void {
        const cart = this.state.carts.find(c => c.id === cartId);
        if (!cart) return;

        const item = cart.items.find(i => i.id === itemId);
        if (!item) return;

        item.addOns = item.addOns.filter(a => a.id !== addOnId);
        cart.updatedAt = new Date();
        this.notify();
    }

    // ============ CUSTOMER OPERATIONS ============

    setCustomer(cartId: string, customer: Customer | null): void {
        const cart = this.state.carts.find(c => c.id === cartId);
        if (!cart) return;

        cart.customer = customer;

        // Update cart name with customer name if set
        if (customer?.name) {
            cart.name = customer.name.split(' ')[0]; // First name only
        }

        cart.updatedAt = new Date();
        this.notify();
    }

    // ============ CHECKOUT ============

    markCartAsProcessed(cartId: string): void {
        // Clear the cart after successful order creation
        this.clearCart(cartId);
    }

    // ============ RESET ============

    resetAll(): void {
        const defaultCart = createEmptyCart(0);
        this.state = {
            carts: [defaultCart],
            activeCartId: defaultCart.id,
            maxCarts: MAX_CARTS,
        };
        this.notify();
    }
}

// ============ SINGLETON EXPORT ============

export const cartManager = new CartManagerService();

// ============ REACT HOOK ============

import { useState, useEffect, useCallback } from 'react';

export function useCartManager() {
    const [state, setState] = useState<CartManager>(cartManager.getState());

    useEffect(() => {
        return cartManager.subscribe(setState);
    }, []);

    const activeCart = state.carts.find(c => c.id === state.activeCartId);
    const totals = activeCart ? calculateCartTotals(activeCart) : null;

    return {
        carts: state.carts,
        activeCart,
        activeCartId: state.activeCartId,
        totals,
        maxCarts: state.maxCarts,
        canCreateCart: state.carts.length < state.maxCarts,

        // Cart operations
        setActiveCart: useCallback((id: string) => cartManager.setActiveCart(id), []),
        createCart: useCallback(() => cartManager.createCart(), []),
        deleteCart: useCallback((id: string) => cartManager.deleteCart(id), []),
        clearCart: useCallback((id: string) => cartManager.clearCart(id), []),
        renameCart: useCallback((id: string, name: string) => cartManager.renameCart(id, name), []),
        updateCart: useCallback((id: string, updates: Partial<Cart>) => cartManager.updateCart(id, updates), []),

        // Item operations
        addItem: useCallback((service: Service) => {
            if (state.activeCartId) {
                return cartManager.addItem(state.activeCartId, service);
            }
        }, [state.activeCartId]),
        updateItem: useCallback((itemId: string, updates: Partial<CartItem>) => {
            if (state.activeCartId) {
                cartManager.updateItem(state.activeCartId, itemId, updates);
            }
        }, [state.activeCartId]),
        updateItemQuantity: useCallback((itemId: string, quantity: number) => {
            if (state.activeCartId) {
                cartManager.updateItemQuantity(state.activeCartId, itemId, quantity);
            }
        }, [state.activeCartId]),
        removeItem: useCallback((itemId: string) => {
            if (state.activeCartId) {
                cartManager.removeItem(state.activeCartId, itemId);
            }
        }, [state.activeCartId]),
        addItemAddOn: useCallback((itemId: string, addOn: AddOn) => {
            if (state.activeCartId) {
                cartManager.addItemAddOn(state.activeCartId, itemId, addOn);
            }
        }, [state.activeCartId]),

        // Customer
        setCustomer: useCallback((customer: Customer | null) => {
            if (state.activeCartId) {
                cartManager.setCustomer(state.activeCartId, customer);
            }
        }, [state.activeCartId]),

        // Checkout
        markAsProcessed: useCallback(() => {
            if (state.activeCartId) {
                cartManager.markCartAsProcessed(state.activeCartId);
            }
        }, [state.activeCartId]),

        // Reset
        resetAll: useCallback(() => cartManager.resetAll(), []),
    };
}

// ============ COMMON ADD-ONS ============

export const COMMON_ADDONS: Record<string, AddOn[]> = {
    'Suit': [
        { id: 'premium-pack', name: 'Premium Packaging', price: 50 },
        { id: 'moth-protect', name: 'Moth Protection', price: 30 },
    ],
    'Shirt': [
        { id: 'light-starch', name: 'Light Starch', price: 10 },
        { id: 'heavy-starch', name: 'Heavy Starch', price: 15 },
        { id: 'no-starch', name: 'No Starch', price: 0 },
    ],
    'Saree': [
        { id: 'silk-care', name: 'Silk Care Treatment', price: 50 },
        { id: 'fold-pleat', name: 'Fold & Pleat', price: 25 },
    ],
    'Blanket': [
        { id: 'deodorize', name: 'Deodorize', price: 30 },
        { id: 'sanitize', name: 'Deep Sanitize', price: 50 },
    ],
    'Curtain': [
        { id: 'hanging', name: 'Hanging Service', price: 100 },
    ],
};

/**
 * Get available add-ons for a service based on name matching
 */
export function getAddOnsForService(serviceName: string): AddOn[] {
    const normalizedName = serviceName.toLowerCase();

    for (const [key, addons] of Object.entries(COMMON_ADDONS)) {
        if (normalizedName.includes(key.toLowerCase())) {
            return addons;
        }
    }

    return [];
}
