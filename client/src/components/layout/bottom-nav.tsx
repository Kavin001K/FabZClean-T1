import { Link, useLocation } from "wouter";
import {
    Home,
    ShoppingCart,
    PlusCircle,
    Users2,
    Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

/** Bottom nav items with role restrictions */
const BOTTOM_NAV_ITEMS = [
    { to: "/", label: "Home", icon: Home, allowedRoles: ["admin", "store_manager", "factory_manager", "store_staff"] },
    { to: "/orders", label: "Orders", icon: ShoppingCart },
    { to: "/create-order", label: "New", icon: PlusCircle, allowedRoles: ["admin", "store_manager", "store_staff"] },
    { to: "/customers", label: "Customers", icon: Users2, allowedRoles: ["admin", "store_manager", "store_staff"] },
    { to: "/wallet-management", label: "Wallet", icon: Wallet, allowedRoles: ["admin", "store_manager", "store_staff"] },
];

export function BottomNav() {
    const [location] = useLocation();
    const { employee } = useAuth();
    const role = employee?.role || 'store_staff';

    const filteredItems = BOTTOM_NAV_ITEMS.filter(item => {
        if (!item.allowedRoles) return true;
        return item.allowedRoles.includes(role);
    });

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:hidden">
            <div className="mx-auto flex h-[4.4rem] w-full max-w-3xl items-center justify-around rounded-[1.8rem] border border-border/70 bg-background/92 px-2 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.48)] backdrop-blur-xl">
                {filteredItems.map((item) => {
                    const isActive = location === item.to;
                    const Icon = item.icon;
                    const isNewOrder = item.to === "/create-order";

                    return (
                        <Link
                            key={item.to}
                            href={item.to}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 transition-all",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                                isNewOrder && !isActive && "text-primary"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-center rounded-full transition-all",
                                    isNewOrder
                                        ? "h-11 w-11 -mt-5 bg-primary text-white shadow-lg"
                                        : "h-9 w-9 bg-transparent",
                                    isActive && !isNewOrder && "scale-105 bg-primary/10 text-primary"
                                )}
                            >
                                <Icon className={cn(isNewOrder ? "h-5 w-5" : "h-5 w-5")} />
                            </div>
                            <span className={cn("max-w-full truncate px-0.5 text-[10px] font-semibold", isNewOrder && "-mt-0.5")}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
