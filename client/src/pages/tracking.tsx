import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Filter, 
  Plus, 
  Truck, 
  Package, 
  QrCode, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  MapPin,
  User,
  Calendar,
  FileText
} from "lucide-react";

interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  status: 'placed' | 'accepted' | 'processing' | 'ready' | 'out_for_delivery' | 'delivered';
  items: number;
  services?: string[];
  totalAmount: number;
  createdAt: string;
  estimatedDelivery: string;
}

interface Shipment {
  id: string;
  uti: string; // Unified Tracking ID
  storeId: string;
  staffName: string;
  packageCount: number;
  orders: string[];
  status: 'created' | 'in_transit' | 'delivered';
  createdAt: string;
  estimatedDelivery: string;
}

const kpiData = [
    { title: "Total Shipments", value: "42", change: "+15 today", changeType: "positive" },
    { title: "In Transit", value: "28", change: "+5 from yesterday", changeType: "positive" },
    { title: "Delivered", value: "1,289", change: "+2.5% this week", changeType: "positive" },
    { title: "Delayed", value: "3", change: "-1 from yesterday", changeType: "negative" },
];

export default function Tracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isCreateShipmentOpen, setIsCreateShipmentOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: shipments, isLoading: shipmentsLoading } = useQuery<Shipment[]>({
    queryKey: ["/api/shipments"],
  });

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.phoneNumber.includes(searchTerm);
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
      case 'accepted': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'processing': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'ready': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'out_for_delivery': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'delivered': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'placed': return 'Order Placed';
      case 'accepted': return 'Order Accepted';
      case 'processing': return 'Processing';
      case 'ready': return 'Ready to Pickup';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  const getShipmentStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'in_transit': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'delivered': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const getShipmentStatusText = (status: string) => {
    switch (status) {
      case 'created': return 'Created';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleCreateShipment = () => {
    if (selectedOrders.length === 0) {
      alert("Please select at least one order to create a shipment.");
      return;
    }
    
    const uti = `UTI-2025-${String(shipments?.length || 0 + 1).padStart(3, '0')}`;
    alert(`Shipment created successfully!\n\nUnified Tracking ID: ${uti}\nOrders: ${selectedOrders.join(', ')}\n\nTransport Order has been generated and is ready for printing.`);
    
    setSelectedOrders([]);
    setIsCreateShipmentOpen(false);
  };

  return (
    <div className="p-8" data-testid="tracking-page">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
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

      {/* Tracking Management Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-h1">Shipment Tracking</h1>
              <div className="status-indicator-enhanced bg-green-500"></div>
              <span className="text-label text-muted-foreground">System Active</span>
            </div>
            <p className="text-body text-muted-foreground">Manage shipments and track deliveries</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isCreateShipmentOpen} onOpenChange={setIsCreateShipmentOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-shipment">
                <Plus className="w-4 h-4 mr-2" />
                Create New Shipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Shipment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Select orders to include in this shipment. You can scan QR codes or manually select orders.
                </div>
                
                {/* QR Code Scanner Simulation */}
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <QrCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">Scan QR codes of orders to add to shipment</p>
                  <Button variant="outline" size="sm">
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                </div>

                {/* Selected Orders */}
                {selectedOrders.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Orders ({selectedOrders.length})</h4>
                    <div className="space-y-1">
                      {selectedOrders.map(orderId => {
                        const order = orders?.find(o => o.id === orderId);
                        return order ? (
                          <div key={orderId} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{order.id} - {order.customerName}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOrderSelect(orderId)}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateShipmentOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateShipment}>
                    Create Shipment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tracking Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Orders</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {orders?.length || 0}
                </p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Ready for Shipment</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {orders?.filter(o => o.status === 'ready').length || 0}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Shipments</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {shipments?.filter(s => s.status === 'in_transit').length || 0}
                </p>
              </div>
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Delivered Today</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {shipments?.filter(s => s.status === 'delivered').length || 0}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Shipments */}
      <Card className="bento-card mb-8">
        <CardHeader>
          <CardTitle className="font-display font-semibold text-xl text-foreground">
            Active Shipments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UTI</TableHead>
                <TableHead>Store ID</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Packages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipmentsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading shipments...</TableCell>
                </TableRow>
              ) : (
                shipments?.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-mono font-medium">{shipment.uti}</TableCell>
                  <TableCell>{shipment.storeId}</TableCell>
                  <TableCell>{shipment.staffName}</TableCell>
                  <TableCell>{shipment.packageCount}</TableCell>
                  <TableCell>
                    <Badge className={getShipmentStatusColor(shipment.status)}>
                      {getShipmentStatusText(shipment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{shipment.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-1" />
                        Print
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedShipment(shipment)}>
                        Track
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

      {/* Orders Ready for Shipment */}
      <Card className="bento-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display font-semibold text-xl text-foreground">
              Orders Ready for Shipment
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="search-orders"
                />
              </div>
              <Button variant="outline" size="sm" data-testid="filter-orders">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Select</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersLoading ? (
                <TableRow>
                    <TableCell colSpan={9} className="text-center">Loading orders...</TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => handleOrderSelect(order.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="font-mono font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.phoneNumber}</TableCell>
                  <TableCell className="max-w-xs truncate">{order.address}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="font-medium">₹{order.totalAmount}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <QrCode className="w-4 h-4 mr-1" />
                        QR
                      </Button>
                      <Button variant="outline" size="sm">
                        View
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

      {/* Transport Order Template */}
      <Card className="bento-card mt-8">
        <CardHeader>
          <CardTitle className="font-display font-semibold text-xl text-foreground">
            Transport Order Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">TRANSPORT ORDER</h2>
              <p className="text-sm text-muted-foreground">Fab Clean Operations</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-medium">Store ID:</p>
                <p className="text-sm text-muted-foreground">STORE-001</p>
              </div>
              <div>
                <p className="text-sm font-medium">Staff Details:</p>
                <p className="text-sm text-muted-foreground">John Doe (ID: EMP-001)</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Number of Packages (Orders):</p>
              <p className="text-sm text-muted-foreground">3 packages</p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium mb-2">List of Orders:</p>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">• ORD-001 - Rajesh Kumar</p>
                <p className="text-sm text-muted-foreground">• ORD-002 - Priya Sharma</p>
                <p className="text-sm text-muted-foreground">• ORD-003 - Amit Patel</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <div className="border-t border-border pt-2">
                  <p className="text-sm font-medium">Sign of Staff</p>
                  <div className="h-8"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-border pt-2">
                  <p className="text-sm font-medium">Sign of Store Manager</p>
                  <div className="h-8"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-border pt-2">
                  <p className="text-sm font-medium">Sign of Supervisor</p>
                  <div className="h-8"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tracking View */}
      <Dialog open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Track Shipment: {selectedShipment?.uti}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* Shipment details and tracking visualization will go here */}
            <p>Details for shipment {selectedShipment?.id} will be displayed here.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
