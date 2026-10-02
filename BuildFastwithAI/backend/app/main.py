import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.routes import auth, documents, chat, planner

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bharatsahay")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing BharatSahay AI database schema...")
    await init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down BharatSahay AI application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multilingual Voice-First AI Action Assistant for Indian Languages (BFWAI/HACK 26 • PS-06)",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(planner.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "Welcome to BharatSahay AI API",
        "description": "Multilingual AI Action Assistant for Indian Languages",
        "docs_url": "/docs",
        "health_url": f"{settings.API_V1_STR}/health"
    }
