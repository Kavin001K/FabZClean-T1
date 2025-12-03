/**
 * Dashboard Quick Actions Component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onQuickAction - Quick action handler
 * @param {boolean} props.isCustomerDialogOpen - Customer dialog state
 * @param {boolean} props.isOrderDialogOpen - Order dialog state
 * @param {boolean} props.isEmployeeDialogOpen - Employee dialog state
 * @param {Function} props.onCloseDialog - Dialog close handler
 * @param {Object} props.quickActionForms - Quick action form data
 * @param {Function} props.updateQuickActionForm - Form update handler
 * @param {Function} props.resetQuickActionForm - Form reset handler
 * @param {boolean} props.isSubmittingCustomer - Customer submission state
 * @param {boolean} props.isSubmittingOrder - Order submission state
 * @param {boolean} props.isSubmittingEmployee - Employee submission state
 * @returns {JSX.Element} Rendered quick actions component
 * 
 * @example
 * ```tsx
 * <DashboardQuickActions
 *   onQuickAction={handleQuickAction}
 *   isCustomerDialogOpen={false}
 *   isOrderDialogOpen={false}
 *   isEmployeeDialogOpen={false}
 *   onCloseDialog={handleCloseDialog}
 *   quickActionForms={quickActionForms}
 *   updateQuickActionForm={updateQuickActionForm}
 *   resetQuickActionForm={resetQuickActionForm}
 *   isSubmittingCustomer={false}
 *   isSubmittingOrder={false}
 *   isSubmittingEmployee={false}
 * />
 * ```
 */

