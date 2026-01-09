"""
Custodian API routes
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, and_, or_, desc, asc
import random
import logging

from app.database import get_db
from app.models.database import NoteIssuance
from app.models.schemas import (
    NoteIssuanceRequest, 
    NoteIssuanceResponse, 
    ServiceInfoResponse,
    NoteUpdateRequest,
    NoteUpdateResponse,
    NoteStatsResponse,
    PaginatedNotesResponse
)

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


def format_note(note: NoteIssuance) -> dict:
    """Format a note object to dict"""
    return {
        "id": note.id,
        "isin": note.isin,
        "wallet_address": note.wallet_address,
        "amount": note.amount,
        "maturity_date": format_datetime(note.maturity_date),
        "status": note.status,
        "issued_at": format_datetime(note.issued_at),
        "created_at": format_datetime(note.created_at)
    }


@router.get("/notes", response_model=PaginatedNotesResponse)
async def get_notes(
    wallet_address: Optional[str] = Query(None, description="Filter by wallet address"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (issued, redeemed, expired)"),
    isin: Optional[str] = Query(None, description="Filter by ISIN (partial match)"),
    min_amount: Optional[int] = Query(None, alias="minAmount", description="Minimum amount"),
    max_amount: Optional[int] = Query(None, alias="maxAmount", description="Maximum amount"),
    issued_from: Optional[str] = Query(None, alias="issuedFrom", description="Issued date from (ISO 8601)"),
    issued_to: Optional[str] = Query(None, alias="issuedTo", description="Issued date to (ISO 8601)"),
    maturity_from: Optional[str] = Query(None, alias="maturityFrom", description="Maturity date from (ISO 8601)"),
    maturity_to: Optional[str] = Query(None, alias="maturityTo", description="Maturity date to (ISO 8601)"),
    expiring_within_days: Optional[int] = Query(None, alias="expiringWithinDays", description="Notes expiring within X days"),
    sort_by: Optional[str] = Query("issued_at", alias="sortBy", description="Sort by field (issued_at, maturity_date, amount, status, wallet_address)"),
    sort_order: Optional[str] = Query("desc", alias="sortOrder", description="Sort order (asc, desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(100, ge=1, le=1000, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of note issuances with advanced filtering, sorting, and pagination
    """
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        # Build base query
        query = select(NoteIssuance)
        count_query = select(func.count(NoteIssuance.id))
        
        # Apply filters
        conditions = []
        
        if wallet_address:
            conditions.append(NoteIssuance.wallet_address == wallet_address.lower())
        
        if status_filter:
            conditions.append(NoteIssuance.status.ilike(status_filter.lower()))
        
        if isin:
            conditions.append(NoteIssuance.isin.ilike(f"%{isin}%"))
        
        if min_amount is not None:
            conditions.append(NoteIssuance.amount >= min_amount)
        
        if max_amount is not None:
            conditions.append(NoteIssuance.amount <= max_amount)
        
        if issued_from:
            try:
                issued_from_dt = datetime.fromisoformat(issued_from.replace('Z', '+00:00'))
                conditions.append(NoteIssuance.issued_at >= issued_from_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid issuedFrom date format"
                )
        
        if issued_to:
            try:
                issued_to_dt = datetime.fromisoformat(issued_to.replace('Z', '+00:00'))
                conditions.append(NoteIssuance.issued_at <= issued_to_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid issuedTo date format"
                )
        
        if maturity_from:
            try:
                maturity_from_dt = datetime.fromisoformat(maturity_from.replace('Z', '+00:00'))
                conditions.append(NoteIssuance.maturity_date >= maturity_from_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid maturityFrom date format"
                )
        
        if maturity_to:
            try:
                maturity_to_dt = datetime.fromisoformat(maturity_to.replace('Z', '+00:00'))
                conditions.append(NoteIssuance.maturity_date <= maturity_to_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid maturityTo date format"
                )
        
        if expiring_within_days is not None:
            now = datetime.now(timezone.utc)
            expiry_date = now + timedelta(days=expiring_within_days)
            conditions.append(and_(
                NoteIssuance.maturity_date >= now,
                NoteIssuance.maturity_date <= expiry_date
            ))
        
        # Apply conditions
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # Get total count
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply sorting
        sort_field_map = {
            "issued_at": NoteIssuance.issued_at,
            "maturity_date": NoteIssuance.maturity_date,
            "amount": NoteIssuance.amount,
            "status": NoteIssuance.status,
            "wallet_address": NoteIssuance.wallet_address,
        }
        
        sort_field = sort_field_map.get(sort_by, NoteIssuance.issued_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_field))
        else:
            query = query.order_by(desc(sort_field))
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        notes = result.scalars().all()
        
        # Format results
        formatted_notes = [format_note(note) for note in notes]
        
        return PaginatedNotesResponse(
            notes=formatted_notes,
            total=total,
            page=page,
            limit=limit,
            has_more=(offset + limit) < total
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve notes: {str(e)}"
        )


