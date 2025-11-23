from flask import Blueprint, request, jsonify, current_app
from ...extensions import db, limiter
from ...models.order import Order
from ...models.service import Service
from ...models.customer import Customer
from ...utils.qr import generate_order_qr
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from .schemas import OrderCreateSchema, OrderUpdateSchema
import secrets

bp = Blueprint("orders", __name__)

def gen_order_number():
    """Generate unique order number."""
    return secrets.token_hex(6)

@bp.route("/", methods=["POST"])
@jwt_required()
@limiter.limit("20 per hour")
def create_order():
    """Create order (requires JWT authentication)."""
    try:
        schema = OrderCreateSchema()
        data = schema.load(request.get_json())
    except ValidationError as err:
        return jsonify(msg="Validation error", errors=err.messages), 400
    
    customer_id = get_jwt_identity()
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify(msg="Invalid user"), 401
    
    service = Service.query.get(data["service_id"])
    if not service:
        return jsonify(msg="Invalid service"), 400
    
    order_number = gen_order_number()
    total_cost = float(service.price)
    
    order = Order(
        order_number=order_number,
        customer_id=customer.id,
        service_id=service.id,
        pickup_date=data.get("pickup_date"),
        instructions=data.get("instructions"),
        total_cost=total_cost
    )
    
    db.session.add(order)
    db.session.commit()
    
    # Generate QR code
    payload = {"order_number": order.order_number, "email": customer.email, "service": service.name}
    qr_path = generate_order_qr(order.order_number, payload)
    order.qr_code_path = qr_path
    db.session.commit()
    
    return jsonify(
        id=order.id,
        order_number=order.order_number,
        qr_code_path=order.qr_code_path
    ), 201

@bp.route("/", methods=["GET"])
@jwt_required()
def list_orders():
    """List orders for authenticated customer."""
    customer_id = get_jwt_identity()
    orders = Order.query.filter_by(customer_id=customer_id).all()
    
    out = []
    for o in orders:
        out.append({
            "id": o.id,
            "order_number": o.order_number,
            "service_id": o.service_id,
            "service_name": o.service.name if o.service else None,
            "status": o.status,
            "total_cost": float(o.total_cost),
            "qr_code_path": o.qr_code_path
        })
    
    return jsonify(out)

@bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):
    """Get single order (owner only)."""
    customer_id = get_jwt_identity()
    order = Order.query.get_or_404(order_id)
    
    if order.customer_id != customer_id:
        return jsonify(msg="Forbidden"), 403
    
    return jsonify(order.to_dict())

@bp.route("/<int:order_id>", methods=["PUT"])
@jwt_required()
def update_order(order_id):
    """Update order (owner only)."""
    customer_id = get_jwt_identity()
    order = Order.query.get_or_404(order_id)
    
    if order.customer_id != customer_id:
        return jsonify(msg="Forbidden"), 403
    
    try:
        schema = OrderUpdateSchema()
        data = schema.load(request.get_json(), partial=True)
    except ValidationError as err:
        return jsonify(msg="Validation error", errors=err.messages), 400
    
    if "pickup_date" in data:
        order.pickup_date = data["pickup_date"]
    if "instructions" in data:
        order.instructions = data["instructions"]
    if "status" in data:
        order.status = data["status"]
    
    db.session.commit()
    return jsonify(msg="Updated", order=order.to_dict())

@bp.route("/<int:order_id>", methods=["DELETE"])
@jwt_required()
def delete_order(order_id):
    """Delete order (owner only)."""
    customer_id = get_jwt_identity()
    order = Order.query.get_or_404(order_id)
    
    if order.customer_id != customer_id:
        return jsonify(msg="Forbidden"), 403
    
    db.session.delete(order)
    db.session.commit()
    return jsonify(msg="Deleted")
