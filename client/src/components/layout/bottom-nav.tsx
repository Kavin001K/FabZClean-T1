import { Link, useLocation } from "wouter";
import {
    Home,
    ShoppingCart,
    PlusCircle,
    Users2,
    Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BOTTOM_NAV_ITEMS = [
    { to: "/", label: "Home", icon: Home },
    { to: "/orders", label: "Orders", icon: ShoppingCart },
    { to: "/create-order", label: "New", icon: PlusCircle },
    { to: "/customers", label: "Customers", icon: Users2 },
    { to: "/print-queue", label: "Tags", icon: Printer },
];

export function BottomNav() {
    const [location] = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
            <div className="flex items-center justify-around h-16 px-2">
                {BOTTOM_NAV_ITEMS.map((item) => {
                    const isActive = location === item.to;
                    const Icon = item.icon;
                    const isNewOrder = item.to === "/create-order";

                    return (
                        <Link
                            key={item.to}
                            href={item.to}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-lg transition-colors",
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
                                        ? "h-10 w-10 -mt-4 bg-primary text-white shadow-lg"
                                        : "h-6 w-6",
                                    isActive && !isNewOrder && "scale-110"
                                )}
                            >
                                <Icon className={cn(isNewOrder ? "h-5 w-5" : "h-5 w-5")} />
                            </div>
                            <span className={cn("text-[10px] font-medium", isNewOrder && "-mt-0.5")}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
            {/* Safe area for notched devices */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
