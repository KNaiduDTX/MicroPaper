# Frontend Integration Guide

**Status**: Ready for integration testing  
**Date**: January 8, 2026

## Overview

This guide covers integrating the Next.js frontend with the Python FastAPI backend that's now connected to the Supabase database.

## Prerequisites

✅ Backend database integration complete  
✅ Python service endpoints tested  
✅ Frontend API client configured

## Step 1: Configure Frontend Environment

### Create `.env.local` File

Create `frontend/.env.local`:

```bash
# Python Service Configuration
NEXT_PUBLIC_PYTHON_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_PYTHON_API_KEY=micropaper-dev-api-key-2024
```

**Important**: The API key must match the `API_KEY` in `python-service/.env`

### Environment Variables Explained

- `NEXT_PUBLIC_PYTHON_SERVICE_URL`: URL of the Python FastAPI service
  - Local: `http://localhost:8000`
  - Production: Your deployed service URL (e.g., `https://your-service.railway.app`)

- `NEXT_PUBLIC_PYTHON_API_KEY`: API key for authentication
  - Must match `API_KEY` in Python service `.env`
  - Use `NEXT_PUBLIC_` prefix for client-side access

## Step 2: Start Services

### Terminal 1: Start Python Backend

```bash
cd python-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verify it's running:
```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy","database":"connected",...}`

### Terminal 2: Start Next.js Frontend

```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:3000`

## Step 3: Test Integration

### Test Compliance Features

1. **Wallet Verification Check**
   - Navigate to: `http://localhost:3000/wallet/0x1234567890123456789012345678901234567890`
   - Should display verification status from database
   - Check browser console for API calls

2. **Compliance Dashboard**
   - Navigate to: `http://localhost:3000/compliance`
   - Should show statistics from database
   - Test verify/unverify buttons
   - Verify data persists

3. **Verify Wallet**
   - Use the verify button in compliance dashboard
   - Check Supabase dashboard to see record created

### Test Note Issuance

1. **Issue Note**
   - Navigate to: `http://localhost:3000/notes/issue`
   - Fill out the form:
     - Wallet Address: `0x1234567890123456789012345678901234567890`
     - Amount: `10000`
     - Maturity Date: Select a future date
   - Submit the form
   - Verify note is created in database

2. **View Notes** (if UI exists)
   - Check Supabase dashboard → `note_issuances` table
   - Verify the note appears with correct data

## Step 4: Verify Database Persistence

### Check Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/nkfynkwzvvrgoytmwotx
2. Navigate to **Table Editor**
3. Verify data in:
   - `wallet_verifications` - Should show verified wallets
   - `note_issuances` - Should show issued notes
   - `compliance_audit_logs` - Should show all compliance actions

### Test Data Persistence

1. Create data through frontend
2. Stop both services
3. Restart services
4. Verify data still exists and is accessible

## Step 5: Frontend API Client

### Updated Endpoints

The frontend API client (`frontend/lib/api/custodian.ts`) now includes:

```typescript
// New endpoint added
async getNotes(params?: GetNotesParams): Promise<NoteIssuance[]>
```

### Usage Example

```typescript
import { custodianApi } from '@/lib/api/custodian';

// Get all notes
const notes = await custodianApi.getNotes();

// Get notes for specific wallet
const walletNotes = await custodianApi.getNotes({
  wallet_address: '0x1234...',
  limit: 10
});
```

## Integration Points

### Compliance Integration

**Components using compliance API**:
- `components/compliance/ComplianceStatus.tsx`
- `components/compliance/ComplianceStats.tsx`
- `components/compliance/ComplianceActions.tsx`
- `components/wallet/WalletVerification.tsx`

**API Methods Used**:
- `complianceApi.checkStatus()`
- `complianceApi.verifyWallet()`
- `complianceApi.unverifyWallet()`
- `complianceApi.getStats()`
- `complianceApi.getVerifiedWallets()`

### Custodian Integration

**Components using custodian API**:
- `components/forms/NoteIssuanceForm.tsx`
- `app/notes/issue/page.tsx`

**API Methods Used**:
- `custodianApi.issueNote()`
- `custodianApi.getNotes()` (NEW)

## Troubleshooting

### Issue: API calls failing with 401 Unauthorized

**Solution**: 
- Verify `NEXT_PUBLIC_PYTHON_API_KEY` matches `API_KEY` in Python service
- Check API key is being sent in headers (check browser Network tab)

### Issue: CORS errors

**Solution**:
- Verify `ALLOWED_ORIGINS` in `python-service/.env` includes `http://localhost:3000`
- Check Python service logs for CORS errors

### Issue: Database connection errors

**Solution**:
- Verify Python service health endpoint shows `"database": "connected"`
- Check `DATABASE_URL` in `python-service/.env`
- Verify Supabase project is active

### Issue: Data not persisting

**Solution**:
- Check Python service logs for database errors
- Verify database connection in Supabase dashboard
- Check RLS policies allow service role access

## Testing Checklist

### Backend Integration
- [ ] Python service starts successfully
- [ ] Health endpoint shows database connected
- [ ] All API endpoints respond correctly
- [ ] Database operations work (create, read, update)

### Frontend Integration
- [ ] Frontend starts successfully
- [ ] Environment variables loaded correctly
- [ ] API client connects to Python service
- [ ] Compliance features work
- [ ] Note issuance works
- [ ] Data displays correctly

### End-to-End Testing
- [ ] Wallet verification flow works
- [ ] Note issuance flow works
- [ ] Data persists across page refreshes
- [ ] Data persists after service restart
- [ ] Error handling works correctly

## Next Steps After Integration

1. ✅ Frontend-backend integration
2. ⏭️ End-to-end testing
3. ⏭️ UI improvements for new endpoints
4. ⏭️ Production deployment preparation
5. ⏭️ Monitoring and logging setup

## Production Configuration

### Vercel Environment Variables

When deploying to Vercel, set:

```
NEXT_PUBLIC_PYTHON_SERVICE_URL=https://your-python-service.railway.app
NEXT_PUBLIC_PYTHON_API_KEY=your-production-api-key
```

### Python Service CORS

Update `python-service/.env` for production:

```
ALLOWED_ORIGINS=["https://your-frontend.vercel.app"]
```

## Resources

- Backend Integration: `docs/BACKEND_DATABASE_INTEGRATION.md`
- Database Setup: `docs/DATABASE_CONFIGURATION_COMPLETE.md`
- API Documentation: `docs/API.md`

---

**Status**: Ready for integration testing  
**Last Updated**: January 8, 2026
