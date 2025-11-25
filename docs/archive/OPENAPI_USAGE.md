# OpenAPI Specification Usage Guide

## File Created

**`openapi.yaml`** - Complete OpenAPI 3.1 specification for FabzClean Modern Backend

## Quick Start

### 1. View in Swagger UI

```bash
# Install Swagger UI (if not installed)
npm install -g swagger-ui-serve

# Serve the OpenAPI spec
swagger-ui-serve openapi.yaml
```

Or use online Swagger Editor:
- Go to https://editor.swagger.io/
- File → Import File → Select `openapi.yaml`

### 2. View in Redoc

```bash
# Install Redoc CLI
npm install -g redoc-cli

# Generate HTML documentation
redoc-cli build openapi.yaml -o api-docs.html
```

### 3. Import into Postman

1. Open Postman
2. Click **Import**
3. Select **`openapi.yaml`**
4. Postman will automatically create a collection from the spec

### 4. Generate Client SDKs

```bash
# Using OpenAPI Generator
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client

# Or for TypeScript
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/typescript-client
```

## Configuration

### Update Server URL

Replace `{{host}}` in the `servers` section with your actual domain or IP:

```yaml
servers:
  - url: https://api.yourdomain.com
    description: Production
  - url: http://localhost:3000
    description: Local development
```

## Security Schemes

The spec defines three security schemes:

1. **bearerAuth** - JWT tokens for customer endpoints
   - Usage: `Authorization: Bearer <access_token>`

2. **workerToken** - Bearer tokens for worker devices
   - Usage: `Authorization: Bearer <worker_token>`

3. **adminSession** - Session cookies for admin endpoints
   - Usage: Cookie header (set after `/admin/login`)

## Endpoints Covered

### Public Endpoints
- `GET /healthz` - Health check
- `GET /api/v1/services/` - List services

### Customer Authentication
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Customer Profile
- `GET /api/v1/customers/` - Get my profile
- `PUT /api/v1/customers/` - Update my profile
- `GET /api/v1/customers/profile/{customer_id}` - Get customer profile

### Services
- `GET /api/v1/services/` - List services
- `GET /api/v1/services/{service_id}` - Get service
- `POST /api/v1/services/` - Create service (admin)
- `PUT /api/v1/services/{service_id}` - Update service (admin)
- `DELETE /api/v1/services/{service_id}` - Delete service (admin)

### Orders
- `GET /api/v1/orders/` - List my orders
- `POST /api/v1/orders/` - Create order
- `GET /api/v1/orders/{order_id}` - Get order
- `PUT /api/v1/orders/{order_id}` - Update order
- `DELETE /api/v1/orders/{order_id}` - Delete order

### Workers
- `POST /api/v1/workers/register` - Register worker (admin)
- `POST /api/v1/workers/login` - Worker login
- `POST /api/v1/workers/scan` - Scan QR code

### Tracks
- `GET /api/v1/tracks/` - List tracks
- `GET /api/v1/tracks/order/{order_id}` - Get tracks by order

### Admin
- `POST /admin/login` - Admin login
- `POST /admin/logout` - Admin logout
- `GET /admin/api/customers` - List all customers
- `GET /admin/api/orders` - List all orders

## Schema Definitions

All request/response schemas are defined in `components/schemas`:

- `Error` - Standard error response
- `Service` - Service model
- `ServiceCreate` - Service creation payload
- `Customer` - Customer model
- `CustomerRegister` - Customer registration payload
- `AuthResponse` - Authentication response (tokens + customer)
- `Order` - Order model
- `OrderCreate` - Order creation payload
- `Track` - Track model
- `Worker` - Worker model
- `WorkerCreate` - Worker creation payload

## Integration Examples

### Flask Integration

You can use `flasgger` to serve the OpenAPI spec from your Flask app:

```python
from flasgger import Swagger

app = Flask(__name__)
swagger = Swagger(app, template_file='openapi.yaml')
```

### API Documentation

The spec can be used to generate:
- Interactive API documentation (Swagger UI, Redoc)
- Client SDKs (Python, TypeScript, Java, etc.)
- Server stubs
- API testing tools

## Validation

Validate your OpenAPI spec:

```bash
# Using swagger-cli
npm install -g @apidevtools/swagger-cli
swagger-cli validate openapi.yaml

# Or using openapi-cli
npm install -g @redocly/cli
redocly lint openapi.yaml
```

## Notes

- All timestamps use ISO 8601 format (`date-time`)
- JWT tokens expire after 15 minutes (configurable)
- Refresh tokens expire after 30 days
- Worker tokens are long-lived until regenerated
- Admin sessions use cookies (managed by browser/Postman)

## Next Steps

1. **Update Server URL** - Replace `{{host}}` with your actual domain/IP
2. **Test in Swagger UI** - Verify all endpoints are correct
3. **Generate Client SDKs** - Create client libraries for your frontend
4. **Add to CI/CD** - Validate spec in your deployment pipeline
5. **Documentation Site** - Host Redoc/Swagger UI for your team

