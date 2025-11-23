from pydantic import BaseModel, EmailStr
from datetime import datetime

class CustomerOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None = None
    is_active: bool
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}

