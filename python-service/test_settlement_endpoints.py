"""
Test script for Settlement Layer endpoints
Tests the new market API endpoints
"""

import asyncio
import sys
from datetime import datetime, timezone, timedelta
from app.database import init_db, get_db
from app.models.database import (
    NoteIssuance, 
    WalletVerification, 
    Order, 
    InvestorHolding,
    CurrencyEnum,
    OfferingStatusEnum,
    OrderStatusEnum
)
from app.utils.yield_calculator import YieldCalculator
from sqlalchemy import select, func


async def test_yield_calculator():
    """Test YieldCalculator utility"""
    print("\n🧮 Testing Yield Calculator...")
    
    # Test 1: Calculate maturity value
    principal = 100000  # $1,000
    rate_bps = 500  # 5.00%
    days = 90
    
    maturity = YieldCalculator.calculate_maturity_value(principal, rate_bps, days)
    print(f"   ✅ Maturity Value: ${maturity/100:.2f} (Principal: ${principal/100:.2f}, Rate: {rate_bps/100}%, Days: {days})")
    
    # Test 2: Calculate APY
    apy = YieldCalculator.calculate_apy(principal, maturity, days)
    print(f"   ✅ APY: {apy:.2f}%")
    
    # Test 3: Calculate from rate and dates
    issued = datetime.now(timezone.utc)
    maturity_date = issued + timedelta(days=90)
    maturity_val, apy_val = YieldCalculator.calculate_yield_from_rate(
        principal, rate_bps, issued, maturity_date
    )
    print(f"   ✅ From Dates - Maturity: ${maturity_val/100:.2f}, APY: {apy_val:.2f}%")
    
    return True


async def test_database_schema():
    """Test that new tables and columns exist"""
    print("\n🗄️  Testing Database Schema...")
    
    async for db in get_db():
        if db is None:
            print("   ❌ Database session is None")
            return False
        
        try:
            # Test note_issuances new columns
            result = await db.execute(
                select(NoteIssuance).limit(1)
            )
            note = result.scalar_one_or_none()
            
            if note:
                print(f"   ✅ Note has new fields:")
                print(f"      - interest_rate_bps: {note.interest_rate_bps}")
                print(f"      - currency: {note.currency}")
                print(f"      - min_subscription_amount: {note.min_subscription_amount}")
                print(f"      - offering_status: {note.offering_status}")
            else:
                print("   ⚠️  No notes found (this is OK if database is empty)")
            
            # Test investor_holdings table exists
            result = await db.execute(
                select(func.count(InvestorHolding.id))
            )
            count = result.scalar() or 0
            print(f"   ✅ investor_holdings table exists (count: {count})")
            
            # Test orders table exists
            result = await db.execute(
                select(func.count(Order.id))
            )
            count = result.scalar() or 0
            print(f"   ✅ orders table exists (count: {count})")
            
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False


