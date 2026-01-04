"""
Pydantic models matching TypeScript interfaces for type consistency
These models ensure the Python API responses match what the Next.js frontend expects
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# Note Issuance Types (matching frontend/types/note.ts)
class NoteIssuanceRequest(BaseModel):
    """Request model matching NoteIssuanceRequest TypeScript interface"""
    wallet_address: str = Field(..., alias="walletAddress")
    amount: int
    maturity_date: str = Field(..., alias="maturityDate")
    
    class Config:
        populate_by_name = True


class NoteIssuanceResponse(BaseModel):
    """Response model matching NoteIssuanceResponse TypeScript interface"""
    isin: str
    status: str
    issued_at: str = Field(..., alias="issuedAt")
    
    class Config:
        populate_by_name = True


# Compliance Types (matching frontend/types/compliance.ts)
class ComplianceStatus(BaseModel):
    """Response model matching ComplianceStatus TypeScript interface"""
    is_verified: bool = Field(..., alias="isVerified")
    request_id: Optional[str] = Field(None, alias="requestId")
    
    class Config:
        populate_by_name = True


class ComplianceStats(BaseModel):
    """Response model matching ComplianceStats TypeScript interface"""
    total_wallets: int = Field(..., alias="totalWallets")
    verified_wallets: int = Field(..., alias="verifiedWallets")
    unverified_wallets: int = Field(..., alias="unverifiedWallets")
    verification_rate: str = Field(..., alias="verificationRate")
    request_id: Optional[str] = Field(None, alias="requestId")
    
    class Config:
        populate_by_name = True


class VerifiedWalletsResponse(BaseModel):
    """Response model matching VerifiedWalletsResponse TypeScript interface"""
    verified_wallets: List[str] = Field(..., alias="verifiedWallets")
    count: int
    request_id: Optional[str] = Field(None, alias="requestId")
    
    class Config:
        populate_by_name = True


# Wallet Types (matching frontend/types/wallet.ts)
class WalletVerificationStatus(BaseModel):
    """Response model matching WalletVerificationStatus TypeScript interface"""
    is_verified: bool = Field(..., alias="isVerified")
    request_id: Optional[str] = Field(None, alias="requestId")
    
    class Config:
        populate_by_name = True


class WalletVerificationResponse(BaseModel):
    """Response model matching WalletVerificationResponse TypeScript interface"""
    success: bool
    message: str
    request_id: Optional[str] = Field(None, alias="requestId")
    
    class Config:
        populate_by_name = True


# API Types (matching frontend/types/api.ts)
class ApiError(BaseModel):
    """Error model matching ApiError TypeScript interface"""
    error: dict
    request_id: Optional[str] = Field(None, alias="requestId")
    
    class Config:
        populate_by_name = True


class HealthCheckResponse(BaseModel):
    """Response model matching HealthCheckResponse TypeScript interface"""
    status: str
    service: str
    timestamp: str
    version: str

