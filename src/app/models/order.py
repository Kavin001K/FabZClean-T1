from ..extensions import db
from datetime import datetime

class Order(db.Model):
    __tablename__ = "orders"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_number = db.Column(db.String(64), nullable=False, unique=True, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False)
    pickup_date = db.Column(db.DateTime, nullable=True)
    instructions = db.Column(db.Text, nullable=True)
    total_cost = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    status = db.Column(
        db.Enum("created", "picked_up", "processing", "completed", "delivered", "cancelled", name="order_status"),
        default="created",
        nullable=False
    )
    qr_code_path = db.Column(db.String(512), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    customer = db.relationship("Customer", backref=db.backref("orders", lazy="dynamic"))
    service = db.relationship("Service")
    
    def to_dict(self):
        """Convert order to dict."""
        return {
            "id": self.id,
            "order_number": self.order_number,
            "customer_id": self.customer_id,
            "service_id": self.service_id,
            "service_name": self.service.name if self.service else None,
            "pickup_date": self.pickup_date.isoformat() if self.pickup_date else None,
            "instructions": self.instructions,
            "total_cost": float(self.total_cost) if self.total_cost else 0.0,
            "status": self.status,
            "qr_code_path": self.qr_code_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

