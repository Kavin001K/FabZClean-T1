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
  ActivitySquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/create-order", label: "New Order", icon: PlusCircle },
  { to: "/orders", label: "Active Orders", icon: ListOrdered },
  { to: "/customers", label: "Customers", icon: Users2 },
  { to: "/wallet-management", label: "Wallet", icon: Wallet },
  { to: "/user-management", label: "Users", icon: ShieldCheck, adminOnly: true },
  { to: "/services", label: "Services", icon: Scissors },
  { to: "/print-queue", label: "Print Tags", icon: Printer },
];

export function Sidebar({ className, onClose }: { className?: string; onClose?: () => void }) {
  const { employee, isAdmin, signOut } = useAuth();
  const [location] = useLocation();

  const filteredNav = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={cn("sticky top-0 flex h-[100dvh] min-h-0 w-60 min-w-0 flex-col border-r bg-background", className)}>
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/" onClick={handleLinkClick} className="flex min-w-0 items-center gap-2 font-semibold">
          <img src="/assets/logo.webp" alt="FabzClean Logo" className="h-9 w-auto" />
        </Link>
      </div>
      <nav className="scrollbar-thin flex flex-1 min-h-0 flex-col gap-1 overflow-y-auto overscroll-contain scroll-smooth p-4 font-medium">
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
                "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-primary/5 hover:text-primary",
                isActive ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={(employee as any)?.profileImage || ''} alt={employee?.fullName} />
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
          <span className="font-medium text-primary">
            {employee?.role === 'admin' ? 'Administrator' : 'Staff'}
          </span>
        </div>
        <Link
          href="/settings"
          onClick={handleLinkClick}
          className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="mt-1 w-full justify-start gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
