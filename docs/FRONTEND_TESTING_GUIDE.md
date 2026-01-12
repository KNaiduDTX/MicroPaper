# Frontend Testing Guide

**Date**: January 9, 2026  
**Status**: Frontend server starting

## Frontend Server Status

The frontend server should be starting on `http://localhost:3000`

## Testing Checklist

### 1. Verify Frontend is Running

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the MicroPaper application homepage.

### 2. Test Compliance Dashboard

**URL**: `http://localhost:3000/compliance`

**What to Test**:
- ✅ Page loads without errors
- ✅ Compliance statistics display
- ✅ Wallet verification status shows
- ✅ Verify/Unverify buttons work
- ✅ Data persists after page refresh

**Expected Behavior**:
- Statistics should show: 1 total wallet, 1 verified wallet
- Verified wallet: `0x1234567890123456789012345678901234567890`
- Verify/Unverify actions should update database

### 3. Test Wallet Verification Page

**URL**: `http://localhost:3000/wallet/0x1234567890123456789012345678901234567890`

**What to Test**:
- ✅ Page loads with wallet address
- ✅ Verification status displays correctly
- ✅ Should show as "Verified" (we verified it in testing)

### 4. Test Note Issuance

**URL**: `http://localhost:3000/notes/issue`

**What to Test**:
- ✅ Form loads correctly
- ✅ Can enter wallet address
- ✅ Can enter amount
- ✅ Can select maturity date
- ✅ Form submission works
- ✅ Success message displays
- ✅ Note appears in database

**Test Data**:
- Wallet Address: `0xabcdefabcdefabcdefabcdefabcdefabcdefabcd`
- Amount: `5000`
- Maturity Date: Select a future date

### 5. Test Dashboard

**URL**: `http://localhost:3000/dashboard`

**What to Test**:
- ✅ Page loads
- ✅ Any statistics or data display correctly

## Browser Console Checks

Open browser DevTools (F12) and check:

1. **Console Tab**:
   - ✅ No errors
   - ✅ API calls successful
   - ✅ Check for any warnings

2. **Network Tab**:
   - ✅ API calls to `http://localhost:8000` succeed
   - ✅ Status codes are 200 (or appropriate)
   - ✅ Check request/response payloads

## Expected API Calls

When testing, you should see these API calls in Network tab:

1. **Compliance Dashboard**:
   - `GET http://localhost:8000/api/mock/compliance/stats`
   - `GET http://localhost:8000/api/mock/compliance/verified`

2. **Wallet Verification**:
   - `GET http://localhost:8000/api/mock/compliance/{wallet_address}`

3. **Note Issuance**:
   - `POST http://localhost:8000/api/mock/custodian/issue`

## Troubleshooting

### Frontend won't start
- Check if port 3000 is already in use
- Verify Node.js and npm are installed
- Check `package.json` for dependencies
- Run `npm install` if needed

### API calls failing
- Verify Python service is running on port 8000
- Check `frontend/.env.local` has correct URL
- Verify API key matches in both services
- Check browser console for CORS errors

### Data not displaying
- Check browser console for errors
- Verify database has data (check Supabase dashboard)
- Check Network tab for API responses
- Verify API responses contain expected data

## Verification Steps

After testing each feature:

1. **Check Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/nkfynkwzvvrgoytmwotx
   - Check Table Editor for new records
   - Verify data matches what you entered

2. **Check Python Service Logs**:
   - Check `/tmp/micropaper-api.log` for any errors
   - Verify requests are being received

3. **Check Frontend Logs**:
   - Check `/tmp/micropaper-frontend.log` for any errors
   - Verify Next.js is running correctly

## Test Scenarios

### Scenario 1: Complete Wallet Verification Flow
1. Navigate to compliance dashboard
2. Verify a new wallet address
3. Check Supabase - should see new record
4. Unverify the wallet
5. Check Supabase - should see updated record
6. Refresh page - changes should persist

### Scenario 2: Complete Note Issuance Flow
1. Navigate to note issuance page
2. Fill out form with test data
3. Submit form
4. Check Supabase - should see new note
5. Navigate away and back - note should still exist

### Scenario 3: Data Persistence
1. Create data through frontend
2. Stop both services
3. Restart both services
4. Verify data still exists and displays

## Success Criteria

✅ Frontend loads without errors  
✅ All pages accessible  
✅ API calls succeed  
✅ Data displays correctly  
✅ Forms submit successfully  
✅ Data persists in database  
✅ Changes reflect immediately  
✅ No console errors  

---

**Next Steps**: Test each feature and verify end-to-end functionality
