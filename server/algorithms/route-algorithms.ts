/**
 * Advanced Route Planning Algorithms for FabZClean Delivery System
 * Implements TSP, VRP, and real-time route optimization
 */

export interface Point {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface DeliveryPoint extends Point {
  orderId: string;
  customerName: string;
  priority: 'high' | 'medium' | 'low';
  timeWindow?: {
    start: Date;
    end: Date;
  };
  serviceTime: number; // in minutes
  weight?: number;
}

export interface Route {
  id: string;
  driverId: string;
  points: DeliveryPoint[];
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  startTime: Date;
  endTime: Date;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface RouteOptimizationOptions {
  maxStops: number;
  maxDistance: number;
  maxTime: number;
  vehicleCapacity?: number;
  considerTraffic?: boolean;
  priorityWeight?: number;
}

/**
 * Haversine Distance Calculation
 * Calculates great-circle distance between two points on Earth
 */
export class DistanceCalculator {
  private static readonly EARTH_RADIUS_KM = 6371;
  private static readonly EARTH_RADIUS_M = 6371000;

  /**
   * Calculate distance between two points using Haversine formula
   * Time Complexity: O(1)
   */
  static haversineDistance(point1: Point, point2: Point): number {
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * 
              Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Calculate driving distance using road network (simplified)
   * This would typically use a routing service like Google Maps API
   */
  static drivingDistance(point1: Point, point2: Point): number {
    const straightLine = this.haversineDistance(point1, point2);
    // Apply road network factor (typically 1.3-1.5x straight line distance)
    return straightLine * 1.4;
  }

  /**
   * Estimate driving time based on distance and average speed
   */
  static estimatedTime(distance: number, averageSpeedKmh: number = 25): number {
    return (distance / averageSpeedKmh) * 60; // in minutes
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

/**
 * Traveling Salesman Problem (TSP) Solver using Genetic Algorithm
 * Time Complexity: O(g * p * n²) where g is generations, p is population size, n is cities
 */
export class TSPSolver {
  private population: number[][];
  private populationSize: number;
  private generations: number;
  private mutationRate: number;
  private crossoverRate: number;
  private points: Point[];

  constructor(options: {
    populationSize?: number;
    generations?: number;
    mutationRate?: number;
    crossoverRate?: number;
  } = {}) {
    this.populationSize = options.populationSize || 100;
    this.generations = options.generations || 1000;
    this.mutationRate = options.mutationRate || 0.01;
    this.crossoverRate = options.crossoverRate || 0.8;
    this.population = [];
  }

  solve(points: Point[]): Point[] {
    if (points.length <= 2) return points;
    
    this.points = points;
    this.initializePopulation();
    
    for (let generation = 0; generation < this.generations; generation++) {
      this.evolve();
    }
    
    const bestRoute = this.getBestRoute();
    return bestRoute.map(index => this.points[index]);
  }

  private initializePopulation(): void {
    this.population = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const route = this.generateRandomRoute();
      this.population.push(route);
    }
  }

  private generateRandomRoute(): number[] {
    const route = Array.from({ length: this.points.length }, (_, i) => i);
    
    // Fisher-Yates shuffle
    for (let i = route.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [route[i], route[j]] = [route[j], route[i]];
    }
    
    return route;
  }

  private evolve(): void {
    const newPopulation: number[][] = [];
    
    // Elitism: Keep best individual
    const best = this.getBestRoute();
    newPopulation.push([...best]);
    
    // Generate offspring
    while (newPopulation.length < this.populationSize) {
      const parent1 = this.tournamentSelection();
      const parent2 = this.tournamentSelection();
      
      let offspring1: number[], offspring2: number[];
      
      if (Math.random() < this.crossoverRate) {
        [offspring1, offspring2] = this.orderedCrossover(parent1, parent2);
      } else {
        offspring1 = [...parent1];
        offspring2 = [...parent2];
      }
      
      if (Math.random() < this.mutationRate) {
        this.swapMutation(offspring1);
      }
      
      if (Math.random() < this.mutationRate) {
        this.swapMutation(offspring2);
      }
      
      newPopulation.push(offspring1);
      if (newPopulation.length < this.populationSize) {
        newPopulation.push(offspring2);
      }
    }
    
    this.population = newPopulation;
  }

  private tournamentSelection(): number[] {
    const tournamentSize = 3;
    let best: number[] | null = null;
    let bestFitness = Infinity;
    
    for (let i = 0; i < tournamentSize; i++) {
      const candidate = this.population[Math.floor(Math.random() * this.populationSize)];
      const fitness = this.calculateFitness(candidate);
      
      if (fitness < bestFitness) {
        best = candidate;
        bestFitness = fitness;
      }
    }
    
    return best!;
  }

  private orderedCrossover(parent1: number[], parent2: number[]): [number[], number[]] {
    const size = parent1.length;
    const start = Math.floor(Math.random() * size);
    const end = Math.floor(Math.random() * (size - start)) + start;
    
    const offspring1 = new Array(size).fill(-1);
    const offspring2 = new Array(size).fill(-1);
    
    // Copy middle section
    for (let i = start; i <= end; i++) {
      offspring1[i] = parent1[i];
      offspring2[i] = parent2[i];
    }
    
    // Fill remaining positions
    this.fillRemaining(offspring1, parent2, start, end);
    this.fillRemaining(offspring2, parent1, start, end);
    
    return [offspring1, offspring2];
  }

  private fillRemaining(offspring: number[], parent: number[], start: number, end: number): void {
    let parentIndex = 0;
    let offspringIndex = 0;
    
    while (offspringIndex < offspring.length) {
      if (offspringIndex < start || offspringIndex > end) {
        while (offspring.includes(parent[parentIndex])) {
          parentIndex++;
        }
        offspring[offspringIndex] = parent[parentIndex];
        parentIndex++;
      }
      offspringIndex++;
    }
  }

  private swapMutation(route: number[]): void {
    const i = Math.floor(Math.random() * route.length);
    const j = Math.floor(Math.random() * route.length);
    [route[i], route[j]] = [route[j], route[i]];
  }

  private calculateFitness(route: number[]): number {
    let totalDistance = 0;
    
    for (let i = 0; i < route.length - 1; i++) {
      const point1 = this.points[route[i]];
      const point2 = this.points[route[i + 1]];
      totalDistance += DistanceCalculator.haversineDistance(point1, point2);
    }
    
    // Add return to start
    const lastPoint = this.points[route[route.length - 1]];
    const firstPoint = this.points[route[0]];
    totalDistance += DistanceCalculator.haversineDistance(lastPoint, firstPoint);
    
    return totalDistance;
  }

  private getBestRoute(): number[] {
    let best: number[] = this.population[0];
    let bestFitness = this.calculateFitness(best);
    
    for (const route of this.population) {
      const fitness = this.calculateFitness(route);
      if (fitness < bestFitness) {
        best = route;
        bestFitness = fitness;
      }
    }
    
    return best;
  }
}

/**
 * Vehicle Routing Problem (VRP) Solver
 * Solves multiple vehicle routing with capacity constraints
 */
export class VRPSolver {
  private tspSolver: TSPSolver;

  constructor() {
    this.tspSolver = new TSPSolver({
      populationSize: 50,
      generations: 500,
      mutationRate: 0.02,
      crossoverRate: 0.8
    });
  }

  solve(
    depot: Point,
    deliveries: DeliveryPoint[],
    vehicles: number,
    options: RouteOptimizationOptions
  ): Route[] {
    if (deliveries.length === 0) return [];
    
    // Group deliveries by clusters
    const clusters = this.clusterDeliveries(deliveries, vehicles);
    
    const routes: Route[] = [];
    
    clusters.forEach((cluster, index) => {
      if (cluster.length === 0) return;
      
      // Add depot as start and end point
      const routePoints = [depot, ...cluster, depot];
      
      // Optimize route using TSP
      const optimizedRoute = this.tspSolver.solve(routePoints);
      
      // Create route object
      const route: Route = {
        id: `route-${Date.now()}-${index}`,
        driverId: `driver-${index}`,
        points: optimizedRoute.slice(1, -1) as DeliveryPoint[], // Remove depot duplicates
        totalDistance: this.calculateRouteDistance(optimizedRoute),
        totalTime: this.calculateRouteTime(optimizedRoute),
        totalCost: this.calculateRouteCost(optimizedRoute),
        startTime: new Date(),
        endTime: new Date(Date.now() + this.calculateRouteTime(optimizedRoute) * 60000),
        status: 'planned'
      };
      
      routes.push(route);
    });
    
    return routes;
  }

  private clusterDeliveries(deliveries: DeliveryPoint[], vehicles: number): DeliveryPoint[][] {
    const clusters: DeliveryPoint[][] = Array.from({ length: vehicles }, () => []);
    
    // Sort deliveries by priority and distance from depot
    const sortedDeliveries = [...deliveries].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by distance from depot
      const depot = { latitude: 0, longitude: 0 }; // This should be actual depot
      const distA = DistanceCalculator.haversineDistance(depot, a);
      const distB = DistanceCalculator.haversineDistance(depot, b);
      return distA - distB;
    });
    
    // Distribute deliveries using round-robin with capacity consideration
    let currentVehicle = 0;
    const vehicleLoads = new Array(vehicles).fill(0);
    
    for (const delivery of sortedDeliveries) {
      // Find vehicle with least load
      let bestVehicle = 0;
      let minLoad = vehicleLoads[0];
      
      for (let i = 1; i < vehicles; i++) {
        if (vehicleLoads[i] < minLoad) {
          minLoad = vehicleLoads[i];
          bestVehicle = i;
        }
      }
      
      clusters[bestVehicle].push(delivery);
      vehicleLoads[bestVehicle] += delivery.weight || 1;
    }
    
    return clusters;
  }

