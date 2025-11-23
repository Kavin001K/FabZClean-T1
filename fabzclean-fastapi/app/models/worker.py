from sqlalchemy import Column, Integer, String
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.db.base import Base

class Worker(Base):
    __tablename__ = "workers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(255), nullable=True, unique=True)
    token = Column(String(255), nullable=True, index=True)  # device token
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

