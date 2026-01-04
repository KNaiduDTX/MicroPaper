# MicroPaper Mock Custodian API - Comprehensive Testing Plan

This document provides a step-by-step guide to test all functionality of the MicroPaper Mock Custodian API locally.

## Prerequisites

- Node.js 18.0.0 or higher installed
- npm or yarn package manager
- curl or Postman for API testing
- Terminal/Command Prompt access

## Phase 1: Initial Setup & Verification

### Step 1.1: Verify Dependencies
```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Check npm version
npm --version

# Install all dependencies
npm install
```

**Expected Result**: All packages install successfully without errors.

### Step 1.2: Setup Environment Variables
```bash
# Run the setup script to generate .env from env.example
npm run setup

# Verify .env file was created
cat .env
```

**Expected Result**: 
- `.env` file is created
- Contains all required variables (PORT, NODE_ENV, etc.)
- Values match `env.example` template

### Step 1.3: Verify Project Structure
```bash
# Check that all key files exist
ls -la src/
ls -la tests/
ls -la scripts/
```

**Expected Result**: All directories and files are present.

## Phase 2: Code Quality Checks

### Step 2.1: Run Linter
```bash
# Check for linting errors
npm run lint

# Auto-fix any fixable issues
npm run lint:fix
```

**Expected Result**: No linting errors (or only auto-fixable warnings).

### Step 2.2: Run Automated Tests
```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (optional)
npm run test:watch
```

**Expected Result**: 
- All tests pass
- Coverage report shows good coverage (>80% recommended)
- No test failures

## Phase 3: Start the Server

### Step 3.1: Start Development Server
```bash
# Start the server in development mode
npm run dev
```

**Expected Result**: 
- Server starts without errors
- Console shows:
  - "🚀 MicroPaper Mock Custodian API running on http://0.0.0.0:3001"
  - "📋 Environment: development"
  - "🔗 Custodian endpoint: POST http://0.0.0.0:3001/api/mock/custodian/issue"
  - "🔗 Compliance endpoint: GET http://0.0.0.0:3001/api/mock/compliance/:walletAddress"
  - "🎭 Demo wallets initialized in compliance registry"

### Step 3.2: Verify Server is Running
```bash
# In a new terminal, test the root endpoint
curl http://localhost:3001/

# Test global health check
curl http://localhost:3001/health
```

**Expected Result**: 
- Root endpoint returns service information JSON
- Health endpoint returns status: "healthy"

## Phase 4: Test Mock Custodian API

### Step 4.1: Test Service Information Endpoint
```bash
curl http://localhost:3001/api/mock/custodian/info
```

**Expected Result**: Returns JSON with service details, endpoints, and features.

### Step 4.2: Test Health Check Endpoint
```bash
curl http://localhost:3001/api/mock/custodian/health
```

**Expected Result**: 
```json
{
  "status": "healthy",
  "service": "micropaper-mock-custodian",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### Step 4.3: Test Note Issuance - Valid Request
```bash
# Calculate a valid maturity date (90 days from today)
# Replace the date below with a date 90 days from today
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "amount": 100000,
    "maturityDate": "2025-12-15T00:00:00.000Z"
  }'
```

**Expected Result**: 
```json
{
  "isin": "USMOCK12345",
  "status": "issued",
  "issuedAt": "2024-12-19T16:33:00.000Z"
}
```
- ISIN follows format: USMOCK + 6 digits
- Status is "issued"
- issuedAt is a valid ISO timestamp

### Step 4.4: Test Note Issuance - Invalid Wallet Address
```bash
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "invalid-address",
    "amount": 100000,
    "maturityDate": "2025-12-15T00:00:00.000Z"
  }'
```

**Expected Result**: 
- HTTP Status: 400
- Error code: "INVALID_INPUT"
- Error message about invalid wallet address

### Step 4.5: Test Note Issuance - Invalid Amount (Not Multiple of $10,000)
```bash
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "amount": 15000,
    "maturityDate": "2025-12-15T00:00:00.000Z"
  }'
