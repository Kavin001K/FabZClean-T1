from flask import Blueprint, request, jsonify, current_app
from ...extensions import db, limiter
from ...models.customer import Customer
from ...utils.security import hash_password, verify_password
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity

bp = Blueprint("auth", __name__)

@bp.route("/register", methods=["POST"])
@limiter.limit("10 per minute")
def register():
    """Customer registration endpoint."""
    data = request.get_json() or {}
    required = ["name", "email", "password"]
    
    if not all(k in data for k in required):
        return jsonify(msg="Missing fields"), 400
    
    if Customer.query.filter_by(email=data["email"]).first():
        return jsonify(msg="Email already registered"), 400
    
    user = Customer(
        name=data["name"],
        email=data["email"],
        phone=data.get("phone"),
        password_hash=hash_password(data["password"])
    )
    
    db.session.add(user)
    db.session.commit()
    
    access = create_access_token(identity=user.id)
    refresh = create_refresh_token(identity=user.id)
    
    return jsonify(
        access_token=access,
        refresh_token=refresh,
        customer={"id": user.id, "email": user.email, "name": user.name}
    ), 201

@bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    """Customer login endpoint."""
    data = request.get_json() or {}
    user = Customer.query.filter_by(email=data.get("email")).first()
    
    if not user or not verify_password(user.password_hash, data.get("password", "")):
        return jsonify(msg="Bad credentials"), 401
    
    access = create_access_token(identity=user.id)
    refresh = create_refresh_token(identity=user.id)
    
    return jsonify(
        access_token=access,
        refresh_token=refresh,
        customer={"id": user.id, "email": user.email, "name": user.name}
    )

@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    identity = get_jwt_identity()
    new_access = create_access_token(identity=identity)
    return jsonify(access_token=new_access)

@bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Logout endpoint (client should discard tokens)."""
    return jsonify(msg="Logged out")

@bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """Get current customer profile."""
    customer_id = get_jwt_identity()
    customer = Customer.query.get(customer_id)
    
    if not customer:
        return jsonify(msg="Customer not found"), 404
    
    return jsonify({
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "is_active": customer.is_active
    })
