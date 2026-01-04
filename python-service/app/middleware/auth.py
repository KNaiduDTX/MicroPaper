"""
Authentication middleware
"""

from fastapi import Request, HTTPException, status
from app.config import settings


async def validate_api_key(request: Request):
    """Validate API key from request header"""
    api_key = request.headers.get("X-API-Key")
    
    if not settings.api_key:
        raise HTTPException(
            status_code=500,
            detail="Server configuration error: API_KEY not set"
        )
    
    if api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    return True

