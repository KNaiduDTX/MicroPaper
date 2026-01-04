"""
Request ID middleware
"""

from fastapi import Request
import uuid


async def add_request_id_middleware(request: Request, call_next):
    """Add or propagate request ID"""
    request_id = request.headers.get("X-Request-ID")
    if not request_id:
        request_id = str(uuid.uuid4())
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

