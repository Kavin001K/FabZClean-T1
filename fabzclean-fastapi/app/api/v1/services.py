from fastapi import APIRouter, Depends, HTTPException
from app.schemas.service import ServiceCreate, ServiceOut
from app.db.session import SessionLocal
from app.models.service import Service
from app.api.deps import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/", response_model=list[ServiceOut])
def list_services(db: Session = Depends(get_db)):
    from app.models.service import ServiceStatus
    rows = db.query(Service).filter(Service.status == ServiceStatus.active).all()
    return rows

@router.post("/", status_code=201, response_model=ServiceOut)
def create_service(payload: ServiceCreate, db: Session = Depends(get_db)):
    if db.query(Service).filter(Service.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Service exists")
    s = Service(name=payload.name, price=payload.price, duration_minutes=payload.duration_minutes)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
