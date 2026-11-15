from collections.abc import Generator
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://USERNAME:PASSWORD@localhost:5432/specfinder_db"
    cors_origins: str = "http://localhost:3000"
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[1] / ".env", extra="ignore")


settings = Settings()
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
