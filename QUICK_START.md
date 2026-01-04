# Quick Start Guide - Testing MicroPaper Mock Custodian API

This guide will help you quickly set up and test the MicroPaper Mock Custodian API locally.

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
```bash
npm run setup
```

This creates a `.env` file from `env.example` with all required configuration.

### Step 3: Start the Server
```bash
npm run dev
```

You should see:
```
🚀 MicroPaper Mock Custodian API running on http://0.0.0.0:3001
📋 Environment: development
🔗 Custodian endpoint: POST http://0.0.0.0:3001/api/mock/custodian/issue
🔗 Compliance endpoint: GET http://0.0.0.0:3001/api/mock/compliance/:walletAddress
🎭 Demo wallets initialized in compliance registry
```

### Step 4: Quick Test (Automated)
In a new terminal window:
```bash
# Run automated test script
./scripts/test-api.sh

# Or if you prefer manual testing:
curl http://localhost:3001/health
```

## 🧪 Testing Options

### Option 1: Automated Test Script (Recommended for Quick Validation)
```bash
./scripts/test-api.sh
```

This runs 10 basic tests automatically and shows pass/fail results.

### Option 2: Run Automated Test Suite
```bash
npm test
```

This runs all Jest unit and integration tests.

### Option 3: Comprehensive Manual Testing
Follow the detailed guide in `TESTING_PLAN.md` for step-by-step testing of all endpoints and edge cases.

## 📋 Quick API Tests

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```

### Test 2: Issue a Note
```bash
# Calculate a date 90 days from today and replace below
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "amount": 100000,
    "maturityDate": "2025-12-15T00:00:00.000Z"
  }'
```

### Test 3: Check Compliance Status
```bash
curl http://localhost:3001/api/mock/compliance/0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6
```

### Test 4: Get Compliance Stats
```bash
curl http://localhost:3001/api/mock/compliance/stats
```

## 🔍 Verify Everything Works

### Check 1: Server is Running
```bash
curl http://localhost:3001/
```
Should return service information JSON.

### Check 2: Tests Pass
```bash
npm test
```
All tests should pass.

### Check 3: Linter Passes
```bash
npm run lint
```
No errors should be reported.

### Check 4: Logs are Working
```bash
tail -f logs/api.log
```
Should show structured JSON logs.

## 📚 Available Endpoints

### Custodian API
- `POST /api/mock/custodian/issue` - Issue a traditional note
- `GET /api/mock/custodian/health` - Health check
- `GET /api/mock/custodian/info` - Service information

### Compliance API
- `GET /api/mock/compliance/:walletAddress` - Check verification status
- `POST /api/mock/compliance/verify/:walletAddress` - Verify wallet
- `POST /api/mock/compliance/unverify/:walletAddress` - Unverify wallet
- `GET /api/mock/compliance/stats` - Get statistics
- `GET /api/mock/compliance/verified` - Get verified wallets list
- `GET /api/mock/compliance/health` - Health check
- `GET /api/mock/compliance/info` - Service information

### Global Endpoints
- `GET /` - Root endpoint with service info
- `GET /health` - Global health check

## 🐳 Docker Testing (Optional)

### Build and Run with Docker
```bash
# Build image
docker build -t micropaper-mock-custodian .

# Run container
docker run -p 3001:3001 micropaper-mock-custodian

# Or use docker-compose
docker-compose up
```

## 📖 Full Documentation

- **API Documentation**: See `docs/API.md` for detailed API reference
- **Testing Plan**: See `TESTING_PLAN.md` for comprehensive testing guide
- **Project README**: See `README.md` for project overview

## ⚠️ Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process or change PORT in .env
```

### Tests Fail
- Make sure server is not running during tests
- Run `npm install` to ensure all dependencies are installed

### Server Won't Start
- Check Node.js version: `node --version` (should be >= 18.0.0)
- Verify `.env` file exists: `ls -la .env`
- Check logs: `tail -f logs/api.log`

## ✅ Success Criteria

You've successfully tested the project when:
- ✅ Server starts without errors
- ✅ All automated tests pass (`npm test`)
- ✅ Quick test script passes (`./scripts/test-api.sh`)
- ✅ Health checks return "healthy"
- ✅ You can issue notes successfully
- ✅ Compliance endpoints work correctly
- ✅ Logs are being generated

## 🎯 Next Steps

After successful local testing:
1. Review test coverage: `npm run test:coverage`
2. Check for any linting issues: `npm run lint`
3. Review the comprehensive testing plan in `TESTING_PLAN.md`
4. Test edge cases and error scenarios
5. Prepare for deployment

---

**Need Help?** Check `TESTING_PLAN.md` for detailed step-by-step instructions for every endpoint and scenario.

