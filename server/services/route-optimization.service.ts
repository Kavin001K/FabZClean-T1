import { 
  TSPSolver, 
  VRPOptimizer, 
  RouteOptimizer,
  calculateDistance,
  calculateRouteDistance
} from '../algorithms/route-algorithms';

export interface DeliveryLocation {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  priority?: 'low' | 'medium' | 'high';
  timeWindow?: {
    start: string; // ISO time string
    end: string;   // ISO time string
  };
  estimatedDuration?: number; // in minutes
}

export interface Driver {
  id: string;
  name: string;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  vehicleType: 'bike' | 'car' | 'truck' | 'van';
  capacity?: number;
  specialties?: string[];
}

export interface OptimizedRoute {
  driverId: string;
  deliveries: DeliveryLocation[];
  totalDistance: number;
  estimatedTime: number; // in minutes
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  route: Array<{
    step: number;
    location: DeliveryLocation;
    arrivalTime: string;
    departureTime: string;
    distanceFromPrevious: number;
  }>;
}

export interface RouteOptimizationResult {
  optimizedRoutes: OptimizedRoute[];
  totalDistance: number;
  totalTime: number;
  savings: {
    distance: number;
    time: number;
    percentage: number;
  };
  unassignedDeliveries: DeliveryLocation[];
}

class RouteOptimizationService {
  private tspSolver = new TSPSolver();
  private vrpOptimizer = new VRPOptimizer();
  private routeOptimizer = new RouteOptimizer();

  /**
   * Optimize delivery routes for multiple drivers
   */
  async optimizeDeliveryRoutes(
    deliveries: DeliveryLocation[],
    drivers: Driver[],
    options: {
      maxDeliveriesPerDriver?: number;
      considerTimeWindows?: boolean;
      considerCapacity?: boolean;
      algorithm?: 'tsp' | 'vrp' | 'genetic';
    } = {}
  ): Promise<RouteOptimizationResult> {
    const {
      maxDeliveriesPerDriver = 20,
      considerTimeWindows = true,
      considerCapacity = false,
      algorithm = 'vrp'
    } = options;

    if (deliveries.length === 0 || drivers.length === 0) {
      return {
        optimizedRoutes: [],
        totalDistance: 0,
        totalTime: 0,
        savings: { distance: 0, time: 0, percentage: 0 },
        unassignedDeliveries: deliveries
      };
    }

    // Calculate baseline (naive assignment)
    const baselineDistance = this.calculateBaselineDistance(deliveries, drivers);

    let optimizedRoutes: OptimizedRoute[];

    switch (algorithm) {
      case 'tsp':
        optimizedRoutes = await this.optimizeWithTSP(deliveries, drivers, maxDeliveriesPerDriver);
        break;
      case 'vrp':
        optimizedRoutes = await this.optimizeWithVRP(deliveries, drivers, {
          maxDeliveriesPerDriver,
          considerTimeWindows,
          considerCapacity
        });
        break;
      case 'genetic':
        optimizedRoutes = await this.optimizeWithGeneticAlgorithm(deliveries, drivers, maxDeliveriesPerDriver);
        break;
      default:
        optimizedRoutes = await this.optimizeWithVRP(deliveries, drivers, {
          maxDeliveriesPerDriver,
          considerTimeWindows,
          considerCapacity
        });
    }

    // Calculate optimized metrics
    const optimizedDistance = optimizedRoutes.reduce((sum, route) => sum + route.totalDistance, 0);
    const optimizedTime = optimizedRoutes.reduce((sum, route) => sum + route.estimatedTime, 0);

    // Calculate savings
    const distanceSavings = baselineDistance - optimizedDistance;
    const timeSavings = Math.max(0, (baselineDistance * 2) - optimizedTime); // Rough time estimate
    const percentageSavings = baselineDistance > 0 ? (distanceSavings / baselineDistance) * 100 : 0;

    // Find unassigned deliveries
    const assignedDeliveryIds = new Set(
      optimizedRoutes.flatMap(route => route.deliveries.map(d => d.id))
    );
    const unassignedDeliveries = deliveries.filter(d => !assignedDeliveryIds.has(d.id));

    return {
      optimizedRoutes,
      totalDistance: optimizedDistance,
      totalTime: optimizedTime,
      savings: {
        distance: distanceSavings,
        time: timeSavings,
        percentage: percentageSavings
      },
      unassignedDeliveries
    };
  }