```

**Expected Result**: 
- HTTP Status: 400
- Error code: "INVALID_INPUT"
- Error message: "Amount must be a multiple of $10,000"

### Step 4.6: Test Note Issuance - Invalid Maturity Date (Too Far)
```bash
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "amount": 100000,
    "maturityDate": "2026-12-15T00:00:00.000Z"
  }'
```

**Expected Result**: 
- HTTP Status: 400
- Error code: "INVALID_INPUT"
- Error message about maturity date being too far in the future

### Step 4.7: Test Note Issuance - Past Maturity Date
```bash
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "amount": 100000,
    "maturityDate": "2020-01-01T00:00:00.000Z"
  }'
```

**Expected Result**: 
- HTTP Status: 400
- Error message about invalid maturity date

### Step 4.8: Test Note Issuance - Missing Required Fields
```bash
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6"
  }'
```

**Expected Result**: 
- HTTP Status: 400
- Error code: "INVALID_INPUT"
- Error details listing missing fields

### Step 4.9: Test Note Issuance - Different Valid Amounts
```bash
# Test $10,000 (minimum)
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "amount": 10000,
    "maturityDate": "2025-12-15T00:00:00.000Z"
  }'

# Test $50,000
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "amount": 50000,
    "maturityDate": "2025-12-15T00:00:00.000Z"
  }'
```

**Expected Result**: Both requests succeed with different ISINs generated.

## Phase 5: Test Mock Compliance API

### Step 5.1: Test Service Information Endpoint
```bash
curl http://localhost:3001/api/mock/compliance/info
```

**Expected Result**: Returns JSON with compliance service details.

### Step 5.2: Test Health Check Endpoint
```bash
curl http://localhost:3001/api/mock/compliance/health
```

**Expected Result**: Returns healthy status.

### Step 5.3: Test Check Status - Unverified Wallet
```bash
# Check status of a new wallet (should be unverified)
curl http://localhost:3001/api/mock/compliance/0xB2c3D4e5F6789012345678901234567890abcdef
```

**Expected Result**: 
```json
{
  "isVerified": false,
  "requestId": "..."
}
```

### Step 5.4: Test Check Status - Verified Wallet (Demo Wallet)
```bash
# Check status of demo wallet (should be verified)
curl http://localhost:3001/api/mock/compliance/0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6
```

**Expected Result**: 
```json
{
  "isVerified": true,
  "requestId": "..."
}
```

### Step 5.5: Test Verify Wallet
```bash
# Verify a new wallet
curl -X POST http://localhost:3001/api/mock/compliance/verify/0xB2c3D4e5F6789012345678901234567890abcdef
```

**Expected Result**: 
```json
{
  "success": true,
  "message": "Wallet 0x... marked as verified",
  "requestId": "..."
}
```

### Step 5.6: Verify the Wallet is Now Verified
```bash
# Check the same wallet again
curl http://localhost:3001/api/mock/compliance/0xB2c3D4e5F6789012345678901234567890abcdef
```

**Expected Result**: `isVerified: true`

### Step 5.7: Test Unverify Wallet
```bash
# Unverify the wallet
curl -X POST http://localhost:3001/api/mock/compliance/unverify/0xB2c3D4e5F6789012345678901234567890abcdef
```

**Expected Result**: Success message returned.

### Step 5.8: Verify the Wallet is Now Unverified
```bash
# Check the wallet again
curl http://localhost:3001/api/mock/compliance/0xB2c3D4e5F6789012345678901234567890abcdef
```

**Expected Result**: `isVerified: false`

### Step 5.9: Test Get Compliance Statistics
```bash
curl http://localhost:3001/api/mock/compliance/stats
```

**Expected Result**: 
```json
{
  "totalWallets": 3,
  "verifiedWallets": 2,
  "unverifiedWallets": 1,
  "verificationRate": "66.67%",
  "requestId": "..."
}
```

### Step 5.10: Test Get Verified Wallets List
```bash
curl http://localhost:3001/api/mock/compliance/verified
```

**Expected Result**: 
```json
{
  "verifiedWallets": ["0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6", "..."],
  "count": 2,
  "requestId": "..."
}
```

### Step 5.11: Test Invalid Wallet Address
```bash
curl http://localhost:3001/api/mock/compliance/invalid-address
```

**Expected Result**: 
- HTTP Status: 400
- Error code: "INVALID_WALLET_ADDRESS"

### Step 5.12: Test Case Insensitivity
```bash
# Test with uppercase address
curl http://localhost:3001/api/mock/compliance/0x742D35CC6634C0532925A3B8D4C9DB96C4B4D8B6
```

**Expected Result**: Should work and return the same result as lowercase version.

## Phase 6: Test Error Handling

### Step 6.1: Test 404 - Non-existent Route
```bash
curl http://localhost:3001/api/nonexistent
```

**Expected Result**: 
- HTTP Status: 404
- Error code: "NOT_FOUND"

### Step 6.2: Test Invalid JSON Body
```bash
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{invalid json}'
```

**Expected Result**: 
- HTTP Status: 400
- Appropriate error message

### Step 6.3: Test Missing Content-Type Header
```bash
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -d '{"walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6", "amount": 100000, "maturityDate": "2025-12-15T00:00:00.000Z"}'
```

**Expected Result**: Should still work (Express handles this) or return appropriate error.

## Phase 7: Test Logging

### Step 7.1: Check Log Files
```bash
# View the API log file
tail -f logs/api.log