  private calculateRouteDistance(points: Point[]): number {
    let totalDistance = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += DistanceCalculator.drivingDistance(points[i], points[i + 1]);
    }
    
    return totalDistance;
  }

  private calculateRouteTime(points: Point[]): number {
    let totalTime = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      const distance = DistanceCalculator.drivingDistance(points[i], points[i + 1]);
      totalTime += DistanceCalculator.estimatedTime(distance);
      
      // Add service time for delivery points
      if ('serviceTime' in points[i]) {
        totalTime += (points[i] as DeliveryPoint).serviceTime;
      }
    }
    
    return totalTime;
  }

  private calculateRouteCost(points: Point[]): number {
    const distance = this.calculateRouteDistance(points);
    const time = this.calculateRouteTime(points);
    
    // Cost calculation: distance * fuel_cost + time * labor_cost
    const fuelCostPerKm = 0.5;
    const laborCostPerMinute = 0.2;
    
    return (distance * fuelCostPerKm) + (time * laborCostPerMinute);
  }
}

/**
 * Real-time Route Optimization
 * Dynamically adjusts routes based on real-time conditions
 */
export class RealTimeRouteOptimizer {
  private currentRoutes: Map<string, Route> = new Map();
  private trafficMultiplier: Map<string, number> = new Map();
  private vrpsolver: VRPSolver;

