# FabZClean - Premium Laundry Management System

A state-of-the-art, full-stack laundry operations platform built for modern franchises and factories. Powered by React, TypeScript, Supabase, and Express.

![Dashboard Preview](attached_assets/dashboard_preview.png)

## 🚀 Key Modules

### 🧺 Smart Order Management
- **End-to-End Lifecycle**: From creation to processing, transit, and delivery.
- **Priority Handling**: Support for Express/Urgent orders with automatic surcharge calculation.
- **Service Categories**: Dry Cleaning, Laundry, Ironing, and specialized treatments.
- **Tag Generation**: Automatic barcode and QR code generation for item tracking.

### 💰 Financial Ecosystem
- **Omni-channel Payments**: Cash, UPI, Card, and Bank Transfer support.
- **Digital Wallet**: Integrated customer wallet for top-ups and seamless payments.
- **Master Ledger**: Centralized transaction tracking with audit logs.
- **GST & Taxation**: Fully compliant GST invoicing with pan/gst tracking.

### 🚚 Logistics & Delivery
- **Live GPS Tracking**: Real-time driver location and delivery status.
- **Route Optimization**: Intelligent routing to save time and fuel.
- **Driver Portal**: Dedicated interface for pickup and delivery partners.
- **Automatic Payouts**: Performance-based delivery partner earnings computation.

### 📊 Advanced Analytics
- **Autonomous Metrics**: Automated monthly performance tracking (MOM growth, Revenue).
- **Local Analytics**: Blazing fast reporting powered by a hybrid SQLite-Supabase engine.
- **Business Intelligence**: Visual charts for revenue, orders, and customer trends.

### 💬 Communication & Branding
- **WhatsApp Integration**: Automated notifications for order status, invoices, and feedback.
- **PDF Invoices**: Dynamic, high-quality invoice generation stored on Cloudflare R2.
- **Public Tracking**: Customer-facing order status page without login required.

## 🛠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, TypeSript, Tailwind CSS, shadcn/ui, Recharts |
| **Backend** | Node.js, Express, Drizzle ORM, WebSocket (Real-time) |
| **Database** | Supabase (PostgreSQL), SQLite (Local Cache) |
| **Storage** | Cloudflare R2 (PDFs/Assets), Supabase Storage (Profiles) |
| **Integrations** | Msg91 (WhatsApp), Supabase Auth, Google Maps (Geocoding) |

## 📋 Getting Started

### 1. Prerequisites
- Node.js 20+ (LTS recommended)
- Supabase Account
- Msg91 API Key

### 2. Installation
```bash
git clone https://github.com/Kavin001K/FabZClean-T1.git
cd FabZClean-T1
npm install
```

### 3. Environment Setup
Create a `.env` file based on the template:
```env
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
PORT=5001
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 4. Development
```bash
npm run dev
```
The app will be available at `http://localhost:5001`

## 🔐 Role-Based Access Control (RBAC)

The system enforces strict permission levels:
- **Admin**: Full control over all franchises, users, and global settings.
- **Store Manager**: Manages specific store operations and staff.
- **Factory Manager**: Focuses on production, services, and processing.
- **Store Staff**: Order creation, customer handling, and billing.
- **Driver**: Delivery/Pickup task execution.

## 📁 Documentation
- [App Features](./app%20features.md) - Detailed breakdown of modules
- [Frontend Architecture](./frontend.md) - Tech stack and UI patterns
- [Backend Architecture](./backend.md) - Server logic and database design

---
**Built with ❤️ by FabZClean Team**
100% Type-Safe • Real-time Updates • Scalable Architecture
