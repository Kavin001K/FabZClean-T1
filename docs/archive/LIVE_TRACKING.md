# Live Tracking Integration

## 🚀 Live Tracking API Integration Complete

API Key: `fd8031fc53487803e037ce5c49ffa78d`

---

## 📋 What Was Implemented

### 1. **Live Tracking Service** (`client/src/lib/live-tracking-service.ts`)
- ✅ WebSocket connection for real-time updates
- ✅ REST API integration
- ✅ Driver location tracking
- ✅ Route tracking with ETA
- ✅ Automatic reconnection on disconnect
- ✅ Mock data fallback for development

### 2. **React Hooks** (`client/src/hooks/use-live-tracking.tsx`)
- ✅ `useDriverTracking(driverId)` - Track single driver in real-time
- ✅ `useActiveDrivers()` - Get all active drivers
- ✅ `useRouteTracking(routeId)` - Track complete route
- ✅ `useLocationUpdater(driverId)` - Update driver location (for mobile apps)

### 3. **Integration with Live Tracking Page**
- ✅ Combined local + external API drivers
- ✅ Real-time map updates
- ✅ Auto-refresh every 30 seconds
- ✅ Fallback to local data if external API fails

---

## 🔧 Configuration

### Environment Variables (added to `.env`)

```env
# Live Tracking API Configuration
LIVE_TRACKING_API_KEY=fd8031fc53487803e037ce5c49ffa78d
LIVE_TRACKING_API_URL=https://api.livetracking.com/v1
VITE_LIVE_TRACKING_ENABLED=true
```

---

## 📡 API Endpoints Used

### Base URL
```
https://api.livetracking.com/v1
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/drivers/{driverId}/location` | Get current driver location |
| GET | `/drivers/active` | Get all active drivers |
| POST | `/drivers/{driverId}/location` | Update driver location |
| GET | `/routes/{routeId}/tracking` | Get route tracking data |

### WebSocket
```
wss://api.livetracking.com/ws?apiKey=YOUR_API_KEY
```

**Subscription Format:**
```json
{
  "type": "subscribe",
  "channel": "driver",
  "id": "driver-123"
}
```

---

## 💻 Usage Examples

### Track a Single Driver
```tsx
import { useDriverTracking } from '@/hooks/use-live-tracking';

function DriverMap({ driverId }) {
  const { driverData, loading, error } = useDriverTracking(driverId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Map
      center={[driverData.currentLocation.latitude, driverData.currentLocation.longitude]}
      markers={[{
        position: [driverData.currentLocation.latitude, driverData.currentLocation.longitude],
        label: driverData.driverName
      }]}
    />
  );
}
```

### Track All Active Drivers
```tsx
import { useActiveDrivers } from '@/hooks/use-live-tracking';

function DriversMap() {
  const { drivers, loading, refresh } = useActiveDrivers();

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <Map>
        {drivers.map(driver => (
          <Marker
            key={driver.driverId}
            position={[driver.currentLocation.latitude, driver.currentLocation.longitude]}
            label={driver.driverName}
          />
        ))}
      </Map>
    </div>
  );
}
```

### Track a Route
```tsx
import { useRouteTracking } from '@/hooks/use-live-tracking';

function RouteMap({ routeId }) {
  const { routeData, loading } = useRouteTracking(routeId);

  if (loading) return <div>Loading route...</div>;

  return (
    <div>
      <h3>Route: {routeData.routeId}</h3>
      <p>Current Stop: {routeData.currentStopIndex + 1} of {routeData.stops.length}</p>
      <Map>
        {routeData.stops.map((stop, index) => (
          <Marker
            key={stop.stopId}
            position={[stop.location.latitude, stop.location.longitude]}
            icon={stop.status === 'completed' ? 'check' : 'pin'}
          />
        ))}
      </Map>
    </div>
  );
}
```

