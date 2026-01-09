"""
Compliance API routes
"""

from fastapi import APIRouter, HTTPException, status, Path, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import select, func, and_, desc, asc
import json
import logging

from app.database import get_db

logger = logging.getLogger(__name__)
from app.models.database import WalletVerification, ComplianceAuditLog, NoteIssuance
from app.models.schemas import (
    ComplianceStatusResponse,
    ComplianceStatsResponse,
    VerifiedWalletsResponse,
    WalletVerificationResponse,
    ServiceInfoResponse,
    AuditLogsResponse,
    AuditLogEntry,
    WalletDetailsResponse
)

router = APIRouter()


def format_datetime(dt: datetime) -> str:
    """Format datetime to ISO 8601 with Z suffix for UTC"""
    if dt is None:
        return ""
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc)
    if dt.microsecond:
        return dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    return dt.strftime("%Y-%m-%dT%H:%M:%S") + "Z"


def _validate_wallet_address(wallet_address: str) -> str:
    """Validate and normalize wallet address"""
    if not wallet_address.startswith('0x') or len(wallet_address) != 42:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Ethereum wallet address format"
        )
    return wallet_address.lower()


# Health and info endpoints (must come before parameterized routes)
@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint for compliance service"""
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
        "service": "micropaper-compliance",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    }


@router.get("/info", response_model=ServiceInfoResponse)
async def get_info():
    """Get compliance service information"""
    return ServiceInfoResponse(
        service="micropaper-compliance",
        version="1.0.0",
        description="Compliance API for MicroPaper - Wallet verification and compliance management",
        endpoints={
            "checkStatus": "GET /api/mock/compliance/{wallet_address}",
            "verifyWallet": "POST /api/mock/compliance/verify/{wallet_address}",
            "unverifyWallet": "POST /api/mock/compliance/unverify/{wallet_address}",
            "getStats": "GET /api/mock/compliance/stats",
            "getVerified": "GET /api/mock/compliance/verified",
            "getAuditLogs": "GET /api/mock/compliance/audit-logs",
            "getWalletDetails": "GET /api/mock/compliance/wallets/{wallet_address}/details",
            "health": "GET /api/mock/compliance/health",
            "info": "GET /api/mock/compliance/info"
        },
        features={
            "walletVerification": "Check and manage wallet verification status",
            "complianceStats": "Get compliance statistics and metrics",
            "auditLogging": "Comprehensive audit trail for compliance actions",
            "database": "PostgreSQL storage for verification records"
        }
    )


@router.get("/stats", response_model=ComplianceStatsResponse)
async def get_stats(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get compliance registry statistics (admin/debugging)
    """
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        # Return empty stats if database not available
        return ComplianceStatsResponse(
            total_wallets=0,
            verified_wallets=0,
            unverified_wallets=0,
            verification_rate="0%",
            request_id=request_id
        )
    
    # Query from database
    from sqlalchemy import select, func
    total_result = await db.execute(select(func.count(WalletVerification.wallet_address)))
    total_wallets = total_result.scalar() or 0
    
    verified_result = await db.execute(
        select(func.count(WalletVerification.wallet_address)).where(WalletVerification.is_verified == True)
    )
    verified_wallets = verified_result.scalar() or 0
    
    unverified_wallets = total_wallets - verified_wallets
    verification_rate = f"{(verified_wallets / total_wallets * 100):.2f}%" if total_wallets > 0 else "0%"
    
    return ComplianceStatsResponse(
        total_wallets=total_wallets,
        verified_wallets=verified_wallets,
        unverified_wallets=unverified_wallets,
        verification_rate=verification_rate,
        request_id=request_id
    )


