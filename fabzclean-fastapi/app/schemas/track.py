from pydantic import BaseModel
from datetime import datetime

class TrackOut(BaseModel):
    id: int
    order_id: int
    worker_id: int | None
    action: str
    note: str | None
    location: str | None
    created_at: datetime | None

    model_config = {"from_attributes": True}

