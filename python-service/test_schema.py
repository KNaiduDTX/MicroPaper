"""Test database schema"""
import asyncio
from app.database import init_db, get_db
from sqlalchemy import text

async def test_schema():
    """Verify database schema matches expectations"""
    await init_db()
    
    async for db in get_db():
        if db is None:
            print("❌ Database session is None")
            return
        
        try:
            # Check tables exist
            tables_query = text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('wallet_verifications', 'note_issuances', 'compliance_audit_logs')
                ORDER BY table_name
            """)
            result = await db.execute(tables_query)
            tables = [row[0] for row in result.fetchall()]
            
            expected_tables = ['compliance_audit_logs', 'note_issuances', 'wallet_verifications']
            
            if set(tables) == set(expected_tables):
                print("✅ All required tables exist:")
                for table in tables:
                    print(f"   - {table}")
            else:
                print(f"❌ Missing tables. Found: {tables}, Expected: {expected_tables}")
                return
            
            # Check RLS is enabled
            rls_query = text("""
                SELECT tablename, rowsecurity 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                AND tablename IN ('wallet_verifications', 'note_issuances', 'compliance_audit_logs')
            """)
            rls_result = await db.execute(rls_query)
            rls_status = {row[0]: row[1] for row in rls_result.fetchall()}
            
            all_rls_enabled = all(rls_status.values())
            if all_rls_enabled:
                print("✅ Row Level Security enabled on all tables")
            else:
                print(f"⚠️  RLS status: {rls_status}")
            
            print("✅ Schema verification complete!")
            
        except Exception as e:
            print(f"❌ Schema verification failed: {e}")
            import traceback
            traceback.print_exc()
            return
        break

if __name__ == "__main__":
    asyncio.run(test_schema())
