import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Map,
  Route,
  Navigation,
  Clock,
  Target,
  Zap,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  MapPin,
  Truck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Timer,
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Temporary type definitions
interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledPickup: string;
  scheduledDelivery: string;
  actualPickup?: string;
  actualDelivery?: string;
  customerName: string;
  customerPhone: string;
  specialInstructions?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  distance: number;
  createdAt: string;
  updatedAt: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastActive?: string;
  rating: number;
  totalDeliveries: number;
  totalEarnings: string;
  createdAt: string;
  updatedAt: string;
}

interface OptimizedRoute {
  id: string;
  totalDistance: number;
  estimatedTime: number;
  fuelCost: number;
  stops: RouteStop[];
  efficiency: number;
}

interface RouteStop {
  id: string;
  type: 'pickup' | 'delivery';
  address: string;
  orderId: string;
  customerName: string;
  estimatedArrival: string;
  duration: number;
  priority: 'low' | 'medium' | 'high';
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface WorkerRouteOptimizerProps {
  deliveries: Delivery[];
  driver: Driver;
}

const WorkerRouteOptimizer: React.FC<WorkerRouteOptimizerProps> = ({ deliveries, driver }) => {
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentStop, setCurrentStop] = useState(0);
  const [isRouteActive, setIsRouteActive] = useState(false);
  const { toast } = useToast();

  // Filter active deliveries
  const activeDeliveries = useMemo(() => {
    return deliveries.filter(delivery => 
      delivery.status === 'assigned' || delivery.status === 'picked_up'
    );
  }, [deliveries]);

