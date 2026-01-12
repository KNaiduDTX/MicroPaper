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
    Trade,
    OfferingStatusEnum,
    OrderStatusEnum,
    OrderSideEnum
)
from app.models.schemas import (
    OfferingResponse,
    OfferingsResponse,
    OrderCreate,
    OrderResponse,
    HoldingResponse,
    SettleResponse,
    RiskBreakdownResponse,
    TradeResponse,
    MatchResponse
)
from app.utils.compliance_checks import validate_investment_eligibility
from app.utils.yield_calculator import YieldCalculator
from app.services.risk_engine import RiskEngine
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
        
        # Format results with yield calculations and protection summary
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
            
            # Calculate protection summary using RiskEngine
            protection_summary = None
            try:
                risk_data = await RiskEngine.calculate_protection_waterfall(note.id, db)
                protection_summary = risk_data.get("protection_summary")
            except Exception as e:
                logger.warning(f"Error calculating protection for note {note.id}: {e}", extra={"request_id": request_id})
            
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
                apy=apy,
                protection_summary=protection_summary
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


@router.post("/order", response_model=OrderResponse)
async def create_order(
    request: Request,
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create an order (buy or sell) for a note.
    
    For Buy Orders:
    - Validates investor wallet is KYC'd (verified)
    - Validates compliance eligibility
    - Validates note exists and is open for investment (primary market)
    - Validates amount meets minimum subscription requirement
    
    For Sell Orders:
    - Validates investor wallet has sufficient holdings
    - Validates note exists
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
    
    # Validate side
    if order_data.side not in ['buy', 'sell']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order side must be 'buy' or 'sell'"
        )
    
    try:
        # Validate note exists
        note_result = await db.execute(
            select(NoteIssuance).where(NoteIssuance.id == order_data.note_id)
        )
        note = note_result.scalar_one_or_none()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {order_data.note_id} not found"
            )
        
        # Validate investor wallet
        wallet_result = await db.execute(
            select(WalletVerification).where(
                WalletVerification.wallet_address == investor_wallet
            )
        )
        wallet = wallet_result.scalar_one_or_none()
        
        if order_data.side == 'buy':
            # Buy order validations
            if not wallet or not wallet.is_verified:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Investor wallet must be verified (KYC'd) to place buy orders"
                )
            
            # Validate compliance eligibility
            if wallet.investor_tier and wallet.jurisdiction:
                is_eligible = validate_investment_eligibility(
                    wallet_tier=wallet.investor_tier,
                    wallet_jurisdiction=wallet.jurisdiction
                )
                if not is_eligible:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Investor is not eligible to invest based on compliance rules"
                    )
            
            # For primary market buy orders, validate offering is open
            if note.offering_status == OfferingStatusEnum.OPEN.value:
                # Validate amount meets minimum subscription
                if order_data.amount < note.min_subscription_amount:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Investment amount must be at least {note.min_subscription_amount} cents (${note.min_subscription_amount / 100:.2f})"
                    )
                
                # Validate amount is multiple of min_subscription_amount
                if order_data.amount % note.min_subscription_amount != 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Investment amount must be a multiple of {note.min_subscription_amount} cents"
                    )
        
        elif order_data.side == 'sell':
            # Sell order validations - check sufficient holdings
            holdings_result = await db.execute(
                select(func.sum(InvestorHolding.quantity_held))
                .where(
                    InvestorHolding.wallet_address == investor_wallet,
                    InvestorHolding.note_id == order_data.note_id
                )
            )
            total_holdings = holdings_result.scalar() or 0
            
            if total_holdings < order_data.amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient holdings. Available: {total_holdings} cents, Requested: {order_data.amount} cents"
                )
        
        # Create order
        order = Order(
            investor_wallet=investor_wallet,
            note_id=order_data.note_id,
            amount=order_data.amount,
            side=order_data.side,
            price=order_data.price,
            status=OrderStatusEnum.PENDING.value,
            request_id=request_id
        )
        
        db.add(order)
        await db.commit()
        await db.refresh(order)
        
        logger.info(
            f"Order created: Order ID {order.id}, Side {order.side}, Note {order_data.note_id}, Amount {order_data.amount} cents",
            extra={"request_id": request_id, "order_id": order.id, "note_id": order_data.note_id, "side": order.side}
        )
        
        return OrderResponse(
            id=order.id,
            investor_wallet=order.investor_wallet,
            note_id=order.note_id,
            amount=order.amount,
            side=order.side,
            price=order.price,
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
            detail=f"Failed to create order: {str(e)}"
        )


