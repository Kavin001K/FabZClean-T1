import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Navigation, MapPin, Truck, Phone, MessageSquare } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DriverLocation {
  driverId: string;
  driverName: string;
  orderId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  status: 'picked_up' | 'in_transit' | 'arrived' | 'delivered';
  estimatedArrival: string;
  lastUpdated: string;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface LiveTrackingMapProps {
  driver: DriverLocation | null;
  allDrivers?: DriverLocation[];
  route?: RoutePoint[];
  showAllDrivers?: boolean;
  className?: string;
}

// Custom driver marker component
const DriverMarker: React.FC<{ driver: DriverLocation }> = ({ driver }) => {
  const map = useMap();
  
  // Create custom driver icon
  const driverIcon = L.divIcon({
    className: 'driver-marker',
    html: `
      <div style="
        background: ${driver.status === 'arrived' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: rotate(${driver.heading}deg);
      ">
        🚚
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up': return 'bg-blue-500';
      case 'in_transit': return 'bg-yellow-500';
      case 'arrived': return 'bg-green-500';
      case 'delivered': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'picked_up': return 'Picked Up';
      case 'in_transit': return 'In Transit';
      case 'arrived': return 'Arrived';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  return (
    <Marker position={[driver.latitude, driver.longitude]} icon={driverIcon}>
      <Popup>
        <div className="p-2 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4" />
            <span className="font-semibold">{driver.driverName}</span>
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(driver.status)} text-white`}>
                {getStatusText(driver.status)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Navigation className="h-3 w-3" />
              <span>{driver.speed.toFixed(0)} km/h</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>ETA: {new Date(driver.estimatedArrival).toLocaleTimeString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span>Order #{driver.orderId.slice(-8)}</span>
            </div>
          </div>
          
          <div className="flex gap-1 mt-3">
            <Button size="sm" variant="outline" className="flex-1">
              <Phone className="h-3 w-3 mr-1" />
              Call
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <MessageSquare className="h-3 w-3 mr-1" />
              Message
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

// Component to update map view when driver location changes
const MapUpdater: React.FC<{ driver: DriverLocation | null }> = ({ driver }) => {
  const map = useMap();
  
  useEffect(() => {
    if (driver) {
      map.setView([driver.latitude, driver.longitude], 15);
    }
  }, [driver, map]);
  
  return null;
};

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ 
  driver, 
  allDrivers = [],
  route = [],
  showAllDrivers = false,
  className = '' 
}) => {
  const mapRef = useRef<L.Map>(null);

  // Show all drivers view if enabled
  if (showAllDrivers && allDrivers.length > 0) {
    const routeCoordinates = route.map(point => [point.latitude, point.longitude] as [number, number]);
    const centerLat = allDrivers.reduce((sum, d) => sum + d.latitude, 0) / allDrivers.length;
    const centerLng = allDrivers.reduce((sum, d) => sum + d.longitude, 0) / allDrivers.length;

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Tracking - All Drivers ({allDrivers.length})
            </div>
            <Badge variant="outline" className="text-xs">
              {allDrivers.filter(d => d.status === 'available').length} Available
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 rounded-lg overflow-hidden border">
            <MapContainer
              center={[centerLat, centerLng]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {allDrivers.map((driver) => (
                <DriverMarker key={driver.driverId} driver={driver} />
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!driver) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">No driver assigned to this order</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const routeCoordinates = route.map(point => [point.latitude, point.longitude] as [number, number]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Tracking
          </div>
          <Badge variant="outline" className="text-xs">
            {driver.status === 'picked_up' ? 'Picked Up' : 
             driver.status === 'in_transit' ? 'In Transit' :
             driver.status === 'arrived' ? 'Arrived' : 'Delivered'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Driver Info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold">{driver.driverName}</p>
              <p className="text-sm text-muted-foreground">Order #{driver.orderId.slice(-8)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{driver.speed.toFixed(0)} km/h</p>
              <p className="text-xs text-muted-foreground">
                ETA: {new Date(driver.estimatedArrival).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="h-64 rounded-lg overflow-hidden border">
            <MapContainer
              center={[driver.latitude, driver.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              <MapUpdater driver={driver} />
              
              <DriverMarker driver={driver} />
              
              {routeCoordinates.length > 1 && (
                <Polyline
                  positions={routeCoordinates}
                  color="#3b82f6"
                  weight={3}
                  opacity={0.7}
                />
              )}
            </MapContainer>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Call Driver
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
