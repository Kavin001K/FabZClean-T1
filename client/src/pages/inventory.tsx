import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Brain, Zap, Bell, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Import child components
import { InventoryKPIs } from '@/components/inventory/inventory-kpis';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { InventoryToolbar } from '@/components/inventory/inventory-toolbar';
import { InventoryDialogs } from '@/components/inventory/inventory-dialogs';

// Import hooks
import { useInventoryKPIs } from '@/hooks/use-inventory-kpis';
import { useInventoryFilters } from '@/hooks/use-inventory-filters';

// Import data service and types
import { inventoryApi, formatCurrency } from '@/lib/data-service';
import type { InventoryItem } from '@/lib/data-service';

export default function Inventory() {
  // State for dialog management
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inventory data with React Query
  const {
    data: inventory = [],
    isLoading: inventoryLoading,
    isError: inventoryError,
    error: inventoryErrorDetails,
  } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: inventoryApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch inventory KPIs
  const {
    data: kpiData,
    isLoading: kpisLoading,
    isError: kpisError,
  } = useInventoryKPIs();

  // Inventory filtering and search
  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    filteredAndSortedInventory,
    clearFilters,
    sortField,
    sortDirection,
    handleSort,
  } = useInventoryFilters(inventory);

  // Low stock alerts
  const lowStockItems = inventory.filter(item => 
    item.status === 'Low Stock' || item.status === 'Out of Stock'
  );

  // Item creation mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: Partial<InventoryItem>) => {
      return await inventoryApi.create(itemData);
    },
    onSuccess: (newItem) => {
      if (newItem) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard/metrics"] });
        
        toast({
          title: "Item Created Successfully",
          description: `${newItem.name} has been added to inventory.`,
        });

        setIsCreateDialogOpen(false);
      }
    },
    onError: (error) => {
      console.error('Failed to create inventory item:', error);
            toast({
        title: "Error",
        description: "Failed to create inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Item edit mutation
  const editItemMutation = useMutation({
    mutationFn: async ({ itemId, itemData }: { itemId: string; itemData: Partial<InventoryItem> }) => {
      return await inventoryApi.update(itemId, itemData);
    },
    onSuccess: (updatedItem) => {
      if (updatedItem) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });
        
        toast({
          title: "Item Updated Successfully",
          description: `${updatedItem.name} has been updated.`,
        });

        setIsEditDialogOpen(false);
        setSelectedItem(null);
      }
    },
    onError: (error) => {
      console.error('Failed to update inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Item delete mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await inventoryApi.delete(itemId);
    },
    onSuccess: (success, itemId) => {
      if (success) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });
        
        toast({
          title: "Item Deleted Successfully",
          description: "Inventory item has been removed.",
        });
      }
    },
    onError: (error) => {
      console.error('Failed to delete inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Stock update mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ itemId, newStock }: { itemId: string; newStock: number }) => {
      return await inventoryApi.updateStock(itemId, newStock);
    },
    onSuccess: (updatedItem) => {
      if (updatedItem) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });
        
        toast({
          title: "Stock Updated",
          description: `${updatedItem.name} stock updated to ${updatedItem.stock}.`,
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update stock:', error);
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const promises = itemIds.map(id => inventoryApi.delete(id));
      const results = await Promise.all(promises);
      return results.every(result => result);
    },
    onSuccess: (success) => {
      if (success) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });
        
        toast({
          title: "Items Deleted Successfully",
          description: `${selectedItems.length} items have been removed from inventory.`,
        });

        setSelectedItems([]);
      }
    },
    onError: (error) => {
      console.error('Failed to delete items:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected items. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItemMutation.mutate(itemId);
  };

  const handleCreateItem = (itemData: Partial<InventoryItem>) => {
    createItemMutation.mutate(itemData);
  };

  const handleUpdateItem = (itemData: Partial<InventoryItem>) => {
    if (!selectedItem) return;
    editItemMutation.mutate({
      itemId: selectedItem.id,
      itemData,
    });
  };

  const handleUpdateStock = (itemId: string, newStock: number) => {
    updateStockMutation.mutate({ itemId, newStock });
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredAndSortedInventory.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      bulkDeleteMutation.mutate(selectedItems);
    }
  };

  const handleExportCSV = useCallback(() => {
    // In a real app, this would export inventory to CSV
    toast({
      title: "Export CSV",
      description: "Exporting inventory to CSV. This feature will be implemented with export utilities.",
    });
  }, [toast]);

  const handleExportPDF = useCallback(() => {
    // In a real app, this would export inventory to PDF
    toast({
      title: "Export PDF",
      description: "Exporting inventory to PDF. This feature will be implemented with export utilities.",
    });
  }, [toast]);

  // Error state
  if (inventoryError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">
                Failed to load inventory
              </div>
              <p className="text-sm text-muted-foreground">
                {inventoryErrorDetails?.message || 'An unexpected error occurred'}
              </p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['inventory-items'] })}
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
      {/* Intelligence Command Center Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display font-bold text-3xl text-foreground">Inventory Intelligence</h1>
              <div className="status-indicator-enhanced bg-green-500"></div>
              <span className="text-sm text-muted-foreground">AI Active</span>
            </div>
            <p className="text-muted-foreground">Predictive analytics and intelligent stock management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log("Opening AI insights...");
              toast({
                title: "AI Insights",
                description: "AI Insights feature coming soon! This would show predictive analytics, demand forecasting, and intelligent recommendations.",
              });
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            AI Insights
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      {lowStockItems.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Bell className="h-5 w-5" />
                Low Stock Alerts ({lowStockItems.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Low Stock Alerts",
                    description: `${lowStockItems.length} items need attention.`,
                  });
                }}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Bell className="h-4 w-4 mr-2" />
                Show Alerts
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.slice(0, 6).map((item) => (
                <div key={item.id} className="p-3 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Stock: {item.stock}</p>
                    </div>
                    <Badge 
                      className={
                        item.status === 'Out of Stock' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <InventoryKPIs 
        data={kpiData} 
        isLoading={kpisLoading} 
        isError={kpisError} 
      />

      {/* Main Inventory Management Card */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Manage your inventory items, track stock levels, and monitor reorder points.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filter Controls */}
          <InventoryToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onAddItem={() => setIsCreateDialogOpen(true)}
            onBulkDelete={handleBulkDelete}
            selectedItems={selectedItems}
            inventory={inventory}
            filteredCount={filteredAndSortedInventory.length}
          />

          {/* Inventory Table */}
          <InventoryTable
            inventory={filteredAndSortedInventory}
            isLoading={inventoryLoading}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onUpdateStock={handleUpdateStock}
            isUpdatingStock={updateStockMutation.isPending}
            isDeleting={deleteItemMutation.isPending}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </CardContent>
      </Card>

      {/* Inventory Dialogs */}
      <InventoryDialogs
        selectedItem={selectedItem}
        isEditDialogOpen={isEditDialogOpen}
        isCreateDialogOpen={isCreateDialogOpen}
        isCreating={createItemMutation.isPending}
        isUpdating={editItemMutation.isPending}
        onCloseEditDialog={() => setIsEditDialogOpen(false)}
        onCloseCreateDialog={() => setIsCreateDialogOpen(false)}
        onEditItem={handleUpdateItem}
        onCreateItem={handleCreateItem}
      />
    </div>
  );
}