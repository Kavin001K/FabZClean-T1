import { useSettings } from "@/contexts/settings-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusCircle, QrCode, Search, Truck, Calculator, Users,
  FileText, Receipt, Settings, Package, BarChart3, RefreshCw, ShieldCheck, Wallet
} from "lucide-react";
import { useLocation, Link } from "wouter";

// Define all possible actions with their metadata
const ACTIONS_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  route: string;
  color: string;
  description?: string;
}> = {
  'new-order': {
    label: 'New Order',
    icon: PlusCircle,
    route: '/create-order',
    color: 'text-green-500',
    description: 'Create a new customer order'
  },
  'active-orders': {
    label: 'Orders',
    icon: Receipt,
    route: '/orders',
    color: 'text-blue-500',
    description: 'View active orders'
  },
  'customer-search': {
    label: 'Customers',
    icon: Users,
    route: '/customers',
    color: 'text-purple-500',
    description: 'Manage customers'
  },
  'services': {
    label: 'Services',
    icon: Settings,
    route: '/services',
    color: 'text-orange-500',
    description: 'Manage services'
  },
  'print-queue': {
    label: 'Print Tags',
    icon: FileText,
    route: '/print-queue',
    color: 'text-indigo-500',
    description: 'Print garment tags'
  },
  'reports': {
    label: 'Reports',
    icon: BarChart3,
    route: '/reports',
    color: 'text-pink-500',
    description: 'View business reports'
  },
  'updates': {
    label: 'Updates',
    icon: RefreshCw,
    route: '/updates',
    color: 'text-teal-500',
    description: 'View system updates'
  },
  'user-management': {
    label: 'Users',
    icon: ShieldCheck,
    route: '/user-management',
    color: 'text-red-500',
    description: 'Manage staff accounts'
  },
  'wallet-management': {
    label: 'Wallet',
    icon: Wallet,
    route: '/wallet-management',
    color: 'text-emerald-500',
    description: 'Manage customer wallets'
  },
};

// Props interface for backward compatibility (unused but keeps TypeScript happy)
interface DashboardQuickActionsProps {
  onQuickAction?: (action: string, data?: any) => void;
  isCustomerDialogOpen?: boolean;
  isOrderDialogOpen?: boolean;
  isEmployeeDialogOpen?: boolean;
  onCloseDialog?: (dialogType: string) => void;
  quickActionForms?: any;
  updateQuickActionForm?: (formType: string, updates: any) => void;
  resetQuickActionForm?: (formType: string) => void;
  isSubmittingCustomer?: boolean;
  isSubmittingOrder?: boolean;
  isSubmittingEmployee?: boolean;
}

export function DashboardQuickActions(_props: DashboardQuickActionsProps = {}) {
  const { settings } = useSettings();
  const [, setLocation] = useLocation();

  // Get the quick actions from settings
  const quickActions = settings?.quickActions || ['new-order', 'active-orders', 'customer-search', 'services', 'print-queue'];

  // Build the list of enabled actions from settings
  const enabledActions = quickActions
    .map(id => {
      const config = ACTIONS_CONFIG[id];
      if (!config) {
        console.warn(`[DashboardQuickActions] Unknown action ID: ${id}`);
        return null;
      }
      return { id, ...config };
    })
    .filter((action): action is NonNullable<typeof action> => action !== null);



  // Fallback if no actions configured
  if (enabledActions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <p className="text-sm text-muted-foreground text-center">
            No quick actions configured.
          </p>
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure in Settings
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Settings className="h-4 w-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {enabledActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="flex h-20 flex-col items-start justify-center gap-1 rounded-2xl border-border bg-background px-4 text-left hover:bg-muted"
                onClick={() => setLocation(action.route)}
              >
                <IconComponent className={`h-5 w-5 ${action.color}`} />
                <span className="text-sm font-semibold text-foreground">{action.label}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">{action.description}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Default export for compatibility
export default DashboardQuickActions;
