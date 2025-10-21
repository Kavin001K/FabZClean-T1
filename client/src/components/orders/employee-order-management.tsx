import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Barcode,
  Truck,
  Factory,
  Store,
  Navigation
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { formatCurrency } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';

// Import our algorithm components
import { SearchInput, SearchFilters, SearchResultsList } from '../search/SearchComponents';
import { Pagination, PaginationInfo, CompactPagination } from '../pagination/PaginationComponents';
import { useHybridSearch } from '../../hooks/use-fuzzy-search';
import { useClientPagination } from '../../hooks/use-pagination';
import { useCachedQuery } from '../../hooks/use-cache';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: string[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  pickupDate: string;
  deliveryDate: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  weight?: number;
  price: number;
  status: string;
}

interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  dateRange?: string;
  service?: string;
  priority?: string;
}

export default function EmployeeOrderManagement() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<OrderFilters>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch orders with caching
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useCachedQuery(
    ['employee-orders-management'],
    async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    {
      cacheName: 'orders-management',
      ttl: 3 * 60 * 1000, // 3 minutes
      staleTime: 20000
    }
  );

  // Search functionality
  const searchFields = ['orderNumber', 'customerName', 'customerEmail', 'customerPhone', 'status', 'service'];
  const { results: searchResults, isLoading: searchLoading } = useHybridSearch(
    orders,
    searchFields,
    '/api/v1/search/orders',
    searchQuery,
    {
      preferServer: true,
      minQueryLength: 2,
      threshold: 0.7,
      maxResults: 100
    }
  );

  // Apply filters
  const filteredOrders = React.useMemo(() => {
    let filtered = searchResults.length > 0 ? searchResults : orders;

    if (filters.status) {
      filtered = filtered.filter((order: Order) => order.status === filters.status);
    }
    if (filters.paymentStatus) {
      filtered = filtered.filter((order: Order) => order.paymentStatus === filters.paymentStatus);
    }
    if (filters.service) {
      filtered = filtered.filter((order: Order) => 
        Array.isArray(order.service) ? order.service.includes(filters.service!) : order.service === filters.service
      );
    }

    return filtered;
  }, [searchResults, orders, filters]);

  // Sorting
  const sortedOrders = React.useMemo(() => {
    return [...filteredOrders].sort((a: Order, b: Order) => {
      let aValue = a[sortField as keyof Order];
      let bValue = b[sortField as keyof Order];

      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortField, sortDirection]);

  // Pagination
  const {
    data: paginatedOrders,
    pagination,
    goToPage,
    goToNextPage,
    goToPreviousPage
  } = useClientPagination(sortedOrders, {
    pageSize: 15,
    maxVisiblePages: 5
  });

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes, updatedBy: 'Employee' }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-orders-management'] });
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  });

  // Bulk status update mutation
  const bulkStatusUpdateMutation = useMutation({
    mutationFn: async ({ orderIds, status, notes }: { orderIds: string[]; status: string; notes?: string }) => {
      const promises = orderIds.map(orderId =>
        fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, notes, updatedBy: 'Employee' }),
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-orders-management'] });
      setSelectedOrders([]);
      setShowBulkActions(false);
      toast({
        title: "Bulk Update Complete",
        description: `${selectedOrders.length} orders have been updated successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update orders.",
        variant: "destructive",
      });
    }
  });

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "in_transit": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "ready_for_delivery": return "bg-purple-100 text-purple-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Event handlers
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleStatusUpdate = (orderId: string, newStatus: string, notes?: string) => {
    statusUpdateMutation.mutate({ orderId, status: newStatus, notes });
    setShowStatusUpdate(false);
  };

  const handleBulkStatusUpdate = (status: string, notes?: string) => {
    bulkStatusUpdateMutation.mutate({ orderIds: selectedOrders, status, notes });
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(paginatedOrders.map((order: Order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportOrders = () => {
    const csvContent = [
      ['Order ID', 'Customer', 'Service', 'Status', 'Amount', 'Created Date'].join(','),
      ...paginatedOrders.map((order: Order) => [
        order.orderNumber,
        order.customerName,
        Array.isArray(order.service) ? order.service.join(';') : order.service,
        order.status,
        order.totalAmount,
        new Date(order.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Orders have been exported successfully.",
    });
  };

  // Stats calculation
  const stats = {
    total: orders.length,
    pending: orders.filter((o: Order) => o.status === 'pending').length,
    processing: orders.filter((o: Order) => o.status === 'processing').length,
    completed: orders.filter((o: Order) => o.status === 'completed').length,
    inTransit: orders.filter((o: Order) => o.status === 'in_transit').length,
    readyForDelivery: orders.filter((o: Order) => o.status === 'ready_for_delivery').length,
    totalValue: orders.reduce((sum: number, o: Order) => sum + o.totalAmount, 0)
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            Manage and track customer orders efficiently
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleExportOrders}
            disabled={paginatedOrders.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateOrder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalValue)} total value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Ready for delivery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search & Filter Orders</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <SearchInput
                data={orders}
                searchFields={searchFields}
                onResultSelect={handleOrderSelect}
                placeholder="Search orders by ID, customer name, email, or status..."
                showSuggestions={true}
                showRecentSearches={true}
                maxResults={50}
                threshold={0.7}
              />
            </div>
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.status === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, status: filters.status === 'pending' ? undefined : 'pending' })}
            >
              Pending ({stats.pending})
            </Button>
            <Button
              variant={filters.status === 'processing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, status: filters.status === 'processing' ? undefined : 'processing' })}
            >
              Processing ({stats.processing})
            </Button>
            <Button
              variant={filters.status === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, status: filters.status === 'completed' ? undefined : 'completed' })}
            >
              Completed ({stats.completed})
            </Button>
            <Button
              variant={filters.status === 'in_transit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, status: filters.status === 'in_transit' ? undefined : 'in_transit' })}
            >
              In Transit ({stats.inTransit})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedOrders.length} order(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('processing', 'Bulk status update')}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Mark Processing
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate('completed', 'Bulk completion')}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBulkActions(true)}
                  >
                    <MoreHorizontal className="w-4 h-4 mr-1" />
                    More Actions
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrders([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Orders</span>
            <div className="flex items-center space-x-4">
              <PaginationInfo pagination={pagination} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchOrders()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('orderNumber')}
                      className="h-auto p-0 font-medium"
                    >
                      Order ID
                      {sortField === 'orderNumber' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('customerName')}
                      className="h-auto p-0 font-medium"
                    >
                      Customer
                      {sortField === 'customerName' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-medium"
                    >
                      Status
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('totalAmount')}
                      className="h-auto p-0 font-medium"
                    >
                      Amount
                      {sortField === 'totalAmount' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('createdAt')}
                      className="h-auto p-0 font-medium"
                    >
                      Created
                      {sortField === 'createdAt' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order: Order) => (
                  <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(order.service) ? order.service.map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        )) : (
                          <Badge variant="secondary" className="text-xs">
                            {order.service}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOrderSelect(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowStatusUpdate(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              pagination={pagination}
              onPageChange={goToPage}
              showPageSizeSelector={true}
              showPageInfo={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Order ID</Label>
                    <p className="font-medium">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Customer Name</Label>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Customer Email</Label>
                    <p className="font-medium">{selectedOrder.customerEmail}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Customer Phone</Label>
                    <p className="font-medium">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <p className="font-medium">{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Status</Label>
                    <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created Date</Label>
                    <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-muted-foreground">Services</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(selectedOrder.service) ? selectedOrder.service.map((service, index) => (
                      <Badge key={index} variant="secondary">
                        {service}
                      </Badge>
                    )) : (
                      <Badge variant="secondary">{selectedOrder.service}</Badge>
                    )}
                  </div>
                </div>

                {selectedOrder.specialInstructions && (
                  <div>
                    <Label className="text-muted-foreground">Special Instructions</Label>
                    <p className="mt-2 p-3 bg-muted rounded-lg">{selectedOrder.specialInstructions}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="items" className="mt-4">
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.weight ? `${item.weight} kg` : 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Order Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Status Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedOrder.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'processing', 'Started processing')}
                      disabled={selectedOrder.status === 'processing'}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Mark Processing
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'completed', 'Order completed')}
                      disabled={selectedOrder.status === 'completed'}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'in_transit', 'Order in transit')}
                      disabled={selectedOrder.status === 'in_transit'}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Mark In Transit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'ready_for_delivery', 'Ready for delivery')}
                      disabled={selectedOrder.status === 'ready_for_delivery'}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Ready for Delivery
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Order</Label>
                <p className="font-medium">{selectedOrder.orderNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Current Status</Label>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <Label htmlFor="newStatus">New Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="ready_for_delivery">Ready for Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this status change..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusUpdate(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle status update
              setShowStatusUpdate(false);
            }}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
