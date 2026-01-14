import { useSettings } from "@/contexts/settings-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, QrCode, Search, Truck, Calculator, Users } from "lucide-react";
import { useLocation } from "wouter";

// Define all possible actions with their metadata
const AVAILABLE_ACTIONS = {
  'new-order': { label: 'New Order', icon: PlusCircle, route: '/create-order', color: 'text-green-500' },
  'scan-qr': { label: 'Scan QR', icon: QrCode, route: '/orders', color: 'text-blue-500' },
  'customer-search': { label: 'Find Customer', icon: Search, route: '/customers', color: 'text-purple-500' },
  'transit': { label: 'Transit', icon: Truck, route: '/transit-orders', color: 'text-orange-500' },
  'expenses': { label: 'Expenses', icon: Calculator, route: '/accounting', color: 'text-red-500' },
  'staff': { label: 'Staff', icon: Users, route: '/employees', color: 'text-indigo-500' },
  'transit-batch': { label: 'Transit Batch', icon: Truck, route: '/transit-orders', color: 'text-orange-500' },
  'add-expense': { label: 'Add Expense', icon: Calculator, route: '/accounting', color: 'text-red-500' },
  'daily-report': { label: 'Daily Report', icon: Calculator, route: '/reports', color: 'text-indigo-500' },
};

export function DashboardQuickActions() {
  const { settings } = useSettings();
  const [, setLocation] = useLocation();

  // 1. Get enabled actions from settings
  // 2. Map them to the config above
  // 3. Filter out any invalid IDs
  const enabledActions = settings.quickActionSlots
    .map(id => {
      const action = AVAILABLE_ACTIONS[id as keyof typeof AVAILABLE_ACTIONS];
      return action ? { id, ...action } : null;
    })
    .filter((action): action is ({ id: string } & typeof AVAILABLE_ACTIONS['new-order']) => action !== null);

  if (enabledActions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">No quick actions configured. Go to Settings to add some.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {enabledActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            className="h-24 flex flex-col gap-2 hover:bg-accent/50 hover:border-primary/50 transition-all"
            onClick={() => setLocation(action.route)}
          >
            <action.icon className={`h-8 w-8 ${action.color}`} />
            <span className="font-semibold">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
