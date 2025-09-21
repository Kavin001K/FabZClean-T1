import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  MapPin, 
  Clock, 
  Route, 
  AlertTriangle, 
  CheckCircle, 
  Navigation,
  Package,
  Users
} from "lucide-react";
import { getStatusColor, formatCurrency } from "@/lib/data";
import { format, formatDistanceToNow } from "date-fns";
import { useSafeQuery } from "@/hooks/use-safe-query";
import type { Delivery, Order } from "../../shared/schema";

// Fallback data for when API fails
const FALLBACK_DELIVERIES: Delivery[] = [
  {
    id: "1",
    orderId: "ORD-001",
    driverName: "John Doe",
    vehicleId: "VH-001",
    status: "in_transit",
    estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    actualDelivery: null,
    location: { lat: 12.9716, lng: 77.5946 },
    route: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    orderId: "ORD-002",
    driverName: "Jane Smith",
    vehicleId: "VH-002",
    status: "delivered",
    estimatedDelivery: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    actualDelivery: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    location: { lat: 12.9716, lng: 77.5946 },
    route: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const FALLBACK_ORDERS: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
    customerPhone: "+1234567890",
    status: "processing",
    paymentStatus: "paid",
    totalAmount: "25.00",
    items: [{ productId: "1", productName: "Dry Cleaning", quantity: 1, price: "25.00" }],
    shippingAddress: { instructions: "Leave at door" },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function Logistics() {
  const { data: deliveries, isLoading: deliveriesLoading, isError: deliveriesError } = useSafeQuery<Delivery[]>({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const response = await fetch("/api/deliveries");
      if (!response.ok) {
        throw new Error("Failed to fetch deliveries");
      }
      return response.json();
    },
  }, FALLBACK_DELIVERIES);

  const { data: orders, isLoading: ordersLoading, isError: ordersError } = useSafeQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    },
  }, FALLBACK_ORDERS);

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "pending": return 10;
      case "in_transit": return 75;
      case "delivered": return 100;
      case "failed": return 0;
      default: return 0;
    }
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "in_transit": return <Truck className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      case "failed": return <AlertTriangle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  // Calculate logistics metrics
  const totalDeliveries = deliveries?.length || 0;
  const activeDeliveries = deliveries?.filter(d => d.status === "in_transit").length || 0;
  const completedDeliveries = deliveries?.filter(d => d.status === "delivered").length || 0;
  const onTimeDeliveries = deliveries?.filter(d => 
    d.status === "delivered" && 
    d.actualDelivery && 
    d.estimatedDelivery &&
    new Date(d.actualDelivery) <= new Date(d.estimatedDelivery)
  ).length || 0;
  const onTimeRate = completedDeliveries > 0 ? (onTimeDeliveries / completedDeliveries) * 100 : 0;

  // Get unique vehicles
  const vehicles = Array.from(new Set(deliveries?.map(d => d.vehicleId) || []));

  const isLoading = deliveriesLoading || ordersLoading;
  const hasError = deliveriesError || ordersError;

  // Show error state if both queries fail
  if (hasError && !deliveries && !orders) {
    return (
      <div className="p-8" data-testid="logistics-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Logistics</h1>
            <p className="text-gray-600 mt-2">Manage deliveries and track shipments</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Data</h3>
              <p className="text-gray-600 mb-4">
                There was an issue loading the logistics data. Using fallback data for demonstration.
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8" data-testid="logistics-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">Logistics</h1>
            <p className="text-muted-foreground mt-1">Fleet management and delivery tracking</p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="logistics-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Logistics</h1>
          <p className="text-muted-foreground mt-1">Fleet management and delivery tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="status-indicator status-online"></div>
            <span className="text-sm text-muted-foreground">GPS Tracking Active</span>
          </div>
          <Button 
            data-testid="view-map"
            onClick={() => {
              console.log("Opening map view...");
              alert("Map view feature coming soon! This would show a real-time map with delivery locations and routes.");
            }}
          >
            <MapPin className="w-4 h-4 mr-2" />
            View Map
          </Button>
        </div>
      </div>

      {/* Logistics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Deliveries</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {activeDeliveries}
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
                <p className="text-xs sm:text-sm text-muted-foreground">Fleet Size</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {vehicles.length}
                </p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">On-Time Rate</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {onTimeRate.toFixed(1)}%
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
                <p className="text-xs sm:text-sm text-muted-foreground">Total Deliveries</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">
                  {totalDeliveries}
                </p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="fleet" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fleet" data-testid="fleet-tab">Fleet Status</TabsTrigger>
          <TabsTrigger value="deliveries" data-testid="deliveries-tab">Active Deliveries</TabsTrigger>
          <TabsTrigger value="routes" data-testid="routes-tab">Route Optimization</TabsTrigger>
        </TabsList>

        {/* Fleet Status Tab */}
        <TabsContent value="fleet" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fleet Overview */}
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Fleet Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicles.map((vehicleId) => {
                    const vehicleDeliveries = deliveries?.filter(d => d.vehicleId === vehicleId) || [];
                    const currentDelivery = vehicleDeliveries.find(d => d.status === "in_transit");
                    const status = currentDelivery ? "active" : "idle";
                    
                    return (
                      <div 
                        key={vehicleId}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                        data-testid={`vehicle-${vehicleId}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            status === "active" ? "status-online" : "bg-muted-foreground"
                          }`}></div>
                          <div>
                            <p className="font-medium text-foreground">{vehicleId}</p>
                            <p className="text-sm text-muted-foreground">
                              {currentDelivery 
                                ? `Driver: ${currentDelivery.driverName}` 
                                : "Available"
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={status === "active" ? getStatusColor("in_transit") : "bg-muted text-muted-foreground"}>
                            {status === "active" ? "En Route" : "Idle"}
                          </Badge>
                          {currentDelivery && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {currentDelivery.estimatedDelivery && 
                                `ETA: ${format(new Date(currentDelivery.estimatedDelivery), "h:mm a")}`
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Driver Performance */}
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Driver Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(new Set(deliveries?.map(d => d.driverName) || [])).map((driverName) => {
                    const driverDeliveries = deliveries?.filter(d => d.driverName === driverName) || [];
                    const completedByDriver = driverDeliveries.filter(d => d.status === "delivered").length;
                    const onTimeByDriver = driverDeliveries.filter(d => 
                      d.status === "delivered" && 
                      d.actualDelivery && 
                      d.estimatedDelivery &&
                      new Date(d.actualDelivery) <= new Date(d.estimatedDelivery)
                    ).length;
                    const driverOnTimeRate = completedByDriver > 0 ? (onTimeByDriver / completedByDriver) * 100 : 0;
                    
                    return (
                      <div 
                        key={driverName}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        data-testid={`driver-${driverName ? driverName.replace(/\s+/g, '-').toLowerCase() : 'unknown'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-foreground font-medium">
                              {driverName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{driverName}</p>
                            <p className="text-xs text-muted-foreground">
                              {completedByDriver} deliveries completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm text-foreground">
                            {driverOnTimeRate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">On-time rate</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Active Deliveries Tab */}
        <TabsContent value="deliveries" className="space-y-6">
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="font-display font-semibold text-lg text-foreground">
                Active Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveries?.filter(delivery => delivery.status !== "delivered").map((delivery) => {
                  const relatedOrder = orders?.find(order => order.id === delivery.orderId);
                  
                  return (
                    <div 
                      key={delivery.id}
                      className="border border-border rounded-lg p-6"
                      data-testid={`delivery-${delivery.vehicleId}-${delivery.id}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getDeliveryStatusIcon(delivery.status)}
                          <div>
                            <h3 className="font-medium text-foreground">{delivery.vehicleId}</h3>
                            <p className="text-sm text-muted-foreground">Driver: {delivery.driverName}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(delivery.status)}>
                          {delivery.status ? delivery.status.replace('_', ' ').charAt(0).toUpperCase() + delivery.status.replace('_', ' ').slice(1) : 'Unknown'}
                        </Badge>
                      </div>
                      
                      {relatedOrder && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-foreground">
                                Order {relatedOrder.orderNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Customer: {relatedOrder.customerName}
                              </p>
                            </div>
                            <p className="font-medium text-foreground">
                              {formatCurrency(parseFloat(relatedOrder.totalAmount))}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="font-medium text-foreground">
                            {getProgressPercentage(delivery.status)}%
                          </span>
                        </div>
                        <Progress value={getProgressPercentage(delivery.status)} className="w-full" />
                        
                        {delivery.estimatedDelivery && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {delivery.status === "delivered" ? "Delivered:" : "ETA:"}
                            </span>
                            <span className="font-medium text-foreground">
                              {delivery.status === "delivered" && delivery.actualDelivery
                                ? format(new Date(delivery.actualDelivery), "MMM d, h:mm a")
                                : format(new Date(delivery.estimatedDelivery), "MMM d, h:mm a")
                              }
                            </span>
                          </div>
                        )}
                        
                        {(delivery.location as any) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>
                              Location: {(delivery.location as any).lat?.toFixed(4)}, {(delivery.location as any).lng?.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Route Optimization Tab */}
        <TabsContent value="routes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Route Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <Route className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="text-2xl font-display font-bold text-foreground mb-2">94.2%</p>
                    <p className="text-sm text-muted-foreground">Average Route Efficiency</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Distance Today</span>
                      <span className="font-medium text-foreground">247 miles</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fuel Efficiency</span>
                      <span className="font-medium text-foreground">12.4 MPG</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Delivery Time</span>
                      <span className="font-medium text-foreground">24 minutes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Optimization Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-foreground">Route Consolidation</p>
                        <p className="text-xs text-muted-foreground">
                          Consider combining routes in downtown area to reduce travel time by 15%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-foreground">Traffic Optimization</p>
                        <p className="text-xs text-muted-foreground">
                          Avoid Main St between 3-5 PM to reduce delays by 8 minutes
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-foreground">Delivery Window</p>
                        <p className="text-xs text-muted-foreground">
                          Current morning routes are optimal with 98% on-time delivery
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
