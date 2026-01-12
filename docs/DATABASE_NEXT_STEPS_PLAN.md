# Database Next Steps - Complete Implementation Plan

**Project**: MicroPaper  
**Database**: Supabase PostgreSQL (nkfynkwzvvrgoytmwotx)  
**Status**: Database schema ready, configuration needed

---

## Overview

This document outlines the complete plan for integrating the Supabase database with the MicroPaper application, including configuration, testing, and deployment.

---

## Phase 1: Database Connection Configuration

### Step 1.1: Get Supabase Connection String

**Objective**: Retrieve the connection string from Supabase Dashboard

**Actions**:
1. Navigate to Supabase Dashboard: https://supabase.com/dashboard/project/nkfynkwzvvrgoytmwotx
2. Go to **Settings** → **Database**
3. Scroll to **Connection string** section
4. Select **Connection pooling** tab (recommended for production)
5. Choose **Transaction mode** (recommended for SQLAlchemy)
6. Copy the connection string

**Expected Format**:
```
postgresql://postgres.nkfynkwzvvrgoytmwotx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Important Notes**:
- Use **Connection pooling** (port 6543) for better performance
- Use **Transaction mode** for SQLAlchemy compatibility
- The password is the database password (not the API key)
- If you don't know the password, reset it in Settings → Database → Database password

### Step 1.2: Create Environment Files

**Objective**: Set up environment configuration for local development and production

**Actions**:

1. **Create `.env` file in `python-service/` directory**:
```bash
cd python-service
touch .env
```

2. **Add database configuration to `.env`**:
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres.nkfynkwzvvrgoytmwotx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

# API Configuration
API_KEY=your-secret-api-key-here
ENVIRONMENT=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://micropaper.vercel.app
```

3. **Create `.env.example` for reference**:
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# API Configuration
API_KEY=your-secret-api-key-here
ENVIRONMENT=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://micropaper.vercel.app
```

4. **Update `.gitignore`** to ensure `.env` is not committed:
```bash
# Add to .gitignore
.env
.env.local
.env.*.local
```

### Step 1.3: Verify Connection String Format

**Objective**: Ensure the connection string is correctly formatted for async SQLAlchemy

**Verification**:
- The application automatically converts `postgresql://` to `postgresql+asyncpg://`
- Connection string should NOT include `+asyncpg://` - let the app handle it
- Port should be `6543` for connection pooling (or `5432` for direct connection)

---

## Phase 2: Backend Testing

### Step 2.1: Install Dependencies

**Objective**: Ensure all required Python packages are installed

**Actions**:
```bash
cd python-service
pip install -r requirements.txt
```

**Verify Installation**:
```bash
pip list | grep -E "(fastapi|sqlalchemy|asyncpg|alembic|pydantic)"
```

**Expected Packages**:
- fastapi>=0.104.0
- sqlalchemy[asyncio]>=2.0.0
- asyncpg>=0.29.0
- alembic>=1.12.0
- pydantic>=2.0.0
- pydantic-settings>=2.0.0

### Step 2.2: Test Database Connection

**Objective**: Verify the database connection works

**Method 1: Quick Connection Test Script**

Create `python-service/test_connection.py`:
```python
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
```

**Run the test**:
```bash
cd python-service
python test_connection.py
```

**Expected Output**:
```
🔌 Initializing database connection...
✅ Database connection pool initialized
✅ Database query successful
   Connection pool: Active
✅ All database tests passed!
```

### Step 2.3: Verify Database Schema

**Objective**: Confirm all tables and indexes exist

**Method: SQL Query Test**

Create `python-service/test_schema.py`:
```python
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
```

**Run the test**:
```bash
python test_schema.py
```

### Step 2.4: Test CRUD Operations

**Objective**: Verify all database operations work correctly

**Create `python-service/test_crud.py`**:
```python
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
```

**Run the test**:
```bash
python test_crud.py
```

### Step 2.5: Test API Endpoints

**Objective**: Verify API endpoints work with database

**Actions**:

1. **Start the Python service**:
```bash
cd python-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

2. **Test health endpoint** (no auth required):
```bash
curl http://localhost:8000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "micropaper-python-api",
  "version": "1.0.0",
  "environment": "development"
}
```

3. **Test compliance endpoint** (requires API key):
```bash
# Set API_KEY in .env first
export API_KEY=$(grep API_KEY .env | cut -d '=' -f2)

curl -X GET "http://localhost:8000/api/mock/compliance/0x1234567890123456789012345678901234567890" \
  -H "X-API-Key: $API_KEY"
```

4. **Test note issuance**:
```bash
curl -X POST "http://localhost:8000/api/mock/custodian/issue" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "amount": 10000,
    "maturityDate": "2024-12-31T00:00:00Z"
  }'
```

---

## Phase 3: Frontend Integration Testing

### Step 3.1: Configure Frontend Environment

**Objective**: Set up frontend to connect to Python service

**Actions**:

1. **Create/update `frontend/.env.local`**:
```bash
# Python Service Configuration
NEXT_PUBLIC_PYTHON_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_PYTHON_API_KEY=your-secret-api-key-here

# Must match API_KEY in python-service/.env
```

2. **Verify frontend API client configuration**:
   - File: `frontend/lib/api/client.ts`
   - Should use `NEXT_PUBLIC_PYTHON_SERVICE_URL` or fallback to `http://localhost:3001`
   - Should include `X-API-Key` header

### Step 3.2: Test Frontend-Backend Integration

**Objective**: Verify frontend can communicate with backend

**Actions**:

1. **Start Python service** (Terminal 1):
```bash
cd python-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

2. **Start Next.js frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

3. **Test Integration Points**:

   **a. Wallet Verification Check**:
   - Navigate to: `http://localhost:3000/wallet/0x1234567890123456789012345678901234567890`
   - Should display wallet verification status
   - Check browser console for API calls
   - Verify database is queried

   **b. Note Issuance**:
   - Navigate to: `http://localhost:3000/notes/issue`
   - Fill out the form
   - Submit and verify note is created in database
   - Check `note_issuances` table in Supabase

   **c. Compliance Dashboard**:
   - Navigate to: `http://localhost:3000/compliance`
   - Verify stats are loaded from database
   - Test wallet verification/unverification
   - Check audit logs are created

### Step 3.3: Verify Database Persistence

**Objective**: Confirm data persists across requests

**Actions**:

1. **Create test data via frontend**:
   - Issue a note through the UI
   - Verify a wallet through the UI

2. **Check Supabase Dashboard**:
   - Go to Table Editor
   - Verify data appears in:
     - `note_issuances`
     - `wallet_verifications`
     - `compliance_audit_logs`

3. **Restart services and verify data persists**:
   - Stop Python service
   - Restart Python service
   - Verify data is still accessible

---

## Phase 4: Production Deployment

### Step 4.1: Get Production Connection String

**Objective**: Use production-ready connection string

**Actions**:
1. Use **Connection Pooling** connection string (port 6543)
2. Use **Transaction mode** (not Session mode)
3. Store connection string securely (environment variables, not code)

### Step 4.2: Configure Production Environment

**Deployment Platform Options**:

#### Option A: Railway

1. **Create `railway.json`** (if not exists):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Set Environment Variables in Railway**:
   - `DATABASE_URL`: Supabase connection string
   - `API_KEY`: Secret API key
   - `ENVIRONMENT`: `production`
   - `ALLOWED_ORIGINS`: Your production frontend URL

#### Option B: Render

1. **Create `render.yaml`** (if not exists):
```yaml
services:
  - type: web
    name: micropaper-python-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: API_KEY
        sync: false
      - key: ENVIRONMENT
        value: production
      - key: ALLOWED_ORIGINS
        value: https://micropaper.vercel.app
```

2. **Set Environment Variables in Render Dashboard**

#### Option C: Docker

1. **Build Docker image**:
```bash
cd python-service
docker build -t micropaper-python-api .
```

2. **Run with environment variables**:
```bash
docker run -p 8000:8000 \
  -e DATABASE_URL="your-connection-string" \
  -e API_KEY="your-api-key" \
  -e ENVIRONMENT="production" \
  -e ALLOWED_ORIGINS="https://micropaper.vercel.app" \
  micropaper-python-api
```

