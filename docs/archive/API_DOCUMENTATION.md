# FabZClean API Documentation

This document provides comprehensive documentation for all API endpoints in the FabZClean application, including the new algorithm-based endpoints and enhanced functionality.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URLs](#base-urls)
3. [Error Handling](#error-handling)
4. [Orders API](#orders-api)
5. [Customers API](#customers-api)
6. [Deliveries API](#deliveries-api)
7. [Drivers API](#drivers-api)
8. [Transit API](#transit-api)
9. [Search API](#search-api)
10. [Algorithms API](#algorithms-api)
11. [WebSocket API](#websocket-api)
12. [Data Models](#data-models)

## Authentication

### Admin Authentication
```http
POST /api/v1/auth/admin/login
Content-Type: application/json

{
  "email": "admin@fabzclean.com",
  "password": "admin_password"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "token": "admin_session_token",
    "user": {
      "id": "admin",
      "email": "admin@fabzclean.com",
      "name": "Admin",
      "role": "admin"
    }
  },
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### JWT Authentication
```http
Authorization: Bearer <jwt_token>
```

## Base URLs

- **Development**: `http://localhost:5000`
- **Production**: `https://your-domain.com`
- **WebSocket**: `ws://localhost:5000` (development) / `wss://your-domain.com` (production)

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "status": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "success": false,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Orders API

### Get All Orders
```http
GET /api/v1/orders
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status
- `customerEmail` (string): Filter by customer email
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "status": 200,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "order_123",
      "orderNumber": "ORD-2024-001",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+1234567890",
      "service": ["Dry Cleaning", "Ironing"],
      "totalAmount": "45.00",
      "status": "processing",
      "paymentStatus": "paid",
      "pickupDate": "2024-01-16T09:00:00.000Z",
      "deliveryDate": "2024-01-18T17:00:00.000Z",
      "specialInstructions": "Handle with care",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "hasMore": false,
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Order by ID
```http
GET /api/v1/orders/:id
```

### Create Order
```http
POST /api/v1/orders
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "service": ["Dry Cleaning", "Ironing"],
  "totalAmount": "45.00",
  "pickupDate": "2024-01-16T09:00:00.000Z",
  "deliveryDate": "2024-01-18T17:00:00.000Z",
  "specialInstructions": "Handle with care"
}
```

### Update Order
```http
PUT /api/v1/orders/:id
Content-Type: application/json

{
  "status": "completed",
  "paymentStatus": "paid"
}
```

### Delete Order
```http
DELETE /api/v1/orders/:id
```

## Customers API

### Get All Customers
```http
GET /api/v1/customers
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `search` (string): Search query
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort order

### Get Customer by ID
```http
GET /api/v1/customers/:id
```

### Create Customer
```http
POST /api/v1/customers
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  }
}
```

### Update Customer
```http
PUT /api/v1/customers/:id
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "+1234567891"
}
```

### Delete Customer
```http
DELETE /api/v1/customers/:id
```

## Deliveries API

### Get All Deliveries
```http
GET /api/v1/deliveries
```

### Get Delivery by ID
```http
GET /api/v1/deliveries/:id
```

### Create Delivery
```http
POST /api/v1/deliveries
Content-Type: application/json

{
  "orderId": "order_123",
  "driverId": "driver_456",
  "pickupAddress": "123 Main St, New York, NY 10001",
  "deliveryAddress": "456 Oak Ave, New York, NY 10002",
  "scheduledPickup": "2024-01-16T09:00:00.000Z",
  "scheduledDelivery": "2024-01-18T17:00:00.000Z"
}
```

### Update Delivery Status
```http
PUT /api/v1/deliveries/:id/status
Content-Type: application/json

{
  "status": "in_transit",
  "actualPickup": "2024-01-16T09:15:00.000Z"
}
```

## Drivers API

### Get All Drivers
```http
GET /api/v1/drivers
```

### Get Driver by ID
```http
GET /api/v1/drivers/:id
```

### Create Driver
```http
POST /api/v1/drivers
Content-Type: application/json

{
  "name": "Jane Smith",
  "phone": "+1234567890",
  "email": "jane@example.com",
  "licenseNumber": "DL123456789",
  "vehicleNumber": "ABC123",
  "vehicleType": "Van"
}
```

### Update Driver Location
```http
PUT /api/v1/drivers/:id/location
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

## Transit API

### Get All Transit Batches
```http
GET /api/v1/transit
```

### Get Transit Batch by ID
```http
GET /api/v1/transit/:id
```

### Create Transit Batch
```http
POST /api/v1/transit
Content-Type: application/json

{
  "type": "pickup",
  "origin": "Warehouse A",
  "destination": "Warehouse B",
  "driverId": "driver_456",
  "orderIds": ["order_123", "order_124"]
}
```

### Update Transit Batch
```http
PUT /api/v1/transit/:id
Content-Type: application/json

{
  "status": "in_transit",
  "actualStartTime": "2024-01-16T09:00:00.000Z"
}
```

## Search API

### Search Orders
```http
GET /api/v1/search/orders?q=john&fuzzy=true&limit=10
```

**Query Parameters:**
- `q` (string): Search query
- `fuzzy` (boolean): Enable fuzzy search
- `caseSensitive` (boolean): Case sensitive search
- `limit` (number): Maximum results

**Response:**
```json
{
  "status": 200,
  "message": "Search completed successfully",
  "data": {
    "data": [
      {
        "id": "order_123",
        "orderNumber": "ORD-2024-001",
        "customerName": "John Doe",
        "customerEmail": "john@example.com",
        "service": ["Dry Cleaning"],
        "totalAmount": "45.00",
        "status": "processing",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "query": "john",
    "total": 1,
    "took": 15,
    "options": {
      "fuzzy": true,
      "caseSensitive": false
    }
  },
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Search Customers
```http
GET /api/v1/search/customers?q=john@example.com&fuzzy=true
```

### Search Products
```http
GET /api/v1/search/products?q=dry cleaning&fuzzy=true
```

## Algorithms API

### Route Optimization
```http
POST /api/v1/algorithms/route-optimization
Content-Type: application/json

{
  "deliveries": [
    {
      "id": "delivery_1",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "priority": "high",
      "timeWindow": {
        "start": "2024-01-16T09:00:00.000Z",
        "end": "2024-01-16T17:00:00.000Z"
      }
    }
  ],
  "driverLocation": {
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "algorithm": "tsp"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Route optimized successfully",
  "data": {
    "optimizedRoute": [
      {
        "deliveryId": "delivery_1",
        "sequence": 1,
        "estimatedTime": "2024-01-16T09:30:00.000Z",
        "distance": 2.5
      }
    ],
    "totalDistance": 15.2,
    "totalTime": 120,
    "algorithm": "tsp",
    "optimizationTime": 45
  },
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Cache Management
```http
GET /api/v1/algorithms/cache/stats
```

**Response:**
```json
{
  "status": 200,
  "message": "Cache statistics retrieved successfully",
  "data": {
    "orders": {
      "hits": 1250,
      "misses": 150,
      "hitRate": 0.893,
      "size": 500,
      "memoryUsage": 1024000
    },
    "customers": {
      "hits": 800,
      "misses": 50,
      "hitRate": 0.941,
      "size": 200,
      "memoryUsage": 512000
    }
  },
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Clear Cache
```http
DELETE /api/v1/algorithms/cache/clear
Content-Type: application/json

{
  "cacheName": "orders",
  "pattern": "order_*"
}
```

## WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:5000');

ws.onopen = () => {
  // Subscribe to updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    topics: ['orders', 'deliveries'],
    portalType: 'admin',
    userId: 'admin'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Message Types

#### Subscribe
```json
{
  "type": "subscribe",
  "topics": ["orders", "deliveries", "analytics"],
  "portalType": "admin",
  "userId": "admin"
}
```

#### Unsubscribe
```json
{
  "type": "unsubscribe"
}
```

#### Ping
```json
{
  "type": "ping"
}
```

#### Location Update (Worker)
```json
{
  "type": "location_update",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Status Update (Worker)
```json
{
  "type": "status_update",
  "status": "available"
}
```

### WebSocket Metrics
```http
GET /api/v1/websocket/metrics
```

**Response:**
```json
{
  "status": 200,
  "message": "WebSocket metrics retrieved successfully",
  "data": {
    "totalConnections": 150,
    "activeConnections": 25,
    "messagesSent": 12500,
    "messagesBatched": 8500,
    "duplicateMessages": 50,
    "hitRate": 0.68,
    "portalConnections": {
      "admin": 5,
      "employee": 8,
      "customer": 10,
      "worker": 2
    }
  },
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Data Models

### Order
```typescript
interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  service: string[];
  totalAmount: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'in_transit' | 'delivered';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  pickupDate?: string;
  deliveryDate?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Customer
```typescript
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: string;
  lastOrder?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Driver
```typescript
interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  status: 'available' | 'busy' | 'offline';
  currentLatitude?: number;
  currentLongitude?: number;
  lastActive?: string;
  rating?: number;
  totalDeliveries?: number;
  totalEarnings?: number;
  createdAt: string;
  updatedAt: string;
}
```

### Delivery
```typescript
interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';
  pickupAddress: string;
  deliveryAddress: string;
  scheduledPickup?: string;
  scheduledDelivery?: string;
  actualPickup?: string;
  actualDelivery?: string;
  createdAt: string;
  updatedAt: string;
}
```

### TransitBatch
```typescript
interface TransitBatch {
  id: string;
  batchNumber: string;
  type: 'pickup' | 'delivery' | 'transfer';
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  origin: string;
  destination: string;
  driverId: string;
  orderIds: string[];
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General API**: 100 requests per minute per IP
- **Search API**: 50 requests per minute per IP
- **WebSocket**: 1000 messages per minute per connection

## CORS Configuration

CORS is configured to allow requests from:
- Development: `http://localhost:5173`, `http://localhost:3000`
- Production: `https://your-production-domain.com`

## Webhooks

Webhooks are available for real-time notifications:

### Order Status Changed
```http
POST /webhooks/order-status-changed
Content-Type: application/json

{
  "orderId": "order_123",
  "oldStatus": "processing",
  "newStatus": "completed",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Delivery Status Changed
```http
POST /webhooks/delivery-status-changed
Content-Type: application/json

{
  "deliveryId": "delivery_456",
  "oldStatus": "in_transit",
  "newStatus": "delivered",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## SDK and Libraries

### JavaScript/TypeScript SDK
```bash
npm install @fabzclean/api-client
```

```typescript
import { FabZCleanClient } from '@fabzclean/api-client';

const client = new FabZCleanClient({
  baseURL: 'https://api.fabzclean.com',
  apiKey: 'your-api-key'
});

// Get orders
const orders = await client.orders.getAll();

// Search customers
const customers = await client.search.customers('john@example.com');

// Optimize route
const route = await client.algorithms.optimizeRoute(deliveries);
```

### React Hooks
```typescript
import { useOrders, useSearch, useWebSocket } from '@fabzclean/react-hooks';

// Use orders
const { data: orders, loading, error } = useOrders();

// Use search
const { search, results, loading } = useSearch();

// Use WebSocket
const { connect, send, messages } = useWebSocket();
```

This comprehensive API documentation provides all the information needed to integrate with the FabZClean application's backend services.
