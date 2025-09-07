import { Link, useLocation } from "wouter";
import { useState } from "react";
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
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden bg-card border border-border rounded-lg p-2 shadow-lg"
      >
        {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r border-border flex-shrink-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16 lg:w-16" : "w-64 lg:w-64",
        "lg:relative lg:translate-x-0",
        "fixed top-0 left-0 h-full z-40 lg:static"
      )}>
        <div className={cn("h-full flex flex-col transition-all duration-300", isCollapsed ? "p-3" : "p-6")}>
          {/* Logo */}
          <div className={cn("flex items-center mb-8", isCollapsed ? "justify-center" : "gap-3")}>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className={cn("transition-all duration-300 overflow-hidden", isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
              <h1 className="text-h2 text-primary font-bold">Fab-Z</h1>
              <p className="text-caption text-muted-foreground">Fab Clean Operations</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md text-sm font-medium transition-all duration-300 sidebar-item",
                    isCollapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className={cn("transition-all duration-300 overflow-hidden", isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
