"""
Custodian API routes
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
import random

from app.database import get_db
from app.models.database import NoteIssuance
from app.models.schemas import NoteIssuanceRequest, NoteIssuanceResponse

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
    
    return NoteIssuanceResponse(
        isin=isin,
        status="issued",
        issued_at=issued_at.isoformat() + "Z"
    )


@router.get("/health")
async def health_check():
    """Health check endpoint for custodian service"""
    return {
        "status": "healthy",
        "service": "micropaper-custodian",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    }