  constructor() {
    this.vrpsolver = new VRPSolver();
  }

  updateRoute(
    routeId: string,
    newDeliveries: DeliveryPoint[],
    depot: Point,
    options: RouteOptimizationOptions
  ): Route | null {
    const currentRoute = this.currentRoutes.get(routeId);
    if (!currentRoute) return null;
    
    // Combine existing undelivered points with new deliveries
    const undeliveredPoints = currentRoute.points.filter(point => 
      point.id !== 'delivered'
    );
    
    const allDeliveries = [...undeliveredPoints, ...newDeliveries];
    
    // Re-optimize route
    const optimizedRoutes = this.vrpsolver.solve(depot, allDeliveries, 1, options);
    
    if (optimizedRoutes.length > 0) {
      const optimizedRoute = optimizedRoutes[0];
      optimizedRoute.id = routeId;
      optimizedRoute.driverId = currentRoute.driverId;
      
      this.currentRoutes.set(routeId, optimizedRoute);
      return optimizedRoute;
    }
    
    return null;
  }

  addTrafficData(segmentId: string, multiplier: number): void {
    this.trafficMultiplier.set(segmentId, multiplier);
  }

  getOptimalRoute(
    start: Point,
    deliveries: DeliveryPoint[],
    options: RouteOptimizationOptions
  ): Route | null {
    if (deliveries.length === 0) return null;
    
    const routes = this.vrpsolver.solve(start, deliveries, 1, options);
    return routes.length > 0 ? routes[0] : null;
  }

  updateRouteProgress(routeId: string, currentLocation: Point): void {
    const route = this.currentRoutes.get(routeId);
    if (!route) return;
    
    // Mark completed deliveries
    route.points = route.points.map(point => {
      if (point.id !== 'delivered') {
        const distance = DistanceCalculator.haversineDistance(currentLocation, point);
        if (distance < 0.1) { // Within 100m
          return { ...point, id: 'delivered' };
        }
      }
      return point;
    });
    
    // Update route status
    const remainingDeliveries = route.points.filter(point => point.id !== 'delivered');
    if (remainingDeliveries.length === 0) {
      route.status = 'completed';
    } else {
      route.status = 'in_progress';
    }
  }
}

