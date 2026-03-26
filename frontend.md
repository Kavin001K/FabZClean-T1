# FabZClean - Frontend Architecture

A high-performance, responsive React frontend designed for laundry management.

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | **React 18** | UI Library |
| **Language** | **TypeScript** | Type-safe development |
| **Bundler** | **Vite** | Fast builds and development server |
| **Styling** | **Tailwind CSS** | Utility-first CSS styling |
| **UI Components** | **shadcn/ui** | Accessible, custom-built UI components |
| **State Management** | **TanStack Query** | Server state syncing and caching |
| **Routing** | **Wouter** | Lightweight client-side routing |
| **Visualization** | **Recharts** | Business and financial charts |
| **Forms** | **React Hook Form** | Built-in validation with **Zod** |

## 📁 Core Directory Structure

- `/client/src/components`: Reusable UI pieces (Pills, Buttons, Layouts, Modals).
- `/client/src/contexts`: Global application state (Auth, Theme).
- `/client/src/hooks`: Custom hooks for data fetching and business logic (e.g., `use-orders`, `use-whatsapp`).
- `/client/src/lib`: Configuration (Supabase client, API utilities).
- `/client/src/pages`: Main application views and route components.
- `/client/src/types`: TypeScript definitions for the interface.

## 🎨 Design System

The application uses a clean, premium design with support for:
- **Responsive Layout**: Works seamlessly on desktops, tablets, and phones.
- **Glassmorphism**: Subtle transperency and blurred backgrounds for modern aesthetic.
- **Micro-animations**: Smooth transitions using **Framer Motion**.
- **Theming**: Full Light and Dark mode support through `next-themes`.

## 🌐 Dynamic Routing

The application uses **Wouter** for client-side routing:
- Protected routes based on **RBAC** (Role-Based Access Control).
- Public tracking pages accessible without authentication.
- URL-driven navigation for easy deep-linking of orders and customers.

## 🚀 Performance Optimizations

- **Vite-powered Builds**: Optimized asset delivery and lightning-fast HMR.
- **Client-side Caching**: TanStack Query minimizes redundant API calls.
- **Lazy Loading**: Code splitting for large dashboards and analytics pages.
- **Asset Optimization**: High-quality icons using **Lucide React**.

## 🔌 API Integration

The frontend communicates with the backend via a RESTful API:
- **Authentication**: JWT-based session management through Supabase Auth.
- **Real-time Engine**: WebSocket/Supabase Realtime integration for live order updates.
- **Form Handling**: Seamless Zod-to-API validation to prevent invalid data submission.
