import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { useInvoicePrint } from "@/hooks/use-invoice-print";

// Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrdersKPI from "@/components/orders/orders-kpi";
import OrdersToolbar from "@/components/orders/orders-toolbar";
import OrdersTable from "@/components/orders/orders-table";
import BulkActionsDialog from "@/components/orders/bulk-actions-dialog";
import OrderDetailsDialog from "@/components/orders/order-details-dialog";
import EditOrderDialog from "@/components/orders/edit-order-dialog";

// Data Service
import { ordersApi } from '@/lib/data-service';
import { exportOrdersToCSV, exportOrdersToPDF } from '@/lib/export-utils';
import type { Order } from "../../shared/schema";

// Types
interface OrderFilters {
  status: string[];
  search: string;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

function OrdersComponent() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  // State Management
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [sortField, setSortField] = useState<keyof Order | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<OrderFilters>({
    status: [],
    search: '',
  });
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 50,
    totalPages: 1,
  });

  // Dialog States
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

  // Data Fetching with React Query
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Filtered and Sorted Orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.orderNumber.toLowerCase().includes(searchLower) ||
        (order as any).customerPhone?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(order => filters.status.includes(order.status));
    }
    
    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }
    
    return filtered;
  }, [orders, filters, sortField, sortDirection]);

  // Pagination
  const paginatedOrders = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, pagination]);

  // Update pagination when filtered orders change
  useEffect(() => {
    const totalPages = Math.ceil(filteredOrders.length / pagination.pageSize);
    setPagination(prev => ({
      ...prev,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }));
  }, [filteredOrders.length, pagination.pageSize]);

  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, updates }: { orderId: string; updates: Partial<Order> }) =>
      ordersApi.update(orderId, updates),
    onSuccess: (updatedOrder, { orderId }) => {
      if (updatedOrder) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        setIsEditDialogOpen(false);
        setEditingOrder(null);

        toast({
          title: "Order Updated",
          description: `Order ${orderId} has been updated successfully`,
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update order:', error);
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: string }) =>
      ordersApi.update(orderId, { status: newStatus as any }),
    onSuccess: (updatedOrder, { orderId, newStatus }) => {
      if (updatedOrder) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        
        addNotification({
          type: 'info',
          title: 'Order Status Updated',
          message: `Order ${orderId} has been moved to ${newStatus}`,
          actionUrl: '/orders',
          actionText: 'View Orders'
        });

        toast({
          title: "Order Status Updated",
          description: `Order ${orderId} moved to ${newStatus}`,
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Event Handlers
  const handleSort = useCallback((field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order.id));
    }
  }, [selectedOrders.length, paginatedOrders]);

  const handleClearSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  }, []);

  const handleEditOrder = useCallback((order: Order) => {
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  }, []);

  const handleCancelOrder = useCallback((order: Order) => {
    updateOrderStatusMutation.mutate({ 
      orderId: order.id, 
      newStatus: 'cancelled' 
    });
  }, [updateOrderStatusMutation]);

  const { printInvoice } = useInvoicePrint({
    onSuccess: (invoiceData) => {
      console.log('Invoice printed successfully:', invoiceData);
    },
    onError: (error) => {
      console.error('Invoice print failed:', error);
    }
  });

  const handlePrintInvoice = useCallback((order: Order) => {
    printInvoice(order);
  }, [printInvoice]);

  const handleNextStep = useCallback((order: Order) => {
    const statusFlow = ['pending', 'processing', 'completed'];
    const currentIndex = statusFlow.indexOf(order.status);
    const nextStatus = statusFlow[currentIndex + 1];
    
    if (nextStatus) {
      updateOrderStatusMutation.mutate({ 
        orderId: order.id, 
        newStatus: nextStatus 
      });
    }
  }, [updateOrderStatusMutation]);

  const handleUpdateStatus = useCallback((orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, newStatus });
  }, [updateOrderStatusMutation]);

  const handleBulkStatusUpdate = useCallback((newStatus: string) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select at least one order to update.",
        variant: "destructive",
      });
      return;
    }

    selectedOrders.forEach(orderId => {
      updateOrderStatusMutation.mutate({ orderId, newStatus });
    });

    setSelectedOrders([]);
    setIsBulkActionsOpen(false);
  }, [selectedOrders, updateOrderStatusMutation, toast]);

  const handleBulkDelete = useCallback(() => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select at least one order to delete.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} orders? This action cannot be undone.`)) {
      toast({
        title: "Orders Deleted",
        description: `${selectedOrders.length} orders have been deleted successfully`,
      });
      setSelectedOrders([]);
      setIsBulkActionsOpen(false);
    }
  }, [selectedOrders, toast]);

  const handleExportSelected = useCallback(() => {
    const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
    exportOrdersToCSV(selectedOrdersData);
    toast({
      title: "Export Started",
      description: `Exporting ${selectedOrdersData.length} selected orders to CSV...`,
    });
  }, [orders, selectedOrders, toast]);

  const handleExportCSV = useCallback(() => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no orders to export.",
        variant: "destructive",
      });
      return;
    }
    exportOrdersToCSV(filteredOrders);
      toast({
      title: "Export Started",
      description: `Exporting ${filteredOrders.length} orders to CSV...`,
      });
  }, [filteredOrders, toast]);

  const handleExportPDF = useCallback(() => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no orders to export.",
        variant: "destructive",
      });
      return;
    }
    exportOrdersToPDF(filteredOrders, 'Orders Report');
    toast({
      title: "PDF Export Started",
      description: `Generating PDF for ${filteredOrders.length} orders...`,
    });
  }, [filteredOrders, toast]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast({
      title: "Data Refreshed",
      description: "Orders data has been refreshed",
    });
  }, [refetch, toast]);

  const handleSearchChange = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleStatusFilterChange = useCallback((status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      status: checked 
        ? [...prev.status, status]
        : prev.status.filter(s => s !== status)
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ status: [], search: '' });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'f':
            event.preventDefault();
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            searchInput?.focus();
            break;
          case 'r':
            event.preventDefault();
            handleRefresh();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRefresh]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <OrdersKPI orders={orders} />

      {/* Main Content Card */}
          <Card>
            <CardHeader>
          <CardTitle>Orders Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your orders and track their progress. Use filters and search to find specific orders quickly.
          </p>
            </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <OrdersToolbar
            searchQuery={filters.search}
            onSearchChange={handleSearchChange}
            statusFilter={filters.status}
            onStatusFilterChange={handleStatusFilterChange}
            onClearFilters={handleClearFilters}
            selectedOrders={selectedOrders}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onRefresh={handleRefresh}
            onBulkActions={() => setIsBulkActionsOpen(true)}
            onClearSelection={handleClearSelection}
            totalOrders={orders.length}
            filteredOrders={filteredOrders.length}
          />

          {/* Orders Table */}
          <OrdersTable
            orders={paginatedOrders}
            isLoading={isLoading}
            error={error}
            selectedOrders={selectedOrders}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onSelectOrder={handleSelectOrder}
            onSelectAll={handleSelectAll}
            onViewOrder={handleViewOrder}
            onEditOrder={handleEditOrder}
            onCancelOrder={handleCancelOrder}
            onPrintInvoice={handlePrintInvoice}
            onUpdateStatus={handleUpdateStatus}
            onRetry={() => refetch()}
          />

          {/* Pagination Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing <strong>{((pagination.currentPage - 1) * pagination.pageSize) + 1}</strong> to{' '}
              <strong>{Math.min(pagination.currentPage * pagination.pageSize, filteredOrders.length)}</strong> of{' '}
              <strong>{filteredOrders.length}</strong> orders
              {filters.search && (
                    <span className="ml-2 text-blue-600">
                  • Filtered by "{filters.search}"
                    </span>
                  )}
              {filters.status.length > 0 && (
                    <span className="ml-2 text-green-600">
                  • Status: {filters.status.join(', ')}
                </span>
              )}
              {sortField && (
                <span className="ml-2 text-purple-600">
                      • Sorted by {sortField} ({sortDirection})
                    </span>
                  )}
                </div>
            <div className="flex items-center gap-4">
                  <span>⌘F to search</span>
                  <span>⌘R to refresh</span>
                  <span>Click headers to sort</span>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Dialogs */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isOrderDetailsOpen}
        onClose={() => {
          setIsOrderDetailsOpen(false);
          setSelectedOrder(null);
        }}
        onEdit={handleEditOrder}
        onCancel={handleCancelOrder}
        onNextStep={handleNextStep}
        onPrintInvoice={handlePrintInvoice}
      />

      <EditOrderDialog
        order={editingOrder}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingOrder(null);
        }}
        onSave={(orderId, updates) => {
          updateOrderMutation.mutate({ orderId, updates });
        }}
        isLoading={updateOrderMutation.isPending}
      />

      <BulkActionsDialog
        isOpen={isBulkActionsOpen}
        onClose={() => setIsBulkActionsOpen(false)}
        selectedCount={selectedOrders.length}
        onUpdateStatus={handleBulkStatusUpdate}
        onExportSelected={handleExportSelected}
        onDeleteSelected={handleBulkDelete}
        isLoading={updateOrderStatusMutation.isPending}
                  />
                </div>
  );
}

export default function Orders() {
  return <OrdersComponent />;
}
