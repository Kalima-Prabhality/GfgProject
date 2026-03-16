from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey,
    Boolean, MetaData, create_engine
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.sql import func
from typing import Generator

# ── Hardcoded from .env ──────────────────────────────────────
DB_HOST     = "localhost"
DB_PORT     = "5432"
DB_NAME     = "nykaa_bi"
DB_USER     = "postgres"
DB_PASSWORD = "Kalima2007"

SECRET_KEY                  = "e07d244479885ebd34ad635035c72d5a0e586635e7d9998b3a0d9bd1617d2fb4"
ALGORITHM                   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080
GEMINI_API_KEY              = "AIzaSyDkMiTG9u-UKiw0t7jJEewDuZCi4qvx5v4"
ENVIRONMENT                 = "development"
FRONTEND_URL                = "http://localhost:3000"


class _Settings:
    SECRET_KEY                  = SECRET_KEY
    ALGORITHM                   = ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES
    GEMINI_API_KEY              = GEMINI_API_KEY
    ENVIRONMENT                 = ENVIRONMENT
    FRONTEND_URL                = FRONTEND_URL


settings = _Settings()

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f">>> Connecting: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

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