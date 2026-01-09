"""
MicroPaper Python FastAPI Service
Main application entry point
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlalchemy import text
import logging
import sys

from app.config import settings
from app.database import init_db, close_db
from app.middleware.auth import validate_api_key
from app.middleware.request_id import add_request_id_middleware
from app.routes import custodian, compliance, market

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.environment == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting MicroPaper Python API Service")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Host: {settings.host}, Port: {settings.port}")
    
    # Initialize database connection pool
    await init_db()
    
    yield
    
    # Shutdown
    logger.info("Shutting down MicroPaper Python API Service")
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="MicroPaper Python API",
    description="Python FastAPI service for MicroPaper - handling heavy compute operations and business logic",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key", "X-Request-ID"],
    expose_headers=["X-Request-ID"]
)

# Add request ID middleware
app.middleware("http")(add_request_id_middleware)


# API Key authentication dependency (exclude health checks)
async def api_key_dependency(request: Request):
    """Dependency to validate API key for protected routes"""
    # Skip authentication for health checks and root endpoint
    if request.url.path in ["/health", "/", "/docs", "/openapi.json", "/redoc"]:
        return True
    
    # Validate API key for all other routes
    return await validate_api_key(request)


# Add API key validation to all routes except health checks
@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    """Middleware to validate API key for protected routes"""
    # Skip authentication for health checks and docs
    if request.url.path in ["/health", "/", "/docs", "/openapi.json", "/redoc"]:
        return await call_next(request)
    
    # Skip authentication for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return await call_next(request)
    
    try:
        await validate_api_key(request)
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": {"code": "UNAUTHORIZED", "message": str(e)}}
        )
    
    return await call_next(request)


# Register routes
# Use /api/mock/* to match frontend expectations
app.include_router(custodian.router, prefix="/api/mock/custodian", tags=["Custodian"])
app.include_router(compliance.router, prefix="/api/mock/compliance", tags=["Compliance"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "MicroPaper Python API",
        "version": "1.0.0",
        "status": "running",
        "environment": settings.environment,
        "endpoints": {
            "custodian": {
                "issue": "POST /api/mock/custodian/issue",
                "health": "GET /api/mock/custodian/health",
                "info": "GET /api/mock/custodian/info"
            },
            "compliance": {
                "checkStatus": "GET /api/mock/compliance/{wallet_address}",
                "verifyWallet": "POST /api/mock/compliance/verify/{wallet_address}",
                "unverifyWallet": "POST /api/mock/compliance/unverify/{wallet_address}",
                "getStats": "GET /api/mock/compliance/stats",
                "getVerified": "GET /api/mock/compliance/verified",
                "health": "GET /api/mock/compliance/health",
                "info": "GET /api/mock/compliance/info"
            },
            "market": {
                "getOfferings": "GET /api/market/offerings",
                "invest": "POST /api/market/invest",
                "settle": "POST /api/market/settle/{note_id}",
                "getHoldings": "GET /api/market/holdings"
            }
        }
    }


# Global health check endpoint
@app.get("/health")
async def health_check():
    """Global health check endpoint with database status"""
    from app.database import engine
    
    db_status = "disconnected"
    if engine:
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception:
            db_status = "error"
    
    return {
        "status": "healthy",
        "service": "micropaper-python-api",
        "version": "1.0.0",
        "environment": settings.environment,
        "database": db_status
    }


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    request_id = request.headers.get("X-Request-ID", "unknown")
    logger.error(f"Unhandled exception: {exc}", exc_info=True, extra={"request_id": request_id})
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred"
            },
            "requestId": request_id
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
        log_level="info"
    )
