import os
from functools import lru_cache

try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = os.getenv("APP_ENV", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "please-change-me")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "please-change-jwt")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@example.com")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "supersecurepassword")
    ALLOW_ORIGINS: str = os.getenv("ALLOW_ORIGINS", "file://,http://localhost:3000")
    APP_PORT: int = int(os.getenv("APP_PORT", 3000))

    ACCESS_TOKEN_EXPIRES_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRES_DAYS: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings():
    return Settings()

