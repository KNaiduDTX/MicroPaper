"""
Market API routes - Settlement & Trading Engine
Handles note offerings, investments, and settlement
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, asc
from typing import Optional, List
from datetime import datetime, timezone
import logging

from app.database import get_db
from app.models.database import (
    NoteIssuance, 
    WalletVerification, 
    Order, 
    InvestorHolding,
    OfferingStatusEnum,
    OrderStatusEnum
)
from app.models.schemas import (
    OfferingResponse,
    OfferingsResponse,
    OrderCreate,
    OrderResponse,
    HoldingResponse,
    SettleResponse
)
from app.utils.yield_calculator import YieldCalculator
from app.middleware.admin_auth import validate_admin_key

logger = logging.getLogger(__name__)

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


@router.get("/offerings", response_model=OfferingsResponse)
async def get_offerings(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(100, ge=1, le=1000, description="Items per page"),
    currency: Optional[str] = Query(None, description="Filter by currency (USD, USDC)"),
    min_rate_bps: Optional[int] = Query(None, alias="minRateBps", description="Minimum interest rate in basis points"),
    max_rate_bps: Optional[int] = Query(None, alias="maxRateBps", description="Maximum interest rate in basis points"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of open note offerings available for investment.
    Only returns notes where offering_status = 'open'.
    """
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        # Build base query - only open offerings
        query = select(NoteIssuance).where(
            NoteIssuance.offering_status == OfferingStatusEnum.OPEN.value
        )
        count_query = select(func.count(NoteIssuance.id)).where(
            NoteIssuance.offering_status == OfferingStatusEnum.OPEN.value
        )
        
        # Apply filters
        conditions = []
        
        if currency:
            conditions.append(NoteIssuance.currency == currency.upper())
        
        if min_rate_bps is not None:
            conditions.append(NoteIssuance.interest_rate_bps >= min_rate_bps)
        
        if max_rate_bps is not None:
            conditions.append(NoteIssuance.interest_rate_bps <= max_rate_bps)
        
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # Get total count
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply sorting (newest first)
        query = query.order_by(desc(NoteIssuance.issued_at))
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        notes = result.scalars().all()
        
        # Format results with yield calculations
        formatted_offerings = []
        for note in notes:
            # Calculate maturity value and APY
            maturity_value_cents = None
            apy = None
            
            try:
                maturity_value_cents, apy = YieldCalculator.calculate_yield_from_rate(
                    principal_cents=note.amount,
                    interest_rate_bps=note.interest_rate_bps,
                    issued_date=note.issued_at,
                    maturity_date=note.maturity_date
                )
            except Exception as e:
                logger.warning(f"Error calculating yield for note {note.id}: {e}", extra={"request_id": request_id})
            
            formatted_offerings.append(OfferingResponse(
                id=note.id,
                isin=note.isin,
                wallet_address=note.wallet_address,
                amount=note.amount,
                maturity_date=format_datetime(note.maturity_date),
                interest_rate_bps=note.interest_rate_bps,
                currency=note.currency.value,
                min_subscription_amount=note.min_subscription_amount,
                offering_status=note.offering_status,
                issued_at=format_datetime(note.issued_at),
                maturity_value_cents=maturity_value_cents,
                apy=apy
            ))
        
        return OfferingsResponse(
            offerings=formatted_offerings,
            total=total,
            page=page,
            limit=limit,
            has_more=(offset + limit) < total
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving offerings: {e}", extra={"request_id": request_id}, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offerings: {str(e)}"
        )


