from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ServiceOut(BaseModel):
    id: int
    name: str
    price: float
    duration_minutes: Optional[int] = None
    status: str
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}

class ServiceCreate(BaseModel):
    name: str
    price: float
    duration_minutes: Optional[int] = None

