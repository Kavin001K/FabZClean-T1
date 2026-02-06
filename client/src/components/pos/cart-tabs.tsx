import { Plus, X, ShoppingBag, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Cart } from '@/lib/cart-manager';

interface CartTabsProps {
    carts: Cart[];
    activeCartId: string | null;
    maxCarts: number;
    onSelectCart: (id: string) => void;
    onCreateCart: () => void;
    onDeleteCart: (id: string) => void;
    onClearCart: (id: string) => void;
    onRenameCart: (id: string, name: string) => void;
}

export function CartTabs({
    carts,
    activeCartId,
    maxCarts,
    onSelectCart,
    onCreateCart,
    onDeleteCart,
    onClearCart,
    onRenameCart
}: CartTabsProps) {

    return (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 px-1">
            {carts.map((cart, index) => {
                const isActive = cart.id === activeCartId;
                const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                    <ContextMenu key={cart.id}>
                        <ContextMenuTrigger>
                            <button
                                onClick={() => onSelectCart(cart.id)}
                                className={cn(
                                    "group relative flex items-center gap-2 pl-3 pr-8 py-1.5 min-w-[120px] max-w-[180px] rounded-t-lg transition-all border-t border-x",
                                    isActive
                                        ? "bg-slate-900 border-slate-700 text-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
                                        : "bg-slate-950/40 border-transparent text-slate-500 hover:bg-slate-900/40 hover:text-slate-300"
                                )}
                            >
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    isActive ? "bg-primary animate-pulse" : "bg-slate-600"
                                )} />

                                <span className="text-xs font-medium truncate flex-1 text-left">
                                    {cart.name}
                                </span>

                                {itemCount > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[9px] min-w-[16px] justify-center bg-slate-800 text-slate-300">
                                        {itemCount}
                                    </Badge>
                                )}

                                {carts.length > 1 && (
                                    <div
                                        className={cn(
                                            "absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-sm hover:bg-red-500/20 hover:text-red-500",
                                            isActive && "opacity-100 text-slate-500"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteCart(cart.id);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </div>
                                )}
                            </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={() => {
                                const newName = prompt("Rename Cart", cart.name);
                                if (newName) onRenameCart(cart.id, newName);
                            }}>
                                <Edit2 className="h-4 w-4 mr-2" /> Rename
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => onClearCart(cart.id)} className="text-destructive">
                                <X className="h-4 w-4 mr-2" /> Clear Cart
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                );
            })}

            {carts.length < maxCarts && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full ml-1 hover:bg-primary/20 hover:text-primary transition-colors"
                            onClick={onCreateCart}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>New Cart (Ctrl+B)</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

export function CartSwitcherMobile({ carts, activeCartId, onSelectCart, onCreateCart, maxCarts }: any) {
    // Simplified mobile version if needed
    return null;
}