@router.get("/verified", response_model=VerifiedWalletsResponse)
async def get_verified_wallets(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of all verified wallets (admin/debugging)
    """
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        # Return empty list if database not available
        return VerifiedWalletsResponse(
            verified_wallets=[],
            count=0,
            request_id=request_id
        )
    
    # Query from database
    result = await db.execute(
        select(WalletVerification.wallet_address).where(WalletVerification.is_verified == True)
    )
    verified_wallets = [row[0] for row in result.fetchall()]
    
    return VerifiedWalletsResponse(
        verified_wallets=verified_wallets,
        count=len(verified_wallets),
        request_id=request_id
    )


@router.get("/audit-logs", response_model=AuditLogsResponse)
async def get_audit_logs(
    request: Request,
    wallet_address: Optional[str] = Query(None, alias="walletAddress", description="Filter by wallet address"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    performed_by: Optional[str] = Query(None, alias="performedBy", description="Filter by performer"),
    from_date: Optional[str] = Query(None, alias="fromDate", description="Filter from date (ISO 8601)"),
    to_date: Optional[str] = Query(None, alias="toDate", description="Filter to date (ISO 8601)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(100, ge=1, le=1000, description="Items per page"),
    sort_order: Optional[str] = Query("desc", alias="sortOrder", description="Sort order (asc, desc)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get compliance audit logs with filtering and pagination
    """
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        # Build base query
        query = select(ComplianceAuditLog)
        count_query = select(func.count(ComplianceAuditLog.id))
        
        # Apply filters
        conditions = []
        
        if wallet_address:
            conditions.append(ComplianceAuditLog.wallet_address == wallet_address.lower())
        
        if action:
            conditions.append(ComplianceAuditLog.action.ilike(f"%{action}%"))
        
        if performed_by:
            conditions.append(ComplianceAuditLog.performed_by.ilike(f"%{performed_by}%"))
        
        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                conditions.append(ComplianceAuditLog.timestamp >= from_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid fromDate format"
                )
        
        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                conditions.append(ComplianceAuditLog.timestamp <= to_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid toDate format"
                )
        
        # Apply conditions
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # Get total count
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply sorting
        if sort_order.lower() == "asc":
            query = query.order_by(asc(ComplianceAuditLog.timestamp))
        else:
            query = query.order_by(desc(ComplianceAuditLog.timestamp))
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Format results
        formatted_logs = []
        for log in logs:
            metadata = None
            if log.metadata_json:
                try:
                    metadata = json.loads(log.metadata_json)
                except json.JSONDecodeError:
                    pass
            
            formatted_logs.append(AuditLogEntry(
                id=log.id,
                wallet_address=log.wallet_address,
                action=log.action,
                performed_by=log.performed_by,
                request_id=log.request_id,
                timestamp=format_datetime(log.timestamp),
                metadata=metadata
            ))
        
        return AuditLogsResponse(
            logs=formatted_logs,
            total=total,
            page=page,
            limit=limit,
            has_more=(offset + limit) < total
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving audit logs: {e}", extra={"request_id": request_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve audit logs: {str(e)}"
        )


@router.get("/wallets/{wallet_address}/details", response_model=WalletDetailsResponse)
async def get_wallet_details(
    request: Request,
    wallet_address: str = Path(..., description="Ethereum wallet address"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive wallet information including verification status and note history
    """
    request_id = request.headers.get("X-Request-ID")
    normalized_address = _validate_wallet_address(wallet_address)
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        # Get wallet verification status
        wallet_result = await db.execute(
            select(WalletVerification).where(WalletVerification.wallet_address == normalized_address)
        )
        wallet = wallet_result.scalar_one_or_none()
        
        is_verified = wallet.is_verified if wallet else False
        verified_at = format_datetime(wallet.updated_at) if wallet and wallet.is_verified else None
        verified_by = wallet.verified_by if wallet else None
        
        # Get all notes for this wallet
        notes_result = await db.execute(
            select(NoteIssuance)
            .where(NoteIssuance.wallet_address == normalized_address)
            .order_by(desc(NoteIssuance.issued_at))
        )
        notes = notes_result.scalars().all()
        
        # Calculate statistics
        total_notes = len(notes)
        total_amount = sum(note.amount for note in notes) if notes else 0
        
        # Get first and last note dates
        first_note_date = None
        last_note_date = None
        if notes:
            first_note_date = format_datetime(min(note.issued_at for note in notes))
            last_note_date = format_datetime(max(note.issued_at for note in notes))
        
        # Format notes
        formatted_notes = [
            {
                "id": note.id,
                "isin": note.isin,
                "amount": note.amount,
                "maturity_date": format_datetime(note.maturity_date),
                "status": note.status,
                "issued_at": format_datetime(note.issued_at),
                "created_at": format_datetime(note.created_at)
            }
            for note in notes
        ]
        
        return WalletDetailsResponse(
            wallet_address=normalized_address,
            is_verified=is_verified,
            verified_at=verified_at,
            verified_by=verified_by,
            total_notes=total_notes,
            total_amount=total_amount,
            first_note_date=first_note_date,
            last_note_date=last_note_date,
            notes=formatted_notes
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving wallet details: {e}", extra={"request_id": request_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve wallet details: {str(e)}"
        )


# Parameterized routes (must come after specific routes)
@router.get("/{wallet_address}", response_model=ComplianceStatusResponse)
async def check_status(
    request: Request,
    wallet_address: str = Path(..., description="Ethereum wallet address"),
    db: AsyncSession = Depends(get_db)
):
    """
    Check verification status for a wallet address
    """
    normalized_address = _validate_wallet_address(wallet_address)
    request_id = request.headers.get("X-Request-ID")
    
    # Query from database
    is_verified = False
    if not db:
        # Return unverified if database not available
        return ComplianceStatusResponse(
            is_verified=False,
            request_id=request_id
        )
    
    from sqlalchemy import select
    try:
        result = await db.execute(
            select(WalletVerification).where(WalletVerification.wallet_address == normalized_address)
        )
        wallet = result.scalar_one_or_none()
        is_verified = wallet.is_verified if wallet else False
    except Exception as e:
        logger.error(f"Error querying wallet verification: {e}", extra={"request_id": request_id})
        # If database error, default to False
        is_verified = False
    
    # Log audit trail
    try:
        audit_log = ComplianceAuditLog(
            wallet_address=normalized_address,
            action="check_status",
            request_id=request_id
        )
        db.add(audit_log)
        await db.commit()
    except Exception as e:
        logger.warning(f"Error logging audit trail: {e}", extra={"request_id": request_id})
        # Log error but don't fail the request
        await db.rollback()
    
    return ComplianceStatusResponse(
        is_verified=is_verified,
        request_id=request_id
    )


@router.post("/verify/{wallet_address}", response_model=WalletVerificationResponse)
async def verify_wallet(
    request: Request,
    wallet_address: str = Path(..., description="Ethereum wallet address"),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually verify a wallet address (admin/demo use)
    """
    normalized_address = _validate_wallet_address(wallet_address)
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    # Update in database
    from sqlalchemy import select
    result = await db.execute(
        select(WalletVerification).where(WalletVerification.wallet_address == normalized_address)
    )
    wallet = result.scalar_one_or_none()
    
    try:
        if wallet:
            wallet.is_verified = True
            wallet.updated_at = datetime.utcnow()
            wallet.verified_by = "admin_demo"
        else:
            wallet = WalletVerification(
                wallet_address=normalized_address,
                is_verified=True,
                verified_by="admin_demo"
            )
            db.add(wallet)
        
        # Log audit trail
        audit_log = ComplianceAuditLog(
            wallet_address=normalized_address,
            action="verify",
            request_id=request_id,
            performed_by="admin_demo"
        )
        db.add(audit_log)
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Error verifying wallet: {e}", extra={"request_id": request_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify wallet: {str(e)}"
        )
    
    return WalletVerificationResponse(
        success=True,
        message=f"Wallet {wallet_address} marked as verified",
        request_id=request_id
    )


@router.post("/unverify/{wallet_address}", response_model=WalletVerificationResponse)
async def unverify_wallet(
    request: Request,
    wallet_address: str = Path(..., description="Ethereum wallet address"),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually unverify a wallet address (admin/demo use)
    """
    normalized_address = _validate_wallet_address(wallet_address)
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    # Update in database
    from sqlalchemy import select
    result = await db.execute(
        select(WalletVerification).where(WalletVerification.wallet_address == normalized_address)
    )
    wallet = result.scalar_one_or_none()
    
    try:
        if wallet:
            wallet.is_verified = False
            wallet.updated_at = datetime.utcnow()
        else:
            wallet = WalletVerification(
                wallet_address=normalized_address,
                is_verified=False
            )
            db.add(wallet)
        
        # Log audit trail
        audit_log = ComplianceAuditLog(
            wallet_address=normalized_address,
            action="unverify",
            request_id=request_id,
            performed_by="admin_demo"
        )
        db.add(audit_log)
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Error unverifying wallet: {e}", extra={"request_id": request_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unverify wallet: {str(e)}"
        )
    
    return WalletVerificationResponse(
        success=True,
        message=f"Wallet {wallet_address} marked as unverified",
        request_id=request_id
    )



