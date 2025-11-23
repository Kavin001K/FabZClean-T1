# src/app/api/customers/routes.py

from flask import Blueprint, request, jsonify
from ...extensions import db
from ...models.customer import Customer
from .schemas import CustomerSchema, CustomerCreateSchema
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint("customers", __name__)
customer_schema = CustomerSchema()
customer_create_schema = CustomerCreateSchema()

@bp.route("/", methods=["GET"])
@jwt_required()
def me():
    """Return current customer's profile."""
    customer_id = get_jwt_identity()
    customer = Customer.query.get_or_404(customer_id)
    return jsonify(customer_schema.dump(customer))

@bp.route("/profile/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_customer(customer_id):
    """Get another customer's public profile (admin or same user)."""
    current = get_jwt_identity()
    # allow only owner or (future) admin. For now, owner only.
    if current != customer_id:
        return jsonify(msg="Forbidden"), 403
    customer = Customer.query.get_or_404(customer_id)
    return jsonify(customer_schema.dump(customer))

@bp.route("/", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update current customer's profile."""
    customer_id = get_jwt_identity()
    customer = Customer.query.get_or_404(customer_id)
    data = request.get_json() or {}
    # validate
    validated, errors = customer_create_schema.load(data, partial=True)
    if errors:
        return jsonify(errors), 400
    # update allowed fields
    if "name" in validated:
        customer.name = validated["name"]
    if "phone" in validated:
        customer.phone = validated["phone"]
    if "email" in validated:
        # changing email should ensure uniqueness
        if Customer.query.filter(Customer.email == validated["email"], Customer.id != customer.id).first():
            return jsonify(msg="Email already in use"), 400
        customer.email = validated["email"]
    db.session.commit()
    return jsonify(customer_schema.dump(customer))

# Admin-only endpoints to list customers can be placed in admin blueprint.
