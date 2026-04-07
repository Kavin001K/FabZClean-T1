import { Link, useLocation } from "wouter";
import {
  Home,
  Users2,
  Settings,
  Printer,
  PlusCircle,
  ListOrdered,
  Scissors,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ROLE_MAP } from "../../../../shared/schema";
import type { SystemRole } from "../../../../shared/schema";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** If set, only these roles see this item */
  allowedRoles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/create-order", label: "New Order", icon: PlusCircle, allowedRoles: ["admin", "store_manager", "store_staff"] },
  { to: "/orders", label: "Active Orders", icon: ListOrdered },
  { to: "/customers", label: "Customers", icon: Users2, allowedRoles: ["admin", "store_manager", "store_staff"] },
  { to: "/wallet-management", label: "Wallet", icon: Wallet, allowedRoles: ["admin", "store_manager", "store_staff"] },
  { to: "/user-management", label: "Users", icon: ShieldCheck, allowedRoles: ["admin"] },
  { to: "/services", label: "Services", icon: Scissors, allowedRoles: ["admin", "store_manager"] },
  { to: "/print-queue", label: "Print Tags", icon: Printer },
];

export function Sidebar({ className, onClose }: { className?: string; onClose?: () => void }) {
  const { employee, isAdmin, signOut } = useAuth();
  const [location] = useLocation();
  const role = (employee?.role || 'store_staff') as SystemRole;
  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  // Filter nav items by role
  const filteredNav = NAV_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true; // Visible to all logged-in users
    return item.allowedRoles.includes(role);
  });

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  // Friendly role label from ROLE_MAP
  const roleInfo = ROLE_MAP[role];
  const roleLabel = roleInfo?.position || (isAdmin ? 'Administrator' : 'Staff');

  return (
    <aside className={cn("flex h-full min-h-0 min-w-0 flex-col rounded-[1.75rem] border border-border/70 bg-card/85 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl", className)}>
      <div className="p-4">
        <Link href="/" onClick={handleLinkClick} className="flex min-w-0 items-start gap-3 rounded-[1.4rem] border border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.22),transparent_48%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(249,250,251,0.92))] px-4 py-4 shadow-sm dark:bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.16),transparent_48%),linear-gradient(135deg,rgba(31,41,55,0.96),rgba(17,24,39,0.95))]">
          <img src="/assets/logo.webp" alt="FabzClean Logo" className="h-11 w-auto shrink-0 rounded-2xl bg-white/80 p-1.5 shadow-sm" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">FabzClean</p>
            <h2 className="mt-1 truncate text-base font-semibold text-foreground">Operations Console</h2>
            <p className="mt-1 text-xs text-muted-foreground">Orders, customers, printing and store flow in one place.</p>
            <div className="mt-3 inline-flex items-center rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {todayLabel}
            </div>
          </div>
        </Link>
      </div>
      <nav className="scrollbar-thin flex flex-1 min-h-0 flex-col gap-1.5 overflow-y-auto overscroll-contain scroll-smooth px-4 pb-2 font-medium">
        {filteredNav.map((item) => {
          const isActive = item.to === "/"
            ? location === "/" || location === "/dashboard"
            : location === item.to || location.startsWith(`${item.to}/`);

          return (
            <Link
              key={item.to}
              href={item.to}
              onClick={handleLinkClick}
              className={cn(
                "group flex min-w-0 items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm transition-all duration-200",
                isActive
                  ? "border-primary/25 bg-primary/10 font-semibold text-primary shadow-sm"
                  : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <span className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                isActive ? "bg-primary/15 text-primary" : "bg-muted/70 text-muted-foreground group-hover:bg-background group-hover:text-foreground"
              )}>
                <item.icon className="h-4 w-4" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/70 p-4">
        <div className="rounded-[1.4rem] border border-border/70 bg-muted/35 p-3.5">
          <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={employee?.avatarUrl || (employee as any)?.profileImage || ''} alt={employee?.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {employee?.fullName?.[0]?.toUpperCase() ?? employee?.username?.[0]?.toUpperCase() ?? "E"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {employee?.fullName ?? employee?.username ?? "Employee"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {employee?.email ?? employee?.employeeId ?? "No email"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Role</span>
          <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
            {roleLabel}
          </span>
        </div>
        </div>
        <Link
          href="/settings"
          onClick={handleLinkClick}
          className={cn(
            "mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary",
            !["admin", "store_manager", "factory_manager"].includes(role) && "hidden"
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => { await signOut(); window.location.href = '/login'; }}
          className="mt-1 w-full justify-start gap-3 rounded-2xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