@router.get("/notes/{note_id}", response_model=dict)
async def get_note_by_id(
    note_id: int = Path(..., description="Note ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a single note by ID
    """
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        result = await db.execute(
            select(NoteIssuance).where(NoteIssuance.id == note_id)
        )
        note = result.scalar_one_or_none()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {note_id} not found"
            )
        
        return format_note(note)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving note: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve note: {str(e)}"
        )


@router.get("/notes/by-isin/{isin}", response_model=dict)
async def get_note_by_isin(
    isin: str = Path(..., description="ISIN"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a single note by ISIN
    """
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        result = await db.execute(
            select(NoteIssuance).where(NoteIssuance.isin == isin.upper())
        )
        note = result.scalar_one_or_none()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ISIN {isin} not found"
            )
        
        return format_note(note)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving note: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve note: {str(e)}"
        )


@router.patch("/notes/{note_id}", response_model=NoteUpdateResponse)
async def update_note_status(
    note_id: int = Path(..., description="Note ID"),
    update_request: NoteUpdateRequest = ...,
    request_obj: Request = ...,
    db: AsyncSession = Depends(get_db)
):
    """
    Update note status (e.g., redeem, expire)
    """
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    # Validate status
    valid_statuses = ["issued", "redeemed", "expired"]
    new_status = update_request.status.lower()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    try:
        result = await db.execute(
            select(NoteIssuance).where(NoteIssuance.id == note_id)
        )
        note = result.scalar_one_or_none()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {note_id} not found"
            )
        
        # Update status
        old_status = note.status
        note.status = new_status
        
        await db.commit()
        await db.refresh(note)
        
        logger.info(f"Note {note_id} status updated from {old_status} to {new_status}")
        
        return NoteUpdateResponse(
            id=note.id,
            isin=note.isin,
            status=note.status,
            message=f"Note status updated from {old_status} to {new_status}"
        )
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating note status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update note status: {str(e)}"
        )


@router.post("/notes/{note_id}/redeem", response_model=NoteUpdateResponse)
async def redeem_note(
    note_id: int = Path(..., description="Note ID"),
    request_obj: Request = ...,
    db: AsyncSession = Depends(get_db)
):
    """
    Redeem a note (convenience endpoint to set status to 'redeemed')
    """
    return await update_note_status(note_id, NoteUpdateRequest(status="redeemed"), request_obj, db)


@router.get("/stats", response_model=NoteStatsResponse)
async def get_note_stats(
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregated statistics about notes
    """
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        # Get total count and amount
        total_result = await db.execute(
            select(func.count(NoteIssuance.id), func.sum(NoteIssuance.amount))
        )
        total_count, total_amount = total_result.first()
        total_count = total_count or 0
        total_amount = total_amount or 0
        
        # Get counts by status
        issued_result = await db.execute(
            select(func.count(NoteIssuance.id)).where(NoteIssuance.status.ilike("issued"))
        )
        issued_count = issued_result.scalar() or 0
        
        redeemed_result = await db.execute(
            select(func.count(NoteIssuance.id)).where(NoteIssuance.status.ilike("redeemed"))
        )
        redeemed_count = redeemed_result.scalar() or 0
        
        expired_result = await db.execute(
            select(func.count(NoteIssuance.id)).where(NoteIssuance.status.ilike("expired"))
        )
        expired_count = expired_result.scalar() or 0
        
        # Calculate average
        average_amount = (total_amount / total_count) if total_count > 0 else 0.0
        
        return NoteStatsResponse(
            total_notes=total_count,
            total_amount=total_amount,
            issued_count=issued_count,
            redeemed_count=redeemed_count,
            expired_count=expired_count,
            average_amount=round(average_amount, 2)
        )
    except Exception as e:
        logger.error(f"Error retrieving note stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve note statistics: {str(e)}"
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
            "getNoteById": "GET /api/mock/custodian/notes/{id}",
            "getNoteByIsin": "GET /api/mock/custodian/notes/by-isin/{isin}",
            "updateNote": "PATCH /api/mock/custodian/notes/{id}",
            "redeemNote": "POST /api/mock/custodian/notes/{id}/redeem",
            "getStats": "GET /api/mock/custodian/stats",
            "health": "GET /api/mock/custodian/health",
            "info": "GET /api/mock/custodian/info"
        },
        features={
            "noteIssuance": "Issue traditional notes with ISIN generation",
            "database": "PostgreSQL storage for note records",
            "validation": "Wallet address and maturity date validation"
        }
    )

