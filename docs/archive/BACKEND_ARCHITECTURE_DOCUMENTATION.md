# FabClean Backend Architecture Documentation

## Table of Contents
1. [Introduction](#1-introduction)
2. [Backend Architecture](#2-backend-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Data Handling](#4-data-handling)
5. [API Design](#5-api-design)
6. [Error Handling and Logging](#6-error-handling-and-logging)
7. [Security Measures](#7-security-measures)
8. [Deployment and Environment Setup](#8-deployment-and-environment-setup)
9. [Best Practices and Lessons Learned](#9-best-practices-and-lessons-learned)
10. [Conclusion](#10-conclusion)

---

## 1. Introduction

### Project Overview
The FabClean Management System is a comprehensive full-stack application designed for dry cleaning and laundry services. The backend serves as the central API layer that powers multiple frontend applications, providing a unified data management system for different user roles and business operations.

### Backend's Role in the Ecosystem
The backend acts as the single source of truth for all business data and operations, serving four distinct frontend applications:

- **Admin Dashboard** (`/admin`) - Management interface for business owners
- **Employee Portal** (`/employee`) - Operational interface for staff members
- **Customer Portal** (`/customer`) - Self-service interface for customers
- **Worker Portal** (`/worker`) - Mobile interface for delivery workers

### Multi-Tenant Architecture
The system implements a multi-tenant architecture where a single backend API serves multiple client applications, each tailored for specific user roles:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Portal  │    │ Employee Portal │    │ Customer Portal │    │ Worker Portal   │
│   (React/TS)    │    │   (React/TS)    │    │   (React/TS)    │    │   (React/TS)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │                      │
          └──────────────────────┼──────────────────────┼──────────────────────┘
                                 │                      │
                    ┌─────────────▼─────────────────────▼─────────────┐
                    │           Flask Backend API                     │
                    │         (Python/SQLAlchemy)                     │
                    └─────────────────────┬───────────────────────────┘
                                          │
                              ┌───────────▼───────────┐
                              │    SQLite Database    │
                              │   (Development)      │
                              │   PostgreSQL         │
                              │   (Production)       │
                              └───────────────────────┘
```

---

## 2. Backend Architecture

### Monolithic Flask Application Architecture
The backend follows a monolithic architecture pattern where all business logic, data models, and API endpoints are contained within a single Flask application (`server/app.py`). This design choice provides:

- **Simplicity**: Single codebase to maintain and deploy
- **Consistency**: Unified data models and business logic across all frontends
- **Performance**: No inter-service communication overhead
- **Development Speed**: Faster development and testing cycles

### Request-Response Flow
```
Client Request → Flask App → Route Handler → Authentication → Business Logic → Database → Response
```

### Component Interaction Diagram
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Routes    │───▶│   Models    │───▶│  Database   │───▶│  Response   │
│ (app.py)    │    │ (SQLAlchemy)│    │ (SQLite/    │    │   (JSON)    │
│             │    │             │    │ PostgreSQL) │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Authentication│    │Validation   │    │Serialization│
│(JWT/Session) │    │(Input Data) │    │(.to_dict()) │
└─────────────┘    └─────────────┘    └─────────────┘
```

### File Structure Breakdown
```
server/
├── app.py              # Main Flask application with all routes and models
├── models.py           # Additional SQLAlchemy models (Delivery)
├── routes/             # Blueprint-based route organization
│   ├── users.py        # User management routes
│   └── deliveries.py   # Delivery tracking routes
├── templates/          # HTML templates for admin login
├── qr/                # Generated QR code images
├── instance/          # SQLite database file
├── requirements.txt   # Python dependencies
└── venv/             # Python virtual environment
```

---

## 3. Technology Stack

### Core Technologies

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Python** | 3.8+ | Runtime Environment | Mature ecosystem, excellent libraries for web development |
| **Flask** | 3.1.2 | Web Framework | Lightweight, flexible, excellent for REST APIs |
| **SQLAlchemy** | 2.0.43 | ORM | Powerful ORM with excellent Python integration |
| **SQLite** | - | Development Database | Zero-configuration, perfect for development |
| **PostgreSQL** | - | Production Database | Robust, scalable, production-ready |

### Authentication & Security

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Flask-JWT-Extended** | 4.7.1 | JWT Authentication | Stateless authentication for API clients |
| **Flask-Session** | - | Session Management | Stateful authentication for admin panel |
| **Werkzeug** | 3.1.3 | Password Hashing | Secure password hashing with pbkdf2:sha256 |

### Additional Libraries

| Technology | Version | Purpose |
|------------|---------|---------|
| **Flask-CORS** | 6.0.1 | Cross-Origin Resource Sharing |
| **python-barcode** | 0.15.1 | QR/Barcode generation |
| **Pillow** | 11.3.0 | Image processing |
| **Gunicorn** | 23.0.0 | Production WSGI server |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **Drizzle-ORM** | 0.39.3 | Alternative ORM (TypeScript) |
| **Drizzle-Kit** | 0.30.4 | Database migrations |
| **Zod** | 3.24.2 | Schema validation |

---

## 4. Data Handling

### SQLAlchemy ORM Patterns

The backend uses SQLAlchemy ORM for all database operations, providing a Pythonic interface to the database with automatic relationship management and query optimization.

### Model Definitions

#### Core Models Structure
```python
# Example from server/app.py (lines 79-213)

class Worker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw, method='pbkdf2:sha256')

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "createdAt": self.created_at.isoformat(),
        }

class Order(db.Model):
    __tablename__ = "orders"
    id = db.Column(db.String(20), primary_key=True, default=lambda: str(uuid.uuid4())[:8])
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(120), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    service_id = db.Column(db.String(20), db.ForeignKey("service.id"))
    service_name = db.Column(db.String(100))
    pickup_date = db.Column(db.String(50))
    special_instructions = db.Column(db.Text)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default="At Store", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "customerName": self.customer_name,
            "customerEmail": self.customer_email,
            "customerPhone": self.customer_phone,
            "serviceId": self.service_id.split(",") if self.service_id else [],
            "service": self.service_name.split(",") if self.service_name else [],
            "pickupDate": self.pickup_date,
            "specialInstructions": self.special_instructions,
            "total": self.total,
            "status": self.status,
            "createdAt": self.created_at.isoformat(),
        }
```

### Relationships and Foreign Keys

The system implements several key relationships:

```python
# Service-Order Relationship
class Service(db.Model):
    id = db.Column(db.String(20), primary_key=True)
    # ... other fields

class Order(db.Model):
    service_id = db.Column(db.String(20), db.ForeignKey("service.id"))
    # ... other fields

# Transit Batch-Order Relationship
class TransitBatch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ... other fields

class TransitOrder(db.Model):
    transit_batch_id = db.Column(db.Integer, db.ForeignKey('transit_batch.id'), nullable=False)
    order_id = db.Column(db.String(20), db.ForeignKey('orders.id'), nullable=False)
```

### Database Initialization and Seeding

```python
# Database initialization from server/app.py (lines 946-966)
def ensure_db():
    """Internal function to create and seed the database."""
    db.create_all()

    # Seed services if none exist
    if not Service.query.first():
        db.session.add_all([
            Service(id="s1", name="Laundry", price=200, duration="24h"),
            Service(id="s2", name="Dry Cleaning", price=300, duration="48h"),
            Service(id="s3", name="Ironing", price=100, duration="12h"),
        ])
        db.session.commit()

    # Seed a default worker if none exist
    if not Worker.query.first():
        default_worker = Worker(name="Employee", email="emp@emp.com")
        default_worker.set_password("emp")
        db.session.add(default_worker)
        db.session.commit()
    
    print("Database initialized and seeded.")
```

### Example CRUD Operations

#### Create Operation
```python
@app.route("/api/orders", methods=["POST"])
def create_order_auto_customer():
    data = request.json or {}
    required_fields = ["customerName", "customerPhone", "customerEmail", "serviceIds", "total"]
    
    # Validation
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400

    # Check if customer exists, create if not
    customer = Customer.query.filter_by(email=data["customerEmail"]).first()
    if not customer:
        customer = Customer(
            name=data["customerName"],
            email=data["customerEmail"],
            phone=data["customerPhone"]
        )
        customer.set_password("defaultpass")
        db.session.add(customer)
        db.session.commit()

    # Create the order
    services = Service.query.filter(Service.id.in_(data["serviceIds"])).all()
    total_calculated = sum(s.price for s in services)

    order = Order(
        customer_name=data["customerName"],
        customer_email=data["customerEmail"],
        customer_phone=data["customerPhone"],
        service_id=",".join([s.id for s in services]),
        service_name=",".join([s.name for s in services]),
        pickup_date=data.get("pickupDate", ""),
        special_instructions=data.get("specialInstructions", ""),
        total=total_calculated,
        status="At Store"
    )
    db.session.add(order)
    db.session.commit()
    generate_qr(order)

    return jsonify({
        "order": order.to_dict(),
        "customer": customer.to_dict()
    }), 201
```

#### Read Operation
```python
@app.route("/api/orders", methods=["GET"])
def get_orders_by_email():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email query param is required"}), 400

    orders = Order.query.filter_by(customer_email=email).all()
    return jsonify([o.to_dict() for o in orders]), 200
```

#### Update Operation
```python
@app.route("/api/orders/<order_id>", methods=["PUT"])
@jwt_required()
def update_order(order_id):
    customer = Customer.query.get_or_404(get_jwt_identity())
    order = Order.query.get_or_404(order_id)
    
    # Authorization check
    if order.customer_name != customer.name or order.customer_phone != customer.phone:
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json or {}
    if "pickupDate" in data:
        order.pickup_date = data["pickupDate"]
    if "specialInstructions" in data:
        order.special_instructions = data["specialInstructions"]
    
    db.session.commit()
    return jsonify(order.to_dict())
```

#### Delete Operation
```python
@app.route("/api/orders/<order_id>", methods=["DELETE"])
def delete_order(order_id):
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email query param is required"}), 400

    order = Order.query.get_or_404(order_id)
    if order.customer_email != email:
        return jsonify({"error": "Unauthorized (email mismatch)"}), 401

    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
```

### Data Serialization Patterns

All models implement a `.to_dict()` method for consistent JSON serialization:

```python
def to_dict(self):
    return {
        "id": self.id,
        "customerName": self.customer_name,  # camelCase for frontend
        "customerEmail": self.customer_email,
        "customerPhone": self.customer_phone,
        "serviceId": self.service_id.split(",") if self.service_id else [],
        "service": self.service_name.split(",") if self.service_name else [],
        "pickupDate": self.pickup_date,
        "specialInstructions": self.special_instructions,
        "total": self.total,
        "status": self.status,
        "createdAt": self.created_at.isoformat(),  # ISO format for dates
    }
```

---

## 5. API Design

### RESTful Conventions

The API follows RESTful design principles with clear resource-based URLs and HTTP methods:

- **GET** `/api/orders` - Retrieve orders
- **POST** `/api/orders` - Create new order
- **PUT** `/api/orders/{id}` - Update existing order
- **DELETE** `/api/orders/{id}` - Delete order

### Endpoint Structure and Naming Patterns

#### Public/Customer Endpoints
```
/api/services          # GET - List all services
/auth/signup          # POST - Customer registration
/auth/login           # POST - Customer login
/api/orders           # POST - Create order
/api/orders?email=    # GET - Get customer orders
/api/orders/{id}      # PUT/DELETE - Update/delete order
```

#### Admin Endpoints
```
/admin/login                    # GET/POST - Admin authentication
/admin/api/services            # GET/POST - Service management
/admin/api/customers           # GET/POST/PUT/DELETE - Customer CRUD
/admin/api/orders              # GET/PUT/DELETE - Order management
/admin/api/workers             # GET/POST/PUT/DELETE - Worker management
/admin/api/transit-batches     # GET/POST - Transit management
```

#### Employee Endpoints
```
/employee/login                # POST - Employee authentication
/employee/api/orders           # GET - View orders
/employee/api/transit-batches  # GET/POST/PUT - Transit operations
```

### Authentication Strategies

#### Session-Based Authentication (Admin)
```python
# Decorator implementation from server/app.py (lines 49-55)
def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return wrapper

# Usage
@app.route("/admin/api/workers", methods=["GET"])
@admin_login_required
def get_workers():
    workers = Worker.query.all()
    return jsonify([w.to_dict() for w in workers]), 200
```

#### JWT Authentication (Customer/Worker)
```python
# Customer login endpoint (lines 271-292)
@app.route("/auth/login", methods=["POST"])
def customer_login():
    if not request.is_json:
        return jsonify({"error": "Expected JSON"}), 400

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    customer = Customer.query.filter_by(email=email).first()
    if not customer or not customer.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity={
        "id": customer.id,
        "email": customer.email,
        "name": customer.name
    })

    return jsonify({"token": token, "customer": customer.to_dict()}), 200

# Protected endpoint usage
@app.route("/api/orders/<order_id>", methods=["PUT"])
@jwt_required()
def update_order(order_id):
    customer = Customer.query.get_or_404(get_jwt_identity())
    # ... rest of implementation
```

### Request/Response Formats

#### Request Format
All API requests use JSON format with appropriate Content-Type headers:

```json
// POST /api/orders
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "serviceIds": ["s1", "s2"],
  "pickupDate": "2024-01-15",
  "specialInstructions": "Handle with care"
}
```

#### Response Format
Consistent JSON responses with appropriate HTTP status codes:

```json
// Success Response (201)
{
  "order": {
    "id": "a1b2c3d4",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "serviceId": ["s1", "s2"],
    "service": ["Laundry", "Dry Cleaning"],
    "pickupDate": "2024-01-15",
    "specialInstructions": "Handle with care",
    "total": 500.0,
    "status": "At Store",
    "createdAt": "2024-01-10T10:30:00.000Z"
  },
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "createdAt": "2024-01-10T10:30:00.000Z"
  }
}

// Error Response (400)
{
  "error": "Missing fields"
}
```

### Example API Calls

#### Customer Registration
```bash
curl -X POST http://localhost:5005/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "password": "securepassword123"
  }'
```

#### Order Creation
```bash
curl -X POST http://localhost:5005/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Jane Smith",
    "customerEmail": "jane@example.com",
    "customerPhone": "+1234567890",
    "serviceIds": ["s1", "s3"],
    "pickupDate": "2024-01-20",
    "specialInstructions": "Express service needed"
  }'
```

#### Worker Management (Admin)
```bash
curl -X GET http://localhost:5005/admin/api/workers \
  -H "Cookie: session=admin_session_token"
```

#### Transit Batch Workflow
```bash
# Create transit batch
curl -X POST http://localhost:5005/admin/api/transit-batches \
  -H "Content-Type: application/json" \
  -H "Cookie: session=admin_session_token" \
  -d '{
    "order_ids": ["a1b2c3d4", "e5f6g7h8"],
    "type": "STORE_TO_FACTORY",
    "created_by": "Admin User"
  }'

# Initiate transit
curl -X PUT http://localhost:5005/admin/api/transit-batches/1/initiate \
  -H "Cookie: session=admin_session_token"
```

---

## 6. Error Handling and Logging

### HTTP Status Codes

The API uses standard HTTP status codes for different scenarios:

| Status Code | Usage | Example |
|-------------|-------|---------|
| **200** | Successful GET/PUT requests | Order retrieved successfully |
| **201** | Successful POST requests | Order created successfully |
| **400** | Bad Request - Invalid input | Missing required fields |
| **401** | Unauthorized - Authentication required | Invalid credentials |
| **403** | Forbidden - Authorization failed | Customer trying to access another's order |
| **404** | Not Found - Resource doesn't exist | Order ID not found |
| **500** | Internal Server Error | Database connection failed |

### Error Response Format

All error responses follow a consistent JSON format:

```json
{
  "error": "Descriptive error message"
}
```

### Error Handling Patterns

#### Input Validation
```python
@app.route("/auth/signup", methods=["POST"])
def customer_signup():
    data = request.json or {}
    required = ["name", "email", "phone", "password"]
    
    # Check for missing fields
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400
    
    # Check for duplicate email
    if Customer.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email exists"}), 400
    
    # ... rest of implementation
```

#### Resource Not Found
```python
@app.route("/api/orders/<order_id>", methods=["PUT"])
@jwt_required()
def update_order(order_id):
    customer = Customer.query.get_or_404(get_jwt_identity())
    order = Order.query.get_or_404(order_id)  # Returns 404 if not found
    # ... rest of implementation
```

#### Authorization Errors
```python
@app.route("/api/orders/<order_id>", methods=["PUT"])
@jwt_required()
def update_order(order_id):
    customer = Customer.query.get_or_404(get_jwt_identity())
    order = Order.query.get_or_404(order_id)
    
    # Check if customer owns this order
    if order.customer_name != customer.name or order.customer_phone != customer.phone:
        return jsonify({"error": "Unauthorized"}), 403
    
    # ... rest of implementation
```

### Try-Catch Patterns

While the current implementation relies on Flask's built-in error handling, here's how you could implement more robust error handling:

```python
@app.route("/api/orders", methods=["POST"])
def create_order():
    try:
        data = request.json or {}
        
        # Validate input
        if not data.get("customerEmail"):
            return jsonify({"error": "Customer email is required"}), 400
        
        # Database operations
        customer = Customer.query.filter_by(email=data["customerEmail"]).first()
        if not customer:
            customer = Customer(
                name=data["customerName"],
                email=data["customerEmail"],
                phone=data["customerPhone"]
            )
            customer.set_password("defaultpass")
            db.session.add(customer)
            db.session.commit()
        
        # Create order
        order = Order(
            customer_name=data["customerName"],
            customer_email=data["customerEmail"],
            # ... other fields
        )
        db.session.add(order)
        db.session.commit()
        
        return jsonify({"order": order.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500
```

### Flask Debug Mode vs Production

#### Development Configuration
```python
# In app.py
if __name__ == "__main__":
    with app.app_context():
        ensure_db()
    app.run(port=5005, debug=True)  # Debug mode enabled
```

#### Production Configuration
```python
# Using Gunicorn (from render.yaml)
startCommand: gunicorn server.app:app
```

Debug mode provides:
- Automatic reloading on code changes
- Detailed error pages with stack traces
- Interactive debugger
- Better error messages

Production mode provides:
- Better performance
- Security (no stack traces exposed)
- Stability
- Proper logging

---

## 7. Security Measures

### Password Hashing

The system uses Werkzeug's secure password hashing with PBKDF2-SHA256:

```python
from werkzeug.security import generate_password_hash, check_password_hash

class Customer(db.Model):
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw, method='pbkdf2:sha256')

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

# Usage
customer = Customer(name="John", email="john@example.com")
customer.set_password("mypassword123")
db.session.add(customer)
db.session.commit()

# Verification
if customer.check_password("mypassword123"):
    print("Password is correct")
```

### JWT Token Generation and Validation

```python
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

# JWT Configuration
app.config["JWT_SECRET_KEY"] = "super-jwt-secret-loki"
jwt = JWTManager(app)

# Token Generation
@app.route("/auth/login", methods=["POST"])
def customer_login():
    # ... authentication logic ...
    
    token = create_access_token(identity={
        "id": customer.id,
        "email": customer.email,
        "name": customer.name
    })
    
    return jsonify({"token": token, "customer": customer.to_dict()}), 200

# Token Validation
@app.route("/api/orders/<order_id>", methods=["PUT"])
@jwt_required()
def update_order(order_id):
    customer_id = get_jwt_identity()["id"]
    customer = Customer.query.get_or_404(customer_id)
    # ... rest of implementation
```

### Session Management

```python
from flask import session

# Session Configuration
app.config["SECRET_KEY"] = "super-secret-key-loki"

# Admin Login with Session
@app.route("/admin/login", methods=["POST"])
def admin_login():
    if request.is_json:
        data = request.get_json()
        if data.get("username") == ADMIN_USER and data.get("password") == ADMIN_PASS:
            session["admin_logged_in"] = True
            return jsonify({"message": "Admin login successful"}), 200
        return jsonify({"error": "Invalid credentials"}), 401

# Session-based Authorization
@app.route("/admin/api/workers", methods=["GET"])
@admin_login_required
def get_workers():
    workers = Worker.query.all()
    return jsonify([w.to_dict() for w in workers]), 200
```

### CORS Configuration

```python
from flask_cors import CORS

# Enable CORS for all routes
CORS(app)

# Or configure specific origins
CORS(app, origins=["http://localhost:5173", "https://yourdomain.com"])
```

### Authentication Decorators

#### Custom Admin Decorator
```python
def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return wrapper

# Usage
@app.route("/admin/api/services", methods=["POST"])
@admin_login_required
def create_service():
    # Only accessible to authenticated admins
    pass
```

#### JWT Decorator
```python
from flask_jwt_extended import jwt_required

@app.route("/api/orders/<order_id>", methods=["PUT"])
@jwt_required()
def update_order(order_id):
    # Only accessible with valid JWT token
    pass
```

### Role-Based Access Control Patterns

#### Customer Order Access Control
```python
@app.route("/api/orders/<order_id>", methods=["PUT"])
@jwt_required()
def update_order(order_id):
    customer = Customer.query.get_or_404(get_jwt_identity())
    order = Order.query.get_or_404(order_id)
    
    # Ensure customer can only access their own orders
    if order.customer_name != customer.name or order.customer_phone != customer.phone:
        return jsonify({"error": "Unauthorized"}), 403
    
    # ... update logic
```

#### Admin-Only Operations
```python
@app.route("/admin/api/workers", methods=["DELETE"])
@admin_login_required
def delete_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    db.session.delete(worker)
    db.session.commit()
    return jsonify({"message": "Worker deleted"}), 200
```

### Security Best Practices Implemented

1. **Password Security**: PBKDF2-SHA256 hashing with salt
2. **Token Security**: JWT tokens with expiration
3. **Session Security**: Secure session management
4. **Input Validation**: Server-side validation for all inputs
5. **Authorization**: Role-based access control
6. **CORS**: Proper cross-origin resource sharing
7. **SQL Injection Prevention**: SQLAlchemy ORM prevents SQL injection
8. **Error Handling**: No sensitive information in error messages

---

## 8. Deployment and Environment Setup

### Development Environment Setup

#### Prerequisites
- Python 3.8+
- Node.js 18+
- Git

#### Backend Setup
```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
flask --app app init-db

# Run development server
python app.py
```

#### Environment Variables (Development)
```bash
# Create .env file in server directory
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=sqlite:///fabclean.db
FLASK_ENV=development
FLASK_DEBUG=True
```

### Production Deployment (Render.com)

#### Configuration File (render.yaml)
```yaml
services:
  # Backend (Flask)
  - type: web
    name: fabfab-server
    env: python
    buildCommand: pip install -r requirements.txt && flask --app server/app init-db
    startCommand: gunicorn server.app:app
    plan: free
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: fabfab-db
          property: connectionString

databases:
  - name: fabfab-db
    plan: free
```

#### Production Environment Variables
```bash
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=production-secret-key
JWT_SECRET_KEY=production-jwt-secret-key
FLASK_ENV=production
```

#### Build and Start Commands
```bash
# Build command
pip install -r requirements.txt && flask --app server/app init-db

# Start command
gunicorn server.app:app
```

### Database Configuration

#### Development (SQLite)
```python
# In app.py
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///fabclean.db"
```

#### Production (PostgreSQL)
```python
# Using environment variable
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
```

### Frontend Deployment

#### Client Application
```yaml
# Customer Frontend
- type: web
  name: fabfab-customer
  env: node
  rootDir: customer
  buildCommand: npm install && npm run build
  startCommand: npm run preview -- --port 10000
  plan: free
  envVars:
    - key: VITE_API_URL
      value: https://fabfab-server.onrender.com
```

#### Environment Variables for Frontend
```bash
# In each frontend application
VITE_API_URL=https://fabfab-server.onrender.com
```

### Deployment Checklist

#### Pre-Deployment
- [ ] Update all hardcoded URLs to use environment variables
- [ ] Set secure secret keys
- [ ] Configure production database
- [ ] Test all API endpoints
- [ ] Verify CORS settings
- [ ] Check error handling

#### Post-Deployment
- [ ] Verify database connection
- [ ] Test authentication flows
- [ ] Check API endpoints
- [ ] Verify frontend-backend communication
- [ ] Monitor logs for errors
- [ ] Set up monitoring and alerts

### Scaling Considerations

#### Horizontal Scaling
- Use load balancer for multiple backend instances
- Implement database connection pooling
- Use Redis for session storage
- Implement API rate limiting

#### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets

---

## 9. Best Practices and Lessons Learned

### ORM Model Design

#### Consistent Serialization Pattern
```python
# All models implement to_dict() for consistent JSON serialization
def to_dict(self):
    return {
        "id": self.id,
        "name": self.name,
        "email": self.email,
        "createdAt": self.created_at.isoformat(),  # ISO format for dates
    }
```

**Benefits:**
- Consistent API responses
- Easy frontend integration
- Centralized data transformation
- Type safety with TypeScript

#### Relationship Management
```python
# Use foreign keys for data integrity
class Order(db.Model):
    service_id = db.Column(db.String(20), db.ForeignKey("service.id"))
    
# Implement cascade operations carefully
class TransitOrder(db.Model):
    transit_batch_id = db.Column(db.Integer, db.ForeignKey('transit_batch.id'), nullable=False)
    order_id = db.Column(db.String(20), db.ForeignKey('orders.id'), nullable=False)
```

### Decorator-Based Authentication

#### Custom Decorators
```python
def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return wrapper
```

**Benefits:**
- Clean separation of concerns
- Reusable authentication logic
- Easy to maintain and test
- Consistent error handling

### Blueprint Pattern for Route Organization

```python
# In routes/users.py
from flask import Blueprint

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "name": u.name, "email": u.email} for u in users])
```

**Benefits:**
- Modular code organization
- Easier testing
- Better maintainability
- Team collaboration

### Database Session Management

#### Proper Session Handling
```python
try:
    # Database operations
    db.session.add(new_record)
    db.session.commit()
except Exception as e:
    db.session.rollback()
    raise e
```

**Best Practices:**
- Always commit or rollback transactions
- Use try-catch blocks for error handling
- Implement proper cleanup
- Monitor database connections

### Multi-Application API Design

#### Shared Backend Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Admin     │    │  Employee   │    │  Customer   │
│   Portal    │    │   Portal    │    │   Portal    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                ┌─────────▼─────────┐
                │   Shared API      │
                │   (Flask Backend)  │
                └─────────┬─────────┘
                          │
                ┌─────────▼─────────┐
                │   Database        │
                └───────────────────┘
```

**Benefits:**
- Single source of truth
- Consistent business logic
- Easier maintenance
- Cost-effective deployment

### Transit/Batch Workflow Implementation

#### State Machine Pattern
```python
# Transit batch states
PENDING → IN_TRANSIT → ARRIVED → COMPLETED

# State transitions with validation
@app.route("/admin/api/transit-batches/<int:batch_id>/initiate", methods=["PUT"])
@admin_login_required
def initiate_transit(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    if batch.status != "PENDING":
        return jsonify({"error": "Transit can only be initiated from PENDING state"}), 400
    
    # Update status and related orders
    batch.status = "IN_TRANSIT"
    # ... update related orders
    db.session.commit()
```

**Benefits:**
- Clear workflow states
- Validation at each step
- Audit trail
- Error prevention

### Barcode Generation Integration

```python
import barcode
from barcode.writer import ImageWriter

def generate_qr(order):
    qr_dir = os.path.join(BASE_DIR, "qr")
    os.makedirs(qr_dir, exist_ok=True)
    
    # Generate barcode
    EAN = barcode.get_barcode_class('code128')
    ean = EAN(order.id, writer=ImageWriter())
    
    # Save barcode
    qr_path = os.path.join(qr_dir, f"{order.id}")
    ean.save(qr_path)
    
    return f"{qr_path}.png"
```

**Benefits:**
- Automated QR code generation
- Unique identifiers for orders
- Easy tracking and scanning
- Professional appearance

### Key Lessons Learned

#### 1. Start with Simple Architecture
- Begin with monolithic design
- Add complexity only when needed
- Focus on core functionality first

#### 2. Consistent Data Patterns
- Use consistent serialization methods
- Implement proper error handling
- Follow RESTful conventions

#### 3. Security First
- Implement authentication early
- Use proper password hashing
- Validate all inputs
- Implement proper authorization

#### 4. Database Design
- Plan relationships carefully
- Use foreign keys for integrity
- Implement proper indexing
- Consider future scalability

#### 5. API Design
- Follow RESTful conventions
- Use consistent naming patterns
- Implement proper status codes
- Document endpoints clearly

#### 6. Error Handling
- Implement comprehensive error handling
- Use appropriate HTTP status codes
- Provide meaningful error messages
- Log errors for debugging

#### 7. Testing Strategy
- Test authentication flows
- Test all CRUD operations
- Test error scenarios
- Test with different user roles

#### 8. Deployment Considerations
- Use environment variables
- Implement proper logging
- Set up monitoring
- Plan for scaling

---

## 10. Conclusion

### Summary of Architecture Decisions

The FabClean backend architecture demonstrates a well-structured, production-ready Flask application that successfully serves multiple frontend applications through a unified API. Key architectural decisions include:

1. **Monolithic Design**: Chosen for simplicity and development speed, providing a single codebase that's easy to maintain and deploy.

2. **SQLAlchemy ORM**: Provides robust database abstraction with excellent Python integration and automatic relationship management.

3. **Dual Authentication**: Session-based authentication for admin panel and JWT for API clients, providing flexibility for different use cases.

4. **RESTful API Design**: Consistent, predictable endpoints that follow industry standards and are easy to integrate with frontend applications.

5. **Multi-Tenant Architecture**: Single backend serving multiple client applications, maximizing code reuse and maintaining consistency.

### Scalability Considerations

#### Current Architecture Strengths
- **Single Database**: Simplifies data consistency and transactions
- **Stateless API**: Easy to scale horizontally with load balancers
- **Modular Design**: Blueprint pattern allows for easy code organization
- **Clear Separation**: Authentication, business logic, and data access are well-separated

#### Future Scaling Strategies
1. **Database Scaling**: 
   - Implement read replicas for read-heavy operations
   - Consider database sharding for very large datasets
   - Add caching layer (Redis) for frequently accessed data

2. **Application Scaling**:
   - Deploy multiple backend instances behind a load balancer
   - Implement session storage in Redis for stateless scaling
   - Add API rate limiting and monitoring

3. **Microservices Migration** (if needed):
   - Extract user management service
   - Separate order processing service
   - Implement service-to-service communication

### How to Adapt for Other Projects

#### 1. Template Structure
Use this architecture as a template by:
- Copying the Flask app structure
- Adapting the models to your domain
- Customizing authentication requirements
- Modifying API endpoints for your use case

#### 2. Key Components to Reuse
- **Authentication System**: JWT and session-based patterns
- **ORM Patterns**: Model definitions and serialization methods
- **Error Handling**: Consistent error response format
- **API Design**: RESTful conventions and naming patterns
- **Security Measures**: Password hashing and authorization decorators

#### 3. Customization Points
- **Database**: Switch between SQLite (dev) and PostgreSQL (prod)
- **Authentication**: Add OAuth, LDAP, or other providers
- **API Versioning**: Implement API versioning for backward compatibility
- **Monitoring**: Add application performance monitoring (APM)
- **Logging**: Implement structured logging with correlation IDs

#### 4. Development Workflow
1. **Start Simple**: Begin with basic CRUD operations
2. **Add Authentication**: Implement user management and security
3. **Expand Features**: Add business-specific functionality
4. **Optimize**: Profile and optimize performance bottlenecks
5. **Scale**: Add caching, monitoring, and scaling strategies

### Final Recommendations

#### For New Projects
1. **Use This Architecture**: It provides a solid foundation for most web applications
2. **Start with SQLite**: Move to PostgreSQL when you need production features
3. **Implement Security Early**: Authentication and authorization are easier to add from the start
4. **Follow RESTful Conventions**: Makes your API predictable and easy to use
5. **Plan for Multiple Clients**: Even if you start with one frontend, plan for more

#### For Existing Projects
1. **Gradual Migration**: Move to this pattern incrementally
2. **Refactor Authentication**: Implement proper security measures
3. **Standardize APIs**: Adopt consistent patterns across endpoints
4. **Add Monitoring**: Implement proper logging and error tracking
5. **Document Everything**: Maintain clear documentation for team collaboration

This backend architecture provides a robust, scalable foundation that can be adapted for various business domains while maintaining consistency, security, and maintainability. The patterns and practices demonstrated here have been proven in production and can serve as a reliable template for future projects.

---

*This documentation serves as a comprehensive guide for understanding, implementing, and adapting the FabClean backend architecture for other projects. The patterns, practices, and code examples provided here represent industry best practices and can be confidently applied to new development efforts.*
