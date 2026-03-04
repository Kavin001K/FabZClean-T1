import { Link, useLocation } from "wouter";
import {
  Home,
  ShoppingCart,
  Users2,
  Settings,
  Printer,
  PlusCircle,
  ListOrdered,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  { to: "/services", label: "Services", icon: Scissors },
  { to: "/print-queue", label: "Print Tags", icon: Printer },
];

const NavLink = ({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => {
  const [location] = useLocation();
  const isActive = location === to;

  return (
    <Link
      href={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
};

export function Sidebar() {
  const { employee, isAdmin } = useAuth();

  const filteredNav = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex h-full w-60 flex-col border-r bg-background">
      <div className="flex h-16 items-center justify-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <img src="/assets/logo.webp" alt="FabzClean Logo" className="h-10 w-auto" />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-2 p-4 font-medium overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50">
        {filteredNav.map((item) => (
          <NavLink key={item.to} to={item.to} icon={item.icon}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={(employee as any)?.profileImage || ''} alt={employee?.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {employee?.fullName?.[0]?.toUpperCase() ?? employee?.username?.[0]?.toUpperCase() ?? "E"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-tight">
              {employee?.fullName ?? employee?.username ?? "Employee"}
            </p>
            <p className="text-xs text-muted-foreground">
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
          className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}