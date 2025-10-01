import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PageTransition, FadeIn, StaggerChildren, StaggerItem } from '@/components/ui/page-transition';

// Import child components
import { CustomerKPIs } from '@/components/customers/customer-kpis';
import { CustomerTable } from '@/components/customers/customer-table';
import { CustomerSearchFilter } from '@/components/customers/customer-search-filter';
import { CustomerDialogs } from '@/components/customers/customer-dialogs';

// Import hooks
import { useCustomerKPIs } from '@/hooks/use-customer-kpis';
import { useCustomerFilters } from '@/hooks/use-customer-filters';

// Import data service and types
import { customersApi } from '@/lib/data-service';
import { exportCustomersToCSV, exportCustomersToPDF } from '@/lib/export-utils';
import type { Customer } from '../../shared/schema';

export default function Customers() {
  // State for dialog management
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers data with React Query
  const {
    data: customers = [],
    isLoading: customersLoading,
    isError: customersError,
    error: customersErrorDetails,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch customer KPIs
  const {
    data: kpiData,
    isLoading: kpisLoading,
    isError: kpisError,
  } = useCustomerKPIs();

  // Customer filtering and search
  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    filteredCustomers,
    clearFilters,
  } = useCustomerFilters(customers);

  // Customer creation mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      return await customersApi.create(customerData);
    },
    onSuccess: (newCustomer) => {
      if (newCustomer) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["customer-kpis"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard/metrics"] });
        
        toast({
          title: "Customer Created Successfully",
          description: `Customer ${newCustomer.name} has been added to the system.`,
        });

        setIsCreateDialogOpen(false);
      }
    },
    onError: (error) => {
      console.error('Failed to create customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Customer edit mutation
  const editCustomerMutation = useMutation({
    mutationFn: async ({ customerId, customerData }: { customerId: string; customerData: Partial<Customer> }) => {
      return await customersApi.update(customerId, customerData);
    },
    onSuccess: (updatedCustomer) => {
      if (updatedCustomer) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["customer-kpis"] });
        
        toast({
          title: "Customer Updated Successfully",
          description: `Customer ${updatedCustomer.name} has been updated.`,
        });

        setIsEditDialogOpen(false);
        setSelectedCustomer(null);
      }
    },
    onError: (error) => {
      console.error('Failed to update customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Customer delete mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      return await customersApi.delete(customerId);
    },
    onSuccess: (success, customerId) => {
      if (success) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["customer-kpis"] });
        
        toast({
          title: "Customer Deleted Successfully",
          description: "Customer has been deleted.",
        });
      }
    },
    onError: (error) => {
      console.error('Failed to delete customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    deleteCustomerMutation.mutate(customerId);
  };

  const handleCreateCustomer = (customerData: Partial<Customer>) => {
    createCustomerMutation.mutate(customerData);
  };

  const handleUpdateCustomer = (customerData: Partial<Customer>) => {
    if (!selectedCustomer) return;
    editCustomerMutation.mutate({
      customerId: selectedCustomer.id,
      customerData,
    });
  };

  const handleExportCSV = () => {
    exportCustomersToCSV(filteredCustomers);
  };

  const handleExportPDF = () => {
    exportCustomersToPDF(filteredCustomers);
  };
  // Error state
  if (customersError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">
                Failed to load customers
              </div>
              <p className="text-sm text-muted-foreground">
                {customersErrorDetails?.message || 'An unexpected error occurred'}
              </p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex-1 items-start gap-4 p-6 gradient-mesh min-h-screen">
        {/* KPI Cards */}
        <FadeIn delay={0.1}>
          <CustomerKPIs
            data={kpiData}
            isLoading={kpisLoading}
            isError={kpisError}
          />
        </FadeIn>

        {/* Main Customer Management Card */}
        <FadeIn delay={0.2}>
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="glass hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-6 w-6 text-primary" />
                    </motion.div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Customer Management
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Manage your customers, view their order history, and track customer insights.
                  </CardDescription>
                </motion.div>
              </CardHeader>

              <CardContent>
          {/* Search and Filter Controls */}
          <div className="mb-6">
            <CustomerSearchFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              customers={customers}
              filteredCount={filteredCustomers.length}
            />
          </div>

                {/* Add Customer Button */}
                <motion.div
                  className="mb-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="gap-2 hover-glow gradient-primary border-0"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Customer
                  </Button>
                </motion.div>

          {/* Customer Table */}
          <CustomerTable
            customers={filteredCustomers}
            isLoading={customersLoading}
            onViewCustomer={handleViewCustomer}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            isDeleting={deleteCustomerMutation.isPending}
          />
              </CardContent>

              <CardFooter className="bg-muted/30">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-muted-foreground"
                >
                  Showing <strong className="text-primary">{filteredCustomers.length}</strong> of{' '}
                  <strong className="text-primary">{customers.length}</strong> customers
                  {searchQuery && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-2 text-accent font-medium"
                    >
                      • Filtered by "{searchQuery}"
                    </motion.span>
                  )}
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>
        </FadeIn>

        {/* Customer Dialogs */}
        <CustomerDialogs
          selectedCustomer={selectedCustomer}
          isViewDialogOpen={isViewDialogOpen}
          isEditDialogOpen={isEditDialogOpen}
          isCreateDialogOpen={isCreateDialogOpen}
          isCreating={createCustomerMutation.isPending}
          isUpdating={editCustomerMutation.isPending}
          onCloseViewDialog={() => setIsViewDialogOpen(false)}
          onCloseEditDialog={() => setIsEditDialogOpen(false)}
          onCloseCreateDialog={() => setIsCreateDialogOpen(false)}
          onEditCustomer={handleUpdateCustomer}
          onCreateCustomer={handleCreateCustomer}
        />
      </div>
    </PageTransition>
  );
};