### Step 4.3: Configure Frontend for Production

**Actions**:

1. **Set Vercel Environment Variables**:
   - `NEXT_PUBLIC_PYTHON_SERVICE_URL`: Your deployed Python service URL
   - `NEXT_PUBLIC_PYTHON_API_KEY`: Your API key (must match backend)

2. **Update CORS in Python service**:
   - Add production frontend URL to `ALLOWED_ORIGINS`

---

## Phase 5: Monitoring & Maintenance

### Step 5.1: Database Monitoring

**Objective**: Monitor database health and performance

**Tools**:
1. **Supabase Dashboard**:
   - Database → Logs: Check for errors
   - Database → Connection Pooling: Monitor connections
   - Database → Performance: Review slow queries

2. **Application Logs**:
   - Monitor Python service logs for database errors
   - Set up alerts for connection failures

### Step 5.2: Performance Monitoring

**Metrics to Track**:
- Connection pool usage
- Query response times
- Database connection errors
- RLS policy effectiveness

**Supabase Monitoring**:
- Go to Database → Performance
- Review query performance
- Check index usage

### Step 5.3: Backup & Recovery

**Actions**:
1. **Enable Supabase Backups**:
   - Settings → Database → Backups
   - Configure automatic backups

2. **Test Recovery**:
   - Document recovery procedures
   - Test backup restoration

### Step 5.4: Security Monitoring

**Actions**:
1. **Regular Security Checks**:
   ```bash
   # Use Supabase MCP tools to check advisors
   mcp_supabase_get_advisors --type security
   mcp_supabase_get_advisors --type performance
   ```

2. **Monitor RLS Policies**:
   - Verify policies are working as expected
   - Review access patterns

3. **Rotate Credentials**:
   - Regularly rotate API keys
   - Update database passwords periodically

---

## Testing Checklist

### Backend Tests
- [ ] Database connection successful
- [ ] All tables accessible
- [ ] RLS policies working
- [ ] CRUD operations functional
- [ ] API endpoints return correct data
- [ ] Error handling works
- [ ] Connection pooling active

### Frontend Tests
- [ ] Frontend connects to Python service
- [ ] API calls include correct headers
- [ ] Data displays correctly
- [ ] Forms submit successfully
- [ ] Error messages display properly
- [ ] Data persists across page refreshes

### Integration Tests
- [ ] End-to-end wallet verification flow
- [ ] End-to-end note issuance flow
- [ ] Compliance dashboard loads data
- [ ] Audit logs are created
- [ ] Statistics are accurate

### Production Readiness
- [ ] Environment variables configured
- [ ] CORS settings correct
- [ ] Connection pooling enabled
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Security advisors clean

---

## Troubleshooting Guide

### Common Issues

**Issue**: Database connection timeout
- **Solution**: Check connection string format, verify network access, check Supabase project status

**Issue**: RLS blocking queries
- **Solution**: Verify service role is used, check RLS policies are correct

**Issue**: Connection pool exhausted
- **Solution**: Increase pool size, check for connection leaks, use connection pooling string

**Issue**: Frontend can't connect to backend
- **Solution**: Verify `NEXT_PUBLIC_PYTHON_SERVICE_URL`, check CORS settings, verify API key

**Issue**: Data not persisting
- **Solution**: Check database commits, verify connection string, check RLS policies

---

## Next Steps Summary

1. ✅ **Get Supabase connection string** from dashboard
2. ✅ **Configure `.env` file** with connection string
3. ✅ **Test database connection** with test scripts
4. ✅ **Test backend API** endpoints
5. ✅ **Configure frontend** environment variables
6. ✅ **Test frontend-backend** integration
7. ✅ **Deploy to production** platform
8. ✅ **Set up monitoring** and alerts
9. ✅ **Configure backups** and recovery

---

## Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/nkfynkwzvvrgoytmwotx
- **Supabase Docs**: https://supabase.com/docs
- **SQLAlchemy Async**: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

**Status**: Ready to begin Phase 1  
**Last Updated**: Current
