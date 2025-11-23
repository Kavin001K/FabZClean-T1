from flask import Blueprint, request
from ...extensions import db
from ...models.service import Service
from ...models.customer import Customer
from ...models.order import Order
from ...utils.responses import success_response, error_response
from ...admin.routes import admin_required
from ...utils.security import hash_password

bp = Blueprint("admin_api", __name__)

@bp.route("/services", methods=["GET"])
@admin_required
def list_services():
    """List all services (admin)."""
    services = Service.query.all()
    return success_response([s.to_dict() for s in services], "Services retrieved")

@bp.route("/services", methods=["POST"])
@admin_required
def create_service():
    """Create service (admin)."""
    data = request.get_json()
    
    service = Service(
        name=data.get("name"),
        price=data.get("price", 0),
        duration_minutes=data.get("duration_minutes"),
        status=data.get("status", "active")
    )
    
    db.session.add(service)
    db.session.commit()
    
    return success_response(service.to_dict(), "Service created", 201)

@bp.route("/services/<int:service_id>", methods=["PUT"])
@admin_required
def update_service(service_id):
    """Update service (admin)."""
    service = Service.query.get(service_id)
    if not service:
        return error_response("Service not found", 404)
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(service, key):
            setattr(service, key, value)
    
    db.session.commit()
    return success_response(service.to_dict(), "Updated")

@bp.route("/services/<int:service_id>", methods=["DELETE"])
@admin_required
def delete_service(service_id):
    """Delete service (admin)."""
    service = Service.query.get(service_id)
    if not service:
        return error_response("Service not found", 404)
    
    db.session.delete(service)
    db.session.commit()
    return success_response(None, "Service deleted")

@bp.route("/customers", methods=["GET"])
@admin_required
def list_customers():
    """List all customers (admin)."""
    customers = Customer.query.all()
    return success_response([c.to_dict() for c in customers], "Customers retrieved")

@bp.route("/customers", methods=["POST"])
@admin_required
def create_customer():
    """Create customer (admin) - legacy: default password 'password'."""
    data = request.get_json()
    
    # Legacy: Default password is "password"
    password = data.get("password", "password")
    
    customer = Customer(
        name=data.get("name"),
        email=data.get("email"),
        phone=data.get("phone"),
        password_hash=hash_password(password),
        is_active=True
    )
    
    db.session.add(customer)
    db.session.commit()
    
    return success_response(customer.to_dict(), "Customer created", 201)

@bp.route("/orders", methods=["GET"])
@admin_required
def list_orders():
    """List all orders (admin)."""
    orders = Order.query.all()
    return success_response([o.to_dict() for o in orders], "Orders retrieved")