  // Generate optimized route
  const generateOptimizedRoute = async () => {
    setIsOptimizing(true);
    
    try {
      // Simulate API call for route optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockRoute: OptimizedRoute = {
        id: `route_${Date.now()}`,
        totalDistance: 45.2,
        estimatedTime: 180, // 3 hours
        fuelCost: 850,
        efficiency: 87,
        stops: activeDeliveries.map((delivery, index) => ({
          id: delivery.id,
          type: delivery.status === 'assigned' ? 'pickup' : 'delivery',
          address: delivery.status === 'assigned' ? delivery.pickupAddress : delivery.deliveryAddress,
          orderId: delivery.orderId,
          customerName: delivery.customerName,
          estimatedArrival: new Date(Date.now() + (index + 1) * 30 * 60000).toLocaleTimeString(),
          duration: delivery.estimatedTime,
          priority: delivery.priority,
          coordinates: {
            latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
            longitude: 77.5946 + (Math.random() - 0.5) * 0.1,
          }
        }))
      };
      
      setOptimizedRoute(mockRoute);
      toast({
        title: "Route Optimized",
        description: `Optimized route with ${mockRoute.stops.length} stops generated`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize route",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const startRoute = () => {
    setIsRouteActive(true);
    setCurrentStop(0);
    toast({
      title: "Route Started",
      description: "Navigation started for optimized route",
    });
  };

  const completeCurrentStop = () => {
    if (currentStop < (optimizedRoute?.stops.length || 0) - 1) {
      setCurrentStop(prev => prev + 1);
      toast({
        title: "Stop Completed",
        description: `Moving to next stop`,
      });
    } else {
      setIsRouteActive(false);
      toast({
        title: "Route Completed",
        description: "All deliveries completed successfully",
      });
    }
  };

  const resetRoute = () => {
    setOptimizedRoute(null);
    setCurrentStop(0);
    setIsRouteActive(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50';
      case 'low':
        return 'text-green-500 bg-green-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getStopIcon = (type: string) => {
    return type === 'pickup' ? Truck : Target;
  };

  const getStopColor = (type: string) => {
    return type === 'pickup' ? 'text-blue-500' : 'text-green-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Route Overview */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="h-5 w-5" />
            Route Optimization
          </CardTitle>
          <CardDescription>
            Optimize your delivery route for maximum efficiency and fuel savings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!optimizedRoute ? (
            <div className="text-center py-8">
              <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Route Generated</h3>
              <p className="text-muted-foreground mb-6">
                Generate an optimized route for your {activeDeliveries.length} active deliveries.
              </p>
              <Button
                onClick={generateOptimizedRoute}
                disabled={isOptimizing || activeDeliveries.length === 0}
                className="gap-2"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Optimizing Route...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Optimize Route
                  </>
                )}
              </Button>
              {activeDeliveries.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No active deliveries to optimize
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Route Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Route className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Distance</span>
                  </div>
                  <p className="text-2xl font-bold">{optimizedRoute.totalDistance} km</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Time</span>
                  </div>
                  <p className="text-2xl font-bold">{Math.floor(optimizedRoute.estimatedTime / 60)}h {optimizedRoute.estimatedTime % 60}m</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Efficiency</span>
                  </div>
                  <p className="text-2xl font-bold">{optimizedRoute.efficiency}%</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Stops</span>
                  </div>
                  <p className="text-2xl font-bold">{optimizedRoute.stops.length}</p>
                </Card>
              </div>

              {/* Route Progress */}
              {isRouteActive && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      Route Progress
                    </h3>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  <Progress 
                    value={(currentStop / optimizedRoute.stops.length) * 100} 
                    className="mb-3"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Stop {currentStop + 1} of {optimizedRoute.stops.length}</span>
                    <span>{Math.round(((currentStop + 1) / optimizedRoute.stops.length) * 100)}% Complete</span>
                  </div>
                </Card>
              )}

              {/* Route Actions */}
              <div className="flex gap-3">
                {!isRouteActive ? (
                  <Button
                    onClick={startRoute}
                    className="flex-1 gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Route
                  </Button>
                ) : (
                  <Button
                    onClick={completeCurrentStop}
                    className="flex-1 gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Current Stop
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={resetRoute}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Stops */}
      {optimizedRoute && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Route Stops
            </CardTitle>
            <CardDescription>
              Follow the optimized sequence for maximum efficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizedRoute.stops.map((stop, index) => {
                const StopIcon = getStopIcon(stop.type);
                const isCurrentStop = isRouteActive && index === currentStop;
                const isCompletedStop = isRouteActive && index < currentStop;
                const isUpcomingStop = !isRouteActive || index > currentStop;

                return (
                  <motion.div
                    key={stop.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`transition-all ${
                      isCurrentStop 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : isCompletedStop 
                        ? 'bg-green-50 border-green-200' 
                        : 'hover:shadow-md'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Stop Number and Icon */}
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isCurrentStop 
                                ? 'bg-primary text-primary-foreground' 
                                : isCompletedStop 
                                ? 'bg-green-500 text-white' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {index + 1}
                            </div>
                            {index < optimizedRoute.stops.length - 1 && (
                              <div className={`w-0.5 h-8 mt-2 ${
                                isCompletedStop ? 'bg-green-500' : 'bg-muted'
                              }`} />
                            )}
                          </div>

                          {/* Stop Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <StopIcon className={`h-5 w-5 ${getStopColor(stop.type)}`} />
                                <div>
                                  <h4 className="font-semibold text-sm">
                                    {stop.type === 'pickup' ? 'Pickup' : 'Delivery'} - Order #{stop.orderId}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">{stop.customerName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${getPriorityColor(stop.priority)}`}>
                                  {stop.priority}
                                </Badge>
                                {isCurrentStop && (
                                  <Badge className="bg-primary text-primary-foreground">
                                    Current
                                  </Badge>
                                )}
                                {isCompletedStop && (
                                  <Badge className="bg-green-100 text-green-800">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <p className="text-sm">{stop.address}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  ETA: {stop.estimatedArrival}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {stop.duration} min
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {isCurrentStop && isRouteActive && (
                              <div className="mt-3 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                >
                                  <Navigation className="h-3 w-3" />
                                  Navigate
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={completeCurrentStop}
                                  className="gap-2"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Complete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Tips */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Route Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Efficiency Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Follow the optimized sequence</li>
                <li>• Complete pickups before deliveries</li>
                <li>• Use navigation for real-time traffic</li>
                <li>• Update status after each stop</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Safety Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Park safely at each location</li>
                <li>• Verify customer identity</li>
                <li>• Handle packages with care</li>
                <li>• Report any issues immediately</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WorkerRouteOptimizer;
