# FabzClean FastAPI Backend (Sync)

## Setup (local)

1. Copy `.env.example` to `.env` and fill values.

2. pip install -r requirements.txt

3. Run migrations:

   - export DATABASE_URL=...
   - alembic revision --autogenerate -m "initial"
   - alembic upgrade head

4. Run:

   uvicorn app.main:app --reload --port 3000

## Docker

docker-compose up --build

## Notes

- Admin login sets cookie `admin_session`. Use HTTPS & secure cookies in production.

- Worker tokens are created by admin and used as bearer tokens for /api/v1/workers/scan.

