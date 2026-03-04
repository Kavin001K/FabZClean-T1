import { useSettings } from "@/contexts/settings-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusCircle, QrCode, Search, Truck, Calculator, Users,
  FileText, Receipt, Settings, Package
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

  // Get the quick action slots from settings
  const quickActionSlots = settings?.quickActionSlots || ['new-order', 'active-orders', 'customer-search', 'services', 'print-queue'];

  // Build the list of enabled actions from settings
  const enabledActions = quickActionSlots
    .map(id => {
      const config = ACTIONS_CONFIG[id];
      if (!config) {
        console.warn(`[DashboardQuickActions] Unknown action ID: ${id}`);
        return null;
      }
      return { id, ...config };
    })
    .filter((action): action is NonNullable<typeof action> => action !== null);

  // Debug logging
  if (settings?.debugMode) {
    console.log('[DashboardQuickActions] Settings quick action slots:', quickActionSlots);
    console.log('[DashboardQuickActions] Enabled actions:', enabledActions.map(a => a.id));
  }

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {enabledActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:bg-accent/50 hover:border-primary/50 transition-all group"
                onClick={() => setLocation(action.route)}
              >
                <IconComponent className={`h-8 w-8 ${action.color} group-hover:scale-110 transition-transform`} />
                <span className="font-semibold text-sm">{action.label}</span>
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

