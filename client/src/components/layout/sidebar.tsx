/**
 * Sidebar Navigation Component
 * 
 * Provides main navigation for the FabZClean application.
 * Includes links to all major sections with active state indication.
 * 
 * @component
 */

import { Link, useLocation } from 'wouter';
import { Home, ShoppingCart, Users2, LineChart, Package, Settings, Truck, Scissors, User, Server, MapPin, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  /** Navigation destination */
  to: string;
  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;
  /** Link text content */
  children: React.ReactNode;
  /** Test identifier */
  'data-testid'?: string;
}

/**
 * Navigation Link Component
 * 
 * Individual navigation link with active state styling.
 */
const NavLink: React.FC<NavLinkProps> = ({ 
  to, 
  icon: Icon, 
  children, 
  'data-testid': testId 
}) => {
  const [location] = useLocation();
  const isActive = location === to;

  // Generate test ID from route if not provided
  const defaultTestId = `nav-link-${to.replace('/', '') || 'dashboard'}`;

  return (
    <Link
      href={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary"
      )}
      data-testid={testId || defaultTestId}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
};

/**
 * Main Sidebar Component
 * 
 * Renders the application sidebar with navigation links and branding.
 */
export function Sidebar() {
  return (
    <aside 
      className="fixed inset-y-0 left-0 z-10 flex h-full w-60 flex-col border-r bg-background"
      data-testid="main-sidebar"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo/Brand Section */}
      <div 
        className="flex h-16 items-center justify-center border-b px-6"
        data-testid="sidebar-header"
      >
        <Link 
          href="/" 
          className="flex items-center gap-2 font-semibold"
          data-testid="brand-logo-link"
          aria-label="FabZClean home"
        >
          <img 
            src="/assets/logo.webp" 
            alt="FabZClean Logo" 
            className="h-10 w-auto"
            data-testid="brand-logo-image"
          />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav 
        className="flex flex-col gap-2 p-4 font-medium flex-1"
        data-testid="main-navigation"
        aria-label="Primary navigation"
      >
        <NavLink to="/" icon={Home} data-testid="nav-dashboard">
          Dashboard
        </NavLink>
        <NavLink to="/orders" icon={ShoppingCart} data-testid="nav-orders">
          Orders
        </NavLink>
        <NavLink to="/customers" icon={Users2} data-testid="nav-customers">
          Customers
        </NavLink>
        <NavLink to="/services" icon={Scissors} data-testid="nav-services">
          Services
        </NavLink>
        <NavLink to="/inventory" icon={Package} data-testid="nav-inventory">
          Inventory
        </NavLink>
        <NavLink to="/logistics" icon={Truck} data-testid="nav-logistics">
          Logistics
        </NavLink>
        <NavLink to="/live-tracking" icon={MapPin} data-testid="nav-live-tracking">
          Live Tracking
        </NavLink>
        <NavLink to="/documents" icon={FileText} data-testid="nav-documents">
          Documents
        </NavLink>
        <NavLink to="/analytics" icon={LineChart} data-testid="nav-analytics">
          Analytics
        </NavLink>
        <NavLink to="/employee-dashboard" icon={User} data-testid="nav-employee-dashboard">
          Employee Dashboard
        </NavLink>
        <NavLink to="/franchise-dashboard" icon={Users2} data-testid="nav-franchise-dashboard">
          Franchise Dashboard
        </NavLink>
        <NavLink to="/database-status" icon={Server} data-testid="nav-database-status">
          Database Status
        </NavLink>
      </nav>

      {/* Secondary Navigation */}
      <nav 
        className="mt-auto flex flex-col gap-2 p-4"
        data-testid="secondary-navigation"
        aria-label="Secondary navigation"
      >
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          data-testid="nav-settings"
          aria-label="Application settings"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          <span>Settings</span>
        </Link>
      </nav>
    </aside>
  );
}