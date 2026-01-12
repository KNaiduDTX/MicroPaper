"""
Admin authentication middleware
Validates admin API key for protected admin endpoints
"""

from fastapi import Request, HTTPException, status
from app.config import settings


async def validate_admin_key(request: Request):
    """
    Validate admin API key from request header.
    Uses a separate admin key for admin-only operations.
    
    In production, this should be a different key from the regular API key.
    For MVP, we'll use a separate header and environment variable.
    """
    admin_key = request.headers.get("X-Admin-Key")
    
    # Get admin key from settings (defaults to regular API key if not set)
    required_admin_key = getattr(settings, 'admin_key', None) or settings.api_key
    
    if not required_admin_key:
        raise HTTPException(
            status_code=500,
            detail="Server configuration error: ADMIN_KEY not set"
        )
    
    # Use constant-time comparison (import from auth module)
    from app.middleware.auth import constant_time_compare
    
    if not admin_key or not constant_time_compare(admin_key, required_admin_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. Invalid or missing X-Admin-Key header",
            headers={"WWW-Authenticate": "AdminKey"},
        )
    
    return True
