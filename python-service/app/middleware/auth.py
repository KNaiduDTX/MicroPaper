"""
Authentication middleware
"""

from fastapi import Request, HTTPException, status
from app.config import settings
import hmac
import hashlib


def constant_time_compare(val1: str, val2: str) -> bool:
    """
    Constant-time string comparison to prevent timing attacks.
    Uses HMAC comparison for secure constant-time comparison.
    """
    if not val1 or not val2:
        return False
    
    # Use HMAC for constant-time comparison
    # Convert both to bytes for comparison
    val1_bytes = val1.encode('utf-8')
    val2_bytes = val2.encode('utf-8')
    
    # If lengths differ, comparison will fail in constant time
    if len(val1_bytes) != len(val2_bytes):
        return False
    
    # Use HMAC comparison for constant-time equality check
    return hmac.compare_digest(val1_bytes, val2_bytes)


async def validate_api_key(request: Request):
    """Validate API key from request header using constant-time comparison"""
    api_key = request.headers.get("X-API-Key")
    
    if not settings.api_key:
        raise HTTPException(
            status_code=500,
            detail="Server configuration error: API_KEY not set"
        )
    
    # Use constant-time comparison to prevent timing attacks
    if not api_key or not constant_time_compare(api_key, settings.api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    return True

