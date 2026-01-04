# MicroPaper Mock Custodian API

## Project Overview

MicroPaper is a cryptocurrency project focused on democratizing access to Commercial Paper for Small to Medium Sized Businesses (SMBs). By leveraging blockchain technology, MicroPaper aims to create a more accessible and transparent marketplace for commercial paper trading, enabling SMBs to access short-term funding solutions that were previously limited to larger corporations.

## Mission

To bridge the gap between traditional commercial paper markets and small to medium-sized businesses by providing:
- **Accessibility**: Lower barriers to entry for SMBs
- **Transparency**: Blockchain-based transparency in commercial paper transactions
- **Efficiency**: Streamlined processes for both issuers and investors
- **Security**: Smart contract-based security and compliance

## Current Status: MVP Development

This repository is currently in the **MVP (Minimum Viable Product)** development phase. The MVP will focus on core functionality to validate the concept and gather initial user feedback.

## Mock Custodian API

This API simulates traditional note issuance for dual-format commercial paper, providing a realistic interface that can be easily replaced with real custodian integrations in production.

### Features

- ✅ **POST /api/mock/custodian/issue** - Simulates traditional note issuance
- ✅ **Input Validation** - Wallet address, amount, and maturity date validation
- ✅ **ISIN Generation** - ISO 6166 compliant mock ISINs
- ✅ **Structured Logging** - Request tracing and audit trails
- ✅ **CORS Support** - Configured for MicroPaper frontend domains
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Error Handling** - Standardized JSON error responses
- ✅ **Vercel Deployment** - Ready for serverless deployment

### Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Test the API**
   ```bash
   curl -X POST http://localhost:3001/api/mock/custodian/issue \
     -H "Content-Type: application/json" \
     -d '{
       "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
       "amount": 100000,
       "maturityDate": "2025-06-15T00:00:00.000Z"
     }'
   ```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mock/custodian/issue` | Issue a traditional note |
| GET | `/api/mock/custodian/health` | Health check |
| GET | `/api/mock/custodian/info` | Service information |

### Business Rules (Corpus Mandates)

- **Unit Size**: $10,000 minimum (multiples only)
- **Maturity**: ≤270 days maximum
- **Dual Format**: Traditional note + tokenized note (1:1 linked)
- **Validation**: KYC'd issuers + verified investors

## Frontend Application

A modern Next.js frontend application that provides a user interface for the Mock Custodian API.

### Features

- ✅ **Note Issuance Interface** - Issue traditional notes with form validation
- ✅ **Compliance Management** - Check and manage wallet verification status
- ✅ **Dashboard** - View system statistics and recent activity
- ✅ **Wallet Management** - View wallet details and compliance status
- ✅ **Responsive Design** - Mobile-first design that works on all devices
- ✅ **Type Safety** - Full TypeScript support with type-safe API calls
- ✅ **Error Handling** - Comprehensive error handling with user-friendly messages

### Quick Start

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`.

For detailed frontend documentation, see [frontend/README.md](frontend/README.md).

## Project Structure

```
MicroPaper/
├── README.md                 # This file
├── package.json             # Backend dependencies and scripts
├── vercel.json              # Backend Vercel deployment configuration
├── env.example              # Environment variables template
├── docs/                    # Documentation
│   └── API.md              # API documentation
├── frontend/                # Frontend application
│   ├── README.md           # Frontend documentation
│   ├── package.json        # Frontend dependencies
│   ├── app/                # Next.js App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities and API client
│   └── types/             # TypeScript types
├── logs/                    # Task completion logs
│   └── task-log.md         # Task tracking
├── src/                     # Backend source code
│   ├── api/                # API routes
│   │   ├── custodian.js    # Mock custodian endpoints
│   │   └── compliance.js   # Compliance endpoints
│   ├── config/             # Configuration
│   │   └── index.js        # Centralized config
│   ├── middleware/         # Express middleware
│   │   ├── errorHandler.js # Error handling
│   │   └── security.js     # Security middleware
│   ├── utils/              # Utilities
│   │   ├── logger.js       # Logging utilities
│   │   └── validators.js   # Input validation
│   └── server.js           # Main server file
├── tests/                   # Backend test files
└── scripts/                 # Build and deployment scripts
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Deployment**: Vercel (serverless)

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Deployment**: Vercel

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Environment Setup

1. Copy environment template:
   ```bash
   cp env.example .env
   ```

2. Configure environment variables in `.env`

3. Install dependencies:
   ```bash
   npm install
   ```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Local Development

```bash
# Start development server
npm run dev

# Server will be available at http://localhost:3001
```

## Deployment

### Backend Deployment (Vercel)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Configure Environment Variables**
   - Set up `.env` file or configure in Vercel dashboard
   - Ensure `ALLOWED_ORIGINS` includes your frontend production URL
   - Required variables:
     - `PORT=3001`
     - `NODE_ENV=production`
     - `ALLOWED_ORIGINS` - Include frontend URL
     - `LOG_LEVEL=info`
     - `USE_MOCK_CUSTODIAN=true`
     - `ENABLE_RATE_LIMITING=true`

3. **Deploy Backend**:
   ```bash
   vercel --prod
   ```

4. **Verify Deployment**:
   ```bash
   curl https://your-backend.vercel.app/health
   ```

### Frontend Deployment

See [frontend/README.md](frontend/README.md) for detailed frontend deployment instructions.

**Quick Steps:**
1. Navigate to `frontend/` directory
2. Set `NEXT_PUBLIC_API_URL` to your backend production URL
3. Deploy to Vercel: `vercel --prod`
4. Update backend `ALLOWED_ORIGINS` to include frontend URL

### Docker

```bash
# Build image
docker build -t micropaper-mock-custodian .

# Run container
docker run -p 3001:3001 micropaper-mock-custodian
```

## API Documentation

Detailed API documentation is available in [docs/API.md](docs/API.md).

### Example Request

```bash
curl -X POST http://localhost:3001/api/mock/custodian/issue \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "amount": 100000,
    "maturityDate": "2025-06-15T00:00:00.000Z"
  }'
```

### Example Response

```json
{
  "isin": "USMOCK12345",
  "status": "issued",
  "issuedAt": "2024-12-19T16:33:00.000Z"
}
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Project**: MicroPaper
- **Repository**: [GitHub Repository]
- **Documentation**: [API Documentation]
- **Email**: [Contact Email]

---

**Note**: This project is in active development. Documentation and features are subject to change as the MVP evolves.