# FabZClean - Backend Architecture

A robust, scalable Node.js backend powering laundry operations.

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | **Node.js (Express)** | API development and server |
| **Language** | **TypeScript** | Type-safe backend logic |
| **ORM** | **Drizzle ORM** | Type-safe database queries |
| **Database** | **Supabase (PostgreSQL)** | Centralized cloud storage |
| **Caching** | **SQLite (Project Local)** | Hybrid local-first analytics engine |
| **Real-time** | **WebSocket (realtimeServer)** | Live status and notifications |
| **Storage** | **Cloudflare R2** | PDF invoices and large assets |
| **Notifications** | **Msg91** | WhatsApp and SMS services |

## 📁 Core Directory Structure

- `/server/index.ts`: Main entry point (Vite/Express setup).
- `/server/routes`: Modular API route definitions (orders, products, users).
- `/server/services`: High-level business logic (WhatsApp, Order processing, Search).
- `/server/middleware`: Authentication, error handling, and performance logging.
- `/shared/schema.ts`: Single source of truth for Drizzle/Zod schemas.

## 🗄 Database Design & Drizzle

The application uses **Drizzle ORM** for type-safe interaction with **Supabase (PostgreSQL)**:
- **Centralized Schema**: Common models shared between frontend and backend.
- **RBAC (Role-Based Access Control)**: Enforced through users, roles, and route access levels.
- **Relational Integrity**: Foreign keys for customers, orders, and employees.
- **JSONB Fields**: Flexible storage for shipping addresses, order items, and metadata.

## ⚙️ Key Services

### 🚀 WhatsApp Notification Service
- Built using **Msg91 API** for high reliability.
- Automated templates for order status updates (`processing`, `ready_for_pickup`, `delivered`).
- Integrated PDF invoice links for easy customer access.

### 📍 Route Optimization Engine
- Intelligent sorting of pickup and delivery tasks.
- Geocoding support through Google Maps/OpenStreetMap.
- Real-time location updates for drivers.

### 📊 SQLite Analytics Cache
- Autonomous metrics computation running in the background.
- Periodic aggregation of revenue and delivery data into a local SQLite file for fast UI rendering.
- Minimizes expensive Supabase queries for historical dashboards.

### 📑 Invoice & PDF Engine
- Dinamyc PDF generation for Professional Invoices.
- Automatic upload to **Cloudflare R2** with public URL management.
- Secure fallback to local storage if R2 is unavailable.

## 🔒 Security & Middleware

- **Authentication**: Supabase-powered session management with Express middleware.
- **Audit Logging**: Captures every administrative action for transparency.
- **Error Handling**: Centralized logging and meaningful error responses via custom middleware.
- **Rate Limiting**: Protects critical endpoints like login and order creation.

## 🚀 Performance & Scalability

- **Compression**: Gzip/Brotli support for API responses.
- **Connection Pooling**: Optimized Supabase connections for concurrent requests.
- **Memory Management**: Efficient serializing/deserialization with custom `serialization.ts`.
- **Hybrid Storage**: Supabase for relational data; R2 for attachments; Local for cache.
