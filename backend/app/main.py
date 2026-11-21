import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.core.config import settings, BASE_DIR
from app.core.logging import logger, setup_logging
from app.core.exceptions import AppException
from app.db.base import Base
from app.db.session import engine
from app.api.v1.api import api_router
from app.middleware.error_handler import (
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from app.middleware.rate_limit_middleware import RateLimitMiddleware
from app.middleware.audit_middleware import AuditMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created
    logger.info("Initializing database schema...")
    try:
        import app.models  # Ensure all models are registered
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database schema: {e}")

    yield

    # Shutdown
    logger.info("Application shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
# DriveNow Car Rental Backend API

Production-ready backend API for the DriveNow Car Rental platform.
Supports car search & filtering, real-time availability, instant quotes, transactional bookings with double-booking prevention, atomic wallet transactions, KYC document management, 24/7 roadside assistance, AI trip planning, and a full-featured admin management panel.
    """,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# 1. Custom Middlewares
app.add_middleware(AuditMiddleware)
app.add_middleware(RateLimitMiddleware)

# 2. CORS Middleware (Configured for Vite frontend running on http://localhost:8443)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# 4. API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "environment": settings.ENVIRONMENT,
        "docs": f"{settings.API_V1_STR}/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
