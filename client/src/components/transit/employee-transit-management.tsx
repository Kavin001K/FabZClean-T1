import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Package,
  Plus,
  Search,
  X,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Navigation,
  Barcode,
  FileText,
  ArrowRight,
  Building2,
  Factory,
  Store,
  User,
  Calendar,
  Eye,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  StopCircle,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Edit,
  Copy,
  Share
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
import { Progress } from '@/components/ui/progress';

import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';

// Import our algorithm components
import { SearchInput, SearchFilters } from '../search/SearchComponents';
import { Pagination, PaginationInfo } from '../pagination/PaginationComponents';
import { useHybridSearch } from '../../hooks/use-fuzzy-search';
import { useClientPagination } from '../../hooks/use-pagination';
import { useCachedQuery } from '../../hooks/use-cache';

interface TransitOrder {
  id: string;
  transitId: string;
  type: 'store_to_factory' | 'factory_to_store';
  origin: string;
  destination: string;
  createdBy: string;
  createdAt: string;
  status: 'in_transit' | 'completed' | 'pending';
  orders: OrderInBatch[];
  totalItems: number;
  totalWeight: number;
  vehicleDetails?: VehicleDetails;
  employeeDetails?: EmployeeDetails;
  storeDetails?: StoreDetails;
  factoryDetails?: FactoryDetails;
}

interface OrderInBatch {
  orderNumber: string;
  customerId: string;
  customerName: string;
  itemCount: number;
  status: string;
  serviceType?: string;
  weight?: number;
}

interface VehicleDetails {
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
}

interface EmployeeDetails {
  name: string;
  employeeId: string;
  designation: string;
  phone: string;
}

interface StoreDetails {
  name: string;
  address: string;
  phone: string;
  managerName: string;
  storeCode: string;
}

interface FactoryDetails {
  name: string;
  address: string;
  phone: string;
  managerName: string;
  factoryCode: string;
}

