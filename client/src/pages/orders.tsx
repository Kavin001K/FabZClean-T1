import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Eye,
  Edit,
  X,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Columns,
  Settings,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { Link } from "wouter"
import { useToast } from "@/hooks/use-toast"
// Import data service
import { 
  ordersApi,
  type Order,
  getNextStatus,
  getStatusColor,
  getPriorityColor,
  formatCurrency,
  formatDate
} from '@/lib/data-service'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Order | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'id', 'customerName', 'service', 'priority', 'status', 'date', 'total', 'actions'
  ]);
  const { toast } = useToast();

  // Calculate KPI data from dummy orders
  const kpiData = [
    { 
      title: "Total Orders", 
      value: orders.length.toString(), 
      change: "+12.5%", 
      changeType: "positive" 
    },
    { 
      title: "Pending Orders", 
      value: orders.filter(o => o.status === 'Pending').length.toString(), 
      change: "-2.1%", 
      changeType: "negative" 
    },
    { 
      title: "Completed Orders", 
      value: orders.filter(o => o.status === 'Completed').length.toString(), 
      change: "+8.2%", 
      changeType: "positive" 
    },
    { 
      title: "Average Order Value", 
      value: `₹${orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length).toLocaleString() : '0'}`, 
      change: "+5.7%", 
      changeType: "positive" 
    },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await ordersApi.getAll();
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchOrders();
  }, [toast]);

  // Filter and sort orders
  useEffect(() => {
    let filtered = orders;
    
    // Filter by tab
    switch (activeTab) {
      case "active":
        filtered = orders.filter(order => order.status === 'Processing' || order.status === 'Pending');
        break;
      case "draft":
        filtered = orders.filter(order => order.status === 'Pending');
        break;
      case "archived":
        filtered = orders.filter(order => order.status === 'Completed' || order.status === 'Cancelled');
        break;
      default:
        filtered = orders;
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.service.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort orders
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
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
    
    setFilteredOrders(filtered);
  }, [orders, activeTab, searchQuery, sortField, sortDirection]);

  // Desktop keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'f':
            event.preventDefault();
            // Focus search input
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            searchInput?.focus();
            break;
          case 'r':
            event.preventDefault();
            // Refresh data
            const refreshOrders = async () => {
              try {
                const ordersData = await ordersApi.getAll();
                setOrders(ordersData);
                setFilteredOrders(ordersData);
                toast({
                  title: "Data Refreshed",
                  description: "Orders data has been refreshed",
                });
              } catch (error) {
                console.error('Failed to refresh orders:', error);
              }
            };
            refreshOrders();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  const handleSort = (field: keyof DummyOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewOrder = (order: DummyOrder) => {
    setSelectedOrder(order);
  };

  const handleEditOrder = (order: DummyOrder) => {
    console.log(`Editing order ${order.id}`);
    toast({
      title: "Edit Order",
      description: `Edit functionality for order ${order.id} coming soon!`,
    });
  };

  const handleCancelOrder = (order: DummyOrder) => {
    console.log(`Cancelling order ${order.id}`);
    toast({
      title: "Cancel Order",
      description: `Cancel functionality for order ${order.id} coming soon!`,
    });
  };

  const handleFilter = () => {
    toast({
      title: "Filter Orders",
      description: "Filter functionality coming soon!",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Orders",
      description: "Export functionality coming soon!",
    });
  };

  const handleNextStep = (order: DummyOrder) => {
    const nextStatus = getNextStatus(order.status);
    if (nextStatus) {
      // Update the order status
      const updatedOrders = orders.map(o => 
        o.id === order.id ? { ...o, status: nextStatus } : o
      );
      setOrders(updatedOrders);
      
      // Update filtered orders if needed
      setFilteredOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, status: nextStatus } : o
      ));

      toast({
        title: "Order Status Updated",
        description: `Order ${order.id} moved to ${nextStatus}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader>
              <CardTitle>{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={`text-xs ${kpi.changeType === "positive" ? "text-green-500" : "text-red-500"}`}>{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived" className="hidden sm:flex">
              Archived
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            {/* Desktop Search Bar */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders... (⌘F)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 text-sm"
                />
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1" onClick={handleFilter}>
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                  Completed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Processing</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Pending
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Cancelled
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button size="sm" variant="outline" className="h-7 gap-1" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
            
            <Button size="sm" variant="outline" className="h-7 gap-1" onClick={async () => {
              try {
                const ordersData = await ordersApi.getAll();
                setOrders(ordersData);
                setFilteredOrders(ordersData);
                toast({
                  title: "Data Refreshed",
                  description: "Orders data has been refreshed",
                });
              } catch (error) {
                console.error('Failed to refresh orders:', error);
              }
            }}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Refresh
              </span>
            </Button>
            
            <Link to="/create-order">
                <Button size="sm" className="h-7 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Create Order
                  </span>
                </Button>
            </Link>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                Manage your orders and view their sales details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center gap-2">
                        Order ID
                        {sortField === 'id' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('customerName')}
                    >
                      <div className="flex items-center gap-2">
                        Customer
                        {sortField === 'customerName' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('service')}
                    >
                      <div className="flex items-center gap-2">
                        Service
                        {sortField === 'service' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center gap-2">
                        Priority
                        {sortField === 'priority' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="hidden md:table-cell cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        {sortField === 'date' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Amount
                        {sortField === 'total' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">No orders found</TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id} className="interactive-row">
                        <TableCell className="font-medium">
                          {order.id}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.customerName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{order.service}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(order.priority || 'Normal')}>
                            {order.priority || 'Normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(order.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">₹{order.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrder(order)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOrder(order)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelOrder(order)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full">
              <div className="text-xs text-muted-foreground">
                  Showing <strong>1-{filteredOrders.length}</strong> of <strong>{filteredOrders.length}</strong> orders
                  {searchQuery && (
                    <span className="ml-2 text-blue-600">
                      • Filtered by "{searchQuery}"
                    </span>
                  )}
                  {sortField && (
                    <span className="ml-2 text-green-600">
                      • Sorted by {sortField} ({sortDirection})
                    </span>
                  )}
                </div>
                <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
                  <span>⌘F to search</span>
                  <span>⌘R to refresh</span>
                  <span>Click headers to sort</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
              <CardDescription>
                Orders currently being processed or pending.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No active orders found</TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.service}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(order.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">₹{order.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleViewOrder(order)} className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditOrder(order)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft">
          <Card>
            <CardHeader>
              <CardTitle>Draft Orders</CardTitle>
              <CardDescription>
                Orders pending confirmation or processing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No draft orders found</TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.service}</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(order.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">₹{order.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleViewOrder(order)} className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditOrder(order)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCancelOrder(order)} className="h-8 w-8 p-0 text-red-600">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>Archived Orders</CardTitle>
              <CardDescription>
                Completed and cancelled orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No archived orders found</TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.service}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(order.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">₹{order.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleViewOrder(order)} className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order Details: {selectedOrder.id}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="text-lg font-semibold">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service</p>
                  <p className="text-lg font-semibold">{selectedOrder.service}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge className={getPriorityColor(selectedOrder.priority || 'Normal')}>
                    {selectedOrder.priority || 'Normal'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-lg font-semibold">{new Date(selectedOrder.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">₹{selectedOrder.total.toLocaleString()}</p>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm bg-muted p-2 rounded">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                {getNextStatus(selectedOrder.status) && (
                  <Button onClick={() => handleNextStep(selectedOrder)} className="bg-green-600 hover:bg-green-700">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Next Step: {getNextStatus(selectedOrder.status)}
                  </Button>
                )}
                <Button variant="outline" onClick={() => handleEditOrder(selectedOrder)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Order
                </Button>
                {selectedOrder.status !== 'Completed' && selectedOrder.status !== 'Cancelled' && (
                  <Button variant="outline" onClick={() => handleCancelOrder(selectedOrder)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
