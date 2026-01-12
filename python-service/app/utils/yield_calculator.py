"""
Yield Calculator Utility
Calculates maturity value and APY for commercial paper notes using integer math
"""

from datetime import datetime, timezone
from typing import Tuple
from decimal import Decimal, ROUND_DOWN


class YieldCalculator:
    """
    Utility class for calculating yield and maturity values.
    Uses integer math (cents) to avoid floating point errors.
    """
    
    @staticmethod
    def calculate_maturity_value(
        principal_cents: int,
        interest_rate_bps: int,
        days_to_maturity: int
    ) -> int:
        """
        Calculate maturity value in cents using simple interest.
        
        Formula: Maturity Value = Principal * (1 + (Rate * Days / 360))
        Where Rate is in basis points (bps), so we divide by 10000 to get decimal
        
        Args:
            principal_cents: Principal amount in cents
            interest_rate_bps: Interest rate in basis points (e.g., 500 = 5.00%)
            days_to_maturity: Number of days until maturity
            
        Returns:
            Maturity value in cents (rounded down)
        """
        if principal_cents <= 0:
            return 0
        if interest_rate_bps < 0:
            raise ValueError("Interest rate cannot be negative")
        if days_to_maturity < 0:
            raise ValueError("Days to maturity cannot be negative")
        
        # Convert basis points to decimal (500 bps = 0.05 = 5%)
        rate_decimal = Decimal(interest_rate_bps) / Decimal(10000)
        
        # Calculate interest: Principal * Rate * (Days / 360)
        # Using 360-day year convention (commercial paper standard)
        days_decimal = Decimal(days_to_maturity) / Decimal(360)
        interest_cents = Decimal(principal_cents) * rate_decimal * days_decimal
        
        # Maturity value = Principal + Interest
        maturity_value = Decimal(principal_cents) + interest_cents
        
        # Round down to nearest cent (integer)
        return int(maturity_value.quantize(Decimal('1'), rounding=ROUND_DOWN))
    
    @staticmethod
    def calculate_apy(
        principal_cents: int,
        maturity_value_cents: int,
        days_to_maturity: int
    ) -> float:
        """
        Calculate Annual Percentage Yield (APY).
        
        Formula: APY = ((Maturity Value / Principal) - 1) * (365 / Days)
        
        Args:
            principal_cents: Principal amount in cents
            maturity_value_cents: Maturity value in cents
            days_to_maturity: Number of days until maturity
            
        Returns:
            APY as a float percentage (e.g., 5.25 = 5.25%)
        """
        if principal_cents <= 0:
            return 0.0
        if days_to_maturity <= 0:
            return 0.0
        
        # Calculate return ratio
        return_ratio = Decimal(maturity_value_cents) / Decimal(principal_cents)
        
        # Calculate annualized return
        # Using 365-day year for APY calculation
        annualized_return = (return_ratio - Decimal('1')) * (Decimal('365') / Decimal(days_to_maturity))
        
        # Convert to percentage
        apy_percentage = float(annualized_return * Decimal('100'))
        
        return round(apy_percentage, 2)
    
    @staticmethod
    def calculate_yield_from_rate(
        principal_cents: int,
        interest_rate_bps: int,
        issued_date: datetime,
        maturity_date: datetime
    ) -> Tuple[int, float]:
        """
        Calculate maturity value and APY from interest rate and dates.
        
        Args:
            principal_cents: Principal amount in cents
            interest_rate_bps: Interest rate in basis points
            issued_date: Date when note was issued
            maturity_date: Date when note matures
            
        Returns:
            Tuple of (maturity_value_cents, apy_percentage)
        """
        # Ensure both dates are timezone-aware
        if issued_date.tzinfo is None:
            issued_date = issued_date.replace(tzinfo=timezone.utc)
        if maturity_date.tzinfo is None:
            maturity_date = maturity_date.replace(tzinfo=timezone.utc)
        
        # Calculate days to maturity
        delta = maturity_date - issued_date
        days_to_maturity = delta.days
        
        if days_to_maturity <= 0:
            return principal_cents, 0.0
        
        # Calculate maturity value
        maturity_value_cents = YieldCalculator.calculate_maturity_value(
            principal_cents,
            interest_rate_bps,
            days_to_maturity
        )
        
        # Calculate APY
        apy = YieldCalculator.calculate_apy(
            principal_cents,
            maturity_value_cents,
            days_to_maturity
        )
        
        return maturity_value_cents, apy
    
    @staticmethod
    def format_cents_to_dollars(cents: int) -> str:
        """
        Format cents to dollar string representation.
        
        Args:
            cents: Amount in cents
            
        Returns:
            Formatted string (e.g., "10000" -> "$100.00")
        """
        dollars = Decimal(cents) / Decimal('100')
        return f"${dollars:,.2f}"
    
    @staticmethod
    def format_bps_to_percentage(bps: int) -> str:
        """
        Format basis points to percentage string.
        
        Args:
            bps: Interest rate in basis points
            
        Returns:
            Formatted string (e.g., 500 -> "5.00%")
        """
        percentage = Decimal(bps) / Decimal('100')
        return f"{percentage:.2f}%"
