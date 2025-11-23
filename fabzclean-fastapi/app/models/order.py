from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class OrderStatus(enum.Enum):
    created = "created"
    picked_up = "picked_up"
    processing = "processing"
    completed = "completed"
    delivered = "delivered"
    cancelled = "cancelled"

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(64), nullable=False, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    pickup_date = Column(DateTime(timezone=True), nullable=True)
    instructions = Column(Text, nullable=True)
    total_cost = Column(Numeric(10,2), nullable=False, default=0)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.created)
    qr_code_path = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", backref="orders")
    service = relationship("Service")

