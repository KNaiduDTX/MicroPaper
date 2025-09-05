# MicroPaper Mock Custodian API Documentation

## Overview

The MicroPaper Mock Custodian API simulates traditional note issuance for dual-format commercial paper. This API is designed for MVP development and testing, providing a realistic interface that can be easily replaced with real custodian integrations in production.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://micropaper-mock-custodian-api.vercel.app`

## Authentication

Currently, no authentication is required for MVP development. In production, this will be replaced with JWT-based authentication.

## Endpoints

### 1. Mock Custodian API

#### 1.1 Issue Traditional Note

**POST** `/api/mock/custodian/issue`

Simulates a custodian issuing a traditional note when a token is minted.

#### Request Body

```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "amount": 100000,
  "maturityDate": "2025-06-15T00:00:00.000Z"
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | string | Yes | Ethereum wallet address (0x + 40 hex characters) |
| `amount` | number | Yes | Amount in USD (must be multiple of $10,000) |
| `maturityDate` | string | Yes | Maturity date in ISO 8601 format (≤270 days from today) |

#### Response

**Success (200 OK)**
```json
{
  "isin": "USMOCK12345",
  "status": "issued",
  "issuedAt": "2024-12-19T16:33:00.000Z"
}
```

**Error (400 Bad Request)**
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Request validation failed",
    "details": [
      {
        "field": "amount",
        "issue": "amount.invalid",
        "message": "Amount must be a multiple of $10,000"
      }
    ]
  },
  "requestId": "b6e9c8a7-1234-5678-9abc-def012345678"
}
```

#### 1.2 Health Check

**GET** `/api/mock/custodian/health`

Returns the health status of the service.

#### Response

```json
{
  "status": "healthy",
  "service": "micropaper-mock-custodian",
  "timestamp": "2024-12-19T16:33:00.000Z",
  "version": "1.0.0"
}
```

#### 1.3 Service Information

**GET** `/api/mock/custodian/info`

Returns detailed information about the service and available endpoints.

#### Response

```json
{
  "service": "MicroPaper Mock Custodian API",
  "version": "1.0.0",
  "description": "Simulates traditional note issuance for dual-format commercial paper",
  "endpoints": {
    "issue": "POST /api/mock/custodian/issue",
    "health": "GET /api/mock/custodian/health",
    "info": "GET /api/mock/custodian/info"
  },
  "features": {
    "isinGeneration": "ISO 6166 compliant mock ISINs",
    "validation": "Wallet address, amount, and maturity date validation",
    "logging": "Structured logging with request tracing",
    "cors": "Configured for MicroPaper frontend domains"
  }
}
```

### 2. Mock Compliance API

#### 2.1 Check Compliance Status

**GET** `/api/mock/compliance/:walletAddress`

Check the verification status of a wallet address.

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | string | Yes | Ethereum wallet address (0x + 40 hex characters) |

#### Response

**Success (200 OK)**
```json
{
  "isVerified": true,
  "requestId": "req_abc123"
}
```

**Error (400 Bad Request)**
```json
{
  "error": {
    "code": "INVALID_WALLET_ADDRESS",
    "message": "Wallet address must be a valid Ethereum address (0x + 40 hex characters)",
    "details": [
      {
        "field": "walletAddress",
        "issue": "invalid_format",
        "message": "Invalid Ethereum address format"
      }
    ]
  },
  "requestId": "req_def456"
}
```

#### 2.2 Verify Wallet (Admin/Demo)

**POST** `/api/mock/compliance/verify/:walletAddress`

Manually verify a wallet address for demo purposes.

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | string | Yes | Ethereum wallet address to verify |

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "message": "Wallet 0x... marked as verified",
  "requestId": "req_ghi789"
}
```

#### 2.3 Unverify Wallet (Admin/Demo)

**POST** `/api/mock/compliance/unverify/:walletAddress`

Manually unverify a wallet address for demo purposes.

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | string | Yes | Ethereum wallet address to unverify |

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "message": "Wallet 0x... marked as unverified",
  "requestId": "req_jkl012"
}
```

#### 2.4 Get Compliance Statistics

**GET** `/api/mock/compliance/stats`

Get statistics about the compliance registry.

#### Response

```json
{
  "totalWallets": 5,
  "verifiedWallets": 2,
  "unverifiedWallets": 3,
  "verificationRate": "40.00%",
  "requestId": "req_mno345"
}
```

#### 2.5 Get Verified Wallets

**GET** `/api/mock/compliance/verified`

Get a list of all verified wallet addresses.

#### Response

```json
{
  "verifiedWallets": [
    "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "0xa1b2c3d4e5f6789012345678901234567890abcd"
  ],
  "count": 2,
  "requestId": "req_pqr678"
}
```

#### 2.6 Health Check

**GET** `/api/mock/compliance/health`

