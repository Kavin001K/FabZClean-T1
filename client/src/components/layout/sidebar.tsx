import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  Users, 
  Home,
  Zap,
  Menu,
  X,
  ClipboardList,
  Map,
  PlusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Services", href: "/services", icon: Package },
  { name: "Create Order", href: "/create-order", icon: PlusCircle },
  { name: "Tracking", href: "/tracking", icon: Truck },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function Sidebar({ isOpen, isCollapsed, onToggle, onClose }: SidebarProps) {
  const [location] = useLocation();

  return (
    <>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-card transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex h-16 items-center justify-between p-4">
          <Link href="/">
            <div className="flex items-center gap-2">
              <img src="/assets/logo.webp" alt="FabZClean" className="h-100 w-auto" />
            </div>
          </Link>
          <button onClick={onToggle} className="hidden lg:block">
            {isCollapsed ? <Menu className="w-7 h-7" /> : <X className="w-7 h-7" />}
          </button>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "text-primary bg-muted",
                  isCollapsed && "justify-center"
                )}
                onClick={onClose}
              >
                {/* ✅ MODIFIED LINE BELOW */}
                <item.icon className="h-8 w-8 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}