async def test_create_note_with_settlement_fields():
    """Test creating a note with settlement layer fields"""
    print("\n📝 Testing Note Creation with Settlement Fields...")
    
    async for db in get_db():
        if db is None:
            print("   ❌ Database session is None")
            return False
        
        try:
            # Create test wallet if it doesn't exist
            test_wallet = "0x1234567890123456789012345678901234567890"
            wallet_result = await db.execute(
                select(WalletVerification).where(
                    WalletVerification.wallet_address == test_wallet
                )
            )
            wallet = wallet_result.scalar_one_or_none()
            
            if not wallet:
                wallet = WalletVerification(
                    wallet_address=test_wallet,
                    is_verified=True,
                    verified_by="test_script"
                )
                db.add(wallet)
                await db.commit()
                print(f"   ✅ Created test wallet: {test_wallet}")
            
            # Create a note with settlement fields
            maturity_date = datetime.now(timezone.utc) + timedelta(days=90)
            note = NoteIssuance(
                isin="USMOCK999999",
                wallet_address=test_wallet,
                amount=1000000,  # $10,000
                maturity_date=maturity_date,
                status="issued",
                interest_rate_bps=500,  # 5.00%
                currency=CurrencyEnum.USD,
                min_subscription_amount=10000,  # $100
                offering_status=OfferingStatusEnum.OPEN
            )
            
            db.add(note)
            await db.commit()
            await db.refresh(note)
            
            print(f"   ✅ Created note with settlement fields:")
            print(f"      - ID: {note.id}")
            print(f"      - ISIN: {note.isin}")
            print(f"      - Amount: ${note.amount/100:.2f}")
            print(f"      - Interest Rate: {note.interest_rate_bps/100}%")
            print(f"      - Currency: {note.currency.value}")
            print(f"      - Min Subscription: ${note.min_subscription_amount/100:.2f}")
            print(f"      - Offering Status: {note.offering_status.value}")
            
            # Calculate yield
            maturity_val, apy = YieldCalculator.calculate_yield_from_rate(
                note.amount, note.interest_rate_bps, note.issued_at, note.maturity_date
            )
            print(f"      - Maturity Value: ${maturity_val/100:.2f}")
            print(f"      - APY: {apy:.2f}%")
            
            return True, note.id
        except Exception as e:
            await db.rollback()
            print(f"   ❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False, None


async def test_create_order(note_id: int):
    """Test creating an investment order"""
    print("\n💰 Testing Order Creation...")
    
    async for db in get_db():
        if db is None:
            print("   ❌ Database session is None")
            return False
        
        try:
            test_wallet = "0x1234567890123456789012345678901234567890"
            
            # Get note to check min_subscription_amount
            note_result = await db.execute(
                select(NoteIssuance).where(NoteIssuance.id == note_id)
            )
            note = note_result.scalar_one_or_none()
            
            if not note:
                print(f"   ❌ Note {note_id} not found")
                return False
            
            # Create order
            order = Order(
                investor_wallet=test_wallet,
                note_id=note_id,
                amount=note.min_subscription_amount * 2,  # 2x minimum
                status=OrderStatusEnum.PENDING
            )
            
            db.add(order)
            await db.commit()
            await db.refresh(order)
            
            print(f"   ✅ Created order:")
            print(f"      - ID: {order.id}")
            print(f"      - Investor: {order.investor_wallet}")
            print(f"      - Note ID: {order.note_id}")
            print(f"      - Amount: ${order.amount/100:.2f}")
            print(f"      - Status: {order.status.value}")
            
            return True, order.id
        except Exception as e:
            await db.rollback()
            print(f"   ❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False, None


async def test_settle_note(note_id: int):
    """Test settling a note"""
    print("\n🏦 Testing Note Settlement...")
    
    async for db in get_db():
        if db is None:
            print("   ❌ Database session is None")
            return False
        
        try:
            # Get note
            note_result = await db.execute(
                select(NoteIssuance).where(NoteIssuance.id == note_id)
            )
            note = note_result.scalar_one_or_none()
            
            if not note:
                print(f"   ❌ Note {note_id} not found")
                return False
            
            # Get pending orders
            orders_result = await db.execute(
                select(Order).where(
                    Order.note_id == note_id,
                    Order.status == OrderStatusEnum.PENDING
                )
            )
            orders = orders_result.scalars().all()
            
            total_subscribed = sum(o.amount for o in orders)
            print(f"   📊 Settlement Summary:")
            print(f"      - Note Amount: ${note.amount/100:.2f}")
            print(f"      - Total Subscribed: ${total_subscribed/100:.2f}")
            print(f"      - Pending Orders: {len(orders)}")
            
            if total_subscribed < note.amount:
                print(f"   ⚠️  Note not fully subscribed (need ${(note.amount - total_subscribed)/100:.2f} more)")
                return False
            
            # Create holdings and update orders
            filled_at = datetime.now(timezone.utc)
            holdings_created = 0
            
            for order in orders:
                holding = InvestorHolding(
                    wallet_address=order.investor_wallet,
                    note_id=note.id,
                    quantity_held=order.amount,
                    acquisition_price=10000  # $100 per unit
                )
                db.add(holding)
                holdings_created += 1
                
                order.status = OrderStatusEnum.FILLED
                order.filled_at = filled_at
            
            note.offering_status = OfferingStatusEnum.SETTLED
            await db.commit()
            
            print(f"   ✅ Note settled:")
            print(f"      - Holdings Created: {holdings_created}")
            print(f"      - Orders Filled: {len(orders)}")
            print(f"      - Offering Status: {note.offering_status.value}")
            
            return True
        except Exception as e:
            await db.rollback()
            print(f"   ❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False


async def main():
    """Run all tests"""
    print("🚀 Starting Settlement Layer Tests\n")
    
    await init_db()
    
    # Test 1: Yield Calculator
    await test_yield_calculator()
    
    # Test 2: Database Schema
    schema_ok = await test_database_schema()
    if not schema_ok:
        print("\n❌ Schema test failed. Exiting.")
        return
    
    # Test 3: Create note with settlement fields
    note_ok, note_id = await test_create_note_with_settlement_fields()
    if not note_ok or not note_id:
        print("\n❌ Note creation test failed. Exiting.")
        return
    
    # Test 4: Create order
    order_ok, order_id = await test_create_order(note_id)
    if not order_ok:
        print("\n⚠️  Order creation test failed (may need more orders for settlement)")
    
    # Test 5: Settle note (if fully subscribed)
    if order_ok:
        await test_settle_note(note_id)
    
    print("\n✅ All tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
