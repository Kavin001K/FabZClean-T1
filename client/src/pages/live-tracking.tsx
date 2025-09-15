import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  EyeOff
} from 'lucide-react';
import { LiveTrackingMap } from '@/components/live-tracking-map';
import { useToast } from '@/hooks/use-toast';

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllDrivers, setShowAllDrivers] = useState(false);
  const { toast } = useToast();

  // Fetch orders and drivers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const [ordersResponse, driversResponse] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/tracking/drivers')
        ]);

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData);
        }

        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          setDrivers(driversData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: "Error",
          description: "Failed to load tracking data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

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
    try {
      setIsLoading(true);
      const response = await fetch('/api/tracking/drivers');
      if (response.ok) {
        const driversData = await response.json();
        setDrivers(driversData);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-bold tracking-tight">Live Order Tracking</h1>
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
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="drivers">Active Drivers</TabsTrigger>
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
                            
                            {driver && (
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

        <TabsContent value="map" className="space-y-4">
          {selectedOrder || selectedDriver ? (
            <LiveTrackingMap 
              orderId={selectedOrder?.id}
              driverId={selectedDriver?.driverId}
              className="w-full"
            />
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select an Order or Driver</h3>
                  <p className="text-muted-foreground">
                    Choose an order from the Orders tab or a driver from the Active Drivers tab to view live tracking.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
