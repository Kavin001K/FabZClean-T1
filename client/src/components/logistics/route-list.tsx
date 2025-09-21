import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  User, 
  Clock, 
  MapPin, 
  Navigation,
  Truck,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Square
} from 'lucide-react';
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';
import type { Route, RouteStop, Driver } from '@/lib/data-service';

interface RouteListProps {
  routes: Route[];
  drivers: Driver[];
  isLoading: boolean;
  selectedRoute?: Route | null;
  onRouteSelect: (route: Route) => void;
  onAssignDriver: (routeId: string, driverId: string) => void;
  onUpdateStopStatus: (routeId: string, stopId: string, status: string) => void;
  onCreateRoute: () => void;
  isAssigningDriver?: boolean;
  isUpdatingStatus?: boolean;
}

interface RouteItemProps {
  route: Route;
  drivers: Driver[];
  isSelected: boolean;
  onSelect: (route: Route) => void;
  onAssignDriver: (routeId: string, driverId: string) => void;
  onUpdateStopStatus: (routeId: string, stopId: string, status: string) => void;
  isAssigningDriver?: boolean;
  isUpdatingStatus?: boolean;
}

const RouteItem: React.FC<RouteItemProps> = React.memo(({ 
  route, 
  drivers,
  isSelected, 
  onSelect, 
  onAssignDriver,
  onUpdateStopStatus,
  isAssigningDriver = false,
  isUpdatingStatus = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStopStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStopStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const completedStops = route.stops.filter(stop => stop.status === 'completed').length;
  const progressPercentage = (completedStops / route.stops.length) * 100;

  const availableDrivers = drivers.filter(driver => driver.status === 'available');

  return (
    <AccordionItem value={route.id} className="border rounded-lg mb-2">
      <AccordionTrigger 
        className={cn(
          "px-4 py-3 hover:no-underline",
          isSelected && "bg-primary/5"
        )}
        onClick={() => onSelect(route)}
      >
        <div className="flex items-center justify-between w-full mr-4">
          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="font-medium text-base">{route.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(route.status)} variant="secondary">
                  {route.status.replace('_', ' ')}
                </Badge>
                {route.driverName && (
                  <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    {route.driverName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{route.stops.length} stops</span>
            </div>
            <div className="flex items-center gap-1">
              <Navigation className="h-4 w-4" />
              <span>{route.totalDistance.toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{route.estimatedDuration} min</span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          {/* Route Progress */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Route Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedStops} / {route.stops.length} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {progressPercentage.toFixed(1)}% complete
            </div>
          </div>

          {/* Driver Assignment */}
          {!route.driverId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">No driver assigned</span>
                </div>
                <Select
                  onValueChange={(driverId) => onAssignDriver(route.id, driverId)}
                  disabled={isAssigningDriver || availableDrivers.length === 0}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Assign driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex items-center gap-2">
                          <span>{driver.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {driver.vehicleType}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Route Stops */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Delivery Stops</h4>
            <div className="space-y-2">
              {route.stops.map((stop, index) => (
                <div key={stop.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium",
                      getStopStatusColor(stop.status)
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{stop.customerName}</div>
                      <div className="text-xs text-muted-foreground">{stop.address}</div>
                      {stop.estimatedArrival && (
                        <div className="text-xs text-muted-foreground">
                          ETA: {new Date(stop.estimatedArrival).toLocaleTimeString() || 'N/A'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={stop.status}
                      onValueChange={(status) => onUpdateStopStatus(route.id, stop.id, status)}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Pending
                          </div>
                        </SelectItem>
                        <SelectItem value="in_progress">
                          <div className="flex items-center gap-2">
                            <Play className="h-3 w-3" />
                            In Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="failed">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" />
                            Failed
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Stop Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <MapPin className="mr-2 h-4 w-4" />
                          View on Map
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Navigation className="mr-2 h-4 w-4" />
                          Get Directions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});

export const RouteList: React.FC<RouteListProps> = React.memo(({
  routes,
  drivers,
  isLoading,
  selectedRoute,
  onRouteSelect,
  onAssignDriver,
  onUpdateStopStatus,
  onCreateRoute,
  isAssigningDriver = false,
  isUpdatingStatus = false
}) => {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Delivery Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton.CustomerRowSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (routes.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Delivery Routes</CardTitle>
            <Button size="sm" onClick={onCreateRoute}>
              <Truck className="h-4 w-4 mr-2" />
              Plan New Route
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No delivery routes for today</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first route to start managing deliveries.
              </p>
              <Button onClick={onCreateRoute}>
                <Truck className="h-4 w-4 mr-2" />
                Plan New Route
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Delivery Routes ({routes.length})</CardTitle>
          <Button size="sm" onClick={onCreateRoute}>
            <Truck className="h-4 w-4 mr-2" />
            Plan New Route
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {routes.map((route) => (
            <RouteItem
              key={route.id}
              route={route}
              drivers={drivers}
              isSelected={selectedRoute?.id === route.id}
              onSelect={onRouteSelect}
              onAssignDriver={onAssignDriver}
              onUpdateStopStatus={onUpdateStopStatus}
              isAssigningDriver={isAssigningDriver}
              isUpdatingStatus={isUpdatingStatus}
            />
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
});

export default RouteList;
