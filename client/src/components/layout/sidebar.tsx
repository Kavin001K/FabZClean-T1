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
  PlusCircle,
  Settings,
  HelpCircle,
  Command,
  Search,
  Bell,
  Maximize2,
  Minimize2,
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, shortcut: "⌘1", badge: null },
  { name: "Orders", href: "/orders", icon: ShoppingCart, shortcut: "⌘2", badge: "5" },
  { name: "Services", href: "/services", icon: Package, shortcut: "⌘3", badge: null },
  { name: "Create Order", href: "/create-order", icon: PlusCircle, shortcut: "⌘N", badge: null },
  { name: "Tracking", href: "/tracking", icon: Truck, shortcut: "⌘4", badge: "2" },
  { name: "Customers", href: "/customers", icon: Users, shortcut: "⌘5", badge: null },
  { name: "Analytics", href: "/analytics", icon: BarChart3, shortcut: "⌘6", badge: null },
];

const secondaryNavigation = [
  { name: "Inventory", href: "/inventory", icon: Package, shortcut: "⌘7", badge: "3" },
  { name: "Settings", href: "/settings", icon: Settings, shortcut: "⌘,", badge: null },
  { name: "Help", href: "/help", icon: HelpCircle, shortcut: "⌘?", badge: null },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function Sidebar({ isOpen, isCollapsed, onToggle, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard shortcuts for desktop
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            window.location.href = '/';
            break;
          case '2':
            event.preventDefault();
            window.location.href = '/orders';
            break;
          case '3':
            event.preventDefault();
            window.location.href = '/services';
            break;
          case '4':
            event.preventDefault();
            window.location.href = '/tracking';
            break;
          case '5':
            event.preventDefault();
            window.location.href = '/customers';
            break;
          case '6':
            event.preventDefault();
            window.location.href = '/analytics';
            break;
          case '7':
            event.preventDefault();
            window.location.href = '/inventory';
            break;
          case 'n':
            event.preventDefault();
            window.location.href = '/create-order';
            break;
          case ',':
            event.preventDefault();
            window.location.href = '/settings';
            break;
          case '/':
            event.preventDefault();
            setSearchQuery('');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredNavigation = navigation.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSecondaryNavigation = secondaryNavigation.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TooltipProvider>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out",
        "lg:translate-x-0 lg:static lg:inset-auto",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-16" : "w-72"
      )}>
        {/* Desktop Window Controls */}
        <div className="hidden lg:flex items-center justify-end gap-1 p-2 border-b">
          <button className="h-6 w-6 p-0 hover:bg-muted rounded flex items-center justify-center">
            <Minimize2 className="h-3 w-3" />
          </button>
          <button className="h-6 w-6 p-0 hover:bg-muted rounded flex items-center justify-center">
            <Square className="h-3 w-3" />
          </button>
          <button className="h-6 w-6 p-0 hover:bg-red-500 hover:text-white rounded flex items-center justify-center">
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Header */}
        <div className="flex h-16 items-center justify-between p-4 border-b">
          <Link href="/">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.webp" alt="FabZClean" className="h-10 w-auto" />
              {!isCollapsed && (
                <div>
                  <h1 className="font-bold text-lg">FabZClean</h1>
                  <p className="text-xs text-muted-foreground">Desktop App</p>
                </div>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 p-0 hover:bg-muted rounded flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 p-0 hover:bg-muted rounded flex items-center justify-center" onClick={onToggle}>
              {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search navigation... (⌘/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted/50 group",
                        isActive && "text-primary bg-primary/10 border border-primary/20",
                        isCollapsed && "justify-center px-2"
                      )}
                      onClick={onClose}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.shortcut}
                          </span>
                        </>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.shortcut}</span>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>

          {/* Secondary Navigation */}
          {!isCollapsed && (
            <div className="pt-4 border-t">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Tools
              </p>
              <div className="space-y-1">
                {filteredSecondaryNavigation.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted/50 group",
                        isActive && "text-primary bg-primary/10 border border-primary/20"
                      )}
                      onClick={onClose}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.shortcut}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Command className="h-4 w-4" />
              <span>Use ⌘ + number for quick navigation</span>
            </div>
          </div>
        )}
      </aside>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </TooltipProvider>
  );
}