  /**
   * Optimize single driver route using TSP
   */
  async optimizeSingleDriverRoute(
    deliveries: DeliveryLocation[],
    driver: Driver
  ): Promise<OptimizedRoute | null> {
    if (deliveries.length === 0) {
      return null;
    }

    // Add driver's current location as starting point
    const startLocation = {
      id: `driver_${driver.id}`,
      address: 'Driver Current Location',
      latitude: driver.currentLocation.latitude,
      longitude: driver.currentLocation.longitude
    };

    const allLocations = [startLocation, ...deliveries];
    const optimizedOrder = this.tspSolver.solve(allLocations);

    // Build route with timing information
    const route = this.buildRouteWithTiming(optimizedOrder, driver);

    const totalDistance = calculateRouteDistance(optimizedOrder);
    const estimatedTime = this.estimateRouteTime(totalDistance, deliveries.length);

    return {
      driverId: driver.id,
      deliveries: deliveries,
      totalDistance,
      estimatedTime,
      startLocation: driver.currentLocation,
      endLocation: driver.currentLocation, // Assuming driver returns to start
      route
    };
  }

  /**
   * Get route preview with estimated times
   */
  async getRoutePreview(
    deliveries: DeliveryLocation[],
    driver: Driver
  ): Promise<{
    route: OptimizedRoute | null;
    preview: {
      totalDistance: number;
      estimatedTime: number;
      deliveryCount: number;
      averageTimePerDelivery: number;
    };
  }> {
    const route = await this.optimizeSingleDriverRoute(deliveries, driver);

    if (!route) {
      return {
        route: null,
        preview: {
          totalDistance: 0,
          estimatedTime: 0,
          deliveryCount: 0,
          averageTimePerDelivery: 0
        }
      };
    }

    const averageTimePerDelivery = deliveries.length > 0 
      ? route.estimatedTime / deliveries.length 
      : 0;

    return {
      route,
      preview: {
        totalDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
        deliveryCount: deliveries.length,
        averageTimePerDelivery
      }
    };
  }

  /**
   * Reoptimize route when new deliveries are added
   */
  async reoptimizeRoute(
    existingRoute: OptimizedRoute,
    newDeliveries: DeliveryLocation[]
  ): Promise<OptimizedRoute> {
    const allDeliveries = [...existingRoute.deliveries, ...newDeliveries];
    
    // Get driver info (assuming we have access to driver data)
    const driver: Driver = {
      id: existingRoute.driverId,
      name: '', // Would need to fetch from database
      currentLocation: existingRoute.startLocation,
      vehicleType: 'car' // Default, would need to fetch from database
    };

    return await this.optimizeSingleDriverRoute(allDeliveries, driver) || existingRoute;
  }

  /**
   * Calculate route efficiency metrics
   */
  calculateRouteEfficiency(route: OptimizedRoute): {
    efficiency: number; // 0-100
    density: number; // deliveries per km
    timeEfficiency: number; // 0-100
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let efficiency = 100;
    let timeEfficiency = 100;

    // Calculate delivery density
    const density = route.totalDistance > 0 ? route.deliveries.length / route.totalDistance : 0;

    // Check for inefficiencies
    if (route.totalDistance > route.deliveries.length * 2) {
      efficiency -= 20;
      recommendations.push('Route has high distance per delivery - consider clustering nearby deliveries');
    }

    if (route.estimatedTime > route.deliveries.length * 30) {
      timeEfficiency -= 15;
      recommendations.push('Route takes longer than expected - check for traffic or time windows');
    }

    if (density < 0.5) {
      efficiency -= 15;
      recommendations.push('Low delivery density - consider adding nearby deliveries to this route');
    }

    // Check for time window violations
    const timeWindowViolations = route.route.filter(step => {
      if (!step.location.timeWindow) return false;
      const arrivalTime = new Date(step.arrivalTime);
      const windowStart = new Date(step.location.timeWindow.start);
      const windowEnd = new Date(step.location.timeWindow.end);
      return arrivalTime < windowStart || arrivalTime > windowEnd;
    }).length;

    if (timeWindowViolations > 0) {
      timeEfficiency -= timeWindowViolations * 10;
      recommendations.push(`${timeWindowViolations} deliveries have time window violations`);
    }

    return {
      efficiency: Math.max(0, efficiency),
      density,
      timeEfficiency: Math.max(0, timeEfficiency),
      recommendations
    };
  }