import React from 'react';
import { PlusCircle, UserPlus, ShoppingBag, Users, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import { useLocation } from 'wouter';

interface DashboardQuickActionsProps {
  /** Quick action handler */
  onQuickAction: (action: string, data: any) => void;
  /** Customer dialog state */
  isCustomerDialogOpen: boolean;
  /** Order dialog state */
  isOrderDialogOpen: boolean;
  /** Employee dialog state */
  isEmployeeDialogOpen: boolean;
  /** Dialog close handler */
  onCloseDialog: (dialogType: string) => void;
  /** Quick action form data */
  quickActionForms: any;
  /** Form update handler */
  updateQuickActionForm: (formType: string, updates: any) => void;
  /** Form reset handler */
  resetQuickActionForm: (formType: string) => void;
  /** Customer submission state */
  isSubmittingCustomer: boolean;
  /** Order submission state */
  isSubmittingOrder: boolean;
  /** Employee submission state */
  isSubmittingEmployee: boolean;
}

interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  isNavigationOnly?: boolean;
  navigateTo?: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'customer',
    title: 'Add Customer',
    description: 'Quickly add a new customer',
    icon: UserPlus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'order',
    title: 'Create Order',
    description: 'Start a new order',
    icon: ShoppingBag,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'employee',
    title: 'Add Employee',
    description: 'Add a new team member',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'transit',
    title: 'Create Transit Order',
    description: 'Create a new transit/delivery order',
    icon: Truck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    isNavigationOnly: true,
    navigateTo: '/logistics',
  },
];

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = React.memo(({
  onQuickAction,
  isCustomerDialogOpen,
  isOrderDialogOpen,
  isEmployeeDialogOpen,
  onCloseDialog,
  quickActionForms,
  updateQuickActionForm,
  resetQuickActionForm,
  isSubmittingCustomer,
  isSubmittingOrder,
  isSubmittingEmployee,
}) => {
  const [, setLocation] = useLocation();

  const handleQuickAction = (action: string, navigateTo?: string) => {
    if (navigateTo) {
      setLocation(navigateTo);
    } else {
      onQuickAction(action, {});
    }
  };

  const handleFormSubmit = (formType: string, e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log(`Submitting ${formType} form:`, quickActionForms[formType]);
  };

  const handleFormChange = (formType: string, field: string, value: string) => {
    updateQuickActionForm(formType, { [field]: value });
  };

  const getDialogState = (action: string) => {
    switch (action) {
      case 'customer':
        return isCustomerDialogOpen;
      case 'order':
        return isOrderDialogOpen;
      case 'employee':
        return isEmployeeDialogOpen;
      default:
        return false;
    }
  };

  const getSubmissionState = (action: string) => {
    switch (action) {
      case 'customer':
        return isSubmittingCustomer;
      case 'order':
        return isSubmittingOrder;
      case 'employee':
        return isSubmittingEmployee;
      default:
        return false;
    }
  };

  return (
    <Card
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'quick-actions')}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isDialogOpen = getDialogState(action.id);
            const isSubmitting = getSubmissionState(action.id);
            const formData = quickActionForms[action.id] || {};

            return (
              <div key={action.id} className="space-y-4">
                {/* Quick Action Button */}
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted/50"
                  onClick={() => handleQuickAction(action.id, action.navigateTo)}
                  data-testid={getTestId(TEST_IDS.BUTTON.ADD, action.id)}
                >
                  <div className={`p-2 rounded-full ${action.bgColor}`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>

                {/* Dialog for each action - only show for non-navigation actions */}
                {!action.isNavigationOnly && (
                  <Dialog open={isDialogOpen} onOpenChange={() => onCloseDialog(action.id)}>
                    <DialogContent
                      className="sm:max-w-md"
                      data-testid={getTestId(TEST_IDS.MODAL.CONTAINER, action.id)}
                    >
                      <DialogHeader>
                        <DialogTitle>{action.title}</DialogTitle>
                      </DialogHeader>

                      <form onSubmit={(e) => handleFormSubmit(action.id, e)} className="space-y-4">
                        {action.id === 'customer' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="customer-name">Name</Label>
                              <Input
                                id="customer-name"
                                value={formData.name || ''}
                                onChange={(e) => handleFormChange(action.id, 'name', e.target.value)}
                                placeholder="Enter customer name"
                                data-testid={getTestId(TEST_IDS.FORM.INPUT, 'customer-name')}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="customer-phone">Phone</Label>
                              <Input
                                id="customer-phone"
                                value={formData.phone || ''}
                                onChange={(e) => handleFormChange(action.id, 'phone', e.target.value)}
                                placeholder="Enter phone number"
                                data-testid={getTestId(TEST_IDS.FORM.INPUT, 'customer-phone')}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="customer-email">Email</Label>
                              <Input
                                id="customer-email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => handleFormChange(action.id, 'email', e.target.value)}
                                placeholder="Enter email address"
                                data-testid={getTestId(TEST_IDS.FORM.INPUT, 'customer-email')}
                              />
                            </div>
                          </>
                        )}

                        {action.id === 'order' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="order-customer">Customer</Label>
                              <Input
                                id="order-customer"
                                value={formData.customerName || ''}
                                onChange={(e) => handleFormChange(action.id, 'customerName', e.target.value)}
                                placeholder="Enter customer name"
                                data-testid={getTestId(TEST_IDS.FORM.INPUT, 'order-customer')}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="order-service">Service</Label>
                              <Input
                                id="order-service"
                                value={formData.service || ''}
                                onChange={(e) => handleFormChange(action.id, 'service', e.target.value)}
                                placeholder="Enter service type"
                                data-testid={getTestId(TEST_IDS.FORM.INPUT, 'order-service')}
                              />
                            </div>
                          </>
                        )}

                        {action.id === 'employee' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="employee-name">Name</Label>
                              <Input
                                id="employee-name"
                                value={formData.name || ''}
                                onChange={(e) => handleFormChange(action.id, 'name', e.target.value)}
                                placeholder="Enter employee name"
                                data-testid={getTestId(TEST_IDS.FORM.INPUT, 'employee-name')}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="employee-position">Position</Label>
                              <Input
                                id="employee-position"
                                value={formData.position || ''}
                                onChange={(e) => handleFormChange(action.id, 'position', e.target.value)}
                                placeholder="Enter position"
                                data-testid={getTestId(TEST_IDS.FORM.INPUT, 'employee-position')}
                              />
                            </div>
                          </>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => onCloseDialog(action.id)}
                            data-testid={getTestId(TEST_IDS.BUTTON.CANCEL, action.id)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            data-testid={getTestId(TEST_IDS.BUTTON.SUBMIT, action.id)}
                          >
                            {isSubmitting ? 'Creating...' : 'Create'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

DashboardQuickActions.displayName = 'DashboardQuickActions';
