"""Quick database connection test"""
import asyncio
from app.database import init_db, get_db
from app.models.database import WalletVerification
from sqlalchemy import select

async def test_connection():
    """Test database connection and basic query"""
    print("🔌 Initializing database connection...")
    await init_db()
    
    print("✅ Database connection pool initialized")
    
    # Test a simple query
    async for db in get_db():
        if db is None:
            print("❌ Database session is None")
            return
        
        try:
            result = await db.execute(select(WalletVerification).limit(1))
            print("✅ Database query successful")
            print(f"   Connection pool: Active")
        except Exception as e:
            print(f"❌ Database query failed: {e}")
            return
        break
    
    print("✅ All database tests passed!")

if __name__ == "__main__":
    asyncio.run(test_connection())
