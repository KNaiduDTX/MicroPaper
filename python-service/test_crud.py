"""Test CRUD operations"""
import asyncio
from datetime import datetime, timedelta
from app.database import init_db, get_db
from app.models.database import WalletVerification, NoteIssuance, ComplianceAuditLog
from sqlalchemy import select

async def test_crud():
    """Test Create, Read, Update operations"""
    await init_db()
    
    test_wallet = "0x1234567890123456789012345678901234567890"
    
    async for db in get_db():
        if db is None:
            print("❌ Database session is None")
            return
        
        try:
            # Test CREATE - Wallet Verification
            print("📝 Testing CREATE operations...")
            wallet = WalletVerification(
                wallet_address=test_wallet,
                is_verified=True,
                verified_by="test_user"
            )
            db.add(wallet)
            await db.commit()
            print("   ✅ Created wallet verification")
            
            # Test READ
            print("📖 Testing READ operations...")
            result = await db.execute(
                select(WalletVerification).where(
                    WalletVerification.wallet_address == test_wallet
                )
            )
            found_wallet = result.scalar_one_or_none()
            if found_wallet and found_wallet.is_verified:
                print("   ✅ Read wallet verification")
            else:
                print("   ❌ Failed to read wallet verification")
                return
            
            # Test UPDATE
            print("✏️  Testing UPDATE operations...")
            found_wallet.is_verified = False
            await db.commit()
            
            # Verify update
            result = await db.execute(
                select(WalletVerification).where(
                    WalletVerification.wallet_address == test_wallet
                )
            )
            updated_wallet = result.scalar_one_or_none()
            if updated_wallet and not updated_wallet.is_verified:
                print("   ✅ Updated wallet verification")
            else:
                print("   ❌ Failed to update wallet verification")
                return
            
            # Test Note Issuance CREATE
            note = NoteIssuance(
                isin="USMOCK123456",
                wallet_address=test_wallet,
                amount=10000,
                maturity_date=datetime.utcnow() + timedelta(days=90),
                status="issued"
            )
            db.add(note)
            await db.commit()
            print("   ✅ Created note issuance")
            
            # Test Audit Log CREATE
            audit_log = ComplianceAuditLog(
                wallet_address=test_wallet,
                action="test_action",
                performed_by="test_user",
                request_id="test_req_123"
            )
            db.add(audit_log)
            await db.commit()
            print("   ✅ Created audit log")
            
            # Cleanup test data
            print("🧹 Cleaning up test data...")
            await db.delete(updated_wallet)
            await db.delete(note)
            await db.delete(audit_log)
            await db.commit()
            print("   ✅ Test data cleaned up")
            
            print("✅ All CRUD operations passed!")
            
        except Exception as e:
            print(f"❌ CRUD test failed: {e}")
            import traceback
            traceback.print_exc()
            return
        break

if __name__ == "__main__":
    asyncio.run(test_crud())
