from fastapi import APIRouter, Depends, HTTPException, status, Response
from app.schemas.auth import RegisterIn
from app.db.session import SessionLocal
from app.utils.password import hash_password, verify_password
from app.models.customer import Customer
from app.api.deps import create_access_token
from app.core.config import get_settings
from sqlalchemy.orm import Session
from app.api.deps import get_db
from jose import jwt

router = APIRouter()

@router.post("/register", status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if db.query(Customer).filter(Customer.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = Customer(name=payload.name, email=payload.email, phone=payload.phone, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    access = create_access_token(user.id)
    # refresh token same mechanism; for simplicity reuse JWT with longer expiry
    from datetime import timedelta
    from app.api.deps import create_access_token as make_token
    refresh = make_token(user.id, expires_delta=timedelta(days=get_settings().REFRESH_TOKEN_EXPIRES_DAYS))
    return {"access_token": access, "refresh_token": refresh, "customer": {"id": user.id, "name": user.name, "email": user.email}}

@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    password = data.get("password")
    user = db.query(Customer).filter(Customer.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bad credentials")
    access = create_access_token(user.id)
    from datetime import timedelta
    from app.api.deps import create_access_token as make_token
    refresh = make_token(user.id, expires_delta=timedelta(days=get_settings().REFRESH_TOKEN_EXPIRES_DAYS))
    return {"access_token": access, "refresh_token": refresh, "customer": {"id": user.id, "name": user.name, "email": user.email}}

@router.post("/refresh")
def refresh_token(token: dict, db: Session = Depends(get_db)):
    # expects Authorization: Bearer <refresh_token>
    from fastapi import Request
    # For simplicity here use same decode function
    raise HTTPException(status_code=501, detail="Use /auth/login flow for refresh in this scaffold (implement refresh handling)")
