from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from routers import auth, chat, history, export, upload as upload_module, gemini
from models.database import create_tables

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — creating tables...")
    create_tables()
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Nykaa BI Dashboard API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # ← allows all origins
    allow_credentials=False,   # ← must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api/auth",    tags=["Auth"])
app.include_router(chat.router,          prefix="/api/chat",    tags=["Chat"])
app.include_router(history.router,       prefix="/api/history", tags=["History"])
app.include_router(export.router,        prefix="/api/export",  tags=["Export"])
app.include_router(upload_module.router, prefix="/api/upload",  tags=["Upload"])
app.include_router(gemini.router,        prefix="/api/gemini",  tags=["Gemini"])


@app.get("/")
async def root():
    return {"status": "running", "version": "2.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}