### Update Driver Location (for Mobile Apps)
```tsx
import { useLocationUpdater } from '@/hooks/use-live-tracking';

function DriverApp({ driverId }) {
  const { isUpdating, lastUpdate } = useLocationUpdater(driverId);

  return (
    <div>
      <div>Location updating: {isUpdating ? 'Yes' : 'No'}</div>
      <div>Last update: {lastUpdate?.toLocaleTimeString()}</div>
      {/* Location updates automatically using browser geolocation */}
    </div>
  );
}
```

---

## 🧪 Testing

### Enable Live Tracking
Set in `.env`:
```env
VITE_LIVE_TRACKING_ENABLED=true
```

### Use Mock Data (Development)
Set in `.env`:
```env
VITE_LIVE_TRACKING_ENABLED=false
```

The service will automatically use mock data with random Chennai locations.

---

## 📊 Data Structures

### DriverTracking
```typescript
{
  driverId: string;
  driverName: string;
  vehicleNumber?: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy?: number;
    speed?: number;
    heading?: number;
  };
  status: 'active' | 'inactive' | 'offline';
  lastUpdated: string;
}
```

### RouteTracking
```typescript
{
  routeId: string;
  driverId: string;
  stops: Array<{
    stopId: string;
    address: string;
    location: { latitude: number; longitude: number };
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    eta?: string;
    actualArrival?: string;
    actualDeparture?: string;
  }>;
  currentStopIndex: number;
  estimatedCompletion: string;
  path: Location[];
}
```

---

## 🔄 Real-Time Updates

The service automatically:
- ✅ Connects to WebSocket on initialization
- ✅ Subscribes to requested drivers/routes
- ✅ Updates React components in real-time
- ✅ Reconnects automatically on disconnect (max 5 attempts)
- ✅ Falls back to polling if WebSocket fails

---

## 🎯 Features

### Auto-Reconnection
- Exponential backoff (1s, 2s, 4s, 8s, 16s, 30s max)
- Max 5 reconnection attempts
- Automatic websocket reconnection

### Geolocation Support
- Browser geolocation API integration
- High accuracy mode
- Automatic location updates every few seconds
- Speed and heading detection

### Error Handling
- Graceful fallback to mock data
- Error messages propagated to UI
- Offline mode support

---

## 📱 Mobile App Integration

For driver mobile apps, use the `useLocationUpdater` hook:

```tsx
// App.tsx
import { useLocationUpdater } from '@/hooks/use-live-tracking';

function DriverApp() {
  const driverId = 'driver-123'; // From login
  const { isUpdating, lastUpdate } = useLocationUpdater(driverId);

  // Location updates automatically in background
  return (
    <div>
      <Status updating={isUpdating} lastUpdate={lastUpdate} />
      <DeliveryList />
    </div>
  );
}
```

---

## 🚨 Troubleshooting

### No drivers showing
1. Check API key is correct in `.env`
2. Check VITE_LIVE_TRACKING_ENABLED=true
3. Check browser console for errors
4. Try mock mode (set ENABLED=false)

### WebSocket not connecting
1. Check network firewall
2. Check API endpoint is accessible
3. Service will fall back to REST API polling

### Location not updating
1. Check browser location permissions
2. Check HTTPS (required for geolocation)
3. Check API key permissions

---

## ✅ Next Steps

1. **Configure API Endpoint**: Update `LIVE_TRACKING_API_URL` if different
2. **Test Integration**: Visit `/live-tracking` page
3. **Enable for Production**: Set `VITE_LIVE_TRACKING_ENABLED=true`
4. **Monitor Usage**: Check API usage/limits

---

## 📄 Files Created

- `client/src/lib/live-tracking-service.ts` - Main tracking service
- `client/src/hooks/use-live-tracking.tsx` - React hooks
- `.env` - API configuration (updated)
- `LIVE_TRACKING.md` - This documentation

---

**Status:** ✅ Ready to use  
**API Key:** fd8031fc53487803e037ce5c49ffa78d  
**Enabled:** Check `.env` file
