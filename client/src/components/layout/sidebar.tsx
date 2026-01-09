import { Link, useLocation } from "wouter";
import {
  Home,
  ShoppingCart,
  Users2,
  LineChart,
  Package,
  Settings,
  Truck,
  Scissors,
  User,
  Server,
  MapPin,
  FileText,
  Calculator,
  Shield,
  Building2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: Home,
    roles: ["admin"],
  },
  {
    to: "/franchise-dashboard",
    label: "Dashboard",
    icon: Home,
    roles: ["franchise_manager", "manager"],
  },
  {
    to: "/factory-dashboard",
    label: "Factory Dashboard",
    icon: Home,
    roles: ["factory_manager"],
  },
  {
    to: "/franchise-management",
    label: "Franchises",
    icon: Building2,
    roles: ["admin"],
  },
  {
    to: "/employee-dashboard",
    label: "Dashboard",
    icon: Home,
    roles: ["employee", "driver", "staff"],
  },
  {
    to: "/orders",
    label: "Orders",
    icon: ShoppingCart,
    roles: ["admin", "employee", "franchise_manager", "manager", "factory_manager", "staff"],
  },
  {
    to: "/customers",
    label: "Customers",
    icon: Users2,
    roles: ["admin", "employee", "franchise_manager", "manager", "staff"],
  },
  {
    to: "/transit-orders",
    label: "Transit Orders",
    icon: Truck,
    roles: ["admin", "franchise_manager", "manager", "factory_manager"],
  },
  {
    to: "/services",
    label: "Services",
    icon: Scissors,
    roles: ["admin", "franchise_manager", "manager"],
  },
  {
    to: "/inventory",
    label: "Inventory",
    icon: Package,
    roles: ["admin", "factory_manager"], // Only admin and factory_manager
  },
  {
    to: "/documents",
    label: "Documents",
    icon: FileText,
    roles: ["admin", "franchise_manager", "manager", "staff"],
  },
  {
    to: "/accounting",
    label: "Accounting",
    icon: Calculator,
    roles: ["admin", "franchise_manager", "manager"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["admin", "franchise_manager", "manager"],
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: LineChart,
    roles: ["admin", "franchise_manager", "manager", "factory_manager"],
  },
  {
    to: "/users",
    label: "User Management",
    icon: Shield,
    roles: ["admin", "franchise_manager", "manager"],
  },
  {
    to: "/database-status",
    label: "Database Status",
    icon: Server,
    roles: ["admin"],
  },
  {
    to: "/admin/audit-logs",
    label: "Audit Logs",
    icon: Shield,
    roles: ["admin", "franchise_manager", "manager"],
  },
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
  const { employee } = useAuth();

  const filteredNav = NAV_ITEMS.filter((item) =>
    employee ? item.roles.includes(employee.role) : false,
  );

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
        {filteredNav.length === 0 && (
          <div className="flex flex-col items-center rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            <Shield className="mb-2 h-5 w-5" />
            No modules assigned to your role yet.
          </div>
        )}
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
            {employee?.role === 'admin' && 'Administrator'}
            {employee?.role === 'franchise_manager' && 'Franchise Manager'}
            {employee?.role === 'manager' && 'Manager'}
            {employee?.role === 'factory_manager' && 'Factory Manager'}
            {employee?.role === 'employee' && 'Employee'}
            {employee?.role === 'driver' && 'Driver'}
            {employee?.role === 'staff' && 'Staff'}
            {!['admin', 'franchise_manager', 'manager', 'factory_manager', 'employee', 'driver', 'staff'].includes(employee?.role || '') && (employee?.role || 'Unknown')}
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