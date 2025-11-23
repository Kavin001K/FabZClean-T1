from flask import Blueprint, jsonify
from ...models.track import Track
from flask_jwt_extended import jwt_required

bp = Blueprint("tracks", __name__)

@bp.route("/", methods=["GET"])
@jwt_required()
def list_tracks():
    """List tracks (authenticated users)."""
    tracks = Track.query.order_by(Track.created_at.desc()).limit(200).all()
    return jsonify([{
        "id": t.id,
        "order_id": t.order_id,
        "worker_id": t.worker_id,
        "action": t.action,
        "location": t.location,
        "note": t.note,
        "created_at": t.created_at.isoformat()
    } for t in tracks])

@bp.route("/order/<int:order_id>", methods=["GET"])
@jwt_required()
def get_tracks_by_order(order_id):
    """Get tracks for a specific order."""
    tracks = Track.query.filter_by(order_id=order_id).order_by(Track.created_at.asc()).all()
    return jsonify([{
        "id": t.id,
        "order_id": t.order_id,
        "worker_id": t.worker_id,
        "action": t.action,
        "location": t.location,
        "note": t.note,
        "created_at": t.created_at.isoformat()
    } for t in tracks])