# Keep /invest as deprecated alias for backward compatibility
@router.post("/invest", response_model=OrderResponse)
async def create_investment_order_deprecated(
    request: Request,
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    [DEPRECATED] Use POST /api/market/order instead.
    Create an investment order for a note (buy orders only).
    """
    # Set side to 'buy' if not provided for backward compatibility
    if not hasattr(order_data, 'side') or order_data.side is None:
        order_data.side = 'buy'
    elif order_data.side != 'buy':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint only supports buy orders. Use POST /api/market/order for sell orders."
        )
    
    return await create_order(request, order_data, db)


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


@router.get("/notes/{note_id}/risk-breakdown", response_model=RiskBreakdownResponse)
async def get_risk_breakdown(
    request: Request,
    note_id: int = Path(..., description="Note ID to get risk breakdown for"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get risk breakdown/waterfall for a specific note.
    
    Returns the protection waterfall showing:
    - Collateral coverage
    - Guarantee coverage
    - Insurance pool claim
    - Uncovered exposure
    - Protection summary percentage
    """
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        # Calculate protection waterfall using RiskEngine
        risk_data = await RiskEngine.calculate_protection_waterfall(note_id, db)
        
        return RiskBreakdownResponse(
            face_value=risk_data["face_value"],
            collateral_coverage=risk_data["collateral_coverage"],
            guarantee_coverage=risk_data["guarantee_coverage"],
            insurance_pool_claim=risk_data["insurance_pool_claim"],
            uncovered_exposure=risk_data["uncovered_exposure"],
            protection_summary=risk_data["protection_summary"],
            protection_percent=risk_data["protection_percent"]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error calculating risk breakdown for note {note_id}: {e}", extra={"request_id": request_id}, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate risk breakdown: {str(e)}"
        )


async def match_orders(note_id: int, db: AsyncSession) -> List[Trade]:
    """
    Match buy and sell orders for a note.
    
    Matching Logic:
    - Fetches all pending orders for the note
    - Matches Buy orders with Sell orders where buy_price >= sell_price
    - Creates trade records
    - Updates investor_holdings (decrement seller, increment buyer)
    - Updates order statuses to 'filled'
    
    Args:
        note_id: ID of the note to match orders for
        db: Database session
    
    Returns:
        List of executed trades
    """
    # Fetch all pending orders for this note
    orders_result = await db.execute(
        select(Order).where(
            and_(
                Order.note_id == note_id,
                Order.status == OrderStatusEnum.PENDING.value
            )
        ).order_by(Order.created_at.asc())
    )
    all_orders = orders_result.scalars().all()
    
    # Separate buy and sell orders
    buy_orders = [o for o in all_orders if o.side == OrderSideEnum.BUY.value]
    sell_orders = [o for o in all_orders if o.side == OrderSideEnum.SELL.value]
    
    executed_trades = []
    filled_at = datetime.now(timezone.utc)
    
    # Match orders: buy_price >= sell_price
    for buy_order in buy_orders:
        if buy_order.status != OrderStatusEnum.PENDING.value:
            continue
        
        # Find matching sell orders
        # If buy_order has a price, match with sell orders where sell_price <= buy_price
        # If buy_order has no price (market order), match with any sell order
        matching_sells = []
        for sell_order in sell_orders:
            if sell_order.status != OrderStatusEnum.PENDING.value:
                continue
            
            # Price matching logic
            if buy_order.price is not None and sell_order.price is not None:
                # Both are limit orders - match if buy_price >= sell_price
                if buy_order.price >= sell_order.price:
                    matching_sells.append(sell_order)
            elif buy_order.price is None:
                # Market buy order - match with any sell order
                matching_sells.append(sell_order)
            elif sell_order.price is None:
                # Market sell order - match with any buy order
                matching_sells.append(sell_order)
        
        # Sort matching sells by price (lowest first) and creation time
        matching_sells.sort(key=lambda x: (x.price if x.price is not None else 0, x.created_at))
        
        # Match buy order with sell orders
        remaining_buy_amount = buy_order.amount
        
        for sell_order in matching_sells:
            if remaining_buy_amount <= 0:
                break
            
            # Determine trade quantity (min of buy remaining and sell remaining)
            sell_remaining = sell_order.amount - sum(
                t.quantity for t in executed_trades 
                if t.sell_order_id == sell_order.id
            )
            
            if sell_remaining <= 0:
                continue
            
            trade_quantity = min(remaining_buy_amount, sell_remaining)
            
            # Determine trade price
            # Use the sell order price if available, otherwise buy order price, otherwise market price
            if sell_order.price is not None:
                trade_price = sell_order.price
            elif buy_order.price is not None:
                trade_price = buy_order.price
            else:
                # Both are market orders - use a default price (could be last trade price or note par value)
                # For now, use 10000 cents ($100) as default
                trade_price = 10000
            
            # Create trade record
            trade = Trade(
                buyer_wallet=buy_order.investor_wallet,
                seller_wallet=sell_order.investor_wallet,
                note_id=note_id,
                quantity=trade_quantity,
                price=trade_price,
                buy_order_id=buy_order.id,
                sell_order_id=sell_order.id,
                timestamp=filled_at
            )
            db.add(trade)
            executed_trades.append(trade)
            
            # Update holdings: decrement seller, increment buyer
            # Find or create seller holding to decrement
            seller_holding_result = await db.execute(
                select(InvestorHolding).where(
                    and_(
                        InvestorHolding.wallet_address == sell_order.investor_wallet,
                        InvestorHolding.note_id == note_id
                    )
                ).order_by(InvestorHolding.acquired_at.asc())
            )
            seller_holdings = seller_holding_result.scalars().all()
            
            # Decrement from seller holdings (FIFO)
            remaining_to_decrement = trade_quantity
            for holding in seller_holdings:
                if remaining_to_decrement <= 0:
                    break
                if holding.quantity_held > 0:
                    decrement_amount = min(remaining_to_decrement, holding.quantity_held)
                    holding.quantity_held -= decrement_amount
                    remaining_to_decrement -= decrement_amount
            
            # Increment buyer holding
            # Check if buyer already has a holding for this note
            buyer_holding_result = await db.execute(
                select(InvestorHolding).where(
                    and_(
                        InvestorHolding.wallet_address == buy_order.investor_wallet,
                        InvestorHolding.note_id == note_id
                    )
                ).order_by(InvestorHolding.acquired_at.desc()).limit(1)
            )
            buyer_holding = buyer_holding_result.scalar_one_or_none()
            
            if buyer_holding:
                # Add to existing holding
                buyer_holding.quantity_held += trade_quantity
            else:
                # Create new holding
                buyer_holding = InvestorHolding(
                    wallet_address=buy_order.investor_wallet,
                    note_id=note_id,
                    quantity_held=trade_quantity,
                    acquisition_price=trade_price
                )
                db.add(buyer_holding)
            
            # Update order statuses
            remaining_buy_amount -= trade_quantity
            
            # Check if buy order is fully filled
            if remaining_buy_amount <= 0:
                buy_order.status = OrderStatusEnum.FILLED.value
                buy_order.filled_at = filled_at
            
            # Check if sell order is fully filled
            sell_filled_quantity = sum(
                t.quantity for t in executed_trades 
                if t.sell_order_id == sell_order.id
            ) + trade_quantity
            
            if sell_filled_quantity >= sell_order.amount:
                sell_order.status = OrderStatusEnum.FILLED.value
                sell_order.filled_at = filled_at
    
    return executed_trades


@router.post("/match/{note_id}", response_model=MatchResponse)
async def match_orders_endpoint(
    request: Request,
    note_id: int = Path(..., description="Note ID to match orders for"),
    db: AsyncSession = Depends(get_db),
    _admin_auth: bool = Depends(validate_admin_key)
):
    """
    Match buy and sell orders for a note (Admin only).
    
    Requires X-Admin-Key header for authentication.
    
    This endpoint:
    1. Fetches all pending orders for the note
    2. Matches Buy orders with Sell orders where buy_price >= sell_price
    3. Creates trade records
    4. Updates investor_holdings (decrement seller, increment buyer)
    5. Updates order statuses to 'filled'
    """
    request_id = request.headers.get("X-Request-ID")
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    try:
        # Validate note exists
        note_result = await db.execute(
            select(NoteIssuance).where(NoteIssuance.id == note_id)
        )
        note = note_result.scalar_one_or_none()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {note_id} not found"
            )
        
        # Execute matching
        executed_trades = await match_orders(note_id, db)
        
        # Commit all changes
        await db.commit()
        
        # Refresh trades to get IDs
        for trade in executed_trades:
            await db.refresh(trade)
        
        # Format trade responses
        trade_responses = [
            TradeResponse(
                id=trade.id,
                buyer_wallet=trade.buyer_wallet,
                seller_wallet=trade.seller_wallet,
                note_id=trade.note_id,
                quantity=trade.quantity,
                price=trade.price,
                buy_order_id=trade.buy_order_id,
                sell_order_id=trade.sell_order_id,
                timestamp=format_datetime(trade.timestamp)
            )
            for trade in executed_trades
        ]
        
        total_quantity = sum(trade.quantity for trade in executed_trades)
        
        logger.info(
            f"Order matching completed for note {note_id}: {len(executed_trades)} trades executed, {total_quantity} cents total",
            extra={"request_id": request_id, "note_id": note_id, "trades_count": len(executed_trades)}
        )
        
        return MatchResponse(
            success=True,
            message=f"Successfully matched orders for note {note_id}",
            note_id=note_id,
            trades_executed=len(executed_trades),
            total_quantity=total_quantity,
            trades=trade_responses,
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
        logger.error(f"Error matching orders: {e}", extra={"request_id": request_id}, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to match orders: {str(e)}"
        )