Returns the health status of the compliance service.

#### Response

```json
{
  "status": "healthy",
  "service": "micropaper-mock-compliance",
  "timestamp": "2024-12-19T16:33:00.000Z",
  "version": "1.0.0"
}
```

#### 2.7 Service Information

**GET** `/api/mock/compliance/info`

Returns detailed information about the compliance service.

#### Response

```json
{
  "service": "MicroPaper Mock Compliance API",
  "version": "1.0.0",
  "description": "Simulates KYC/AML compliance registry for wallet verification",
  "endpoints": {
    "checkStatus": "GET /api/mock/compliance/:walletAddress",
    "verifyWallet": "POST /api/mock/compliance/verify/:walletAddress",
    "unverifyWallet": "POST /api/mock/compliance/unverify/:walletAddress",
    "getStats": "GET /api/mock/compliance/stats",
    "getVerified": "GET /api/mock/compliance/verified",
    "health": "GET /api/mock/compliance/health",
    "info": "GET /api/mock/compliance/info"
  },
  "features": {
    "inMemoryStorage": "Wallet verification status stored in memory",
    "auditLogging": "All compliance actions logged for audit trail",
    "adminControls": "Manual verification/unverification for demo purposes",
    "statistics": "Registry statistics and verified wallet lists"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_INPUT` | 400 | Request validation failed |
| `INVALID_WALLET_ADDRESS` | 400 | Invalid wallet address format |
| `VALIDATION_ERROR` | 422 | Business rule validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `NOT_FOUND` | 404 | Route not found |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Business Rules

### Amount Validation
- Must be a positive integer
- Must be a multiple of $10,000 (corpus mandate)
- Example valid amounts: $10,000, $50,000, $100,000

### Maturity Date Validation
- Must be in ISO 8601 format
- Must be between 1 and 270 days from today (corpus mandate)
- Example: `2025-06-15T00:00:00.000Z`

### Wallet Address Validation
- Must be a valid Ethereum address format (0x + 40 hex characters)
- Example: `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`

### ISIN Generation
- Follows ISO 6166 standard (12 characters)
- Format: `USMOCK` + 5-digit number + check digit
- Example: `USMOCK12345`

### Compliance Rules
- Default verification status for all wallets is `false`
- Wallet addresses are case-insensitive (normalized to lowercase)
- Verification status is stored in memory (resets on server restart)
- All compliance actions are logged for audit trail
- Manual verification/unverification available for demo purposes

## Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per window
- **Headers**: Rate limit information is included in response headers

## CORS

The API is configured to accept requests from:
- `http://localhost:3000` (development)
- `https://micropaper-mvp.vercel.app` (MVP deployment)
- `https://app.micropaper.com` (production)

## Logging

All requests and responses are logged with:
- Request ID for tracing
- Timestamp
- Request/response details
- Processing time
- Error details (if applicable)

## Example Usage

### cURL

```bash
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "amount": 100000,
    "maturityDate": "2025-06-15T00:00:00.000Z"
  }'
```

### JavaScript (Fetch)

```javascript
// Issue traditional note
const response = await fetch('http://localhost:3001/api/mock/custodian/issue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    amount: 100000,
    maturityDate: '2025-06-15T00:00:00.000Z'
  })
});

const data = await response.json();
console.log(data);

// Check compliance status
const complianceResponse = await fetch('http://localhost:3001/api/mock/compliance/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
const complianceData = await complianceResponse.json();
console.log(complianceData);

// Verify wallet (admin/demo)
const verifyResponse = await fetch('http://localhost:3001/api/mock/compliance/verify/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', {
  method: 'POST'
});
const verifyData = await verifyResponse.json();
console.log(verifyData);
```

### Python (requests)

```python
import requests

# Issue traditional note
url = 'http://localhost:3001/api/mock/custodian/issue'
data = {
    'walletAddress': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    'amount': 100000,
    'maturityDate': '2025-06-15T00:00:00.000Z'
}

response = requests.post(url, json=data)
print(response.json())

# Check compliance status
compliance_url = 'http://localhost:3001/api/mock/compliance/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
compliance_response = requests.get(compliance_url)
print(compliance_response.json())

# Verify wallet (admin/demo)
verify_url = 'http://localhost:3001/api/mock/compliance/verify/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
verify_response = requests.post(verify_url)
print(verify_response.json())
```

## Development

### Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Server will be available at `http://localhost:3001`

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Key variables:
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `ALLOWED_ORIGINS`: CORS allowed origins
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

## Deployment

### Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

### Docker

```bash
docker build -t micropaper-mock-custodian .
docker run -p 3001:3001 micropaper-mock-custodian
```

## Testing

Run the test suite:

```bash
npm test
```

## Support

For issues and questions:
- GitHub Issues: [MicroPaper Repository]
- Documentation: [API Documentation]
- Email: [Support Email]
