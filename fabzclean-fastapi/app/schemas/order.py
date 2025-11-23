from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class OrderCreate(BaseModel):
    service_id: int
    pickup_date: Optional[datetime] = None
    instructions: Optional[str] = None

class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_id: int
    service_id: int
    service_name: Optional[str] = None
    pickup_date: Optional[datetime] = None
    instructions: Optional[str] = None
    total_cost: float
    status: str
    qr_code_path: Optional[str] = None
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}

