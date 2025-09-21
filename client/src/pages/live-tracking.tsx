import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MapPin, 
  Search, 
  Truck, 
  Clock, 
  Navigation, 
  Phone, 
  MessageSquare,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Users
} from 'lucide-react';
import { LiveTrackingMap } from '@/components/live-tracking-map';
import { DriverManagement } from '@/components/driver-management';
import { DriverProfile } from '@/components/driver-profile';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { useNotifications } from '@/hooks/use-notifications';

interface DriverLocation {
  driverId: string;
  driverName: string;
  orderId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  status: 'picked_up' | 'in_transit' | 'arrived' | 'delivered';
  estimatedArrival: string;
  lastUpdated: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: string;
  createdAt: string;
}

export default function LiveTrackingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [showAllDrivers, setShowAllDrivers] = useState(false);
  const [selectedDriverProfile, setSelectedDriverProfile] = useState<any>(null);
  const [isDriverManagementOpen, setIsDriverManagementOpen] = useState(false);
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  // Fetch orders using React Query
  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['live-tracking-orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });

  // Fetch drivers using React Query
  const {
    data: drivers = [],
    isLoading: driversLoading,
    isError: driversError,
    refetch: refetchDrivers,
  } = useQuery({
    queryKey: ['live-tracking-drivers'],
    queryFn: async () => {
      const response = await fetch('/api/tracking/drivers');
      if (!response.ok) throw new Error('Failed to fetch drivers');
      return response.json();
    },
    staleTime: 10 * 1000, // 10 seconds
    cacheTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 10 * 1000, // Auto-refetch every 10 seconds
  });

  const isLoading = ordersLoading || driversLoading;
  const hasError = ordersError || driversError;

  // WebSocket connection for real-time updates
  const { isConnected, subscribe } = useWebSocket({
    url: 'ws://localhost:3003',
    onMessage: (message) => {
      if (message.type === 'driver_locations') {
        const updatedDrivers = message.data.drivers as DriverLocation[];
        
        // Check for status changes and send notifications
        updatedDrivers.forEach(updatedDriver => {
          const existingDriver = drivers.find(d => d.driverId === updatedDriver.driverId);
          if (existingDriver && existingDriver.status !== updatedDriver.status) {
            addNotification({
              type: 'info',
              title: 'Driver Status Update',
              message: `${updatedDriver.driverName} status changed to ${getStatusText(updatedDriver.status)}`,
              actionUrl: '/live-tracking',
              actionText: 'View Details'
            });
          }
        });
        
        setDrivers(updatedDrivers);
      } else if (message.type === 'driver_assigned') {
        const { driverId, orderId, driverName } = message.data;
        addNotification({
          type: 'success',
          title: 'Driver Assigned',
          message: `${driverName} has been assigned to order #${orderId.slice(-8)}`,
          actionUrl: '/live-tracking',
          actionText: 'Track Order'
        });
        refetchDrivers(); // Use React Query refetch instead
      }
    },
    onOpen: () => {
      console.log('Connected to live tracking WebSocket');
      subscribe(['driver_locations', 'driver_assigned', 'driver_status_update']);
    },
    onClose: () => {
      console.log('Disconnected from live tracking WebSocket');
    },
    onError: (error) => {
      console.error('Live tracking WebSocket error:', error);
    }
  });

  // Data fetching is now handled by React Query above

  // Filter orders based on search
  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get orders with active drivers
  const ordersWithDrivers = orders.filter(order => 
    drivers.some(driver => driver.orderId === order.id)
  );

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    const driver = drivers.find(d => d.orderId === order.id);
    setSelectedDriver(driver || null);
  };

  const handleDriverSelect = (driver: DriverLocation) => {
    setSelectedDriver(driver);
    const order = orders.find(o => o.id === driver.orderId);
    setSelectedOrder(order || null);
  };

  const refreshData = async () => {
    await Promise.all([refetchOrders(), refetchDrivers()]);
    toast({
      title: "Data Refreshed",
      description: "Live tracking data has been updated",
    });
  };

  const handleDriverAssign = async (driverId: string, orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/assign-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId }),
      });

      if (response.ok) {
        toast({
          title: "Driver Assigned",
          description: "Driver has been successfully assigned to the order.",
        });
        refreshData(); // Refresh to show updated driver assignment
      } else {
        throw new Error('Failed to assign driver');
      }
    } catch (error) {
      console.error('Failed to assign driver:', error);
      toast({
        title: "Error",
        description: "Failed to assign driver to order.",
        variant: "destructive",
      });
    }
  };

  const handleDriverProfileSelect = (driver: any) => {
    setSelectedDriverProfile(driver);
  };

  const handleCallDriver = (phone: string) => {
    // In a real app, this would initiate a phone call
    toast({
      title: "Calling Driver",
      description: `Initiating call to ${phone}`,
    });
  };

  const handleMessageDriver = (driverId: string) => {
    // In a real app, this would open a messaging interface
    toast({
      title: "Messaging Driver",
      description: `Opening message interface for driver ${driverId}`,
    });
  };

  const handleTrackDriver = (driverId: string) => {
    // Find the driver in the active drivers list and select them
    const driver = drivers.find(d => d.driverId === driverId);
    if (driver) {
      handleDriverProfileSelect(driver);
      // Switch to map view
      const mapTab = document.querySelector('[value="map"]') as HTMLElement;
      if (mapTab) mapTab.click();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up': return 'bg-blue-500';
      case 'in_transit': return 'bg-yellow-500';
      case 'arrived': return 'bg-green-500';
      case 'delivered': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'picked_up': return 'Picked Up';
      case 'in_transit': return 'In Transit';
      case 'arrived': return 'Arrived';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  // Error state
  if (hasError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">
                Failed to load live tracking data
              </div>
              <p className="text-sm text-muted-foreground">
                {ordersError?.message || driversError?.message || 'An unexpected error occurred'}
              </p>
              <Button 
                onClick={() => {
                  refetchOrders();
                  refetchDrivers();
                }}
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Live Order Tracking</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading tracking data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Live Order Tracking</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground">Track your orders in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAllDrivers(!showAllDrivers)}
          >
            {showAllDrivers ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showAllDrivers ? 'Hide' : 'Show'} All Drivers
          </Button>
          <Dialog open={isDriverManagementOpen} onOpenChange={setIsDriverManagementOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Manage Drivers
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Driver Management</DialogTitle>
              </DialogHeader>
              <DriverManagement 
                onDriverSelect={handleDriverProfileSelect}
                onDriverAssign={handleDriverAssign}
                selectedOrderId={selectedOrder?.id}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="drivers">Active Drivers</TabsTrigger>
          <TabsTrigger value="management">Driver Management</TabsTrigger>
          <TabsTrigger value="map">Live Map</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order number or customer name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid gap-4">
                  {filteredOrders.map((order) => {
                    const driver = drivers.find(d => d.orderId === order.id);
                    return (
                      <Card 
                        key={order.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleOrderSelect(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                                {driver && (
                                  <Badge className={`${getStatusColor(driver.status)} text-white`}>
                                    {getStatusText(driver.status)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{order.customerName}</p>
                              <p className="text-sm text-muted-foreground">₹{order.totalAmount}</p>
                            </div>
                            
                            {driver ? (
                              <div className="text-right space-y-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Truck className="h-3 w-3" />
                                  <span>{driver.driverName}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <Navigation className="h-3 w-3" />
                                  <span>{driver.speed.toFixed(0)} km/h</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(driver.estimatedArrival).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-right">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                    setIsDriverManagementOpen(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Assign Driver
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Active Drivers ({drivers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {drivers.map((driver) => {
                  const order = orders.find(o => o.id === driver.orderId);
                  return (
                    <Card 
                      key={driver.driverId}
                      className={`cursor-pointer transition-colors ${
                        selectedDriver?.driverId === driver.driverId ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleDriverSelect(driver)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{driver.driverName}</h3>
                              <Badge className={`${getStatusColor(driver.status)} text-white`}>
                                {getStatusText(driver.status)}
                              </Badge>
                            </div>
                            {order && (
                              <>
                                <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                                <p className="text-sm text-muted-foreground">{order.customerName}</p>
                              </>
                            )}
                          </div>
                          
                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Navigation className="h-3 w-3" />
                              <span>{driver.speed.toFixed(0)} km/h</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(driver.estimatedArrival).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              <span>{driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <DriverManagement 
            onDriverSelect={handleDriverProfileSelect}
            onDriverAssign={handleDriverAssign}
            selectedOrderId={selectedOrder?.id}
          />
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              {selectedOrder || selectedDriver || drivers.length > 0 ? (
                <LiveTrackingMap 
                  orderId={selectedOrder?.id}
                  driverId={selectedDriver?.driverId}
                  allDrivers={drivers}
                  showAllDrivers={showAllDrivers}
                  className="w-full h-[600px]"
                />
              ) : (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Active Drivers</h3>
                      <p className="text-muted-foreground">
                        No drivers are currently active. Add drivers or assign them to orders to see live tracking.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setIsDriverManagementOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Driver
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={refreshData}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowAllDrivers(!showAllDrivers)}
                  >
                    {showAllDrivers ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showAllDrivers ? 'Hide' : 'Show'} All Drivers
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Live Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Drivers</span>
                    <span className="font-semibold">{drivers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Orders with Drivers</span>
                    <span className="font-semibold">{ordersWithDrivers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Available Drivers</span>
                    <span className="font-semibold text-green-600">
                      {drivers.filter(d => d.status === 'available').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">In Transit</span>
                    <span className="font-semibold text-yellow-600">
                      {drivers.filter(d => d.status === 'in_transit').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {drivers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Driver Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {drivers.slice(0, 5).map((driver) => (
                        <div key={driver.driverId} className="flex items-center justify-between text-sm">
                          <span className="truncate">{driver.driverName}</span>
                          <Badge className={`${getStatusColor(driver.status)} text-white text-xs`}>
                            {getStatusText(driver.status)}
                          </Badge>
                        </div>
                      ))}
                      {drivers.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{drivers.length - 5} more drivers
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Driver Profile Modal */}
      {selectedDriverProfile && (
        <DriverProfile
          driver={selectedDriverProfile}
          onClose={() => setSelectedDriverProfile(null)}
          onCall={handleCallDriver}
          onMessage={handleMessageDriver}
          onTrack={handleTrackDriver}
        />
      )}
    </div>
  );
}
