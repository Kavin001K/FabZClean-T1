import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingBag,
  Star,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import type { Customer } from '../../../shared/schema';

// Form validation schemas
const customerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: 'Please enter a valid email address',
  }).optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number must be less than 15 digits'),
  address: z.string().optional(), // Simple string for now - matches text input in UI
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerDialogsProps {
  selectedCustomer: Customer | null;
  isViewDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isCreateDialogOpen: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  onCloseViewDialog: () => void;
  onCloseEditDialog: () => void;
  onCloseCreateDialog: () => void;
  onEditCustomer: (data: CustomerFormData) => void;
  onCreateCustomer: (data: CustomerFormData) => void;
}

// Mock recent orders data - in real app this would come from API
const mockRecentOrders = [
  {
    id: '1',
    orderNumber: 'FC-2024-001',
    status: 'completed',
    total: '₹2,450',
    createdAt: '2025-09-15T10:30:00Z',
    services: ['Dry Cleaning', 'Ironing']
  },
  {
    id: '2',
    orderNumber: 'FC-2024-002',
    status: 'in_progress',
    total: '₹1,850',
    createdAt: '2025-09-18T14:20:00Z',
    services: ['Wash & Fold']
  },
  {
    id: '3',
    orderNumber: 'FC-2024-003',
    status: 'completed',
    total: '₹3,200',
    createdAt: '2025-09-20T09:15:00Z',
    services: ['Dry Cleaning', 'Stain Removal', 'Ironing']
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const CustomerDialogs: React.FC<CustomerDialogsProps> = React.memo(({
  selectedCustomer,
  isViewDialogOpen,
  isEditDialogOpen,
  isCreateDialogOpen,
  isCreating,
  isUpdating,
  onCloseViewDialog,
  onCloseEditDialog,
  onCloseCreateDialog,
  onEditCustomer,
  onCreateCustomer,
}) => {
  const editForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: selectedCustomer?.name || '',
      email: selectedCustomer?.email || '',
      phone: selectedCustomer?.phone || '',
      address: selectedCustomer?.address || '',
      notes: selectedCustomer?.notes || '',
    },
  });

  const createForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  // Reset forms when dialogs open/close
  React.useEffect(() => {
    if (isEditDialogOpen && selectedCustomer) {
      editForm.reset({
        name: selectedCustomer.name,
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || '',
      });
    }
  }, [isEditDialogOpen, selectedCustomer, editForm]);

  React.useEffect(() => {
    if (isCreateDialogOpen) {
      createForm.reset();
    }
  }, [isCreateDialogOpen, createForm]);

  const handleEditSubmit = (data: CustomerFormData) => {
    onEditCustomer(data);
  };

  const handleCreateSubmit = (data: CustomerFormData) => {
    onCreateCustomer(data);
  };

  // Compute customer stats only when we have a selected customer (View/Edit dialogs)
  const totalSpent = selectedCustomer ? parseFloat(selectedCustomer.totalSpent || '0') : 0;
  const totalOrders = selectedCustomer?.totalOrders || 0;
  const customerSince = selectedCustomer ? new Date(selectedCustomer.createdAt || new Date()) : new Date();
  const daysSinceJoined = Math.max(1, Math.floor((Date.now() - customerSince.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <>
      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={onCloseViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedCustomer ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-xl font-semibold">{selectedCustomer.name}</div>
                <div className="text-sm text-muted-foreground">
                  Customer since {customerSince.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm">{selectedCustomer.email || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-sm">{selectedCustomer.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <p className="text-sm">{selectedCustomer.address || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{totalOrders}</div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      ₹{totalSpent.toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant={totalOrders > 5 ? 'default' : 'secondary'}>
                    {totalOrders > 5 ? 'Loyal Customer' : 'Regular Customer'}
                  </Badge>
                  <Badge variant={totalSpent > 10000 ? 'default' : 'outline'}>
                    {totalSpent > 10000 ? 'High Value' : 'Standard'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Order Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {totalOrders > 0 ? `${Math.round(totalOrders / Math.max(daysSinceJoined, 1) * 30)}` : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">orders per month</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Average Order Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{totalOrders > 0 ? Math.round(totalSpent / totalOrders).toLocaleString('en-IN') : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">per order</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-purple-500" />
                    Customer Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {totalOrders > 5 ? '4.8' : totalOrders > 2 ? '4.5' : '4.2'}
                  </div>
                  <p className="text-xs text-muted-foreground">out of 5.0</p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Recent Orders */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status ? order.status.replace('_', ' ') : 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {order.services.map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{order.total}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onCloseViewDialog}>
              Close
            </Button>
          </DialogFooter>
          </motion.div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={onCloseEditDialog}>
        <DialogContent>
          {selectedCustomer ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                {...editForm.register('name')}
                className={cn(
                  editForm.formState.errors.name && 'border-red-500'
                )}
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                {...editForm.register('email')}
                className={cn(
                  editForm.formState.errors.email && 'border-red-500'
                )}
              />
              {editForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                type="tel"
                {...editForm.register('phone')}
                className={cn(
                  editForm.formState.errors.phone && 'border-red-500'
                )}
              />
              {editForm.formState.errors.phone && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                {...editForm.register('address')}
                placeholder="Enter customer address"
                className={cn(
                  editForm.formState.errors.address && 'border-red-500'
                )}
              />
              {editForm.formState.errors.address && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                {...editForm.register('notes')}
                placeholder="Add any notes about this customer"
                className={cn(
                  editForm.formState.errors.notes && 'border-red-500'
                )}
              />
              {editForm.formState.errors.notes && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.notes.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onCloseEditDialog}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
          </motion.div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={onCloseCreateDialog}>
        <DialogContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter customer information below. They will receive a welcome email with special offers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                {...createForm.register('name')}
                placeholder="Enter customer name"
                className={cn(
                  createForm.formState.errors.name && 'border-red-500'
                )}
              />
              {createForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                {...createForm.register('email')}
                placeholder="Enter email address"
                className={cn(
                  createForm.formState.errors.email && 'border-red-500'
                )}
              />
              {createForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-phone">Phone *</Label>
              <Input
                id="create-phone"
                type="tel"
                {...createForm.register('phone')}
                placeholder="Enter phone number"
                className={cn(
                  createForm.formState.errors.phone && 'border-red-500'
                )}
              />
              {createForm.formState.errors.phone && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-address">Address</Label>
              <Textarea
                id="create-address"
                {...createForm.register('address')}
                placeholder="Enter customer address"
                className={cn(
                  createForm.formState.errors.address && 'border-red-500'
                )}
              />
              {createForm.formState.errors.address && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-notes">Notes</Label>
              <Textarea
                id="create-notes"
                {...createForm.register('notes')}
                placeholder="Add any notes about this customer"
                className={cn(
                  createForm.formState.errors.notes && 'border-red-500'
                )}
              />
              {createForm.formState.errors.notes && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.notes.message}
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Welcome Package:</strong> New customers will receive a welcome email with 
                special offers and service information.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onCloseCreateDialog}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </form>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
});

export { CustomerDialogs };
export default CustomerDialogs;
