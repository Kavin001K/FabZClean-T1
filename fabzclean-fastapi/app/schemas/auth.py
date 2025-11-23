from pydantic import BaseModel, EmailStr, Field

class RegisterIn(BaseModel):
    name: str = Field(..., max_length=128)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: str | None = None

class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    # customer omitted here; use customer schema where needed

