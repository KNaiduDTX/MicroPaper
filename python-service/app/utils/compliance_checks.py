"""
Compliance validation utilities for investment eligibility checks
"""

from typing import Optional


def validate_investment_eligibility(
    wallet_tier: Optional[str],
    wallet_jurisdiction: Optional[str],
    note_jurisdiction: Optional[str] = None
) -> bool:
    """
    Validate if an investor is eligible to invest based on tier and jurisdiction rules.
    
    Regulatory Rule:
    - If jurisdiction is 'US' and tier is 'retail', return False (strict SEC rules)
    - For all other combinations, return True
    
    Args:
        wallet_tier: Investor tier ('retail', 'accredited', 'institutional')
        wallet_jurisdiction: Investor's jurisdiction code (e.g., 'US', 'SG')
        note_jurisdiction: Note's jurisdiction (optional, for future use)
    
    Returns:
        bool: True if eligible, False otherwise
    """
    # If tier or jurisdiction is not provided, default to eligible (for backward compatibility)
    if not wallet_tier or not wallet_jurisdiction:
        return True
    
    # Normalize inputs to uppercase for comparison
    tier = wallet_tier.lower() if wallet_tier else None
    jurisdiction = wallet_jurisdiction.upper() if wallet_jurisdiction else None
    
    # SEC Rule: US retail investors are not eligible
    if jurisdiction == 'US' and tier == 'retail':
        return False
    
    # All other combinations are eligible
    return True
