# FabZClean Architecture Documentation

This document provides comprehensive documentation for the FabZClean application architecture, including the redesigned backend, enhanced frontend, and integrated algorithms.

## Table of Contents

1. [System Overview](#system-overview)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Database Architecture](#database-architecture)
5. [API Architecture](#api-architecture)
6. [Real-time Architecture](#real-time-architecture)
7. [Algorithm Integration](#algorithm-integration)
8. [Performance Architecture](#performance-architecture)
9. [Security Architecture](#security-architecture)
10. [Deployment Architecture](#deployment-architecture)

## System Overview

FabZClean is a comprehensive laundry and dry cleaning management system with four distinct portals:

- **Admin Portal**: System administration and oversight
- **Employee Portal**: Order management and customer service
- **Customer Portal**: Self-service and order tracking
- **Worker Portal**: Delivery management and route optimization

### Technology Stack

**Backend:**
- Node.js with Express.js
- TypeScript
- SQLite with better-sqlite3
- WebSocket for real-time communication
- Advanced algorithms for optimization

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + Shadcn UI
- TanStack Query for server state
- Framer Motion for animations

**Infrastructure:**
- Netlify for hosting
- Neon for database (production)
- GitHub for version control

## Backend Architecture

### Modular Structure

```
server/
├── algorithms/           # Algorithm implementations
│   ├── search-algorithms.ts
│   ├── sorting-algorithms.ts
│   ├── caching-algorithms.ts
│   ├── route-optimization.ts
│   └── data-structures.ts
├── middleware/           # Express middleware
│   ├── auth.ts
│   ├── validation.ts
│   └── error-handling.ts
├── routes/              # API route modules
│   ├── orders.ts
│   ├── customers.ts
│   ├── deliveries.ts
│   ├── drivers.ts
│   ├── transit.ts
│   └── api/
│       ├── search.ts
│       ├── algorithms.ts
│       └── websocket-metrics.ts
├── services/            # Business logic services
│   ├── search.service.ts
│   ├── pagination.service.ts
│   ├── cache.service.ts
│   ├── route-optimization.service.ts
│   └── serialization.ts
├── models/              # Data models
│   └── index.ts
├── database.ts          # Database connection
├── websocket-server.ts  # WebSocket server
└── index.ts            # Main server file
```

### Key Components

#### 1. Algorithm Engine
The algorithm engine provides optimized solutions for various business operations:

- **Search Algorithms**: Levenshtein Distance, Boyer-Moore, KMP
- **Sorting Algorithms**: TimSort, QuickSort, HeapSort, RadixSort
- **Caching Algorithms**: LRU, LFU, TTL, Hybrid caching
- **Route Optimization**: TSP solver, VRP optimization
- **Data Structures**: Trie, Bloom filter, Segment tree

#### 2. Service Layer
Business logic is encapsulated in service classes:

- **SearchService**: Advanced search functionality
- **PaginationService**: Efficient pagination
- **CacheService**: Intelligent caching strategies
- **RouteOptimizationService**: Delivery route optimization

#### 3. Middleware Stack
Express middleware for cross-cutting concerns:

- **Authentication**: Session and JWT-based auth
- **Validation**: Input validation with Zod
- **Error Handling**: Centralized error handling
- **CORS**: Cross-origin resource sharing

### API Design

#### RESTful Endpoints
```
GET    /api/v1/orders           # List orders
POST   /api/v1/orders           # Create order
GET    /api/v1/orders/:id       # Get order
PUT    /api/v1/orders/:id       # Update order
DELETE /api/v1/orders/:id       # Delete order

GET    /api/v1/search/orders    # Search orders
POST   /api/v1/algorithms/route-optimization  # Optimize routes
GET    /api/v1/websocket/metrics              # WebSocket metrics
```

#### Response Format
```json
{
  "status": 200,
  "message": "Success",
  "data": { ... },
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Frontend Architecture

### Application Structure

```
client/
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── orders/        # Order management
│   │   ├── customer-portal/ # Customer portal
│   │   ├── worker-portal/   # Worker portal
│   │   └── search/        # Search components
│   ├── hooks/             # Custom React hooks
│   │   ├── use-fuzzy-search.tsx
│   │   ├── use-pagination.tsx
│   │   ├── use-cache.tsx
│   │   └── use-memoization.tsx
│   ├── lib/               # Utility libraries
│   │   ├── data-service.ts
│   │   ├── bundle-optimization.ts
│   │   └── performance-monitor.ts
│   ├── pages/             # Page components
│   │   ├── employee-dashboard.tsx
│   │   ├── customer-portal.tsx
│   │   └── worker-portal.tsx
│   ├── contexts/          # React contexts
│   │   ├── realtime-context.tsx
│   │   └── settings-context.tsx
│   └── types/             # TypeScript types
└── public/                # Static assets
```

### Component Architecture

#### 1. UI Components
Base UI components built with Radix UI and styled with Tailwind CSS:

- **VirtualScroll**: High-performance list rendering
- **LazyLoad**: Intersection Observer-based lazy loading
- **PerformanceMonitor**: Real-time performance monitoring
- **DataTable**: Optimized table component

#### 2. Portal Components
Portal-specific components for each user type:

- **Admin Portal**: System administration and analytics
- **Employee Portal**: Order management and customer service
- **Customer Portal**: Self-service and order tracking
- **Worker Portal**: Delivery management and route optimization

#### 3. Search Components
Advanced search functionality:

- **FuzzySearch**: Levenshtein distance-based search
- **SearchSuggestions**: Autocomplete and suggestions
- **AdvancedFilters**: Multi-criteria filtering

### State Management

#### 1. Server State
TanStack Query for server state management:

```typescript
const { data: orders, isLoading, error } = useQuery({
  queryKey: ['orders'],
  queryFn: () => ordersApi.getAll(),
  staleTime: 5 * 60 * 1000,
  retry: 3
});
```

#### 2. Global State
React Context for global state:

```typescript
const RealtimeContext = createContext({
  connection: null,
  subscribe: () => {},
  unsubscribe: () => {}
});
```

#### 3. Local State
React hooks for component state:

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [filters, setFilters] = useState({});
```

## Database Architecture

### Schema Design

#### Core Tables
```sql
-- Orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  orderNumber TEXT UNIQUE NOT NULL,
  customerName TEXT NOT NULL,
  customerEmail TEXT,
  customerPhone TEXT,
  service TEXT NOT NULL, -- JSON array
  totalAmount TEXT NOT NULL,
  status TEXT NOT NULL,
  paymentStatus TEXT NOT NULL,
  pickupDate TEXT,
  deliveryDate TEXT,
  specialInstructions TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Customers table
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT, -- JSON object
  loyaltyPoints INTEGER DEFAULT 0,
  totalOrders INTEGER DEFAULT 0,
  totalSpent TEXT DEFAULT '0',
  lastOrder TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Drivers table
CREATE TABLE drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  licenseNumber TEXT UNIQUE NOT NULL,
  vehicleNumber TEXT NOT NULL,
  vehicleType TEXT NOT NULL,
  status TEXT NOT NULL,
  currentLatitude REAL,
  currentLongitude REAL,
  lastActive TEXT,
  rating REAL DEFAULT 0,
  totalDeliveries INTEGER DEFAULT 0,
  totalEarnings TEXT DEFAULT '0',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Deliveries table
CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  driverId TEXT NOT NULL,
  status TEXT NOT NULL,
  pickupAddress TEXT NOT NULL,
  deliveryAddress TEXT NOT NULL,
  scheduledPickup TEXT,
  scheduledDelivery TEXT,
  actualPickup TEXT,
  actualDelivery TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders(id),
  FOREIGN KEY (driverId) REFERENCES drivers(id)
);
```

#### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_orders_customer_email ON orders(customerEmail);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(createdAt);
CREATE INDEX idx_orders_pickup_date ON orders(pickupDate);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_license ON drivers(licenseNumber);

CREATE INDEX idx_deliveries_driver_id ON deliveries(driverId);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_scheduled_pickup ON deliveries(scheduledPickup);
```

### Data Access Layer

#### Repository Pattern
```typescript
class OrderRepository {
  async findAll(options: QueryOptions): Promise<Order[]> {
    // Optimized query with pagination and filtering
  }
  
  async findById(id: string): Promise<Order | null> {
    // Single order retrieval
  }
  
  async create(orderData: CreateOrderData): Promise<Order> {
    // Order creation with validation
  }
  
  async update(id: string, updates: UpdateOrderData): Promise<Order> {
    // Order updates with optimistic locking
  }
}
```

## API Architecture

### RESTful Design

#### Resource-Based URLs
```
GET    /api/v1/orders              # Collection
GET    /api/v1/orders/:id          # Resource
POST   /api/v1/orders              # Create
PUT    /api/v1/orders/:id          # Update
DELETE /api/v1/orders/:id          # Delete
```

#### Query Parameters
```
GET /api/v1/orders?page=1&limit=20&status=processing&sortBy=createdAt&sortOrder=desc
```

#### Response Format
```json
{
  "status": 200,
  "message": "Success",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  },
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Algorithm APIs

#### Search API
```
GET /api/v1/search/orders?q=john&fuzzy=true&limit=10
GET /api/v1/search/customers?q=john@example.com&fuzzy=true
GET /api/v1/search/products?q=dry cleaning&fuzzy=true
```

#### Algorithms API
```
POST /api/v1/algorithms/route-optimization
GET  /api/v1/algorithms/cache/stats
DELETE /api/v1/algorithms/cache/clear
```

## Real-time Architecture

### WebSocket Implementation

#### Connection Management
```typescript
class RealtimeServer {
  private clients: Map<string, ClientSubscription> = new Map();
  private messageQueue: BatchedMessage[] = [];
  private batchInterval: NodeJS.Timeout | null = null;
  
  // Message batching and deduplication
  private addToBatch(type: string, data: any, priority: 'low' | 'medium' | 'high') {
    // Add message to batch queue
  }
  
  private processBatch(): void {
    // Process batched messages
  }
  
  // Portal-specific broadcasts
  private broadcastToPortal(portalType: string, type: string, data: any) {
    // Broadcast to specific portal
  }
}
```

#### Message Types
```typescript
interface BatchedMessage {
  type: string;
  data: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  id: string;
}
```

#### Client Subscription
```typescript
interface ClientSubscription {
  ws: WebSocket;
  subscriptions: string[];
  lastSeen: number;
  portalType?: 'admin' | 'employee' | 'customer' | 'worker';
  userId?: string;
}
```

### Real-time Features

#### 1. Message Batching
- Batch multiple messages for efficiency
- Priority-based message ordering
- Automatic batch processing every 2 seconds

#### 2. Portal-Specific Updates
- Targeted broadcasts by portal type
- User-specific notifications
- Role-based access control

#### 3. Connection Pooling
- Efficient connection management
- Automatic cleanup of stale connections
- Connection metrics and monitoring

## Algorithm Integration

### Search Algorithms

#### Levenshtein Distance
```typescript
class LevenshteinDistance {
  static calculate(str1: string, str2: string): number {
    // Dynamic programming implementation
  }
  
  static similarity(str1: string, str2: string): number {
    // Similarity score calculation
  }
}
```

#### Advanced Search Engine
```typescript
class AdvancedSearchEngine {
  private index: Map<string, any[]> = new Map();
  
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // Multi-algorithm search implementation
  }
  
  private buildIndex(data: any[]): void {
    // Index building for fast search
  }
}
```

### Caching Algorithms

#### LRU Cache
```typescript
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  
  get(key: string): T | null {
    // LRU implementation
  }
  
  set(key: string, value: T): void {
    // Cache insertion with eviction
  }
}
```

#### Hybrid Cache
```typescript
class HybridCache<T> {
  private lruCache: LRUCache<T>;
  private ttlCache: TTLCache<T>;
  
  get(key: string): T | null {
    // Hybrid cache logic
  }
}
```

### Route Optimization

#### TSP Solver
```typescript
class TSPSolver {
  solve(deliveries: Delivery[], driverLocation: Location): OptimizedRoute {
    // Traveling Salesman Problem solution
  }
  
  private geneticAlgorithm(deliveries: Delivery[]): Delivery[] {
    // Genetic algorithm implementation
  }
}
```

## Performance Architecture

### Frontend Performance

#### 1. Virtual Scrolling
```typescript
class VirtualScroll {
  private visibleRange: { start: number; end: number };
  private totalHeight: number;
  private offsetY: number;
  
  render(items: any[], itemHeight: number, containerHeight: number) {
    // Virtual scrolling implementation
  }
}
```

#### 2. Lazy Loading
```typescript
class LazyLoad {
  private observer: IntersectionObserver;
  private element: HTMLElement;
  
  observe(callback: () => void): void {
    // Intersection Observer implementation
  }
}
```

#### 3. Memoization
```typescript
const useMemoizedSearch = <T>(
  items: T[],
  searchQuery: string,
  searchFields: (keyof T)[]
) => {
  return useMemo(() => {
    // Memoized search implementation
  }, [items, searchQuery, searchFields]);
};
```

### Backend Performance

#### 1. Database Optimization
- Strategic indexing for frequent queries
- Query optimization with proper joins
- Connection pooling for efficient resource usage
- Prepared statements for repeated queries

#### 2. Caching Strategy
- Multi-level caching (memory, database, CDN)
- Intelligent cache invalidation
- Cache warming for frequently accessed data
- Distributed caching for scalability

#### 3. Algorithm Optimization
- Efficient data structures for frequent operations
- Optimized algorithms for specific use cases
- Parallel processing where applicable
- Memory-efficient implementations

## Security Architecture

### Authentication & Authorization

#### 1. Session-Based Auth (Admin)
```typescript
const adminLoginRequired = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const adminToken = req.headers.authorization?.replace('Bearer ', '');
  if (adminToken === process.env.ADMIN_SECRET_TOKEN) {
    req.user = { id: 'admin', email: 'admin@fabzclean.com', name: 'Admin', role: 'admin' };
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized: Admin access required' });
};
```

#### 2. JWT-Based Auth (Customers/Workers)
```typescript
const jwtRequired = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && validateJWT(token)) {
    req.user = decodeJWT(token);
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized: JWT token required' });
};
```

### Input Validation

#### Zod Schema Validation
```typescript
const orderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  service: z.array(z.string()),
  totalAmount: z.string().regex(/^\d+\.\d{2}$/),
  pickupDate: z.string().datetime(),
  deliveryDate: z.string().datetime()
});
```

### CORS Configuration
```typescript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

## Deployment Architecture

### Development Environment
- **Local Development**: SQLite database, local server
- **Hot Reloading**: Vite dev server with HMR
- **Debugging**: Source maps and debugging tools
- **Testing**: Jest and React Testing Library

### Production Environment
- **Hosting**: Netlify for frontend and serverless functions
- **Database**: Neon PostgreSQL for production data
- **CDN**: Netlify CDN for static assets
- **Monitoring**: Performance monitoring and error tracking

### CI/CD Pipeline
- **GitHub Actions**: Automated testing and deployment
- **Build Process**: Vite build with optimization
- **Testing**: Automated test suite execution
- **Deployment**: Automatic deployment to Netlify

### Environment Configuration
```typescript
// Environment variables
const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '5000',
  DATABASE_URL: process.env.DATABASE_URL,
  ADMIN_SECRET_TOKEN: process.env.ADMIN_SECRET_TOKEN,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN
};
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: No server-side session storage
- **Database Scaling**: Read replicas for query distribution
- **CDN**: Global content delivery
- **Load Balancing**: Multiple server instances

### Performance Monitoring
- **Real-time Metrics**: WebSocket connection monitoring
- **Performance Tracking**: Component render times
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: Usage pattern analysis

### Future Enhancements
- **Microservices**: Service decomposition for scalability
- **Event Sourcing**: Event-driven architecture
- **CQRS**: Command Query Responsibility Segregation
- **GraphQL**: Flexible API querying
- **Machine Learning**: Predictive analytics and optimization

This comprehensive architecture documentation provides a complete overview of the FabZClean application's technical architecture and implementation details.