# Or view last 50 lines
tail -n 50 logs/api.log
```

**Expected Result**: 
- Log file exists
- Contains structured JSON logs
- Shows request/response information
- Includes request IDs for tracing

### Step 7.2: Verify Console Logging
Check the server console output for:
- Request logs
- Response logs
- Mock custodian issuance messages
- Mock compliance status messages

**Expected Result**: Console shows structured logging output.

## Phase 8: Test EIP-55 Checksum Validation

### Step 8.1: Test Valid Checksummed Address
```bash
# Use a properly checksummed address
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "amount": 100000,
    "maturityDate": "2025-12-15T00:00:00.000Z"
  }'
```

**Expected Result**: Request succeeds.

### Step 8.2: Test Invalid Checksum
```bash
# Use an address with incorrect checksum (mixed case but wrong)
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4D8B6",
    "amount": 100000,
    "maturityDate": "2025-12-15T00:00:00.000Z"
  }'
```

**Expected Result**: Request should fail with invalid wallet address error (if checksum validation is strict).

## Phase 9: Test Rate Limiting

### Step 9.1: Test Rate Limit (Optional - Requires Many Requests)
```bash
# Make 101 requests quickly to test rate limiting
for i in {1..101}; do
  curl -X POST http://localhost:3001/api/mock/custodian/issue \
    -H "Content-Type: application/json" \
    -d '{
      "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
      "amount": 100000,
      "maturityDate": "2025-12-15T00:00:00.000Z"
    }'
  echo "Request $i"
done
```

**Expected Result**: 
- First 100 requests succeed
- 101st request returns HTTP 429 (Too Many Requests)
- Error code: "RATE_LIMIT_EXCEEDED"

## Phase 10: Test Docker Setup (Optional)

### Step 10.1: Build Docker Image
```bash
docker build -t micropaper-mock-custodian .
```

**Expected Result**: Image builds successfully.

### Step 10.2: Run Docker Container
```bash
docker run -p 3001:3001 micropaper-mock-custodian
```

**Expected Result**: Container starts and server runs.

### Step 10.3: Test API in Docker
```bash
# In another terminal, test the API
curl http://localhost:3001/health
```

**Expected Result**: Health check returns healthy status.

### Step 10.4: Use Docker Compose
```bash
# Start with docker-compose
docker-compose up

