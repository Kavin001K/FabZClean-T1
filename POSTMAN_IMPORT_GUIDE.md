# Postman Import Guide - FabzClean Modern Backend

## Quick Import Steps

### 1. Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select **FabzClean-Modern-Backend.postman_collection.json**
4. Click **Import**

### 2. Import Environment
1. Click **Import** again
2. Select **FabzClean-Modern-Backend.postman_environment.json**
3. Click **Import**

### 3. Select Environment
1. Click the environment dropdown (top right)
2. Select **"FabzClean Modern Backend Environment"**

### 4. Configure Base URL
1. Click the eye icon next to the environment dropdown
2. Update `base_url` if needed:
   - Local: `http://127.0.0.1:3000`
   - Static IP: `http://YOUR_IP:3000`
   - Production: `https://your-domain.com`

## Collection Structure

### Environment Setup
- **Set Base URL (Manual)** - Health check to verify API is running

### Auth (Customer JWT)
- **Register** - Create new customer account
- **Login** - Authenticate customer (auto-saves tokens)
- **Refresh Token** - Refresh access token
- **Get Profile (me)** - Get current customer profile

### Services
- **List Services (Public)** - Get all active services
- **Create Service (Admin)** - Create new service (requires JWT)

### Orders
- **Create Order (Customer JWT)** - Create new order (requires JWT)
- **List My Orders** - Get customer's orders
- **Update Order** - Update order details
- **Delete Order** - Delete order

### Workers (Token Auth)
- **Register Worker (Admin/Elevated)** - Create worker (auto-saves token)
- **Worker Scan** - Scan QR code and update order status

### Tracks
- **List Tracks (Public/Restricted)** - Get tracking history

### Admin (Session Based)
- **Admin Login** - Admin authentication
- **List Customers** - Get all customers
- **Admin Logout** - End admin session

## Environment Variables

The environment includes these variables:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://127.0.0.1:3000` | API base URL |
| `access_token` | (empty) | JWT access token (auto-set on login) |
| `refresh_token` | (empty) | JWT refresh token (auto-set on login) |
| `worker_token` | (empty) | Worker authentication token (auto-set on register) |
| `admin_session_cookie` | (empty) | Admin session cookie |
| `admin_email` | `admin@example.com` | Admin email (from .env) |
| `admin_password` | `supersecurepassword` | Admin password (from .env) |

## Usage Workflow

### 1. Customer Flow
```
1. Auth → Register (or Login)
2. Tokens are automatically saved
3. Services → List Services (get service_id)
4. Orders → Create Order (with service_id)
5. Orders → List My Orders (verify order)
```

### 2. Worker Flow
```
1. Workers → Register Worker (admin creates worker)
2. Worker token is auto-saved
3. Workers → Worker Scan (use order_number from order)
```

### 3. Admin Flow
```
1. Admin → Admin Login (uses admin_email/admin_password)
2. Admin → List Customers (view all customers)
3. Admin → List Orders (view all orders)
```

## Auto-Save Features

The collection automatically saves:
- **access_token** - After login/register
- **refresh_token** - After login/register
- **worker_token** - After worker registration

These are saved via test scripts in the requests.

## Testing Tips

1. **Start with Health Check** - Verify API is running
2. **Register First** - Create a test account
3. **Login** - Tokens auto-save for subsequent requests
4. **Create Service** - Before creating orders
5. **Create Order** - Use service_id from services list
6. **Worker Scan** - Use order_number from created order

## Troubleshooting

- **401 Unauthorized**: Token expired, use Refresh Token or login again
- **403 Forbidden**: Not authorized (check ownership or admin status)
- **404 Not Found**: Resource doesn't exist (check IDs)
- **400 Bad Request**: Validation error (check request body)
- **500 Server Error**: Check server logs and database

## Notes

- All timestamps use ISO 8601 format
- JWT tokens expire after 15 minutes (configurable)
- Refresh tokens expire after 30 days
- Worker tokens are long-lived until regenerated
- Admin sessions use cookies (managed by Postman)

## Example Request Sequence

```
1. Environment Setup → Set Base URL (Manual)
2. Auth → Register
3. Auth → Login (tokens auto-saved)
4. Services → List Services
5. Services → Create Service
6. Orders → Create Order
7. Orders → List My Orders
8. Workers → Register Worker (worker_token auto-saved)
9. Workers → Worker Scan
10. Tracks → List Tracks
11. Admin → Admin Login
12. Admin → List Customers
```

## Ready to Use! 🚀

Your collection is now ready to test the complete FabzClean Modern Backend API.

