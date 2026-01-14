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
  'scan-qr': {
    label: 'Scan QR',
    icon: QrCode,
    route: '/orders?scan=true',
    color: 'text-blue-500',
    description: 'Scan order QR code'
  },
  'customer-search': {
    label: 'Find Customer',
    icon: Search,
    route: '/customers',
    color: 'text-purple-500',
    description: 'Search for a customer'
  },
  'transit': {
    label: 'Transit',
    icon: Truck,
    route: '/transit-orders',
    color: 'text-orange-500',
    description: 'View transit orders'
  },
  'transit-batch': {
    label: 'Transit Batch',
    icon: Package,
    route: '/transit-orders',
    color: 'text-orange-600',
    description: 'Manage transit batches'
  },
  'expenses': {
    label: 'Expenses',
    icon: Calculator,
    route: '/accounting',
    color: 'text-red-500',
    description: 'View expenses'
  },
  'add-expense': {
    label: 'Add Expense',
    icon: Receipt,
    route: '/accounting?action=add',
    color: 'text-red-600',
    description: 'Record a new expense'
  },
  'staff': {
    label: 'Staff',
    icon: Users,
    route: '/users',
    color: 'text-indigo-500',
    description: 'Manage staff members'
  },
  'daily-report': {
    label: 'Daily Report',
    icon: FileText,
    route: '/reports',
    color: 'text-teal-500',
    description: 'View daily reports'
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
  const quickActionSlots = settings?.quickActionSlots || ['new-order', 'scan-qr', 'customer-search'];

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
