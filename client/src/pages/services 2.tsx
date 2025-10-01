import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Import child components
import { ServiceKPIs } from '@/components/services/service-kpis';
import { ServiceAccordion } from '@/components/services/service-accordion';
import { ServiceSearchFilter } from '@/components/services/service-search-filter';
import { ServiceDialogs } from '@/components/services/service-dialogs';

// Import hooks
import { useServiceKPIs } from '@/hooks/use-service-kpis';
import { useServiceFilters } from '@/hooks/use-service-filters';

// Import data service and types
import { servicesApi } from '@/lib/data-service';
import type { Service } from '../../shared/schema';

export default function Services() {
  // State for dialog management
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch services data with React Query
  const {
    data: services = [],
    isLoading: servicesLoading,
    isError: servicesError,
    error: servicesErrorDetails,
  } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch service KPIs
  const {
    data: kpiData,
    isLoading: kpisLoading,
    isError: kpisError,
  } = useServiceKPIs();

  // Service filtering and search
  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    filteredServices,
    clearFilters,
  } = useServiceFilters(services);

  // Service creation mutation
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: Partial<Service>) => {
      return await servicesApi.create(serviceData);
    },
    onSuccess: (newService) => {
      if (newService) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["services"] });
        queryClient.invalidateQueries({ queryKey: ["service-kpis"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard/metrics"] });
        
        toast({
          title: "Service Created Successfully",
          description: `Service ${newService.name} has been added to the catalog.`,
        });

        setIsCreateDialogOpen(false);
      }
    },
    onError: (error) => {
      console.error('Failed to create service:', error);
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Service edit mutation
  const editServiceMutation = useMutation({
    mutationFn: async ({ serviceId, serviceData }: { serviceId: string; serviceData: Partial<Service> }) => {
      return await servicesApi.update(serviceId, serviceData);
    },
    onSuccess: (updatedService) => {
      if (updatedService) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["services"] });
        queryClient.invalidateQueries({ queryKey: ["service-kpis"] });
        
        toast({
          title: "Service Updated Successfully",
          description: `Service ${updatedService.name} has been updated.`,
        });

        setIsEditDialogOpen(false);
        setSelectedService(null);
      }
    },
    onError: (error) => {
      console.error('Failed to update service:', error);
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Service delete mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return await servicesApi.delete(serviceId);
    },
    onSuccess: (success, serviceId) => {
      if (success) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["services"] });
        queryClient.invalidateQueries({ queryKey: ["service-kpis"] });
        
        toast({
          title: "Service Deleted Successfully",
          description: "Service has been removed from the catalog.",
        });
      }
    },
    onError: (error) => {
      console.error('Failed to delete service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };

  const handleDeleteService = (serviceId: string) => {
    deleteServiceMutation.mutate(serviceId);
  };

  const handleCreateService = (serviceData: Partial<Service>) => {
    createServiceMutation.mutate(serviceData);
  };

  const handleUpdateService = (serviceData: Partial<Service>) => {
    if (!selectedService) return;
    editServiceMutation.mutate({
      serviceId: selectedService.id,
      serviceData,
    });
  };

  const handleAddProduct = useCallback((serviceId: string) => {
    // In a real app, this would open a product dialog
    toast({
      title: "Add Product",
      description: `Adding product to service ${serviceId}. This feature will be implemented with the products API.`,
    });
  }, [toast]);

  const handleEditProduct = useCallback((serviceId: string, productId: string) => {
    // In a real app, this would open a product edit dialog
    toast({
      title: "Edit Product",
      description: `Editing product ${productId} in service ${serviceId}. This feature will be implemented with the products API.`,
    });
  }, [toast]);

  const handleDeleteProduct = useCallback((serviceId: string, productId: string) => {
    // In a real app, this would delete the product
    toast({
      title: "Delete Product",
      description: `Deleting product ${productId} from service ${serviceId}. This feature will be implemented with the products API.`,
    });
  }, [toast]);

  const handleExportCSV = useCallback(() => {
    // In a real app, this would export services to CSV
    toast({
      title: "Export CSV",
      description: "Exporting services to CSV. This feature will be implemented with export utilities.",
    });
  }, [toast]);

  const handleExportPDF = useCallback(() => {
    // In a real app, this would export services to PDF
    toast({
      title: "Export PDF",
      description: "Exporting services to PDF. This feature will be implemented with export utilities.",
    });
  }, [toast]);

  // Error state
  if (servicesError) {
  return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">
                Failed to load services
              </div>
              <p className="text-sm text-muted-foreground">
                {servicesErrorDetails?.message || 'An unexpected error occurred'}
              </p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['services'] })}
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
    <div className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      {/* KPI Cards */}
      <ServiceKPIs 
        data={kpiData} 
        isLoading={kpisLoading} 
        isError={kpisError} 
      />

      {/* Main Service Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Management</CardTitle>
                <CardDescription>
                Manage your services, add products, and track service performance.
                </CardDescription>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
                            Add Service
                        </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="mb-6">
            <ServiceSearchFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              services={services}
              filteredCount={filteredServices.length}
            />
          </div>

          {/* Services Accordion */}
          <ServiceAccordion
            services={filteredServices}
            isLoading={servicesLoading}
            onEditService={handleEditService}
            onDeleteService={handleDeleteService}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            isDeleting={deleteServiceMutation.isPending}
          />
          </CardContent>
      </Card>

      {/* Service Dialogs */}
      <ServiceDialogs
        selectedService={selectedService}
        isEditDialogOpen={isEditDialogOpen}
        isCreateDialogOpen={isCreateDialogOpen}
        isProductDialogOpen={isProductDialogOpen}
        isCreating={createServiceMutation.isPending}
        isUpdating={editServiceMutation.isPending}
        onCloseEditDialog={() => setIsEditDialogOpen(false)}
        onCloseCreateDialog={() => setIsCreateDialogOpen(false)}
        onCloseProductDialog={() => setIsProductDialogOpen(false)}
        onEditService={handleUpdateService}
        onCreateService={handleCreateService}
        onCreateProduct={() => {
          // This would handle product creation
          toast({
            title: "Create Product",
            description: "Product creation will be implemented with the products API.",
          });
        }}
      />
    </div>
  );
}