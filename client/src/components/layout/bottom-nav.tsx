import { Link, useLocation } from "wouter";
import {
    Home,
    ShoppingCart,
    CalendarDays,
    Users2,
    Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

/** Bottom nav items with role restrictions */
const BOTTOM_NAV_ITEMS = [
    { to: "/", label: "Home", icon: Home, allowedRoles: ["admin", "store_manager", "factory_manager", "store_staff"] },
    { to: "/orders", label: "Orders", icon: ShoppingCart },
    { to: "/booking", label: "Booking", icon: CalendarDays, allowedRoles: ["admin", "store_manager", "store_staff"] },
    { to: "/customers", label: "Customers", icon: Users2, allowedRoles: ["admin", "store_manager", "store_staff"] },
    { to: "/updates", label: "Updates", icon: Bell, allowedRoles: ["admin", "store_manager", "store_staff", "factory_manager"] },
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
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/96 lg:hidden">
            <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-around px-1.5 sm:px-2">
                {filteredItems.map((item) => {
                    const isActive = location === item.to;
                    const Icon = item.icon;
                    const isBooking = item.to === "/booking";

                    return (
                        <Link
                            key={item.to}
                            href={item.to}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 transition-all",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <div
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                                    isBooking
                                        ? "bg-primary text-white"
                                        : "bg-transparent",
                                    isActive && !isBooking && "bg-primary/10 text-primary"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            <span className="max-w-full truncate px-0.5 text-[10px] font-medium">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
