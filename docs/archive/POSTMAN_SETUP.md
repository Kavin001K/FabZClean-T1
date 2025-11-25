# Postman Collection Setup Guide

## Import Instructions

1. **Import Collection:**
   - Open Postman
   - Click "Import" button
   - Select `FabZClean_API.postman_collection.json`
   - Collection will appear in your workspace

2. **Import Environment:**
   - Click "Import" again
   - Select `FabZClean_Environment.postman_environment.json`
   - Select the environment from the dropdown (top right)

3. **Configure Environment:**
   - Click the environment dropdown (top right)
   - Select "FabZClean Development"
   - Update `base_url` if your server runs on a different port/host
   - Default: `http://localhost:3000`

## Collection Structure

### Authentication
- **Register Customer** - Creates new customer account, auto-saves tokens
- **Login Customer** - Authenticates customer, auto-saves tokens
- **Refresh Token** - Refreshes access token using refresh token
- **Get Current User (Me)** - Returns authenticated customer profile
- **Logout** - Revokes current token

### Services
- **List Services** - Public endpoint, returns all active services
- **Get Service** - Public endpoint, returns single service details
- **Create Service** - Admin only, creates new service
- **Update Service** - Admin only, updates service
- **Delete Service** - Admin only, deletes service

### Orders
- **Create Order** - Requires JWT, creates new order, auto-saves order_id
- **List My Orders** - Returns authenticated customer's orders
- **Get Order** - Returns single order (owner only)
- **Update Order** - Updates order (owner only)
- **Delete Order** - Deletes order (owner only)

### Customers
- **Get My Profile** - Returns current customer profile
- **Get Customer Profile** - Returns another customer's profile (owner only)
- **Update My Profile** - Updates current customer profile

### Workers
- **Worker Login** - Generates worker token, auto-saves token
- **Register Worker** - Admin only, creates new worker
- **Scan QR Code** - Worker only, scans order and creates track record

### Tracks
- **List Tracks** - Returns all tracks (authenticated)
- **Get Tracks by Order** - Returns tracks for specific order

### Admin
- **Admin Login** - Session-based admin login
- **Admin Logout** - Logs out admin
- **List All Customers** - Admin only, returns all customers
- **List All Orders** - Admin only, returns all orders

### Health Check
- **Health Check** - Public endpoint, checks API and database status

## Usage Workflow

### 1. Customer Flow
1. Run **Register Customer** or **Login Customer**
2. Tokens are automatically saved to environment
3. All subsequent requests use `{{access_token}}` variable
4. Use **Refresh Token** when access token expires

### 2. Order Flow
1. Ensure you're logged in (have access_token)
2. **List Services** to see available services
3. **Create Order** with `service_id` from services list
4. `order_id` and `order_number` are auto-saved
5. Use saved variables in subsequent requests

### 3. Worker Flow
1. Admin creates worker via **Register Worker**
2. Worker uses **Worker Login** with `worker_id`
3. Worker token is auto-saved
4. Use **Scan QR Code** with worker token and order_number

### 4. Admin Flow
1. Use **Admin Login** with credentials from `.env`
2. Session cookie is automatically managed by Postman
3. Access admin endpoints (list customers, orders)

## Environment Variables

The collection uses these environment variables:

- `base_url` - API base URL (default: http://localhost:3000)
- `access_token` - JWT access token (auto-set on login/register)
- `refresh_token` - JWT refresh token (auto-set on login/register)
- `customer_id` - Current customer ID (auto-set on login/register)
- `order_id` - Last created order ID (auto-set on order creation)
- `order_number` - Last created order number (auto-set on order creation)
- `service_id` - Service ID for testing (default: 1)
- `worker_token` - Worker authentication token (auto-set on worker login)
- `worker_id` - Worker ID (auto-set on worker login)

## Testing Tips

1. **Start with Health Check** - Verify API is running
2. **Register/Login First** - Most endpoints require authentication
3. **Create Services** - Before creating orders, ensure services exist
4. **Use Variables** - Collection auto-saves IDs and tokens for chained requests
5. **Check Responses** - All endpoints return JSON with proper status codes

## Example Request Sequence

```
1. Health Check → Verify API is up
2. Register Customer → Get access_token
3. List Services → Get service_id
4. Create Order → Get order_id and order_number
5. List My Orders → Verify order appears
6. Get Order → View order details
7. Worker Login → Get worker_token
8. Scan QR Code → Update order status
9. Get Tracks by Order → View tracking history
```

## Troubleshooting

- **401 Unauthorized**: Token expired, use Refresh Token or login again
- **403 Forbidden**: Not authorized for this resource (check ownership)
- **404 Not Found**: Resource doesn't exist (check IDs)
- **400 Bad Request**: Validation error (check request body format)
- **500 Server Error**: Check server logs and database connection

## Notes

- All timestamps use ISO 8601 format (e.g., "2024-12-25T10:00:00")
- JWT tokens expire after 15 minutes (configurable)
- Refresh tokens expire after 30 days
- Worker tokens are long-lived until regenerated
- Admin sessions use cookies (managed by Postman)

