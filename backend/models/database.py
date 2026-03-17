import os
from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey,
    Boolean, MetaData, create_engine
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.sql import func
from typing import Generator

# ── Read from environment variables ──────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:Kalima2007@localhost:5432/nykaa_bi"
)

# Render uses postgres:// but SQLAlchemy needs postgresql+psycopg2://
if DATABASE_URL.startswith("postgresql://") and "+psycopg2" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

SECRET_KEY                  = os.getenv("SECRET_KEY",  "e07d244479885ebd34ad635035c72d5a0e586635e7d9998b3a0d9bd1617d2fb4")
ALGORITHM                   = os.getenv("ALGORITHM",   "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
GEMINI_API_KEY              = os.getenv("GEMINI_API_KEY", "AIzaSyDWjSEptW0w9W36r9BX7PGz8Lt4TYbWVTQ")
ENVIRONMENT                 = os.getenv("ENVIRONMENT",  "development")
FRONTEND_URL                = os.getenv("FRONTEND_URL", "http://localhost:3000")

print(f">>> Connecting to database...")

class _Settings:
    SECRET_KEY                  = SECRET_KEY
    ALGORITHM                   = ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES
    GEMINI_API_KEY              = GEMINI_API_KEY
    ENVIRONMENT                 = ENVIRONMENT
    FRONTEND_URL                = FRONTEND_URL

settings = _Settings()

engine       = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()
metadata     = MetaData()


class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(255), nullable=False)
    email         = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    is_active     = Column(Boolean, default=True)


class ChatHistory(Base):
    __tablename__ = "chat_history"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    question      = Column(Text, nullable=False)
    generated_sql = Column(Text)
    result_json   = Column(Text)
    chart_type    = Column(String(50))
    insights      = Column(Text)
    timestamp     = Column(DateTime(timezone=True), server_default=func.now())


class Campaign(Base):
    __tablename__ = "campaigns"
    id               = Column(Integer, primary_key=True, index=True)
    campaign_id      = Column(String(50), unique=True, index=True)
    campaign_type    = Column(String(100))
    target_audience  = Column(String(100))
    duration         = Column(Integer)
    channel_used     = Column(String(200))
    impressions      = Column(Integer)
    clicks           = Column(Integer)
    leads            = Column(Integer)
    conversions      = Column(Integer)
    revenue          = Column(Float)
    acquisition_cost = Column(Float)
    roi              = Column(Float)
    language         = Column(String(50))
    engagement_score = Column(Float)
    customer_segment = Column(String(100))
    date             = Column(DateTime(timezone=True))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)