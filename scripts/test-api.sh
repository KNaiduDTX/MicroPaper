#!/bin/bash

# MicroPaper Mock Custodian API - Quick Test Script
# This script performs basic API tests to verify functionality

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Calculate valid maturity date (90 days from today)
MATURITY_DATE=$(date -u -v+90d +"%Y-%m-%dT00:00:00.000Z" 2>/dev/null || date -u -d "+90 days" +"%Y-%m-%dT00:00:00.000Z" 2>/dev/null || echo "2025-12-15T00:00:00.000Z")

echo "🧪 MicroPaper Mock Custodian API - Quick Test"
echo "=============================================="
echo ""

# Test 1: Root endpoint
echo "Test 1: Root endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Root endpoint: OK (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} Root endpoint: FAILED (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Global health check
echo "Test 2: Global health check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Health check: OK (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} Health check: FAILED (HTTP $HTTP_CODE)"
fi
echo ""

# Test 3: Custodian health check
echo "Test 3: Custodian health check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/mock/custodian/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Custodian health: OK (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} Custodian health: FAILED (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: Compliance health check
echo "Test 4: Compliance health check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/mock/compliance/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Compliance health: OK (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} Compliance health: FAILED (HTTP $HTTP_CODE)"
fi
echo ""

# Test 5: Issue note - valid request
echo "Test 5: Issue note (valid request)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/mock/custodian/issue" \
  -H "Content-Type: application/json" \
  -d "{
    \"walletAddress\": \"0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6\",
    \"amount\": 100000,
    \"maturityDate\": \"$MATURITY_DATE\"
  }")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    ISIN=$(echo "$BODY" | grep -o '"isin":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC} Issue note: OK (HTTP $HTTP_CODE, ISIN: $ISIN)"
else
    echo -e "${RED}✗${NC} Issue note: FAILED (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

# Test 6: Issue note - invalid amount
echo "Test 6: Issue note (invalid amount)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/mock/custodian/issue" \
  -H "Content-Type: application/json" \
  -d "{
    \"walletAddress\": \"0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6\",
    \"amount\": 15000,
    \"maturityDate\": \"$MATURITY_DATE\"
  }")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${GREEN}✓${NC} Invalid amount rejection: OK (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} Invalid amount rejection: FAILED (HTTP $HTTP_CODE)"
fi
echo ""

# Test 7: Check compliance status
echo "Test 7: Check compliance status"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/mock/compliance/0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    IS_VERIFIED=$(echo "$BODY" | grep -o '"isVerified":[^,}]*' | cut -d':' -f2)
    echo -e "${GREEN}✓${NC} Compliance check: OK (HTTP $HTTP_CODE, Verified: $IS_VERIFIED)"
else
    echo -e "${RED}✗${NC} Compliance check: FAILED (HTTP $HTTP_CODE)"
fi
echo ""

# Test 8: Get compliance stats
echo "Test 8: Get compliance statistics"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/mock/compliance/stats")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Compliance stats: OK (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} Compliance stats: FAILED (HTTP $HTTP_CODE)"
fi
echo ""

# Test 9: Verify wallet
echo "Test 9: Verify wallet"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/mock/compliance/verify/0xB2c3D4e5F6789012345678901234567890abcdef")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Verify wallet: OK (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} Verify wallet: FAILED (HTTP $HTTP_CODE)"
fi
echo ""

# Test 10: 404 error handling
echo "Test 10: 404 error handling"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/nonexistent")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${GREEN}✓${NC} 404 handling: OK (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} 404 handling: FAILED (HTTP $HTTP_CODE)"
fi
echo ""

echo "=============================================="
echo -e "${YELLOW}Testing complete!${NC}"
echo ""
echo "For comprehensive testing, see TESTING_PLAN.md"
echo ""

