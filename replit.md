# Fab-Z Operations Dashboard

## Overview

Fab-Z is a comprehensive business operations dashboard that provides real-time visibility into all aspects of a fabric cleaning business. The application serves as a unified command center for managing orders, inventory, point-of-sale transactions, logistics, customer relationships, and analytics. Built as a demonstration platform, it showcases a complete business management system without authentication requirements, allowing users to explore all features seamlessly.

The application follows a "Bento Box" grid layout philosophy with evolved minimalism design principles, featuring both light and dark modes. It's designed to handle the complete lifecycle of a fabric cleaning operation from order intake through delivery tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Design System**: Custom Bento Box grid layout with evolved minimalism aesthetic
- **Theme Support**: Light/dark mode toggle with system preference detection

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with conventional HTTP methods
- **Error Handling**: Centralized error middleware with structured error responses
- **Development Tools**: Hot module replacement via Vite integration
- **Request Logging**: Custom middleware for API request/response logging

### Data Storage Solutions
- **Database**: PostgreSQL as the primary database
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL connection
- **Validation**: Zod schemas for runtime type validation and data parsing

### Core Data Models
- **Products**: Inventory management with SKU tracking, stock levels, and reorder points
- **Orders**: Complete order lifecycle from creation to fulfillment
- **Customers**: Customer relationship management with purchase history
- **Deliveries**: Logistics tracking with GPS coordinates and route management
- **POS Transactions**: Point-of-sale integration for in-store purchases
- **Users**: Basic user management (currently unused due to no-auth design)

### Key Architectural Patterns
- **Modular Component Structure**: Reusable UI components with consistent interfaces
- **Type-Safe API Contracts**: Shared TypeScript types between frontend and backend
- **Query-Based State Management**: Server state handled via React Query with optimistic updates
- **Responsive Grid Layouts**: CSS Grid and Flexbox for adaptive layouts across devices
- **Performance Optimization**: Code splitting, lazy loading, and efficient re-renders

### Development Environment
- **Replit Integration**: Configured for Replit development with runtime error overlay
- **TypeScript Configuration**: Strict type checking with path mapping for clean imports
- **Hot Reload**: Vite development server with instant updates
- **Build Process**: Optimized production builds with ESBuild bundling

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management

### UI and Design Libraries
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Modern icon library with consistent design language
- **Class Variance Authority**: Type-safe variant management for component styling

### Data Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime schema validation and type inference
- **date-fns**: Date manipulation and formatting utilities

### Charts and Visualization
- **Recharts**: React charting library for data visualization and analytics
- **Custom Chart Components**: Built on Recharts for consistent styling

### Development Tools
- **Vite**: Fast build tool and development server
- **ESBuild**: Fast JavaScript bundler for production builds
- **TypeScript**: Static type checking and enhanced developer experience
- **PostCSS**: CSS processing with Tailwind CSS integration

### Styling and Theming
- **CSS Custom Properties**: Dynamic theming for light/dark mode support
- **Google Fonts**: Typography with Inter, Poppins, and JetBrains Mono
- **Tailwind CSS Plugins**: Extended functionality for component styling

### Additional Libraries
- **Wouter**: Lightweight routing for single-page application navigation
- **React DOM**: React rendering and event handling
- **Embla Carousel**: Touch-friendly carousel implementation for mobile interfaces