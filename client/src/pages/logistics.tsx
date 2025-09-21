import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Navigation, Calendar, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import child components
import { LogisticsKPIs } from '@/components/logistics/logistics-kpis';
import { LogisticsMap } from '@/components/logistics/logistics-map';
import { RouteList } from '@/components/logistics/route-list';

// Import hooks
import { useLogisticsKPIs } from '@/hooks/use-logistics-kpis';

// Import data service and types
import { logisticsApi } from '@/lib/data-service';
import type { Route, Driver } from '@/lib/data-service';

export default function Logistics() {
  // State for UI management
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const isoString = today.toISOString();
    return isoString ? isoString.split('T')[0] : '2024-01-01';
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch logistics data with React Query and auto-refetch
  const {
    data: routes = [],
    isLoading: routesLoading,
    isError: routesError,
    error: routesErrorDetails,
  } = useQuery({
    queryKey: ['logistics-routes'],
    queryFn: logisticsApi.getRoutes,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds for live updates
    refetchIntervalInBackground: true,
  });

  const {
    data: drivers = [],
    isLoading: driversLoading,
    isError: driversError,
  } = useQuery({
    queryKey: ['drivers'],
    queryFn: logisticsApi.getDrivers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });

  // Fetch logistics KPIs
  const {
    data: kpiData,
    isLoading: kpisLoading,
    isError: kpisError,
  } = useLogisticsKPIs();

  // Driver assignment mutation
  const assignDriverMutation = useMutation({
    mutationFn: async ({ routeId, driverId }: { routeId: string; driverId: string }) => {
      return await logisticsApi.assignDriverToRoute(routeId, driverId);
    },
    onSuccess: (updatedRoute) => {
      if (updatedRoute) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["logistics-routes"] });
        queryClient.invalidateQueries({ queryKey: ["logistics-kpis"] });
        
        toast({
          title: "Driver Assigned Successfully",
          description: `Driver has been assigned to ${selectedRoute?.name || 'the route'}.`,
        });
      }
    },
    onError: (error) => {
      console.error('Failed to assign driver:', error);
      toast({
        title: "Error",
        description: "Failed to assign driver. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ routeId, stopId, status }: { routeId: string; stopId: string; status: string }) => {
      // In a real app, this would update the stop status via API
      // For now, we'll just invalidate the routes query to trigger a refetch
      return { routeId, stopId, status };
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["logistics-routes"] });
      queryClient.invalidateQueries({ queryKey: ["logistics-kpis"] });
      
      toast({
        title: "Status Updated",
        description: "Delivery status has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to update status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create route mutation
  const createRouteMutation = useMutation({
    mutationFn: async (routeData: Partial<Route>) => {
      return await logisticsApi.createRoute(routeData);
    },
    onSuccess: (newRoute) => {
      if (newRoute) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["logistics-routes"] });
        queryClient.invalidateQueries({ queryKey: ["logistics-kpis"] });
        
        toast({
          title: "Route Created Successfully",
          description: `New route "${newRoute.name}" has been created.`,
        });
      }
    },
    onError: (error) => {
      console.error('Failed to create route:', error);
      toast({
        title: "Error",
        description: "Failed to create route. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleRouteSelect = useCallback((route: Route) => {
    setSelectedRoute(route);
  }, []);

  const handleAssignDriver = useCallback((routeId: string, driverId: string) => {
    assignDriverMutation.mutate({ routeId, driverId });
  }, [assignDriverMutation]);

  const handleUpdateStopStatus = useCallback((routeId: string, stopId: string, status: string) => {
    updateStatusMutation.mutate({ routeId, stopId, status });
  }, [updateStatusMutation]);

  const handleCreateRoute = useCallback(() => {
    createRouteMutation.mutate({
      name: `Route ${routes.length + 1}`,
      status: 'unassigned',
      stops: [],
      totalDistance: 0,
      estimatedDuration: 0,
    });
  }, [createRouteMutation, routes.length]);

  const isLoading = routesLoading || driversLoading;
  const hasError = routesError || driversError;

  // Error state with non-intrusive toast notification
  if (hasError && routes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">
                Unable to load logistics data
          </div>
              <p className="text-sm text-muted-foreground">
                {routesErrorDetails?.message || 'An unexpected error occurred'}
              </p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['logistics-routes'] })}
                variant="outline"
              >
                Refresh
              </Button>
            </div>
            </CardContent>
          </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Logistics Management</h1>
          <p className="text-muted-foreground mt-1">Real-time fleet tracking and route optimization</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Live Tracking Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={(() => {
                  const today = new Date();
                  const isoString = today.toISOString();
                  return isoString ? isoString.split('T')[0] : '2024-01-01';
                })()}>
                  Today
                </SelectItem>
                <SelectItem value={(() => {
                  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  const isoString = tomorrow.toISOString();
                  return isoString ? isoString.split('T')[0] : '2024-01-02';
                })()}>
                  Tomorrow
                </SelectItem>
                <SelectItem value={(() => {
                  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  const isoString = yesterday.toISOString();
                  return isoString ? isoString.split('T')[0] : '2023-12-31';
                })()}>
                  Yesterday
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateRoute} disabled={createRouteMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Plan New Route
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <LogisticsKPIs 
        data={kpiData} 
        isLoading={kpisLoading} 
        isError={kpisError} 
      />

      {/* Main Content - Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
        {/* Left Panel - Map View (60% width) */}
        <div className="lg:col-span-3">
          <LogisticsMap
            routes={routes}
            selectedRoute={selectedRoute}
            isLoading={isLoading}
            onRouteSelect={handleRouteSelect}
          />
            </div>

        {/* Right Panel - Route List (40% width) */}
        <div className="lg:col-span-2">
          <RouteList
            routes={routes}
            drivers={drivers}
            isLoading={isLoading}
            selectedRoute={selectedRoute}
            onRouteSelect={handleRouteSelect}
            onAssignDriver={handleAssignDriver}
            onUpdateStopStatus={handleUpdateStopStatus}
            onCreateRoute={handleCreateRoute}
            isAssigningDriver={assignDriverMutation.isPending}
            isUpdatingStatus={updateStatusMutation.isPending}
          />
            </div>
      </div>

      {/* Real-time Status Indicator */}
      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-700 font-medium">
            Live updates every 30 seconds
                            </span>
                          </div>
          </div>
    </div>
  );
}