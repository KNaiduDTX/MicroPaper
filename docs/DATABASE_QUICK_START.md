# Database Quick Start Guide

**Quick reference for setting up and testing the database connection.**

## Prerequisites

- Supabase project: `nkfynkwzvvrgoytmwotx`
- Python service dependencies installed
- Access to Supabase dashboard

## Step 1: Get Connection String

1. Go to: https://supabase.com/dashboard/project/nkfynkwzvvrgoytmwotx/settings/database
2. Scroll to **Connection string**
3. Select **Connection pooling** tab
4. Select **Transaction mode**
5. Copy the connection string

## Step 2: Configure Environment

Create `python-service/.env`:

```bash
DATABASE_URL=postgresql://postgres.nkfynkwzvvrgoytmwotx:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
API_KEY=your-secret-api-key-here
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,https://micropaper.vercel.app
```

## Step 3: Test Connection

```bash
cd python-service
python test_connection.py
```

Expected: ✅ All database tests passed!

## Step 4: Verify Schema

```bash
python test_schema.py
```

Expected: ✅ All required tables exist, RLS enabled

## Step 5: Test CRUD Operations

```bash
python test_crud.py
```

Expected: ✅ All CRUD operations passed!

## Step 6: Start API Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Test health endpoint:
```bash
curl http://localhost:8000/health
```

## Step 7: Configure Frontend

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_PYTHON_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_PYTHON_API_KEY=your-secret-api-key-here
```

## Troubleshooting

**Connection fails**: Check connection string format, verify password
**RLS errors**: Verify service role is used in connection string
**Import errors**: Run `pip install -r requirements.txt`

## Full Documentation

See `docs/DATABASE_NEXT_STEPS_PLAN.md` for complete details.
