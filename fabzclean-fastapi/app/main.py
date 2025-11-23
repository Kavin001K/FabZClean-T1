from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.config import get_settings
from app.core.logging_config import configure_logging
from app.api.v1 import router as api_router
from app.db import session as db_session

settings = get_settings()
configure_logging()
app = FastAPI(title="FabzClean Backend", version="1.0")

@app.get("/healthz")
def health():
    try:
        db = db_session.SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return {"status":"ok","db":"ok"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status":"error","db": str(e)})

# include API router
app.include_router(api_router.api_router, prefix="/api/v1")

# admin login endpoints (session via cookie)
from fastapi import Cookie, Response, Depends
from app.core.config import get_settings
from jose import jwt
import datetime

@app.post("/admin/login")
def admin_login(data: dict, response: Response):
    settings = get_settings()
    email = data.get("email")
    password = data.get("password")
    if email == settings.ADMIN_EMAIL and password == settings.ADMIN_PASSWORD:
        payload = {"sub": "admin", "role": "admin", "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)}
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        response.set_cookie(key="admin_session", value=token, httponly=True, secure=False, samesite="lax")
        return {"msg":"ok"}
    return JSONResponse(status_code=401, content={"msg":"Bad creds"})

@app.post("/admin/logout")
def admin_logout(response: Response):
    response.delete_cookie("admin_session")
    return {"msg":"logged out"}
