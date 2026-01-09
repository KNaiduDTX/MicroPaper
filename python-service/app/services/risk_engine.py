"""
Risk Engine Service - Calculates protection waterfall for notes
Implements the risk waterfall logic from the MicroPaper whitepaper
"""

from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import logging

from app.models.database import (
    NoteIssuance,
    CollateralAsset,
    Guarantee,
    InsurancePoolContribution
)

logger = logging.getLogger(__name__)


class RiskEngine:
    """Risk Engine for calculating investor protection waterfall"""
    
    @staticmethod
    async def calculate_protection_waterfall(
        note_id: int,
        db: AsyncSession
    ) -> Dict:
        """
        Calculate the protection waterfall for a note.
        
        Risk Waterfall Order (in case of default):
        1. Collateral (e.g., Cash Reserves, Inventory)
        2. Guarantees (e.g., Personal, SBA, Bank)
        3. Insurance Pool
        
        Args:
            note_id: ID of the note to calculate protection for
            db: Database session
        
        Returns:
            Dictionary with protection breakdown:
            {
                "face_value": int,
                "collateral_coverage": int,
                "guarantee_coverage": int,
                "insurance_pool_claim": int,
                "uncovered_exposure": int,
                "protection_summary": str
            }
        """
        # Fetch the note
        note_result = await db.execute(
            select(NoteIssuance).where(NoteIssuance.id == note_id)
        )
        note = note_result.scalar_one_or_none()
        
        if not note:
            raise ValueError(f"Note with ID {note_id} not found")
        
        face_value = note.amount
        
        # 1. Calculate Collateral Coverage
        # Sum all active collateral assets
        collateral_result = await db.execute(
            select(func.sum(CollateralAsset.valuation_cents))
            .where(
                CollateralAsset.note_id == note_id,
                CollateralAsset.status == 'active'
            )
        )
        collateral_coverage = collateral_result.scalar() or 0
        
        # 2. Calculate Guarantee Coverage
        # Sum coverage from all active guarantees
        # Coverage = note_amount * coverage_percent / 100 for each guarantee
        guarantees_result = await db.execute(
            select(Guarantee)
            .where(
                Guarantee.note_id == note_id,
                Guarantee.enforcement_status == 'active'
            )
        )
        guarantees = guarantees_result.scalars().all()
        
        guarantee_coverage = 0
        for guarantee in guarantees:
            # Calculate coverage amount: face_value * coverage_percent / 100
            coverage_amount = int(face_value * guarantee.coverage_percent / 100)
            guarantee_coverage += coverage_amount
        
        # Cap guarantee coverage at face_value (can't exceed 100%)
        guarantee_coverage = min(guarantee_coverage, face_value)
        
        # 3. Calculate Insurance Pool Claim
        # Sum all insurance pool contributions for this note
        insurance_result = await db.execute(
            select(func.sum(InsurancePoolContribution.amount_cents))
            .where(InsurancePoolContribution.note_id == note_id)
        )
        insurance_pool_claim = insurance_result.scalar() or 0
        
        # Calculate total protection (in waterfall order)
        # Note: In a default scenario, we use collateral first, then guarantees, then insurance
        # For visualization, we show all layers but calculate uncovered exposure
        total_protection = collateral_coverage + guarantee_coverage + insurance_pool_claim
        
        # Calculate uncovered exposure
        # This is the amount that would not be covered in a default scenario
        # We apply protection in waterfall order:
        # 1. Use collateral first
        remaining_after_collateral = max(0, face_value - collateral_coverage)
        # 2. Use guarantees next
        remaining_after_guarantees = max(0, remaining_after_collateral - guarantee_coverage)
        # 3. Use insurance pool last
        uncovered_exposure = max(0, remaining_after_guarantees - insurance_pool_claim)
        
        # Calculate protection percentage
        protected_amount = face_value - uncovered_exposure
        protection_percent = (protected_amount / face_value * 100) if face_value > 0 else 0
        
        # Format protection summary
        protection_summary = f"{protection_percent:.0f}% Secured"
        
        return {
            "face_value": face_value,
            "collateral_coverage": collateral_coverage,
            "guarantee_coverage": guarantee_coverage,
            "insurance_pool_claim": insurance_pool_claim,
            "uncovered_exposure": uncovered_exposure,
            "protection_summary": protection_summary,
            "protection_percent": round(protection_percent, 2)
        }
