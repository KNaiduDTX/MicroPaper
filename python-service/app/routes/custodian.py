"""
Custodian API routes
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime, timezone
import random
import logging

from app.database import get_db
from app.models.database import NoteIssuance
from app.models.schemas import NoteIssuanceRequest, NoteIssuanceResponse, ServiceInfoResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/issue", response_model=NoteIssuanceResponse)
async def issue_note(
    request: NoteIssuanceRequest,
    request_obj: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Issue a traditional note
    
    This endpoint simulates custodian issuing a traditional note when a token is minted.
    """
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    # Normalize wallet address
    wallet_address = request.wallet_address.lower()
    
    # Parse maturity date
    maturity_date = datetime.fromisoformat(request.maturity_date.replace('Z', '+00:00'))
    
    # Generate mock ISIN following ISO 6166 format
    country_code = "US"
    prefix = "MOCK"
    random_number = random.randint(10000, 99999)
    check_digit = random.randint(0, 9)
    isin = f"{country_code}{prefix}{random_number}{check_digit}"
    
    issued_at = datetime.utcnow()
    
    # Store in database
    try:
        note_issuance = NoteIssuance(
            isin=isin,
            wallet_address=wallet_address,
            amount=request.amount,
            maturity_date=maturity_date,
            status="issued",
            issued_at=issued_at
        )
        db.add(note_issuance)
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Error issuing note: {e}")
        # Check if it's a duplicate ISIN error
        if "unique constraint" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Note with this ISIN already exists. Please try again."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to issue note: {str(e)}"
        )
    
    return NoteIssuanceResponse(
        isin=isin,
        status="issued",
        issued_at=issued_at.isoformat() + "Z"
    )


@router.get("/notes", response_model=List[dict])
async def get_notes(
    wallet_address: Optional[str] = Query(None, description="Filter by wallet address"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of notes to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of note issuances
    """
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    from sqlalchemy import select
    try:
        query = select(NoteIssuance)
        
        if wallet_address:
            query = query.where(NoteIssuance.wallet_address == wallet_address.lower())
        
        query = query.order_by(NoteIssuance.issued_at.desc()).limit(limit)
        
        result = await db.execute(query)
        notes = result.scalars().all()
        
        def format_datetime(dt: datetime) -> str:
            """Format datetime to ISO 8601 with Z suffix for UTC"""
            if dt is None:
                return ""
            
            # If timezone-aware, convert to UTC
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc)
            
            # Format without timezone info, then add Z
            # Remove microseconds if they exist, keep milliseconds
            if dt.microsecond:
                formatted = dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
            else:
                formatted = dt.strftime("%Y-%m-%dT%H:%M:%S") + "Z"
            
            return formatted
        
        return [
            {
                "id": note.id,
                "isin": note.isin,
                "wallet_address": note.wallet_address,
                "amount": note.amount,
                "maturity_date": format_datetime(note.maturity_date),
                "status": note.status,
                "issued_at": format_datetime(note.issued_at),
                "created_at": format_datetime(note.created_at)
            }
            for note in notes
        ]
    except Exception as e:
        logger.error(f"Error retrieving notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve notes: {str(e)}"
        )


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint for custodian service"""
    db_status = "connected" if db else "disconnected"
    
    # Test database connection if available
    if db:
        try:
            from sqlalchemy import text
            await db.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception:
            db_status = "error"
    
    return {
        "status": "healthy",
        "service": "micropaper-custodian",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    }


@router.get("/info", response_model=ServiceInfoResponse)
async def get_info():
    """Get custodian service information"""
    return ServiceInfoResponse(
        service="micropaper-custodian",
        version="1.0.0",
        description="Mock Custodian API for MicroPaper - Simulates traditional note issuance",
        endpoints={
            "issue": "POST /api/mock/custodian/issue",
            "getNotes": "GET /api/mock/custodian/notes",
            "health": "GET /api/mock/custodian/health",
            "info": "GET /api/mock/custodian/info"
        },
        features={
            "noteIssuance": "Issue traditional notes with ISIN generation",
            "database": "PostgreSQL storage for note records",
            "validation": "Wallet address and maturity date validation"
        }
    )