export default function EmployeeTransitManagement() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedTransit, setSelectedTransit] = useState<TransitOrder | null>(null);
  const [showTransitDetails, setShowTransitDetails] = useState(false);
  const [showCreateTransit, setShowCreateTransit] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Current batch state
  const [currentBatch, setCurrentBatch] = useState<OrderInBatch[]>([]);
  const [batchType, setBatchType] = useState<'store_to_factory' | 'factory_to_store'>('store_to_factory');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Fetch transit orders with caching
  const { data: transitOrders = [], isLoading: transitLoading, refetch: refetchTransit } = useCachedQuery(
    ['employee-transit-management'],
    async () => {
      const response = await fetch('/api/transit-orders');
      if (!response.ok) throw new Error('Failed to fetch transit orders');
      return response.json();
    },
    {
      cacheName: 'transit-management',
      ttl: 2 * 60 * 1000, // 2 minutes
      staleTime: 15000
    }
  );

  // Fetch recent orders for batch creation
  const { data: recentOrders = [], isLoading: ordersLoading } = useCachedQuery(
    ['recent-orders-for-transit'],
    async () => {
      const response = await fetch('/api/orders/recent');
      if (!response.ok) throw new Error('Failed to fetch recent orders');
      return response.json();
    },
    {
      cacheName: 'recent-orders',
      ttl: 5 * 60 * 1000, // 5 minutes
      staleTime: 30000
    }
  );

  // Search functionality
  const searchFields = ['transitId', 'origin', 'destination', 'createdBy', 'status', 'type'];
  const { results: searchResults, isLoading: searchLoading } = useHybridSearch(
    transitOrders,
    searchFields,
    '/api/v1/search/transit-orders',
    searchQuery,
    {
      preferServer: true,
      minQueryLength: 2,
      threshold: 0.7,
      maxResults: 50
    }
  );

  // Apply filters
  const filteredTransitOrders = React.useMemo(() => {
    let filtered = searchResults.length > 0 ? searchResults : transitOrders;

    if (filters.status) {
      filtered = filtered.filter((transit: TransitOrder) => transit.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter((transit: TransitOrder) => transit.type === filters.type);
    }
    if (filters.dateRange) {
      const now = new Date();
      const days = parseInt(filters.dateRange);
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((transit: TransitOrder) => 
        new Date(transit.createdAt) >= cutoffDate
      );
    }

    return filtered;
  }, [searchResults, transitOrders, filters]);

  // Sorting
  const sortedTransitOrders = React.useMemo(() => {
    return [...filteredTransitOrders].sort((a: TransitOrder, b: TransitOrder) => {
      let aValue = a[sortField as keyof TransitOrder];
      let bValue = b[sortField as keyof TransitOrder];

      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTransitOrders, sortField, sortDirection]);

  // Pagination
  const {
    data: paginatedTransitOrders,
    pagination,
    goToPage,
    goToNextPage,
    goToPreviousPage
  } = useClientPagination(sortedTransitOrders, {
    pageSize: 10,
    maxVisiblePages: 5
  });

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ transitId, status, notes }: { transitId: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/transit-orders/${transitId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes, updatedBy: 'Employee' }),
      });
      if (!response.ok) throw new Error('Failed to update transit status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-transit-management'] });
      toast({
        title: "Status Updated",
        description: "Transit status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update transit status.",
        variant: "destructive",
      });
    }
  });

  // Create transit order mutation
  const createTransitMutation = useMutation({
    mutationFn: async (transitData: any) => {
      const response = await fetch('/api/transit-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transitData),
      });
      if (!response.ok) throw new Error('Failed to create transit order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-transit-management'] });
      setCurrentBatch([]);
      setIsScanning(false);
      setShowCreateTransit(false);
      toast({
        title: "Transit Order Created",
        description: "Transit order has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create transit order.",
        variant: "destructive",
      });
    }
  });

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_transit": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "store_to_factory": return "bg-blue-100 text-blue-800";
      case "factory_to_store": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "store_to_factory": return <Store className="w-4 h-4" />;
      case "factory_to_store": return <Factory className="w-4 h-4" />;
      default: return <Truck className="w-4 h-4" />;
    }
  };

  // Event handlers
  const handleTransitSelect = (transit: TransitOrder) => {
    setSelectedTransit(transit);
    setShowTransitDetails(true);
  };

  const handleStatusUpdate = (transitId: string, newStatus: string, notes?: string) => {
    statusUpdateMutation.mutate({ transitId, status: newStatus, notes });
    setShowStatusUpdate(false);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStartNewBatch = () => {
    setCurrentBatch([]);
    setBarcodeInput('');
    setIsScanning(true);
    setShowCreateTransit(true);
  };

  const handleAddOrderToBatch = async (orderData: any) => {
    // Check if already in batch
    if (currentBatch.some((order) => order.orderNumber === orderData.orderNumber)) {
      toast({
        title: 'Already Added',
        description: 'Order already in batch',
        variant: 'destructive',
      });
      return;
    }

    const orderInBatch: OrderInBatch = {
      orderNumber: orderData.orderNumber,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      itemCount: orderData.items?.length || 0,
      status: orderData.status,
      serviceType: orderData.serviceType || 'Dry Clean',
      weight: orderData.items?.reduce((sum: number, item: any) => sum + (item.weight || 0), 0) || 0,
    };

    setCurrentBatch([...currentBatch, orderInBatch]);
    toast({
      title: 'Order Added',
      description: `Order ${orderData.orderNumber} added to batch`,
    });
  };

  const handleRemoveOrderFromBatch = (orderNumber: string) => {
    setCurrentBatch(currentBatch.filter((order) => order.orderNumber !== orderNumber));
    toast({
      title: 'Order Removed',
      description: `Order ${orderNumber} removed from batch`,
    });
  };

  const handleCreateTransitOrder = async () => {
    if (currentBatch.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one order to the batch',
        variant: 'destructive',
      });
      return;
    }

    const transitId = `TRN-${Date.now().toString().slice(-6)}`;
    const totalItems = currentBatch.reduce((sum, order) => sum + order.itemCount, 0);
    const totalWeight = currentBatch.reduce((sum, order) => sum + (order.weight || 0), 0);

    const transitData = {
      transitId,
      type: batchType,
      status: 'pending',
      origin: batchType === 'store_to_factory' ? 'Store #1' : 'Central Factory',
      destination: batchType === 'store_to_factory' ? 'Central Factory' : 'Store #1',
      createdBy: 'Current Employee',
      totalItems,
      totalWeight,
      orders: currentBatch,
      vehicleDetails: {
        vehicleNumber: 'KA-01-AB-1234',
        vehicleType: 'Tempo Traveller',
        driverName: 'Vijay Singh',
        driverPhone: '+91 98765 43212',
        driverLicense: 'KA0120230012345',
      },
      employeeDetails: {
        name: 'Current Employee',
        employeeId: 'EMP001',
        designation: 'Store Executive',
        phone: '+91 98765 43213',
      }
    };

    createTransitMutation.mutate(transitData);
  };

  // Stats calculation
  const stats = {
    total: transitOrders.length,
    inTransit: transitOrders.filter((t: TransitOrder) => t.status === 'in_transit').length,
    completed: transitOrders.filter((t: TransitOrder) => t.status === 'completed').length,
    pending: transitOrders.filter((t: TransitOrder) => t.status === 'pending').length,
    storeToFactory: transitOrders.filter((t: TransitOrder) => t.type === 'store_to_factory').length,
    factoryToStore: transitOrders.filter((t: TransitOrder) => t.type === 'factory_to_store').length,
    totalItems: transitOrders.reduce((sum: number, t: TransitOrder) => sum + t.totalItems, 0),
    totalWeight: transitOrders.reduce((sum: number, t: TransitOrder) => sum + t.totalWeight, 0)
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transit Management</h1>
          <p className="text-muted-foreground">
            Manage transit orders and track shipments between store and factory
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => refetchTransit()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleStartNewBatch}>
            <Plus className="w-4 h-4 mr-2" />
            New Transit Batch
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transit Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalItems} total items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">
              Active shipments
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
              Delivered successfully
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalWeight.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">
              Total shipped weight
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transit-orders">Transit Orders</TabsTrigger>
          <TabsTrigger value="create-batch">Create Batch</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Search Transit Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <SearchInput
                    data={transitOrders}
                    searchFields={searchFields}
                    onResultSelect={handleTransitSelect}
                    placeholder="Search by transit ID, origin, destination, or status..."
                    showSuggestions={true}
                    showRecentSearches={true}
                    maxResults={30}
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
                  variant={filters.status === 'in_transit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, status: filters.status === 'in_transit' ? undefined : 'in_transit' })}
                >
                  In Transit ({stats.inTransit})
                </Button>
                <Button
                  variant={filters.status === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, status: filters.status === 'completed' ? undefined : 'completed' })}
                >
                  Completed ({stats.completed})
                </Button>
                <Button
                  variant={filters.type === 'store_to_factory' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, type: filters.type === 'store_to_factory' ? undefined : 'store_to_factory' })}
                >
                  Store → Factory ({stats.storeToFactory})
                </Button>
                <Button
                  variant={filters.type === 'factory_to_store' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, type: filters.type === 'factory_to_store' ? undefined : 'factory_to_store' })}
                >
                  Factory → Store ({stats.factoryToStore})
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

          {/* Recent Transit Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transit Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paginatedTransitOrders.slice(0, 5).map((transit: TransitOrder) => (
                  <div key={transit.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{transit.transitId}</h4>
                        <Badge className={getStatusColor(transit.status)}>
                          {transit.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getTypeColor(transit.type)}>
                          {getTypeIcon(transit.type)}
                          <span className="ml-1">
                            {transit.type === 'store_to_factory' ? 'Store → Factory' : 'Factory → Store'}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transit.origin} → {transit.destination} • 
                        {transit.totalItems} items • 
                        {transit.totalWeight.toFixed(1)} kg • 
                        {new Date(transit.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransitSelect(transit)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTransit(transit);
                          setShowStatusUpdate(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transit Orders Tab */}
        <TabsContent value="transit-orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Transit Orders</span>
                <PaginationInfo pagination={pagination} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('transitId')}
                          className="h-auto p-0 font-medium"
                        >
                          Transit ID
                          {sortField === 'transitId' && (
                            sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('status')}
                          className="h-auto p-0 font-medium"
                        >
                          Status
                          {sortField === 'status' && (
                            sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('createdAt')}
                          className="h-auto p-0 font-medium"
                        >
                          Created
                          {sortField === 'createdAt' && (
                            sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransitOrders.map((transit: TransitOrder) => (
                      <TableRow key={transit.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{transit.transitId}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(transit.type)}>
                            {getTypeIcon(transit.type)}
                            <span className="ml-1">
                              {transit.type === 'store_to_factory' ? 'Store → Factory' : 'Factory → Store'}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{transit.origin}</div>
                            <div className="text-muted-foreground">→ {transit.destination}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transit.status)}>
                            {transit.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{transit.totalItems}</TableCell>
                        <TableCell>{transit.totalWeight.toFixed(1)} kg</TableCell>
                        <TableCell>{new Date(transit.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTransitSelect(transit)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTransit(transit);
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
        </TabsContent>

        {/* Create Batch Tab */}
        <TabsContent value="create-batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Barcode className="w-5 h-5" />
                <span>Create New Transit Batch</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Batch Type Selection */}
              <div className="space-y-2">
                <Label>Transit Type</Label>
                <Select value={batchType} onValueChange={(value: any) => setBatchType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store_to_factory">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Store → Factory
                      </div>
                    </SelectItem>
                    <SelectItem value="factory_to_store">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4" />
                        Factory → Store
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Barcode Input */}
              <div className="space-y-2">
                <Label htmlFor="barcode-input">Scan or Enter Order ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode-input"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan barcode or type Order ID..."
                    disabled={!isScanning}
                    className="flex-1"
                  />
                  <Button onClick={() => setIsScanning(!isScanning)}>
                    {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                  </Button>
                </div>
              </div>

              {/* Recent Orders Quick Add */}
              {isScanning && recentOrders.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quick Add - Recent Orders</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg bg-muted/30">
                    {recentOrders.slice(0, 10).map((order: any) => (
                      <div
                        key={order.orderNumber}
                        className={`p-2 rounded-md border-2 transition-all cursor-pointer ${
                          currentBatch.some(b => b.orderNumber === order.orderNumber)
                            ? 'border-green-500 bg-green-50 opacity-50 cursor-not-allowed'
                            : 'border-border bg-background hover:border-primary hover:shadow-sm'
                        }`}
                        onClick={() => handleAddOrderToBatch(order)}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-semibold">{order.orderNumber}</span>
                            {currentBatch.some(b => b.orderNumber === order.orderNumber) && (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">{order.customerName}</span>
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {order.items?.length || 0} items
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Batch List */}
              {currentBatch.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead className="text-center">Weight</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentBatch.map((order, index) => (
                        <TableRow key={order.orderNumber}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{order.orderNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell className="text-center">{order.itemCount} pcs</TableCell>
                          <TableCell className="text-center">{order.weight?.toFixed(1)} kg</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOrderFromBatch(order.orderNumber)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No orders in batch</p>
                  <p className="text-sm">
                    {isScanning
                      ? 'Scan order barcodes to add them to this batch'
                      : 'Click "Start Scanning" to begin'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateTransitOrder}
                  disabled={currentBatch.length === 0}
                  className="flex-1 gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Create Transit Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentBatch([])}
                  disabled={currentBatch.length === 0}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Batch
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transit Details Dialog */}
      <Dialog open={showTransitDetails} onOpenChange={setShowTransitDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transit Order Details - {selectedTransit?.transitId}</DialogTitle>
          </DialogHeader>
          {selectedTransit && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="tracking">Tracking</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Transit ID</Label>
                    <p className="font-medium">{selectedTransit.transitId}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(selectedTransit.status)}>
                      {selectedTransit.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <Badge className={getTypeColor(selectedTransit.type)}>
                      {getTypeIcon(selectedTransit.type)}
                      <span className="ml-1">
                        {selectedTransit.type === 'store_to_factory' ? 'Store → Factory' : 'Factory → Store'}
                      </span>
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created By</Label>
                    <p className="font-medium">{selectedTransit.createdBy}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Origin</Label>
                    <p className="font-medium">{selectedTransit.origin}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Destination</Label>
                    <p className="font-medium">{selectedTransit.destination}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Items</Label>
                    <p className="font-medium">{selectedTransit.totalItems}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Weight</Label>
                    <p className="font-medium">{selectedTransit.totalWeight.toFixed(1)} kg</p>
                  </div>
                </div>

                {selectedTransit.vehicleDetails && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Vehicle Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Vehicle Number</Label>
                          <p className="font-medium">{selectedTransit.vehicleDetails.vehicleNumber}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Vehicle Type</Label>
                          <p className="font-medium">{selectedTransit.vehicleDetails.vehicleType}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Driver Name</Label>
                          <p className="font-medium">{selectedTransit.vehicleDetails.driverName}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Driver Phone</Label>
                          <p className="font-medium">{selectedTransit.vehicleDetails.driverPhone}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="orders" className="mt-4">
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-right">Items</TableHead>
                        <TableHead className="text-right">Weight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTransit.orders?.map((order, index) => (
                        <TableRow key={order.orderNumber}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.serviceType || 'Dry Clean'}</TableCell>
                          <TableCell className="text-right">{order.itemCount}</TableCell>
                          <TableCell className="text-right">
                            {order.weight ? `${order.weight.toFixed(1)} kg` : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="tracking" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Transit Order Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedTransit.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedTransit.status === 'in_transit' && (
                    <div className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">In Transit</p>
                        <p className="text-sm text-muted-foreground">
                          Currently being transported
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedTransit.status === 'completed' && (
                    <div className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Delivered</p>
                        <p className="text-sm text-muted-foreground">
                          Successfully delivered to destination
                        </p>
                      </div>
                    </div>
                  )}
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
            <DialogTitle>Update Transit Status</DialogTitle>
          </DialogHeader>
          {selectedTransit && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Transit Order</Label>
                <p className="font-medium">{selectedTransit.transitId}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Current Status</Label>
                <Badge className={getStatusColor(selectedTransit.status)}>
                  {selectedTransit.status.replace('_', ' ')}
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
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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