  /**
   * Private helper methods
   */
  private async optimizeWithTSP(
    deliveries: DeliveryLocation[],
    drivers: Driver[],
    maxDeliveriesPerDriver: number
  ): Promise<OptimizedRoute[]> {
    const routes: OptimizedRoute[] = [];
    const remainingDeliveries = [...deliveries];

    for (const driver of drivers) {
      if (remainingDeliveries.length === 0) break;

      // Take up to maxDeliveriesPerDriver deliveries
      const driverDeliveries = remainingDeliveries.splice(0, maxDeliveriesPerDriver);
      const route = await this.optimizeSingleDriverRoute(driverDeliveries, driver);
      
      if (route) {
        routes.push(route);
      }
    }

    return routes;
  }

  private async optimizeWithVRP(
    deliveries: DeliveryLocation[],
    drivers: Driver[],
    options: {
      maxDeliveriesPerDriver: number;
      considerTimeWindows: boolean;
      considerCapacity: boolean;
    }
  ): Promise<OptimizedRoute[]> {
    return this.vrpOptimizer.optimize(deliveries, drivers, options);
  }

  private async optimizeWithGeneticAlgorithm(
    deliveries: DeliveryLocation[],
    drivers: Driver[],
    maxDeliveriesPerDriver: number
  ): Promise<OptimizedRoute[]> {
    // This would use the genetic algorithm implementation
    // For now, fall back to VRP
    return this.optimizeWithVRP(deliveries, drivers, {
      maxDeliveriesPerDriver,
      considerTimeWindows: true,
      considerCapacity: false
    });
  }

  private calculateBaselineDistance(
    deliveries: DeliveryLocation[],
    drivers: Driver[]
  ): number {
    // Simple baseline: assign deliveries in order to drivers
    const deliveriesPerDriver = Math.ceil(deliveries.length / drivers.length);
    let totalDistance = 0;

    for (let i = 0; i < drivers.length; i++) {
      const startIndex = i * deliveriesPerDriver;
      const endIndex = Math.min(startIndex + deliveriesPerDriver, deliveries.length);
      const driverDeliveries = deliveries.slice(startIndex, endIndex);

      if (driverDeliveries.length > 0) {
        // Calculate naive route distance
        const route = [drivers[i].currentLocation, ...driverDeliveries];
        totalDistance += calculateRouteDistance(route);
      }
    }

    return totalDistance;
  }

  private buildRouteWithTiming(
    locations: DeliveryLocation[],
    driver: Driver
  ): Array<{
    step: number;
    location: DeliveryLocation;
    arrivalTime: string;
    departureTime: string;
    distanceFromPrevious: number;
  }> {
    const route = [];
    let currentTime = new Date();
    let previousLocation = driver.currentLocation;

    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      const distance = calculateDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        location.latitude,
        location.longitude
      );

      // Estimate travel time (assuming 30 km/h average speed)
      const travelTimeMinutes = (distance / 1000) * 2; // 2 minutes per km
      currentTime = new Date(currentTime.getTime() + travelTimeMinutes * 60 * 1000);

      const arrivalTime = currentTime.toISOString();
      
      // Estimate service time
      const serviceTimeMinutes = location.estimatedDuration || 5; // 5 minutes default
      currentTime = new Date(currentTime.getTime() + serviceTimeMinutes * 60 * 1000);
      
      const departureTime = currentTime.toISOString();

      route.push({
        step: i + 1,
        location,
        arrivalTime,
        departureTime,
        distanceFromPrevious: distance
      });

      previousLocation = location;
    }

    return route;
  }

  private estimateRouteTime(totalDistanceKm: number, deliveryCount: number): number {
    // Estimate based on distance and number of deliveries
    const averageSpeed = 30; // km/h
    const averageServiceTime = 5; // minutes per delivery
    
    const travelTime = (totalDistanceKm / averageSpeed) * 60; // minutes
    const serviceTime = deliveryCount * averageServiceTime;
    
    return Math.round(travelTime + serviceTime);
  }
}

// Export singleton instance
export const routeOptimizationService = new RouteOptimizationService();
