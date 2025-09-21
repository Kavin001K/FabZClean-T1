import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CustomerRowSkeleton } from '@/components/ui/loading-skeleton';
import { formatDate } from '@/lib/data-service';
import type { Customer } from '../../../shared/schema';

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  isDeleting?: boolean;
}

interface CustomerRowProps {
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  isDeleting?: boolean;
}

const CustomerRow: React.FC<CustomerRowProps> = React.memo(({ 
  customer, 
  onView, 
  onEdit, 
  onDelete, 
  isDeleting 
}) => {
  const getCustomerStatus = (customer: Customer) => {
    const totalSpent = parseFloat(customer.totalSpent || '0');
    const totalOrders = customer.totalOrders || 0;
    
    if (totalOrders === 0) return { label: 'New', variant: 'secondary' as const };
    if (totalSpent > 10000) return { label: 'VIP', variant: 'default' as const };
    if (totalOrders > 5) return { label: 'Loyal', variant: 'secondary' as const };
    return { label: 'Active', variant: 'outline' as const };
  };

  const status = getCustomerStatus(customer);

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onView(customer)}
    >
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium flex items-center gap-2">
            {customer.name}
            <Badge variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {customer.email}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <span className="font-medium">{customer.totalOrders || 0}</span>
      </TableCell>
      <TableCell className="text-center">
        {formatDate(customer.createdAt || new Date())}
      </TableCell>
      <TableCell className="text-center">
        {customer.phone || 'N/A'}
      </TableCell>
      <TableCell>
        <div onClick={(e) => e.stopPropagation()}>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onView(customer)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(customer)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Customer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Customer
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{customer.name}</strong>? 
                  This action cannot be undone and will permanently remove the customer 
                  and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(customer.id)}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Customer'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
});

export const CustomerTable: React.FC<CustomerTableProps> = React.memo(({
  customers,
  isLoading,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
  isDeleting = false
}) => {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="text-center">Orders</TableHead>
            <TableHead className="text-center">Join Date</TableHead>
            <TableHead className="text-center">Phone</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <CustomerRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    );
  }

  if (customers.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="text-center">Orders</TableHead>
            <TableHead className="text-center">Join Date</TableHead>
            <TableHead className="text-center">Phone</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-muted p-4">
                  <MoreHorizontal className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No customers found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Get started by adding your first customer to the system.
                  </p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead className="text-center">Orders</TableHead>
          <TableHead className="text-center">Join Date</TableHead>
          <TableHead className="text-center">Phone</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <CustomerRow
            key={customer.id}
            customer={customer}
            onView={onViewCustomer}
            onEdit={onEditCustomer}
            onDelete={onDeleteCustomer}
            isDeleting={isDeleting}
          />
        ))}
      </TableBody>
    </Table>
  );
});

export default CustomerTable;
