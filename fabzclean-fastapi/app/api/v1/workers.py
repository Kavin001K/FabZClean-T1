from fastapi import APIRouter, Depends, HTTPException, Request
from app.schemas.worker import WorkerCreate, WorkerOut, WorkerScanIn
from app.api.deps import get_db, get_current_customer
from sqlalchemy.orm import Session
from app.models.worker import Worker
from app.models.order import Order
from app.models.track import Track
import secrets

router = APIRouter()

@router.post("/register", response_model=WorkerOut)
def register_worker(payload: WorkerCreate, db: Session = Depends(get_db), current=Depends(get_current_customer)):
    # For now only allow admin email to create worker - check current.user email
    from app.core.config import get_settings
    settings = get_settings()
    if current.email != settings.ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin only")
    token = secrets.token_hex(16)
    w = Worker(name=payload.name, email=payload.email, token=token)
    db.add(w)
    db.commit()
    db.refresh(w)
    return w

@router.post("/scan")
def scan(payload: WorkerScanIn, db: Session = Depends(get_db), request: Request = None):
    auth = request.headers.get("Authorization","")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing worker token")
    token = auth.split(" ",1)[1]
    worker = db.query(Worker).filter(Worker.token == token).first()
    if not worker:
        raise HTTPException(status_code=401, detail="Invalid worker token")
    order = db.query(Order).filter(Order.order_number == payload.order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    from app.models.order import OrderStatus
    t = Track(order_id=order.id, worker_id=worker.id, action=payload.action, location=payload.location)
    if payload.action == "picked_up":
        order.status = OrderStatus.picked_up
    elif payload.action == "delivered":
        order.status = OrderStatus.delivered
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"msg":"Scan recorded", "track": {"id": t.id, "action": t.action, "created_at": t.created_at.isoformat()}}
