"""
SQLAlchemy database models
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from sqlalchemy.sql import func
from app.database import Base


class WalletVerification(Base):
    """Wallet verification status table"""
    __tablename__ = "wallet_verifications"
    
    wallet_address = Column(String(42), primary_key=True, index=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    verified_by = Column(String(255), nullable=True)  # Admin/user who verified


class NoteIssuance(Base):
    """Note issuance records table"""
    __tablename__ = "note_issuances"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    isin = Column(String(12), unique=True, index=True, nullable=False)
    wallet_address = Column(String(42), index=True, nullable=False)
    amount = Column(Integer, nullable=False)
    maturity_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="issued", nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ComplianceAuditLog(Base):
    """Compliance audit log table"""
    __tablename__ = "compliance_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    wallet_address = Column(String(42), index=True, nullable=False)
    action = Column(String(50), nullable=False)  # 'check_status', 'verify', 'unverify'
    performed_by = Column(String(255), nullable=True)
    request_id = Column(String(255), index=True, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    metadata = Column(Text, nullable=True)  # JSON string for additional data

