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


# Response model aliases for route compatibility
ComplianceStatusResponse = ComplianceStatus
ComplianceStatsResponse = ComplianceStats


# Service Info Types (matching frontend/types/api.ts)
class ServiceInfoResponse(BaseModel):
    """Response model matching ServiceInfoResponse TypeScript interface"""
    service: str
    version: str
    description: str
    endpoints: dict
    features: dict


# Note Management Types
class NoteUpdateRequest(BaseModel):
    """Request model for updating note status"""
    status: str = Field(..., description="New status (issued, redeemed, expired)")
    
    class Config:
        populate_by_name = True


class NoteUpdateResponse(BaseModel):
    """Response model for note update"""
    id: int
    isin: str
    status: str
    message: str
    
    class Config:
        populate_by_name = True


class NoteStatsResponse(BaseModel):
    """Response model for note statistics"""
    total_notes: int = Field(..., alias="totalNotes")
    total_amount: int = Field(..., alias="totalAmount")
    issued_count: int = Field(..., alias="issuedCount")
    redeemed_count: int = Field(..., alias="redeemedCount")
    expired_count: int = Field(..., alias="expiredCount")
    average_amount: float = Field(..., alias="averageAmount")
    
    class Config:
        populate_by_name = True


class PaginatedNotesResponse(BaseModel):
    """Response model for paginated notes"""
    notes: List[dict]
    total: int
    page: int
    limit: int
    has_more: bool = Field(..., alias="hasMore")
    
    class Config:
        populate_by_name = True


# Audit Log Types
class AuditLogEntry(BaseModel):
    """Single audit log entry"""
    id: int
    wallet_address: str = Field(..., alias="walletAddress")
    action: str
    performed_by: Optional[str] = Field(None, alias="performedBy")
    request_id: Optional[str] = Field(None, alias="requestId")
    timestamp: str
    metadata: Optional[dict] = None
    
    class Config:
        populate_by_name = True


class AuditLogsResponse(BaseModel):
    """Response model for audit logs query"""
    logs: List[AuditLogEntry]
    total: int
    page: int
    limit: int
    has_more: bool = Field(..., alias="hasMore")
    
    class Config:
        populate_by_name = True


# Wallet Details Types
class WalletDetailsResponse(BaseModel):
    """Response model for wallet details"""
    wallet_address: str = Field(..., alias="walletAddress")
    is_verified: bool = Field(..., alias="isVerified")
    verified_at: Optional[str] = Field(None, alias="verifiedAt")
    verified_by: Optional[str] = Field(None, alias="verifiedBy")
    total_notes: int = Field(..., alias="totalNotes")
    total_amount: int = Field(..., alias="totalAmount")
    first_note_date: Optional[str] = Field(None, alias="firstNoteDate")
    last_note_date: Optional[str] = Field(None, alias="lastNoteDate")
    notes: List[dict] = Field(default_factory=list)
    
    class Config:
        populate_by_name = True

