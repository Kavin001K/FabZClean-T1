/**
 * Quick Actions Section Component
 * 
 * Provides quick action buttons for creating customers, orders, and employees.
 * Includes modal dialogs for each action with form validation.
 * 
 * @component
 */

import React from "react";
import { motion } from "framer-motion";
import { PlusCircle, UserPlus, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StaggerItem } from "@/components/ui/page-transition";

interface QuickActionForm {
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  order: {
    customerName: string;
    customerPhone: string;
    service: string;
    quantity: number;
    pickupDate: string;
  };
  employee: {
    name: string;
    phone: string;
    email: string;
    position: string;
    salary: string;
  };
}

interface QuickActionsSectionProps {
  /** Form data for quick actions */
  quickActionForms: QuickActionForm;
  /** Handler for form updates */
  setQuickActionForms: React.Dispatch<React.SetStateAction<QuickActionForm>>;
  /** Handler for creating a customer */
  handleCreateCustomer: () => Promise<void>;
  /** Handler for creating an order */
  handleCreateOrder: () => Promise<void>;
  /** Handler for creating an employee */
  handleCreateEmployee: () => Promise<void>;
  /** Loading states for each action */
  isLoading?: {
    customer?: boolean;
    order?: boolean;
    employee?: boolean;
  };
}

/**
 * Quick Actions Section Component
 * 
 * Renders quick action cards with modal dialogs for creating customers, orders, and employees.
 */
export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  quickActionForms,
  setQuickActionForms,
  handleCreateCustomer,
  handleCreateOrder,
  handleCreateEmployee,
  isLoading = {}
}) => {
  return (
    <StaggerItem>
      <Card data-testid="quick-actions-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="quick-actions-title">
            <PlusCircle className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Add Customer Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid="add-customer-trigger"
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <UserPlus className="h-8 w-8 text-blue-500 mb-2" />
                      <span className="font-medium">Add Customer</span>
                    </CardContent>
                  </Card>
                </motion.div>
              </DialogTrigger>
              <DialogContent data-testid="add-customer-dialog">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customer-name">Name</Label>
                    <Input
                      id="customer-name"
                      data-testid="customer-name-input"
                      value={quickActionForms.customer.name}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          customer: { ...prev.customer, name: e.target.value }
                        }))
                      }
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-phone">Phone</Label>
                    <Input
                      id="customer-phone"
                      data-testid="customer-phone-input"
                      value={quickActionForms.customer.phone}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          customer: { ...prev.customer, phone: e.target.value }
                        }))
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-email">Email</Label>
                    <Input
                      id="customer-email"
                      data-testid="customer-email-input"
                      type="email"
                      value={quickActionForms.customer.email}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          customer: { ...prev.customer, email: e.target.value }
                        }))
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <Button
                    onClick={handleCreateCustomer}
                    disabled={isLoading.customer}
                    data-testid="create-customer-button"
                  >
                    {isLoading.customer ? "Creating..." : "Create Customer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Order Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid="add-order-trigger"
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <ShoppingBag className="h-8 w-8 text-green-500 mb-2" />
                      <span className="font-medium">Add Order</span>
                    </CardContent>
                  </Card>
                </motion.div>
              </DialogTrigger>
              <DialogContent data-testid="add-order-dialog">
                <DialogHeader>
                  <DialogTitle>Add New Order</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="order-customer-name">Customer Name</Label>
                    <Input
                      id="order-customer-name"
                      data-testid="order-customer-name-input"
                      value={quickActionForms.order.customerName}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          order: { ...prev.order, customerName: e.target.value }
                        }))
                      }
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="order-customer-phone">Customer Phone</Label>
                    <Input
                      id="order-customer-phone"
                      data-testid="order-customer-phone-input"
                      value={quickActionForms.order.customerPhone}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          order: { ...prev.order, customerPhone: e.target.value }
                        }))
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="order-service">Service</Label>
                    <Input
                      id="order-service"
                      data-testid="order-service-input"
                      value={quickActionForms.order.service}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          order: { ...prev.order, service: e.target.value }
                        }))
                      }
                      placeholder="Enter service type"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="order-pickup-date">Pickup Date</Label>
                    <Input
                      id="order-pickup-date"
                      data-testid="order-pickup-date-input"
                      type="date"
                      value={quickActionForms.order.pickupDate}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          order: { ...prev.order, pickupDate: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={handleCreateOrder}
                    disabled={isLoading.order}
                    data-testid="create-order-button"
                  >
                    {isLoading.order ? "Creating..." : "Create Order"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Employee Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid="add-employee-trigger"
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <UserPlus className="h-8 w-8 text-purple-500 mb-2" />
                      <span className="font-medium">Add Employee</span>
                    </CardContent>
                  </Card>
                </motion.div>
              </DialogTrigger>
              <DialogContent data-testid="add-employee-dialog">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="employee-name">Name</Label>
                    <Input
                      id="employee-name"
                      data-testid="employee-name-input"
                      value={quickActionForms.employee.name}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          employee: { ...prev.employee, name: e.target.value }
                        }))
                      }
                      placeholder="Enter employee name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employee-phone">Phone</Label>
                    <Input
                      id="employee-phone"
                      data-testid="employee-phone-input"
                      value={quickActionForms.employee.phone}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          employee: { ...prev.employee, phone: e.target.value }
                        }))
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employee-email">Email</Label>
                    <Input
                      id="employee-email"
                      data-testid="employee-email-input"
                      type="email"
                      value={quickActionForms.employee.email}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          employee: { ...prev.employee, email: e.target.value }
                        }))
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employee-position">Position</Label>
                    <Input
                      id="employee-position"
                      data-testid="employee-position-input"
                      value={quickActionForms.employee.position}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          employee: { ...prev.employee, position: e.target.value }
                        }))
                      }
                      placeholder="Enter position"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employee-salary">Salary</Label>
                    <Input
                      id="employee-salary"
                      data-testid="employee-salary-input"
                      value={quickActionForms.employee.salary}
                      onChange={(e) =>
                        setQuickActionForms(prev => ({
                          ...prev,
                          employee: { ...prev.employee, salary: e.target.value }
                        }))
                      }
                      placeholder="Enter salary"
                    />
                  </div>
                  <Button
                    onClick={handleCreateEmployee}
                    disabled={isLoading.employee}
                    data-testid="create-employee-button"
                  >
                    {isLoading.employee ? "Creating..." : "Create Employee"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </StaggerItem>
  );
};
