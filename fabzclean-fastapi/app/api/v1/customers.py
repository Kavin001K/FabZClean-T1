from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_db, get_current_customer
from sqlalchemy.orm import Session
from app.schemas.customer import CustomerOut

router = APIRouter()

@router.get("/", response_model=CustomerOut)
def me(current = Depends(get_current_customer)):
    return current
