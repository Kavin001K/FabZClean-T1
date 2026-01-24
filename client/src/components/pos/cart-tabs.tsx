/**
 * ============================================================================
 * POS CART TABS COMPONENT
 * ============================================================================
 * 
 * Multi-cart tab strip for the POS system.
 * Features:
 * - Visual tabs with customer names/cart colors
 * - Add new cart button
 * - Close/delete cart
 * - Item count badges
 * - Active cart indicator
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ShoppingCart, User, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Cart, calculateCartTotals } from '@/lib/cart-manager';

interface CartTabsProps {
    carts: Cart[];
    activeCartId: string;
    maxCarts: number;
    onSelectCart: (cartId: string) => void;
    onCreateCart: () => void;
    onDeleteCart: (cartId: string) => void;
    onClearCart: (cartId: string) => void;
    onRenameCart: (cartId: string, name: string) => void;
}

export function CartTabs({
    carts,
    activeCartId,
    maxCarts,
    onSelectCart,
    onCreateCart,
    onDeleteCart,
    onClearCart,
    onRenameCart,
}: CartTabsProps) {
    const [editingCartId, setEditingCartId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleStartRename = (cart: Cart) => {
        setEditingCartId(cart.id);
        setEditName(cart.name);
    };

    const handleFinishRename = () => {
        if (editingCartId && editName.trim()) {
            onRenameCart(editingCartId, editName.trim());
        }
        setEditingCartId(null);
        setEditName('');
    };

    const canAddCart = carts.length < maxCarts;

    return (
        <div className="flex items-center gap-1 p-2 bg-muted/30 rounded-t-xl border-b overflow-x-auto">
            <AnimatePresence mode="popLayout">
                {carts.map((cart, index) => {
                    const totals = calculateCartTotals(cart);
                    const isActive = cart.id === activeCartId;
                    const isEditing = editingCartId === cart.id;

                    return (
                        <motion.div
                            key={cart.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="relative group"
                        >
                            <button
                                onClick={() => onSelectCart(cart.id)}
                                className={cn(
                                    "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all min-w-[120px] max-w-[180px]",
                                    isActive
                                        ? "bg-white dark:bg-slate-800 shadow-md"
                                        : "bg-transparent hover:bg-white/50 dark:hover:bg-slate-800/50"
                                )}
                                style={{
                                    borderBottom: isActive ? `3px solid ${cart.color}` : 'none',
                                }}
                            >
                                {/* Cart Color Indicator */}
                                <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: cart.color }}
                                />

                                {/* Cart Name / Customer */}
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={handleFinishRename}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleFinishRename();
                                            if (e.key === 'Escape') setEditingCartId(null);
                                        }}
                                        className="w-20 px-1 py-0.5 text-sm font-medium bg-transparent border-b border-primary outline-none"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        {cart.customer ? (
                                            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        ) : (
                                            <ShoppingCart className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        )}
                                        <span className={cn(
                                            "text-sm font-medium truncate",
                                            isActive ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {cart.customer?.name?.split(' ')[0] || cart.name}
                                        </span>
                                    </div>
                                )}

                                {/* Item Count Badge */}
                                {totals.itemCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "h-5 min-w-[20px] px-1.5 text-xs font-bold",
                                            isActive && "bg-primary/10 text-primary"
                                        )}
                                    >
                                        {totals.itemCount}
                                    </Badge>
                                )}

                                {/* Keyboard shortcut hint */}
                                <kbd className="hidden group-hover:inline-block text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground ml-auto">
                                    {index + 1 <= 5 ? `⌃${index + 1}` : ''}
                                </kbd>
                            </button>

                            {/* Cart Options Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className={cn(
                                            "absolute -top-1 -right-1 p-1 rounded-full bg-white dark:bg-slate-800 shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity",
                                            isActive && "opacity-100"
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => handleStartRename(cart)}>
                                        Rename Cart
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onClearCart(cart.id)}
                                        disabled={totals.itemCount === 0}
                                    >
                                        Clear Items
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDeleteCart(cart.id)}
                                        className="text-destructive focus:text-destructive"
                                        disabled={carts.length <= 1}
                                    >
                                        Delete Cart
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Add New Cart Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCreateCart}
                        disabled={!canAddCart}
                        className={cn(
                            "h-9 w-9 p-0 rounded-lg border-2 border-dashed",
                            canAddCart
                                ? "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
                                : "border-muted-foreground/10 opacity-50"
                        )}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {canAddCart
                        ? `New Cart (F3) • ${maxCarts - carts.length} remaining`
                        : `Maximum ${maxCarts} carts allowed`
                    }
                </TooltipContent>
            </Tooltip>

            {/* Cart Count */}
            <div className="ml-auto text-xs text-muted-foreground px-2">
                {carts.length}/{maxCarts} carts
            </div>
        </div>
    );
}

/**
 * Compact cart switcher for mobile
 */
export function CartSwitcherMobile({
    carts,
    activeCartId,
    onSelectCart,
    onCreateCart,
    maxCarts,
}: {
    carts: Cart[];
    activeCartId: string;
    onSelectCart: (cartId: string) => void;
    onCreateCart: () => void;
    maxCarts: number;
}) {
    const activeCart = carts.find(c => c.id === activeCartId);
    const totals = activeCart ? calculateCartTotals(activeCart) : null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: activeCart?.color }}
                    />
                    <span className="max-w-[100px] truncate">
                        {activeCart?.customer?.name?.split(' ')[0] || activeCart?.name || 'Cart'}
                    </span>
                    {totals && totals.itemCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5">
                            {totals.itemCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {carts.map((cart) => {
                    const cartTotals = calculateCartTotals(cart);
                    const isActive = cart.id === activeCartId;

                    return (
                        <DropdownMenuItem
                            key={cart.id}
                            onClick={() => onSelectCart(cart.id)}
                            className={cn(isActive && "bg-primary/10")}
                        >
                            <div
                                className="w-2.5 h-2.5 rounded-full mr-2"
                                style={{ backgroundColor: cart.color }}
                            />
                            <span className="flex-1 truncate">
                                {cart.customer?.name?.split(' ')[0] || cart.name}
                            </span>
                            {cartTotals.itemCount > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {cartTotals.itemCount}
                                </Badge>
                            )}
                        </DropdownMenuItem>
                    );
                })}

                {carts.length < maxCarts && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onCreateCart}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Cart
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
