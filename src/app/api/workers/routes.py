from flask import Blueprint, request, jsonify
from functools import wraps
from marshmallow import ValidationError
from ...extensions import db
from ...models.worker import Worker
from ...models.order import Order
from ...models.track import Track
from ...utils.security import hash_password
from .schemas import WorkerSchema, WorkerCreateSchema
import secrets

bp = Blueprint("workers", __name__)
worker_schema = WorkerSchema()
worker_create_schema = WorkerCreateSchema()

def require_worker_token(f):
    """Decorator to require worker token authentication."""
    @wraps(f)
    def decorator(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify(msg="Missing worker token"), 401
        
        token = auth.split(" ", 1)[1]
        worker = Worker.query.filter_by(token=token).first()
        
        if not worker:
            return jsonify(msg="Invalid token"), 401
        
        request.worker = worker
        return f(*args, **kwargs)
    return decorator

@bp.route("/login", methods=["POST"])
def worker_login():
    """Worker login - generates/returns token."""
    data = request.get_json() or {}
    worker_id = data.get("worker_id")
    password = data.get("password")
    
    if not worker_id:
        return jsonify(msg="Missing worker_id"), 400
    
    worker = Worker.query.get(worker_id)
    if not worker:
        return jsonify(msg="Worker not found"), 404
    
    # Generate new token for worker
    token = secrets.token_urlsafe(32)
    worker.token = token
    db.session.commit()
    
    return jsonify({
        "worker_token": token,
        "worker": {
            "id": worker.id,
            "name": worker.name,
            "email": worker.email
        }
    })

@bp.route("/register", methods=["POST"])
@jwt_required()  # only admin or privileged user should create workers; change as needed
def register_worker():
    """Register a new worker (admin only)."""
    data = request.get_json() or {}
    try:
        validated = worker_create_schema.load(data)
    except ValidationError as err:
        return jsonify(err.messages), 400
    
    w = Worker(name=validated["name"], email=validated.get("email"))
    # generate token (for device) - random hex
    w.token = secrets.token_hex(16)
    db.session.add(w)
    db.session.commit()
    return jsonify(worker_schema.dump(w)), 201

@bp.route("/scan", methods=["POST"])
@require_worker_token
def scan():
    """Scan QR code and create track record (requires worker token)."""
    data = request.get_json() or {}
    order_number = data.get("order_number")
    action = data.get("action")
    location = data.get("location")
    note = data.get("note")
    
    if not order_number or not action:
        return jsonify(msg="Missing fields"), 400
    
    order = Order.query.filter_by(order_number=order_number).first()
    if not order:
        return jsonify(msg="Order not found"), 404
    
    track = Track(
        order_id=order.id,
        worker_id=request.worker.id,
        action=action,
        location=location,
        note=note
    )
    
    # Update order status based on action
    if action == "picked_up":
        order.status = "picked_up"
    elif action == "processing":
        order.status = "processing"
    elif action == "completed":
        order.status = "completed"
    elif action == "delivered":
        order.status = "delivered"
    
    db.session.add(track)
    db.session.commit()
    
    return jsonify(
        msg="Scan recorded",
        track={
            "id": track.id,
            "action": track.action,
            "created_at": track.created_at.isoformat()
        }
    )
