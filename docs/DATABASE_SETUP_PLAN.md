# Database Setup Plan for MicroPaper

## Supabase Project Information
- **REST Endpoint**: `https://nkfynkwzvvrgoytmwotx.supabase.co`
- **API Key**: `sb_publishable_cDvJtfznHeE0iMFJFtlwVg_Qm1_M3eK`
- **Project ID**: `nkfynkwzvvrgoytmwotx`

## Required Database Schema

Based on the Alembic migration (`001_initial_schema.py`), the application requires three tables:

### 1. `wallet_verifications`
- **Purpose**: Store wallet verification status
- **Columns**:
  - `wallet_address` (VARCHAR(42), PRIMARY KEY) - Ethereum wallet address
  - `is_verified` (BOOLEAN, NOT NULL, DEFAULT false)
  - `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT now())
  - `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT now())
  - `verified_by` (VARCHAR(255), NULLABLE) - Admin/user who verified
- **Indexes**: `ix_wallet_verifications_wallet_address` on `wallet_address`

### 2. `note_issuances`
- **Purpose**: Store commercial paper note issuance records
- **Columns**:
  - `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
  - `isin` (VARCHAR(12), UNIQUE, NOT NULL) - ISO 6166 compliant ISIN
  - `wallet_address` (VARCHAR(42), NOT NULL) - Recipient wallet
  - `amount` (INTEGER, NOT NULL) - Note amount
  - `maturity_date` (TIMESTAMP WITH TIME ZONE, NOT NULL)
  - `status` (VARCHAR(50), NOT NULL, DEFAULT 'issued')
  - `issued_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT now())
  - `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT now())
- **Indexes**:
  - `ix_note_issuances_id` on `id`
  - `ix_note_issuances_isin` on `isin` (UNIQUE)
  - `ix_note_issuances_wallet_address` on `wallet_address`

### 3. `compliance_audit_logs`
- **Purpose**: Audit trail for compliance actions
- **Columns**:
  - `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
  - `wallet_address` (VARCHAR(42), NOT NULL)
  - `action` (VARCHAR(50), NOT NULL) - 'check_status', 'verify', 'unverify'
  - `performed_by` (VARCHAR(255), NULLABLE)
  - `request_id` (VARCHAR(255), NULLABLE) - For request tracing
  - `timestamp` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT now())
  - `metadata` (TEXT, NULLABLE) - JSON string for additional data
- **Indexes**:
  - `ix_compliance_audit_logs_id` on `id`
  - `ix_compliance_audit_logs_wallet_address` on `wallet_address`
  - `ix_compliance_audit_logs_request_id` on `request_id`

## Database Tasks Checklist

### Phase 1: Connection & Verification
- [ ] **Task 1.1**: Verify Supabase project connection
  - Test connection to `https://nkfynkwzvvrgoytmwotx.supabase.co`
  - Verify API key access
  - Check project status and availability

- [ ] **Task 1.2**: Get database connection string
  - Retrieve PostgreSQL connection string from Supabase dashboard
  - Format: `postgresql://[user]:[password]@[host]:[port]/[database]`
  - Note: For async SQLAlchemy, will need `postgresql+asyncpg://` prefix

### Phase 2: Schema Creation
- [ ] **Task 2.1**: Check existing tables
  - List all tables in the `public` schema
  - Verify if any of the required tables already exist
  - Document current state

- [ ] **Task 2.2**: Create database schema
  - Option A: Use Supabase MCP migration tool to apply schema
  - Option B: Convert Alembic migration to Supabase migration
  - Option C: Execute SQL directly via Supabase SQL editor
  - Ensure all tables, indexes, and constraints are created correctly

- [ ] **Task 2.3**: Verify schema creation
  - Confirm all three tables exist
  - Verify all columns match expected schema
  - Check all indexes are created
  - Validate constraints (PRIMARY KEY, UNIQUE, NOT NULL)

### Phase 3: Security & Access Control
- [ ] **Task 3.1**: Set up Row Level Security (RLS)
  - Review security advisors for missing RLS policies
  - Create RLS policies if needed (based on application requirements)
  - Test RLS policies

- [ ] **Task 3.2**: Configure API access
  - Verify API key permissions
  - Set up service role key for backend (if needed)
  - Configure CORS if using Supabase REST API directly

- [ ] **Task 3.3**: Review security advisors
  - Run security advisor check
  - Address any security vulnerabilities
  - Run performance advisor check
  - Optimize indexes if needed

### Phase 4: Application Integration
- [ ] **Task 4.1**: Update environment configuration
  - Create/update `.env` file with `DATABASE_URL`
  - Update `python-service/app/config.py` if needed
  - Test database connection from Python service

- [ ] **Task 4.2**: Test database operations
  - Test wallet verification CRUD operations
  - Test note issuance creation
  - Test compliance audit logging
  - Verify timestamp defaults work correctly

- [ ] **Task 4.3**: Set up connection pooling
  - Verify async connection pool configuration
  - Test connection pool behavior
  - Monitor connection health

### Phase 5: Data Migration (if applicable)
- [ ] **Task 5.1**: Migrate existing data (if any)
  - Check for existing in-memory data that needs migration
  - Create migration scripts if needed
  - Execute data migration

- [ ] **Task 5.2**: Seed initial data (if needed)
  - Create seed scripts for test data
  - Document seed data structure

## Next Steps

1. **Immediate Actions**:
   - Connect to Supabase project using provided endpoint and API key
   - Check current database state (tables, migrations)
   - Create schema if tables don't exist

2. **Configuration**:
   - Get PostgreSQL connection string from Supabase
   - Update environment variables
   - Test connection

3. **Verification**:
   - Run security advisor checks
   - Test all CRUD operations
   - Verify indexes and performance

4. **Documentation**:
   - Document connection string format
   - Update README with database setup instructions
   - Create database backup/restore procedures

## Notes

- The application uses **async SQLAlchemy** with `asyncpg` driver
- Connection string format: `postgresql+asyncpg://user:pass@host:port/dbname`
- Supabase provides connection pooling, but the app also implements its own pool
- All timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
- The `metadata` column in `compliance_audit_logs` stores JSON as TEXT (can be migrated to JSONB later)

## Potential Issues to Watch For

1. **Connection Timeouts**: Supabase may have connection limits
2. **RLS Policies**: May need to configure Row Level Security for production
3. **Index Performance**: Monitor query performance and adjust indexes
4. **Migration Conflicts**: If tables exist, need to handle migration carefully
5. **Async Driver**: Ensure `asyncpg` is installed and compatible
