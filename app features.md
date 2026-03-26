# FabZClean - Detailed Feature Breakdown

A comprehensive overview of the modules and business logic implemented in the FabZClean Laundry Management System.

## 🧺 1. Order Management System
The core of the application, designed for high-volume operations.

- **Multi-Step Order Creation**: Dynamic pricing based on quantity, service type, and customer history.
- **Service Categories**: Extensive catalog of dry cleaning, laundry, ironing, and repairs.
- **Priority Orders**: Dedicated 'Express' and 'Urgent' status handling with automated surcharges.
- **Lifecycle Tracking**:
    - `pending` → `processing` → `ready_for_pickup` → `out_for_delivery` → `delivered`
- **Tag Generation**: Integration with QR codes and barcodes for item-level tracking within the factory.
- **Special Instructions**: Customer-specific notes for garment handling (e.g., "stain on collar").

## 🚚 2. Smart Logistics & Delivery
End-to-end logistics platform for drivers and managers.

- **Real-time GPS Tracking**: Live location updates for drivers during transit.
- **Route Optimization**: Intelligent sorting of delivery and pickup tasks to minimize travel distance.
- **Driver Mobile Interface**: Simplified dashboard for drivers to update order status on the go.
- **Delivery Payouts**: Automated calculation of driver earnings based on a per-order salary model.
- **Transit Management**: Support for 'Ready for Transit' state for batching factory-to-store shipments.

## 💰 3. Financial Module & Payments
A robust accounting engine managing the cash flow of the business.

- **Customer Wallet**: Integrated prepaid wallet system with 'Credit In' and 'Credit Out' operations.
- **Multiple Payment Gateways**: Support for Cash, Card, UPI, and Bank Transfers.
- **GST Compliance**: Automated tax calculation (default 18%) with support for PAN and GSTIN tracking.
- **Accounting Dashboard**: Comprehensive P&L, balance sheets, and transaction logs.
- **Discount Management**: Support for coupon codes and flat/percentage-based discounts.
- **Advance Payments**: Capture customer deposits at the time of order creation.

## 👥 4. CRM & Customer Loyalty
Building long-term relationships through data.

- **Customer Database**: Detailed profiles with order history, active credits, and preferences.
- **Loyalty Program**: Automatic points accumulation and tier-based benefits.
- **Public Order Tracking**: Secure link shared via WhatsApp/SMS for customers to track their laundry without login.
- **Profile Management**: Customers can update their addresses and contact details through a dedicated portal.

## 🏭 5. Factory & Inventory Management
Optimizing the operational backend.

- **Franchise Management**: Multi-location support with dedicated store and factory manager roles.
- **Service Definitions**: Granular control over pricing, duration, and status of global laundry services.
- **Inventory Tracking**: Stock management for detergents, packaging, and shop consumables.
- **Employee Management**: Comprehensive HR module tracking position, salary, and performance ratings.

## 💬 6. Automated Communications
Automated touchpoints throughout the customer journey.

- **WhatsApp Service**: Powered by Msg91 for automated invoices and status updates.
- **PDF Invoice Engine**: Professional, high-quality invoices generated on request and stored in Cloudflare R2.
- **Email Notifications**: Fallback for order confirmations and critical system alerts.

## 📊 7. Business Intelligence (BI)
Data-driven decision making.

- **Analytics Dashboard**: Real-time revenue, order count, and active customer trends.
- **Performance Metrics**: Automated monthly computation of key performance indicators (KPIs).
- **SQLite Analytics**: Hybrid engine using a local SQLite cache for ultra-fast reporting without hitting the main DB.
- **Audit Logs**: Full system transparency tracking every action performed by employees.
