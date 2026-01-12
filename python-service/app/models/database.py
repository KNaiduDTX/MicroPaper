"""
SQLAlchemy database models
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Enum as SQLEnum, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class CurrencyEnum(str, enum.Enum):
    """Currency enumeration"""
    USD = "USD"
    USDC = "USDC"


class OfferingStatusEnum(str, enum.Enum):
    """Offering status enumeration - values match database enum"""
    OPEN = "open"
    CLOSED = "closed"
    SETTLED = "settled"


class OrderStatusEnum(str, enum.Enum):
    """Order status enumeration - values match database enum"""
    PENDING = "pending"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class OrderSideEnum(str, enum.Enum):
    """Order side enumeration - values match database enum"""
    BUY = "buy"
    SELL = "sell"


class InvestorTierEnum(str, enum.Enum):
    """Investor tier enumeration - values match database enum"""
    RETAIL = "retail"
    ACCREDITED = "accredited"
    INSTITUTIONAL = "institutional"


class WalletVerification(Base):
    """Wallet verification status table"""
    __tablename__ = "wallet_verifications"
    
    wallet_address = Column(String(42), primary_key=True, index=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    verified_by = Column(String(255), nullable=True)  # Admin/user who verified
    investor_tier = Column(String(20), nullable=True, comment="Investor classification tier (retail, accredited, institutional)")
    jurisdiction = Column(String(10), nullable=True, comment="Jurisdiction code (e.g., US, SG)")


class NoteIssuance(Base):
    """Note issuance records table"""
    __tablename__ = "note_issuances"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    isin = Column(String(12), unique=True, index=True, nullable=False)
    wallet_address = Column(String(42), index=True, nullable=False)
    amount = Column(Integer, nullable=False, comment="Total note amount in cents")
    maturity_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="issued", nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Settlement Layer fields
    interest_rate_bps = Column(Integer, nullable=False, comment="Interest rate in basis points (1 bp = 0.01%)")
    currency = Column(String(10), nullable=False, default=CurrencyEnum.USD.value)
    min_subscription_amount = Column(Integer, nullable=False, comment="Minimum subscription amount in cents")
    offering_status = Column(String(20), nullable=False, default=OfferingStatusEnum.CLOSED.value)
    
    # Relationships
    orders = relationship("Order", back_populates="note", cascade="all, delete-orphan")
    holdings = relationship("InvestorHolding", back_populates="note", cascade="all, delete-orphan")


class ComplianceAuditLog(Base):
    """Compliance audit log table"""
    __tablename__ = "compliance_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    wallet_address = Column(String(42), index=True, nullable=False)
    action = Column(String(50), nullable=False)  # 'check_status', 'verify', 'unverify'
    performed_by = Column(String(255), nullable=True)
    request_id = Column(String(255), index=True, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    metadata_json = Column("metadata", Text, nullable=True)  # JSON string for additional data


class InvestorHolding(Base):
    """Investor holdings table - tracks ownership of notes"""
    __tablename__ = "investor_holdings"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    wallet_address = Column(String(42), ForeignKey('wallet_verifications.wallet_address', ondelete='CASCADE'), nullable=False, index=True)
    note_id = Column(Integer, ForeignKey('note_issuances.id', ondelete='CASCADE'), nullable=False, index=True)
    quantity_held = Column(Integer, nullable=False, comment="Amount held in cents")
    acquisition_price = Column(Integer, nullable=False, comment="Price per unit in cents (typically 10000 = $100.00)")
    acquired_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    note = relationship("NoteIssuance", back_populates="holdings")


class Order(Base):
    """Orders table - tracks buy and sell orders for notes"""
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    investor_wallet = Column(String(42), ForeignKey('wallet_verifications.wallet_address', ondelete='CASCADE'), nullable=False, index=True)
    note_id = Column(Integer, ForeignKey('note_issuances.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = Column(Integer, nullable=False, comment="Order amount in cents")
    side = Column(String(10), nullable=False, default=OrderSideEnum.BUY.value, index=True, comment="Order side: buy or sell")
    price = Column(Integer, nullable=True, index=True, comment="Price per unit in cents (for limit orders)")
    status = Column(String(20), nullable=False, default=OrderStatusEnum.PENDING.value, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    filled_at = Column(DateTime(timezone=True), nullable=True)
    request_id = Column(String(255), nullable=True)
    
    # Relationships
    note = relationship("NoteIssuance", back_populates="orders")


class CollateralAsset(Base):
    """Collateral assets backing note issuances"""
    __tablename__ = "collateral_assets"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    note_id = Column(Integer, ForeignKey('note_issuances.id', ondelete='CASCADE'), nullable=False, index=True)
    asset_type = Column(String(20), nullable=False, comment="Asset type: cash, receivables, inventory")
    description = Column(String(500), nullable=True)
    valuation_cents = Column(BigInteger, nullable=False, comment="Valuation in cents")
    status = Column(String(20), nullable=False, default='active', comment="Status: active, liquidated")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    note = relationship("NoteIssuance", foreign_keys=[note_id])


class Guarantee(Base):
    """Guarantees backing note issuances"""
    __tablename__ = "guarantees"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    note_id = Column(Integer, ForeignKey('note_issuances.id', ondelete='CASCADE'), nullable=False, index=True)
    guarantor_type = Column(String(20), nullable=False, comment="Guarantor type: personal, bank, sba, insurance_pool")
    guarantor_name = Column(String(255), nullable=False)
    coverage_percent = Column(Integer, nullable=False, comment="Coverage percentage (0-100)")
    enforcement_status = Column(String(20), nullable=False, default='active', comment="Status: active, triggered")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    note = relationship("NoteIssuance", foreign_keys=[note_id])


class InsurancePoolContribution(Base):
    """Insurance pool contributions for note issuances"""
    __tablename__ = "insurance_pool_contributions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    note_id = Column(Integer, ForeignKey('note_issuances.id', ondelete='CASCADE'), nullable=False, index=True)
    amount_cents = Column(BigInteger, nullable=False, comment="Contribution amount in cents")
    contribution_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    note = relationship("NoteIssuance", foreign_keys=[note_id])


class Trade(Base):
    """Trades table - tracks executed trades in secondary market"""
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    buyer_wallet = Column(String(42), nullable=False, index=True)
    seller_wallet = Column(String(42), nullable=False, index=True)
    note_id = Column(Integer, ForeignKey('note_issuances.id', ondelete='CASCADE'), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, comment="Trade quantity in cents")
    price = Column(Integer, nullable=False, comment="Price per unit in cents")
    buy_order_id = Column(Integer, ForeignKey('orders.id', ondelete='SET NULL'), nullable=True, index=True)
    sell_order_id = Column(Integer, ForeignKey('orders.id', ondelete='SET NULL'), nullable=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    note = relationship("NoteIssuance", foreign_keys=[note_id])
    buy_order = relationship("Order", foreign_keys=[buy_order_id])
    sell_order = relationship("Order", foreign_keys=[sell_order_id])

