from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.order import OrderCreate, OrderOut
from app.api.deps import get_db, create_access_token, decode_token
from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.service import Service
from app.models.customer import Customer
from app.utils.qr_generator import generate_order_qr
import secrets
from app.api.deps import get_current_customer

router = APIRouter()

def gen_order_number():
    return secrets.token_hex(6)

@router.post("/", status_code=201, response_model=OrderOut)
def create_order(payload: OrderCreate, db: Session = Depends(get_db), current=Depends(get_current_customer)):
    svc = db.query(Service).filter(Service.id == payload.service_id).first()
    if not svc:
        raise HTTPException(status_code=400, detail="Invalid service")
    order_number = gen_order_number()
    total_cost = float(svc.price)
    order = Order(order_number=order_number, customer_id=current.id, service_id=svc.id, pickup_date=payload.pickup_date, instructions=payload.instructions, total_cost=total_cost)
    db.add(order)
    db.commit()
    db.refresh(order)
    qr_payload = {"order_number": order.order_number, "email": current.email, "service": svc.name}
    qr_path = generate_order_qr(order.order_number, qr_payload)
    order.qr_code_path = qr_path
    db.commit()
    db.refresh(order)
    return order

@router.get("/", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db), current=Depends(get_current_customer)):
    rows = db.query(Order).filter(Order.customer_id == current.id).all()
    # pydantic model maps attributes
    for r in rows:
        if r.service:
            r.service_name = r.service.name
    return rows

@router.put("/{order_id}")
def update_order(order_id: int, payload: OrderCreate, db: Session = Depends(get_db), current=Depends(get_current_customer)):
    order = db.query(Order).get(order_id)
    if not order or order.customer_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if payload.pickup_date:
        order.pickup_date = payload.pickup_date
    if payload.instructions:
        order.instructions = payload.instructions
    db.commit()
    return {"msg": "Updated"}

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db), current=Depends(get_current_customer)):
    order = db.query(Order).get(order_id)
    if not order or order.customer_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    db.delete(order)
    db.commit()
    return {"msg": "Deleted"}
