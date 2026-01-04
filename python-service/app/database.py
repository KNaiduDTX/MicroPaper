"""
Database connection and pooling configuration
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Create async engine with connection pooling
engine = None
async_session_maker = None
Base = declarative_base()


async def init_db():
    """Initialize database connection pool"""
    global engine, async_session_maker
    
    if not settings.database_url:
        logger.warning("DATABASE_URL not set, database features will be unavailable")
        return
    
    # Convert postgresql:// to postgresql+asyncpg:// for async support
    database_url = settings.database_url
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(
        database_url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Verify connections before using
        echo=settings.environment == "development"
    )
    
    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    logger.info("Database connection pool initialized")


async def close_db():
    """Close database connection pool"""
    global engine
    if engine:
        await engine.dispose()
        logger.info("Database connection pool closed")


async def get_db():
    """Dependency for getting database session"""
    if not async_session_maker:
        # If database not initialized, return None (routes will handle gracefully)
        yield None
        return
    
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

