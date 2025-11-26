/**
 * Live Tracking Service
 * Integrates with external live tracking API for real-time location updates
 */

const TRACKING_API_KEY = import.meta.env.VITE_LIVE_TRACKING_API_KEY || 'fd8031fc53487803e037ce5c49ffa78d';
const TRACKING_ENABLED = false; // Explicitly disabled as per user request

export interface TrackingLocation {
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy?: number;
    speed?: number;
    heading?: number;
}

export interface DriverTracking {
    driverId: string;
    driverName: string;
    vehicleNumber?: string;
    currentLocation: TrackingLocation;
    status: 'active' | 'inactive' | 'offline';
    lastUpdated: string;
}

export interface RouteTracking {
    routeId: string;
    driverId: string;
    stops: TrackingStop[];
    currentStopIndex: number;
    estimatedCompletion: string;
    path: TrackingLocation[];
}

export interface TrackingStop {
    stopId: string;
    address: string;
    location: {
        latitude: number;
        longitude: number;
    };
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    eta?: string;
    actualArrival?: string;
    actualDeparture?: string;
}

class LiveTrackingService {
    private apiKey: string;
    private baseUrl: string = 'https://api.livetracking.com/v1';
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Initialize WebSocket connection for real-time updates
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!TRACKING_ENABLED) {
                console.warn('Live tracking is disabled');
                resolve();
                return;
            }

            try {
                const wsUrl = `wss://api.livetracking.com/ws?apiKey=${this.apiKey}`;
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('✅ Live tracking connected');
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('Failed to parse tracking message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('Live tracking error:', error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('Live tracking disconnected');
                    this.attemptReconnect();
                };
            } catch (error) {
                console.error('Failed to initialize live tracking:', error);
                reject(error);
            }
        });
    }

    /**
     * Disconnect from live tracking
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.listeners.clear();
    }

    /**
     * Subscribe to tracking updates for a specific driver
     */
    subscribeToDriver(driverId: string, callback: (data: DriverTracking) => void): () => void {
        const eventKey = `driver:${driverId}`;

        if (!this.listeners.has(eventKey)) {
            this.listeners.set(eventKey, new Set());
            // Send subscription request
            this.send({ type: 'subscribe', channel: 'driver', id: driverId });
        }

        this.listeners.get(eventKey)!.add(callback);

        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(eventKey);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this.listeners.delete(eventKey);
                    this.send({ type: 'unsubscribe', channel: 'driver', id: driverId });
                }
            }
        };
    }

    /**
     * Subscribe to tracking updates for a specific route
     */
    subscribeToRoute(routeId: string, callback: (data: RouteTracking) => void): () => void {
        const eventKey = `route:${routeId}`;

        if (!this.listeners.has(eventKey)) {
            this.listeners.set(eventKey, new Set());
            this.send({ type: 'subscribe', channel: 'route', id: routeId });
        }

        this.listeners.get(eventKey)!.add(callback);

        return () => {
            const listeners = this.listeners.get(eventKey);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this.listeners.delete(eventKey);
                    this.send({ type: 'unsubscribe', channel: 'route', id: routeId });
                }
            }
        };
    }

    /**
     * Get current location of a driver
     */
    async getDriverLocation(driverId: string): Promise<DriverTracking | null> {
        if (!TRACKING_ENABLED) {
            return this.getMockDriverLocation(driverId);
        }

        try {
            const response = await fetch(`${this.baseUrl}/drivers/${driverId}/location`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch driver location: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching driver location:', error);
            return this.getMockDriverLocation(driverId);
        }
    }

    /**
     * Get all active drivers
     */
    async getActiveDrivers(): Promise<DriverTracking[]> {
        if (!TRACKING_ENABLED) {
            return this.getMockActiveDrivers();
        }

        try {
            const response = await fetch(`${this.baseUrl}/drivers/active`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch active drivers: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching active drivers:', error);
            return this.getMockActiveDrivers();
        }
    }

    /**
     * Update driver location (for mobile apps)
     */
    async updateDriverLocation(driverId: string, location: TrackingLocation): Promise<void> {
        if (!TRACKING_ENABLED) {
            console.log('Mock: Updated driver location', { driverId, location });
            return;
        }

        try {
            await fetch(`${this.baseUrl}/drivers/${driverId}/location`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(location),
            });
        } catch (error) {
            console.error('Error updating driver location:', error);
        }
    }

    /**
     * Get route tracking data
     */
    async getRouteTracking(routeId: string): Promise<RouteTracking | null> {
        if (!TRACKING_ENABLED) {
            return this.getMockRouteTracking(routeId);
        }

        try {
            const response = await fetch(`${this.baseUrl}/routes/${routeId}/tracking`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch route tracking: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching route tracking:', error);
            return this.getMockRouteTracking(routeId);
        }
    }

    // Private methods

    private send(message: any): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    private handleMessage(data: any): void {
        const { type, channel, id, payload } = data;
        const eventKey = `${channel}:${id}`;
        const listeners = this.listeners.get(eventKey);

        if (listeners) {
            listeners.forEach(callback => callback(payload));
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`Attempting to reconnect in ${delay}ms...`);
            setTimeout(() => this.connect(), delay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    // Mock data methods for development/fallback

    private getMockDriverLocation(driverId: string): DriverTracking {
        return {
            driverId,
            driverName: `Driver ${driverId}`,
            vehicleNumber: `TN-01-AB-${Math.floor(Math.random() * 9999)}`,
            currentLocation: {
                latitude: 13.0827 + (Math.random() - 0.5) * 0.1,
                longitude: 80.2707 + (Math.random() - 0.5) * 0.1,
                timestamp: new Date().toISOString(),
                accuracy: 10,
                speed: 30 + Math.random() * 20,
                heading: Math.random() * 360,
            },
            status: 'active',
            lastUpdated: new Date().toISOString(),
        };
    }

    private getMockActiveDrivers(): DriverTracking[] {
        return Array.from({ length: 5 }, (_, i) => this.getMockDriverLocation(`driver-${i + 1}`));
    }

    private getMockRouteTracking(routeId: string): RouteTracking {
        return {
            routeId,
            driverId: 'driver-1',
            currentStopIndex: 1,
            estimatedCompletion: new Date(Date.now() + 3600000).toISOString(),
            stops: [
                {
                    stopId: '1',
                    address: 'Anna Nagar, Chennai',
                    location: { latitude: 13.0850, longitude: 80.2101 },
                    status: 'completed',
                    actualArrival: new Date(Date.now() - 1800000).toISOString(),
                    actualDeparture: new Date(Date.now() - 1700000).toISOString(),
                },
                {
                    stopId: '2',
                    address: 'T Nagar, Chennai',
                    location: { latitude: 13.0418, longitude: 80.2341 },
                    status: 'in_progress',
                    eta: new Date(Date.now() + 600000).toISOString(),
                },
                {
                    stopId: '3',
                    address: 'Adyar, Chennai',
                    location: { latitude: 13.0067, longitude: 80.2577 },
                    status: 'pending',
                    eta: new Date(Date.now() + 1800000).toISOString(),
                },
            ],
            path: [],
        };
    }
}

// Export singleton instance
export const liveTrackingService = new LiveTrackingService(TRACKING_API_KEY);

// Auto-connect if enabled
if (TRACKING_ENABLED) {
    liveTrackingService.connect().catch(console.error);
}
