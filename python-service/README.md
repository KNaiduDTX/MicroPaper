# MicroPaper Python FastAPI Service

This is the Python FastAPI service for MicroPaper, handling heavy compute operations and business logic.

## Architecture

- **Framework**: FastAPI
- **Database**: PostgreSQL (Supabase/Neon) with connection pooling
- **Deployment**: Railway or Render

## Environment Variables

Required environment variables:

```bash
# API Configuration
API_KEY=your-secret-api-key-here  # Must match PYTHON_API_KEY in Next.js frontend

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# CORS Configuration
ALLOWED_ORIGIN=https://micropaper.vercel.app

# Environment
ENVIRONMENT=production
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables (see `.env.example`)

3. Run migrations:
```bash
alembic upgrade head
```

4. Start the server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

- `POST /api/custodian/issue` - Issue a traditional note
- `GET /api/compliance/{wallet_address}` - Check wallet verification status
- `POST /api/compliance/verify/{wallet_address}` - Verify a wallet
- `GET /api/compliance/stats` - Get compliance statistics
- `GET /health` - Health check endpoint

## Security

- API Key authentication via `X-API-Key` header
- CORS restricted to `micropaper.vercel.app`
- Request ID propagation via `X-Request-ID` header

