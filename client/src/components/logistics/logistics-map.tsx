import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Truck } from 'lucide-react';
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';
import type { Route, RouteStop } from '@/lib/data-service';

interface LogisticsMapProps {
  routes: Route[];
  selectedRoute?: Route | null;
  isLoading: boolean;
  onRouteSelect: (route: Route) => void;
}

// Mock map component - in real app this would use react-leaflet
const MockMap: React.FC<{
  routes: Route[];
  selectedRoute?: Route | null;
  onRouteSelect: (route: Route) => void;
}> = ({ routes, selectedRoute, onRouteSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  const getStopColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getRouteColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-50';
      case 'in_progress': return 'border-blue-500 bg-blue-50';
      case 'assigned': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
      {/* Map Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #3b82f6 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, #10b981 2px, transparent 2px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px'
        }} />
      </div>

      {/* Routes and Stops */}
      <div className="relative z-10 p-6 h-full">
        <div className="grid grid-cols-2 gap-4 h-full">
          {routes.slice(0, 4).map((route, routeIndex) => (
            <div
              key={route.id}
              className={cn(
                "relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                selectedRoute?.id === route.id ? "ring-2 ring-primary ring-offset-2" : "",
                getRouteColor(route.status)
              )}
              onClick={() => onRouteSelect(route)}
            >
              {/* Route Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", getStopColor(route.stops[0]?.status || 'pending'))} />
                  <span className="font-medium text-sm">{route.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {route.status}
                </Badge>
              </div>

              {/* Route Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  <span>{route.driverName || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{route.stops.length} stops</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Navigation className="h-3 w-3" />
                  <span>{route.totalDistance.toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{route.estimatedDuration} min</span>
                </div>
              </div>

              {/* Route Path Visualization */}
              <div className="mt-3 flex items-center gap-1">
                {route.stops.map((stop, stopIndex) => (
                  <React.Fragment key={stop.id}>
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 border-white shadow-sm",
                        getStopColor(stop.status)
                      )}
                      title={`${stop.customerName} - ${stop.status}`}
                    />
                    {stopIndex < route.stops.length - 1 && (
                      <div className={cn(
                        "h-0.5 flex-1",
                        selectedRoute?.id === route.id ? "bg-primary" : "bg-gray-300"
                      )} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Progress Indicator */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>
                    {route.stops.filter(s => s.status === 'completed').length} / {route.stops.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${(route.stops.filter(s => s.status === 'completed').length / route.stops.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-xs font-medium text-muted-foreground mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-xs">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs">Failed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LogisticsMap: React.FC<LogisticsMapProps> = React.memo(({
  routes,
  selectedRoute,
  isLoading,
  onRouteSelect,
}) => {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Live Route Map</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-96 p-4">
            <LoadingSkeleton.KpiCardSkeleton />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (routes.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Live Route Map</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No routes available</h3>
              <p className="text-sm text-muted-foreground">
                Create your first route to see it visualized on the map.
              </p>
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
          <CardTitle>Live Route Map</CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Live Tracking</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96">
          <MockMap
            routes={routes}
            selectedRoute={selectedRoute}
            onRouteSelect={onRouteSelect}
          />
        </div>
      </CardContent>
    </Card>
  );
});

export default LogisticsMap;
