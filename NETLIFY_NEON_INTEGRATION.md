# Netlify + Neon Database Integration

This document explains how the FabZClean application uses Netlify's native Neon database integration for serverless functions.

## Overview

The application now uses the `@netlify/neon` package for direct database access in Netlify Functions, providing better performance and native integration.

## Setup

### 1. Dependencies

The following package is installed:
```json
{
  "@netlify/neon": "^latest"
}
```

### 2. Environment Variables

The `netlify.toml` file includes both environment variables:
```toml
[build.environment]
  DATABASE_URL = "postgresql://neondb_owner:npg_8WdTlBKStax0@ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
  NETLIFY_DATABASE_URL = "postgresql://neondb_owner:npg_8WdTlBKStax0@ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

- `DATABASE_URL`: Used by the main application
- `NETLIFY_DATABASE_URL`: Used by Netlify Functions (automatically detected by `@netlify/neon`)

## Usage

### Basic Database Connection

```typescript
import { neon } from '@netlify/neon';

// Initialize Neon client - automatically uses NETLIFY_DATABASE_URL
const sql = neon();
```

### Query Examples

```typescript
// Simple query
const users = await sql`SELECT * FROM users WHERE active = true`;

// Parameterized query
const user = await sql`SELECT * FROM users WHERE id = ${userId}`;

// Insert with returning
const newUser = await sql`
  INSERT INTO users (name, email) 
  VALUES (${name}, ${email}) 
  RETURNING *
`;
```

## Database Utility Functions

The `netlify/functions/db.ts` file provides a complete database utility layer:

### Available Functions

```typescript
import { db } from './db';

// Orders
const orders = await db.getOrders();
const order = await db.getOrderById('123');
const newOrder = await db.createOrder(orderData);

// Customers
const customers = await db.getCustomers();
const customer = await db.getCustomerById('123');
const newCustomer = await db.createCustomer(customerData);

// Products & Services
const products = await db.getProducts();
const services = await db.getServices();

// Dashboard
const metrics = await db.getDashboardMetrics();

// Connection test
const connection = await db.testConnection();
```

## API Endpoints

The following API endpoints are available:

| Endpoint | Function | Description |
|----------|----------|-------------|
| `GET /api/orders` | `orders-simple` | Get all orders |
| `POST /api/orders` | `orders-simple` | Create new order |
| `GET /api/customers` | `customers-simple` | Get all customers |
| `POST /api/customers` | `customers-simple` | Create new customer |
| `GET /api/dashboard/metrics` | `dashboard-metrics-simple` | Get dashboard metrics |
| `GET /api/test-db` | `test-db` | Test database connection |

## Current Implementation

### Sample Data Mode

Currently, the functions return sample data instead of querying the actual database. This is because:

1. **Database Schema**: The actual database tables haven't been created yet
2. **Development**: Allows testing the API structure without database setup
3. **Fallback**: Provides graceful degradation if database is unavailable

### Transitioning to Real Database

To use the actual database, uncomment the SQL queries in `netlify/functions/db.ts`:

```typescript
// Before (sample data)
return sampleData.orders;

// After (real database)
const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
return orders;
```

## Database Schema

When ready to use the real database, you'll need to create tables matching the sample data structure:

### Orders Table
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT,
  payment_status TEXT,
  total_amount DECIMAL(10,2),
  items JSONB,
  shipping_address JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Customers Table
```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  address JSONB,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  join_date TIMESTAMP DEFAULT NOW(),
  last_order TIMESTAMP
);
```

## Testing

### Local Testing

```bash
# Build functions
npm run build:functions

# Test database connection
curl http://localhost:8888/api/test-db
```

### Production Testing

After deployment, test the endpoints:

```bash
# Test database connection
curl https://your-site.netlify.app/api/test-db

# Get orders
curl https://your-site.netlify.app/api/orders

# Get customers
curl https://your-site.netlify.app/api/customers

# Get dashboard metrics
curl https://your-site.netlify.app/api/dashboard/metrics
```

## Benefits

1. **Native Integration**: Direct integration with Netlify's infrastructure
2. **Performance**: Optimized for serverless functions
3. **Simplicity**: Automatic connection management
4. **Reliability**: Built-in connection pooling and retry logic
5. **Security**: Environment variables are automatically injected

## Migration Notes

- The old server-based database code is still available in the `server/` directory
- The new functions use a simplified, sample-data approach for immediate deployment
- Database schema migration can be done incrementally
- Both approaches can coexist during the transition period

## Next Steps

1. **Create Database Schema**: Set up the actual database tables
2. **Migrate Data**: Import existing data if any
3. **Update Functions**: Switch from sample data to real queries
4. **Test Thoroughly**: Verify all endpoints work with real data
5. **Monitor Performance**: Check query performance and optimize as needed
