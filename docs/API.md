# MicroPaper Mock Custodian API Documentation

## Overview

The MicroPaper Mock Custodian API simulates traditional note issuance for dual-format commercial paper. This API is designed for MVP development and testing, providing a realistic interface that can be easily replaced with real custodian integrations in production.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://micropaper-mock-custodian-api.vercel.app`

## Authentication

Currently, no authentication is required for MVP development. In production, this will be replaced with JWT-based authentication.

## Endpoints

### 1. Issue Traditional Note

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

### 2. Health Check

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

### 3. Service Information

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

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_INPUT` | 400 | Request validation failed |
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
```

### Python (requests)

```python
import requests

url = 'http://localhost:3001/api/mock/custodian/issue'
data = {
    'walletAddress': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    'amount': 100000,
    'maturityDate': '2025-06-15T00:00:00.000Z'
}

response = requests.post(url, json=data)
print(response.json())
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