/**
 * Route Analytics and Optimization
 */
export class RouteAnalytics {
  static analyzeRouteEfficiency(routes: Route[]): {
    averageDistance: number;
    averageTime: number;
    averageCost: number;
    fuelEfficiency: number;
    timeEfficiency: number;
    costEfficiency: number;
  } {
    if (routes.length === 0) {
      return {
        averageDistance: 0,
        averageTime: 0,
        averageCost: 0,
        fuelEfficiency: 0,
        timeEfficiency: 0,
        costEfficiency: 0
      };
    }
    
    const totalDistance = routes.reduce((sum, route) => sum + route.totalDistance, 0);
    const totalTime = routes.reduce((sum, route) => sum + route.totalTime, 0);
    const totalCost = routes.reduce((sum, route) => sum + route.totalCost, 0);
    const totalDeliveries = routes.reduce((sum, route) => sum + route.points.length, 0);
    
    const averageDistance = totalDistance / routes.length;
    const averageTime = totalTime / routes.length;
    const averageCost = totalCost / routes.length;
    
    // Efficiency metrics (deliveries per unit)
    const fuelEfficiency = totalDeliveries / totalDistance; // deliveries per km
    const timeEfficiency = totalDeliveries / totalTime; // deliveries per minute
    const costEfficiency = totalDeliveries / totalCost; // deliveries per rupee
    
    return {
      averageDistance,
      averageTime,
      averageCost,
      fuelEfficiency,
      timeEfficiency,
      costEfficiency
    };
  }
  
  static findOptimalVehicleCount(
    deliveries: DeliveryPoint[],
    depot: Point,
    options: RouteOptimizationOptions
  ): number {
    const vrpsolver = new VRPSolver();
    let bestVehicleCount = 1;
    let bestEfficiency = 0;
    
    // Test different vehicle counts (1 to min(deliveries.length, 10))
    const maxVehicles = Math.min(deliveries.length, 10);
    
    for (let vehicles = 1; vehicles <= maxVehicles; vehicles++) {
      const routes = vrpsolver.solve(depot, deliveries, vehicles, options);
      const analytics = this.analyzeRouteEfficiency(routes);
      
      // Use cost efficiency as primary metric
      if (analytics.costEfficiency > bestEfficiency) {
        bestEfficiency = analytics.costEfficiency;
        bestVehicleCount = vehicles;
      }
    }
    
    return bestVehicleCount;
  }
}

// Export utility functions for FabZClean integration
export class FabZCleanRouteOptimizer {
  private realTimeOptimizer: RealTimeRouteOptimizer;
  private analytics: typeof RouteAnalytics;

  constructor() {
    this.realTimeOptimizer = new RealTimeRouteOptimizer();
    this.analytics = RouteAnalytics;
  }

  /**
   * Optimize delivery routes for FabZClean orders
   */
  optimizeDeliveryRoutes(
    orders: any[],
    drivers: any[],
    depot: Point
  ): Route[] {
    // Convert orders to delivery points
    const deliveries: DeliveryPoint[] = orders.map(order => ({
      id: order.id,
      latitude: order.shippingAddress?.latitude || 0,
      longitude: order.shippingAddress?.longitude || 0,
      address: order.shippingAddress?.address || '',
      name: order.customerName,
      orderId: order.id,
      customerName: order.customerName,
      priority: this.determinePriority(order),
      serviceTime: 5, // 5 minutes average service time
      weight: 1
    }));

    const options: RouteOptimizationOptions = {
      maxStops: 20,
      maxDistance: 100, // 100 km
      maxTime: 480, // 8 hours
      considerTraffic: true
    };

    const vrpsolver = new VRPSolver();
    const routes = vrpsolver.solve(depot, deliveries, drivers.length, options);

    // Assign routes to drivers
    routes.forEach((route, index) => {
      if (drivers[index]) {
        route.driverId = drivers[index].id;
      }
    });

    return routes;
  }

  private determinePriority(order: any): 'high' | 'medium' | 'low' {
    const amount = parseFloat(order.totalAmount || '0');
    const isUrgent = order.pickupDate && new Date(order.pickupDate) < new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    if (isUrgent || amount > 1000) return 'high';
    if (amount > 500) return 'medium';
    return 'low';
  }

  getRouteAnalytics(routes: Route[]) {
    return this.analytics.analyzeRouteEfficiency(routes);
  }

  getRealTimeOptimizer() {
    return this.realTimeOptimizer;
  }
}
