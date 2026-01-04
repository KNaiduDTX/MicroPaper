"""
Compliance API routes
"""

from fastapi import APIRouter, HTTPException, status, Path, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.database import WalletVerification, ComplianceAuditLog
from app.models.schemas import (
    ComplianceStatusResponse,
    ComplianceStatsResponse,
    VerifiedWalletsResponse,
    WalletVerificationResponse
)

router = APIRouter()


def _validate_wallet_address(wallet_address: str) -> str:
    """Validate and normalize wallet address"""
    if not wallet_address.startswith('0x') or len(wallet_address) != 42:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Ethereum wallet address format"
        )
    return wallet_address.lower()


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
    if db:
        from sqlalchemy import select
        try:
            result = await db.execute(
                select(WalletVerification).where(WalletVerification.wallet_address == normalized_address)
            )
            wallet = result.scalar_one_or_none()
            is_verified = wallet.is_verified if wallet else False
        except Exception:
            # If database not available, default to False
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
        except Exception:
            # Log error but don't fail the request
            pass
    
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
    
    if wallet:
        wallet.is_verified = True
        wallet.updated_at = datetime.utcnow()
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
    
    return WalletVerificationResponse(
        success=True,
        message=f"Wallet {wallet_address} marked as unverified",
        request_id=request_id
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
    from sqlalchemy import select
    result = await db.execute(
        select(WalletVerification.wallet_address).where(WalletVerification.is_verified == True)
    )
    verified_wallets = [row[0] for row in result.fetchall()]
    
    return VerifiedWalletsResponse(
        verified_wallets=verified_wallets,
        count=len(verified_wallets),
        request_id=request_id
    )


@router.get("/health")
async def health_check():
    """Health check endpoint for compliance service"""
    return {
        "status": "healthy",
        "service": "micropaper-compliance",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    }

