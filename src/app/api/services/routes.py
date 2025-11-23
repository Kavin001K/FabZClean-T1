from flask import Blueprint, request, jsonify
from ...extensions import db
from ...models.service import Service
from flask_jwt_extended import jwt_required

bp = Blueprint("services", __name__)

@bp.route("/", methods=["GET"])
def list_services():
    """List all active services (public)."""
    services = Service.query.filter_by(status="active").all()
    out = [{
        "id": s.id,
        "name": s.name,
        "price": float(s.price),
        "duration_minutes": s.duration_minutes
    } for s in services]
    return jsonify(out)

@bp.route("/<int:service_id>", methods=["GET"])
def get_service(service_id):
    """Get single service (public)."""
    service = Service.query.get_or_404(service_id)
    return jsonify({
        "id": service.id,
        "name": service.name,
        "price": float(service.price),
        "duration_minutes": service.duration_minutes,
        "status": service.status
    })

@bp.route("/", methods=["POST"])
@jwt_required()  # TODO: Add admin role check
def create_service():
    """Create service (admin only)."""
    data = request.get_json() or {}
    
    if not data.get("name") or data.get("price") is None:
        return jsonify(msg="Missing fields"), 400
    
    s = Service(
        name=data["name"],
        price=data["price"],
        duration_minutes=data.get("duration_minutes"),
        status=data.get("status", "active")
    )
    
    db.session.add(s)
    db.session.commit()
    
    return jsonify(id=s.id, name=s.name), 201

@bp.route("/<int:service_id>", methods=["PUT"])
@jwt_required()  # TODO: Add admin role check
def update_service(service_id):
    """Update service (admin only)."""
    service = Service.query.get_or_404(service_id)
    data = request.get_json() or {}
    
    if "name" in data:
        service.name = data["name"]
    if "price" in data:
        service.price = data["price"]
    if "duration_minutes" in data:
        service.duration_minutes = data["duration_minutes"]
    if "status" in data:
        service.status = data["status"]
    
    db.session.commit()
    return jsonify(msg="Updated", service={"id": service.id, "name": service.name})

@bp.route("/<int:service_id>", methods=["DELETE"])
@jwt_required()  # TODO: Add admin role check
def delete_service(service_id):
    """Delete service (admin only)."""
    service = Service.query.get_or_404(service_id)
    db.session.delete(service)
    db.session.commit()
    return jsonify(msg="Deleted")
