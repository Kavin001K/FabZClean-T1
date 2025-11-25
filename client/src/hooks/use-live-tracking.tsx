import { useState, useEffect, useCallback } from 'react';
import {
    liveTrackingService,
    type DriverTracking,
    type RouteTracking,
    type TrackingLocation,
} from '@/lib/live-tracking-service';

/**
 * Hook to track a specific driver's location in real-time
 */
export function useDriverTracking(driverId: string | null) {
    const [driverData, setDriverData] = useState<DriverTracking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!driverId) {
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | null = null;

        // Initial fetch
        liveTrackingService
            .getDriverLocation(driverId)
            .then((data) => {
                setDriverData(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
            });

        // Subscribe to real-time updates
        unsubscribe = liveTrackingService.subscribeToDriver(driverId, (data) => {
            setDriverData(data);
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [driverId]);

    return { driverData, loading, error };
}

/**
 * Hook to track all active drivers
 */
export function useActiveDrivers() {
    const [drivers, setDrivers] = useState<DriverTracking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const data = await liveTrackingService.getActiveDrivers();
            setDrivers(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        // Refresh every 30 seconds
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
    }, [refresh]);

    return { drivers, loading, error, refresh };
}

/**
 * Hook to track a specific route in real-time
 */
export function useRouteTracking(routeId: string | null) {
    const [routeData, setRouteData] = useState<RouteTracking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!routeId) {
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | null = null;

        // Initial fetch
        liveTrackingService
            .getRouteTracking(routeId)
            .then((data) => {
                setRouteData(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
            });

        // Subscribe to real-time updates
        unsubscribe = liveTrackingService.subscribeToRoute(routeId, (data) => {
            setRouteData(data);
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [routeId]);

    return { routeData, loading, error };
}

/**
 * Hook to update current driver's location (for driver mobile app)
 */
export function useLocationUpdater(driverId: string) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const updateLocation = useCallback(
        async (location: TrackingLocation) => {
            if (!driverId) return;

            try {
                setIsUpdating(true);
                await liveTrackingService.updateDriverLocation(driverId, location);
                setLastUpdate(new Date());
            } catch (error) {
                console.error('Failed to update location:', error);
            } finally {
                setIsUpdating(false);
            }
        },
        [driverId]
    );

    // Auto-update using browser geolocation
    useEffect(() => {
        if (!driverId || !navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const location: TrackingLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    timestamp: new Date(position.timestamp).toISOString(),
                    accuracy: position.coords.accuracy,
                    speed: position.coords.speed || undefined,
                    heading: position.coords.heading || undefined,
                };
                updateLocation(location);
            },
            (error) => {
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [driverId, updateLocation]);

    return { isUpdating, lastUpdate, updateLocation };
}
