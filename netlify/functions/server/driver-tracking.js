import { storage } from './storage';
import { realtimeServer } from './websocket-server';
class DriverTrackingService {
    constructor() {
        this.activeDrivers = new Map();
        this.driverRoutes = new Map();
        this.simulationInterval = null;
        this.isSimulating = false;
        this.initializeSimulation();
    }
    initializeSimulation() {
        // Start simulation if not already running
        if (!this.isSimulating) {
            this.startSimulation();
        }
    }
    startSimulation() {
        this.isSimulating = true;
        console.log('Starting driver tracking simulation...');
        // Update driver locations every 3 seconds
        this.simulationInterval = setInterval(() => {
            this.updateDriverLocations();
        }, 3000);
    }
    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        this.isSimulating = false;
        console.log('Driver tracking simulation stopped');
    }
    async updateDriverLocations() {
        try {
            const orders = await storage.getOrders();
            const activeOrders = orders.filter(order => order.status === 'in_progress' || order.status === 'shipped');
            // Simulate drivers for active orders
            for (const order of activeOrders) {
                await this.simulateDriverForOrder(order);
            }
            // Broadcast location updates to connected clients
            this.broadcastLocationUpdates();
        }
        catch (error) {
            console.error('Error updating driver locations:', error);
        }
    }
    async simulateDriverForOrder(order) {
        const driverId = `driver_${order.id}`;
        let driver = this.activeDrivers.get(driverId);
        if (!driver) {
            // Create new driver simulation
            driver = await this.createDriverSimulation(order);
            this.activeDrivers.set(driverId, driver);
        }
        else {
            // Update existing driver location
            driver = this.updateDriverLocation(driver);
            this.activeDrivers.set(driverId, driver);
        }
        // Add route point for tracking
        this.addRoutePoint(driverId, {
            latitude: driver.latitude,
            longitude: driver.longitude,
            timestamp: new Date()
        });
    }
    async createDriverSimulation(order) {
        // Simulate driver starting from a warehouse location
        const warehouseLocation = this.getWarehouseLocation();
        const customerLocation = this.getCustomerLocation(order);
        return {
            driverId: `driver_${order.id}`,
            driverName: `Driver ${Math.floor(Math.random() * 1000)}`,
            orderId: order.id,
            latitude: warehouseLocation.latitude,
            longitude: warehouseLocation.longitude,
            heading: this.calculateHeading(warehouseLocation, customerLocation),
            speed: 25 + Math.random() * 15, // 25-40 km/h
            status: 'picked_up',
            estimatedArrival: this.calculateEstimatedArrival(warehouseLocation, customerLocation),
            lastUpdated: new Date()
        };
    }
    updateDriverLocation(driver) {
        const customerLocation = this.getCustomerLocation({ id: driver.orderId });
        const currentLocation = { latitude: driver.latitude, longitude: driver.longitude };
        // Calculate distance to customer
        const distanceToCustomer = this.calculateDistance(currentLocation, customerLocation);
        if (distanceToCustomer < 0.1) { // Within 100m
            driver.status = 'arrived';
            driver.speed = 0;
        }
        else {
            // Move towards customer
            const newLocation = this.moveTowardsTarget(currentLocation, customerLocation, driver.speed);
            driver.latitude = newLocation.latitude;
            driver.longitude = newLocation.longitude;
            driver.heading = this.calculateHeading(currentLocation, customerLocation);
            driver.status = 'in_transit';
        }
        driver.lastUpdated = new Date();
        return driver;
    }
    moveTowardsTarget(current, target, speedKmh) {
        const speedMs = speedKmh / 3.6; // Convert km/h to m/s
        const updateInterval = 3; // seconds
        const distanceMoved = speedMs * updateInterval; // meters
        const distanceToTarget = this.calculateDistance(current, target);
        if (distanceMoved >= distanceToTarget) {
            return target; // Reached destination
        }
        // Calculate bearing
        const bearing = this.calculateBearing(current, target);
        // Move in the direction of the target
        const earthRadius = 6371000; // meters
        const angularDistance = distanceMoved / earthRadius;
        const lat1 = current.latitude * Math.PI / 180;
        const lon1 = current.longitude * Math.PI / 180;
        const bearingRad = bearing * Math.PI / 180;
        const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDistance) +
            Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad));
        const lon2 = lon1 + Math.atan2(Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1), Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2));
        return {
            latitude: lat2 * 180 / Math.PI,
            longitude: lon2 * 180 / Math.PI
        };
    }
    calculateDistance(point1, point2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
        const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    }
    calculateBearing(point1, point2) {
        const lat1 = point1.latitude * Math.PI / 180;
        const lat2 = point2.latitude * Math.PI / 180;
        const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }
    calculateHeading(point1, point2) {
        return this.calculateBearing(point1, point2);
    }
    calculateEstimatedArrival(start, end) {
        const distance = this.calculateDistance(start, end);
        const averageSpeed = 30; // km/h
        const timeHours = distance / 1000 / averageSpeed; // Convert to hours
        const arrivalTime = new Date();
        arrivalTime.setTime(arrivalTime.getTime() + timeHours * 60 * 60 * 1000);
        return arrivalTime;
    }
    getWarehouseLocation() {
        // Simulate warehouse locations in different areas
        const warehouses = [
            { latitude: 12.9716, longitude: 77.5946 }, // Bangalore
            { latitude: 19.0760, longitude: 72.8777 }, // Mumbai
            { latitude: 28.7041, longitude: 77.1025 }, // Delhi
            { latitude: 13.0827, longitude: 80.2707 } // Chennai
        ];
        return warehouses[Math.floor(Math.random() * warehouses.length)];
    }
    getCustomerLocation(order) {
        // Simulate customer locations based on order data
        // In a real app, this would come from the customer's address
        const baseLatitude = 12.9716; // Bangalore center
        const baseLongitude = 77.5946;
        // Add some random variation within Bangalore area
        const latVariation = (Math.random() - 0.5) * 0.1; // ±0.05 degrees
        const lonVariation = (Math.random() - 0.5) * 0.1;
        return {
            latitude: baseLatitude + latVariation,
            longitude: baseLongitude + lonVariation
        };
    }
    addRoutePoint(driverId, point) {
        if (!this.driverRoutes.has(driverId)) {
            this.driverRoutes.set(driverId, []);
        }
        const route = this.driverRoutes.get(driverId);
        route.push(point);
        // Keep only last 50 points to prevent memory issues
        if (route.length > 50) {
            route.shift();
        }
    }
    broadcastLocationUpdates() {
        const activeDrivers = Array.from(this.activeDrivers.values());
        if (activeDrivers.length > 0) {
            realtimeServer.broadcastToSubscribers('driver_locations', {
                drivers: activeDrivers,
                timestamp: new Date().toISOString()
            });
        }
    }
    getDriverLocation(driverId) {
        return this.activeDrivers.get(driverId) || null;
    }
    getDriverRoute(driverId) {
        return this.driverRoutes.get(driverId) || [];
    }
    getAllActiveDrivers() {
        return Array.from(this.activeDrivers.values());
    }
    getDriverForOrder(orderId) {
        for (const driver of this.activeDrivers.values()) {
            if (driver.orderId === orderId) {
                return driver;
            }
        }
        return null;
    }
    async startTrackingForOrder(orderId) {
        try {
            const order = await storage.getOrder(orderId);
            if (!order) {
                return null;
            }
            // Create driver simulation for this order
            await this.simulateDriverForOrder(order);
            return this.getDriverForOrder(orderId);
        }
        catch (error) {
            console.error(`Error starting tracking for order ${orderId}:`, error);
            return null;
        }
    }
    stopTrackingForOrder(orderId) {
        const driverId = `driver_${orderId}`;
        this.activeDrivers.delete(driverId);
        this.driverRoutes.delete(driverId);
    }
    stop() {
        this.stopSimulation();
    }
}
// Export singleton instance
export const driverTrackingService = new DriverTrackingService();
//# sourceMappingURL=driver-tracking.js.map