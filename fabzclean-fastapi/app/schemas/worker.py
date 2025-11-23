from pydantic import BaseModel, EmailStr

class WorkerCreate(BaseModel):
    name: str
    email: EmailStr | None = None

class WorkerOut(BaseModel):
    id: int
    name: str
    email: str | None
    token: str | None

    model_config = {"from_attributes": True}

class WorkerScanIn(BaseModel):
    order_number: str
    action: str
    location: str | None = None

