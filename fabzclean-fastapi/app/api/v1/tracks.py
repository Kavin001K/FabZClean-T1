from fastapi import APIRouter, Depends
from app.api.deps import get_db
from sqlalchemy.orm import Session
from app.models.track import Track

router = APIRouter()

@router.get("/")
def list_tracks(db: Session = Depends(get_db)):
    rows = db.query(Track).order_by(Track.created_at.desc()).limit(200).all()
    return rows