@router.post("/invest", response_model=OrderResponse)
async def create_investment_order(
    request: Request,
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create an investment order for a note.
    Validates that:
    1. Investor wallet is KYC'd (verified)
    2. Note exists and is open for investment
    3. Amount meets minimum subscription requirement
    """
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    # Get investor wallet from request (could be from auth token in production)
    # For now, we'll need to add it to the request body or header
    # Assuming it's in a custom header for MVP
    investor_wallet = request.headers.get("X-Investor-Wallet")
    if not investor_wallet:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Investor-Wallet header is required"
        )
    
    investor_wallet = investor_wallet.lower()
    
    try:
        # Validate investor is KYC'd
        wallet_result = await db.execute(
            select(WalletVerification).where(
                WalletVerification.wallet_address == investor_wallet
            )
        )
        wallet = wallet_result.scalar_one_or_none()
        
        if not wallet or not wallet.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Investor wallet must be verified (KYC'd) to place orders"
            )
        
        # Validate note exists and is open
        note_result = await db.execute(
            select(NoteIssuance).where(NoteIssuance.id == order_data.note_id)
        )
        note = note_result.scalar_one_or_none()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {order_data.note_id} not found"
            )
        
        if note.offering_status != OfferingStatusEnum.OPEN.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Note offering is not open for investment (status: {note.offering_status.value})"
            )
        
        # Validate amount meets minimum subscription
        if order_data.amount < note.min_subscription_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Investment amount must be at least {note.min_subscription_amount} cents (${note.min_subscription_amount / 100:.2f})"
            )
        
        # Validate amount is multiple of min_subscription_amount (business rule)
        if order_data.amount % note.min_subscription_amount != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Investment amount must be a multiple of {note.min_subscription_amount} cents"
            )
        
        # Create order
        order = Order(
            investor_wallet=investor_wallet,
            note_id=order_data.note_id,
            amount=order_data.amount,
            status=OrderStatusEnum.PENDING.value,
            request_id=request_id
        )
        
        db.add(order)
        await db.commit()
        await db.refresh(order)
        
        logger.info(
            f"Investment order created: Order ID {order.id}, Note {order_data.note_id}, Amount {order_data.amount} cents",
            extra={"request_id": request_id, "order_id": order.id, "note_id": order_data.note_id}
        )
        
        return OrderResponse(
            id=order.id,
            investor_wallet=order.investor_wallet,
            note_id=order.note_id,
            amount=order.amount,
            status=order.status,
            created_at=format_datetime(order.created_at),
            filled_at=format_datetime(order.filled_at) if order.filled_at else None,
            request_id=order.request_id
        )
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        try:
            await db.rollback()
        except Exception as rollback_error:
            logger.error(f"Error during rollback: {rollback_error}", extra={"request_id": request_id}, exc_info=True)
        logger.error(f"Error creating investment order: {e}", extra={"request_id": request_id}, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create investment order: {str(e)}"
        )


@router.post("/settle/{note_id}", response_model=SettleResponse)
async def settle_note(
    request: Request,
    note_id: int = Path(..., description="Note ID to settle"),
    db: AsyncSession = Depends(get_db),
    _admin_auth: bool = Depends(validate_admin_key)
):
    """
    Settle a note offering (Admin only).
    
    Requires X-Admin-Key header for authentication.
    
    This endpoint:
    1. Aggregates all pending orders for the note
    2. If fully subscribed (total orders >= note amount), updates note to 'settled'
    3. Creates investor_holdings records for all filled orders
    4. Updates order statuses to 'filled'
    """
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        # Get note
        note_result = await db.execute(
            select(NoteIssuance).where(NoteIssuance.id == note_id)
        )
        note = note_result.scalar_one_or_none()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {note_id} not found"
            )
        
        if note.offering_status == OfferingStatusEnum.SETTLED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Note is already settled"
            )
        
        # Get all pending orders for this note
        orders_result = await db.execute(
            select(Order).where(
                and_(
                    Order.note_id == note_id,
                    Order.status == OrderStatusEnum.PENDING.value
                )
            )
        )
        pending_orders = orders_result.scalars().all()
        
        # Calculate total subscribed amount
        total_subscribed = sum(order.amount for order in pending_orders)
        
        # Check if fully subscribed
        if total_subscribed < note.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Note is not fully subscribed. Total subscribed: {total_subscribed} cents, Required: {note.amount} cents"
            )
        
        # If over-subscribed, we'll fill proportionally (simple approach: fill all orders)
        # In production, you might want more sophisticated allocation logic
        
        # Create holdings and update orders
        holdings_created = 0
        orders_filled = 0
        filled_at = datetime.now(timezone.utc)
        
        for order in pending_orders:
            # Calculate acquisition price (typically par value = 10000 cents per $100 unit)
            # For simplicity, we'll use 10000 cents per unit
            # In production, this might be calculated based on market conditions
            acquisition_price = 10000  # $100.00 per unit
            
            # Create holding
            holding = InvestorHolding(
                wallet_address=order.investor_wallet,
                note_id=note.id,
                quantity_held=order.amount,
                acquisition_price=acquisition_price
            )
            db.add(holding)
            holdings_created += 1
            
            # Update order status
                order.status = OrderStatusEnum.FILLED.value
            order.filled_at = filled_at
            orders_filled += 1
        
        # Update note status to settled
        note.offering_status = OfferingStatusEnum.SETTLED.value
        
        await db.commit()
        
        logger.info(
            f"Note {note_id} settled: {orders_filled} orders filled, {holdings_created} holdings created",
            extra={"request_id": request_id, "note_id": note_id, "total_subscribed": total_subscribed}
        )
        
        return SettleResponse(
            success=True,
            message=f"Note {note_id} successfully settled",
            note_id=note_id,
            total_subscribed=total_subscribed,
            total_offering=note.amount,
            orders_filled=orders_filled,
            holdings_created=holdings_created,
            request_id=request_id
        )
    except HTTPException:
        try:
            await db.rollback()
        except Exception as rollback_error:
            logger.error(f"Error during rollback: {rollback_error}", extra={"request_id": request_id}, exc_info=True)
        raise
    except Exception as e:
        try:
            await db.rollback()
        except Exception as rollback_error:
            logger.error(f"Error during rollback: {rollback_error}", extra={"request_id": request_id}, exc_info=True)
        logger.error(f"Error settling note: {e}", extra={"request_id": request_id}, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to settle note: {str(e)}"
        )


@router.get("/holdings", response_model=List[HoldingResponse])
async def get_holdings(
    request: Request,
    wallet_address: Optional[str] = Query(None, alias="walletAddress", description="Filter by wallet address"),
    note_id: Optional[int] = Query(None, alias="noteId", description="Filter by note ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get investor holdings with yield calculations.
    """
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        # Build query
        query = select(InvestorHolding, NoteIssuance).join(
            NoteIssuance, InvestorHolding.note_id == NoteIssuance.id
        )
        
        conditions = []
        
        if wallet_address:
            conditions.append(InvestorHolding.wallet_address == wallet_address.lower())
        
        if note_id:
            conditions.append(InvestorHolding.note_id == note_id)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Execute query
        result = await db.execute(query)
        rows = result.all()
        
        # Format results
        holdings = []
        for holding, note in rows:
            # Calculate maturity value and APY
            maturity_value_cents = None
            apy = None
            
            try:
                maturity_value_cents, apy = YieldCalculator.calculate_yield_from_rate(
                    principal_cents=holding.quantity_held,
                    interest_rate_bps=note.interest_rate_bps,
                    issued_date=note.issued_at,
                    maturity_date=note.maturity_date
                )
            except Exception as e:
                logger.warning(f"Error calculating yield for holding {holding.id}: {e}", extra={"request_id": request_id})
            
            holdings.append(HoldingResponse(
                id=holding.id,
                wallet_address=holding.wallet_address,
                note_id=holding.note_id,
                isin=note.isin,
                quantity_held=holding.quantity_held,
                acquisition_price=holding.acquisition_price,
                acquired_at=format_datetime(holding.acquired_at),
                maturity_date=format_datetime(note.maturity_date),
                maturity_value_cents=maturity_value_cents,
                apy=apy
            ))
        
        return holdings
    except Exception as e:
        logger.error(f"Error retrieving holdings: {e}", extra={"request_id": request_id}, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve holdings: {str(e)}"
        )
