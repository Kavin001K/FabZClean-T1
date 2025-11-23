from fastapi import APIRouter
from . import auth, services, orders, workers, tracks, customers

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(workers.router, prefix="/workers", tags=["workers"])
api_router.include_router(tracks.router, prefix="/tracks", tags=["tracks"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
