from sqlalchemy import Column, Integer, String, Numeric, Enum
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.db.base import Base

import enum

class ServiceStatus(enum.Enum):
    active = "active"
    inactive = "inactive"

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False, unique=True, index=True)
    price = Column(Numeric(10,2), nullable=False, default=0)
    duration_minutes = Column(Integer, nullable=True)
    status = Column(Enum(ServiceStatus), nullable=False, default=ServiceStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

