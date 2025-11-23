from ..extensions import db
from datetime import datetime

class Track(db.Model):
    __tablename__ = "tracks"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey("workers.id"), nullable=True)
    action = db.Column(db.String(64), nullable=False)
    note = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    order = db.relationship("Order", backref=db.backref("tracks", lazy="dynamic"))
    worker = db.relationship("Worker")
