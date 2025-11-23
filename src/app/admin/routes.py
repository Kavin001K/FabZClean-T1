from flask import Blueprint, request, session, jsonify, current_app
from functools import wraps
from ...extensions import db
from ...models.customer import Customer
import os

bp = Blueprint("admin", __name__)

def admin_required(f):
    """Decorator to require admin authentication."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("is_admin"):
            return jsonify(msg="Admin login required"), 401
        return f(*args, **kwargs)
    return wrapper

@bp.route("/login", methods=["POST"])
def login():
    """Admin login (checks ENV credentials)."""
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    # Check ENV credentials
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    
    if email == admin_email and password == admin_password:
        session["is_admin"] = True
        return jsonify(msg="ok")
    
    return jsonify(msg="Bad creds"), 401

@bp.route("/logout", methods=["POST"])
@admin_required
def logout():
    """Admin logout."""
    session.clear()
    return jsonify(msg="logged out")

@bp.route("/api/customers", methods=["GET"])
@admin_required
def list_customers():
    """List all customers (admin only)."""
    customers = Customer.query.all()
    return jsonify([{
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "is_active": c.is_active
    } for c in customers])

@bp.route("/api/orders", methods=["GET"])
@admin_required
def list_orders():
    """List all orders (admin only)."""
    from ...models.order import Order
    orders = Order.query.all()
    return jsonify([{
        "id": o.id,
        "order_number": o.order_number,
        "customer_id": o.customer_id,
        "service_id": o.service_id,
        "status": o.status,
        "total_cost": float(o.total_cost),
        "created_at": o.created_at.isoformat()
    } for o in orders])