# Or run in background
docker-compose up -d

# Stop when done
docker-compose down
```

**Expected Result**: Services start successfully.

## Phase 11: Integration Test - Full Workflow

### Step 11.1: Complete Workflow Test
```bash
# 1. Check if wallet is verified (should be false for new wallet)
curl http://localhost:3001/api/mock/compliance/0x1234567890123456789012345678901234567890

# 2. Verify the wallet
curl -X POST http://localhost:3001/api/mock/compliance/verify/0x1234567890123456789012345678901234567890

# 3. Check status again (should be true)
curl http://localhost:3001/api/mock/compliance/0x1234567890123456789012345678901234567890

# 4. Issue a note for the verified wallet
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "amount": 100000,
    "maturityDate": "2025-12-15T00:00:00.000Z"
  }'

# 5. Check compliance stats
curl http://localhost:3001/api/mock/compliance/stats

# 6. Get verified wallets list
curl http://localhost:3001/api/mock/compliance/verified
```

**Expected Result**: All steps complete successfully, demonstrating the full workflow.

## Phase 12: Performance & Edge Cases

### Step 12.1: Test Concurrent Requests
```bash
# Make multiple requests simultaneously
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/mock/custodian/issue \
    -H "Content-Type: application/json" \
    -d "{
      \"walletAddress\": \"0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6\",
      \"amount\": 100000,
      \"maturityDate\": \"2025-12-15T00:00:00.000Z\"
    }" &
done
wait
```

**Expected Result**: All requests complete successfully.

### Step 12.2: Test Edge Cases - Maximum Maturity Date
```bash
# Calculate exactly 270 days from today
# Replace with actual date 270 days from today
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "amount": 100000,
    "maturityDate": "2025-09-15T00:00:00.000Z"
  }'
```

**Expected Result**: Request succeeds (270 days is the maximum allowed).

### Step 12.3: Test Edge Cases - Minimum Amount
```bash
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "amount": 10000,
    "maturityDate": "2025-12-15T00:00:00.000Z"
  }'
```

**Expected Result**: Request succeeds ($10,000 is the minimum unit size).

## Verification Checklist

After completing all phases, verify:

- [ ] All dependencies installed successfully
- [ ] Environment variables configured correctly
- [ ] Linter passes with no errors
- [ ] All automated tests pass
- [ ] Server starts without errors
- [ ] All Custodian API endpoints work correctly
- [ ] All Compliance API endpoints work correctly
- [ ] Error handling works for invalid inputs
- [ ] Logging is working (files and console)
- [ ] EIP-55 checksum validation works
- [ ] Rate limiting works (if tested)
- [ ] Docker setup works (if tested)
- [ ] Full workflow integration works
- [ ] Edge cases handled correctly

## Troubleshooting

### Server Won't Start
- Check if port 3001 is already in use: `lsof -i :3001`
- Verify Node.js version: `node --version`
- Check for missing dependencies: `npm install`

### Tests Fail
- Ensure server is not running on port 3001 during tests
- Check that test environment variables are set correctly
- Verify all test dependencies are installed

### API Requests Fail
- Verify server is running: `curl http://localhost:3001/health`
- Check request format matches documentation
- Verify Content-Type header is set to `application/json`
- Check server logs for detailed error messages

### Logs Not Appearing
- Verify `logs/` directory exists and is writable
- Check LOG_LEVEL in .env file
- Verify file permissions: `chmod 755 logs/`

## Next Steps

After successful testing:
1. Review test coverage report
2. Address any failing tests
3. Document any issues found
4. Consider adding additional test cases based on findings
5. Prepare for deployment

---

**Note**: Replace dates in the examples with actual dates relative to when you're testing (e.g., maturity dates should be 1-270 days from today).

