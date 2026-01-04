# MicroPaper Frontend

Modern Next.js frontend application for the MicroPaper Mock Custodian API. Provides a user interface for wallet verification, note issuance, compliance management, and system monitoring.

## Features

- **Note Issuance**: Issue traditional notes with validation for wallet addresses, amounts, and maturity dates
- **Compliance Management**: Check and manage wallet verification status
- **Dashboard**: View system statistics and recent activity
- **Wallet Management**: View wallet details and compliance status
- **Responsive Design**: Mobile-first design that works on all devices
- **Type Safety**: Full TypeScript support with type-safe API calls
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Clear loading indicators for all async operations

## Technology Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Backend API running (see main README)

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the frontend directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with Header/Footer
│   ├── page.tsx           # Home page
│   ├── dashboard/         # Dashboard page
│   ├── notes/issue/       # Note issuance page
│   ├── compliance/        # Compliance management page
│   └── wallet/[address]/  # Wallet detail page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── wallet/          # Wallet-related components
│   └── compliance/      # Compliance components
├── lib/                  # Utilities and helpers
│   ├── api/             # API client
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   └── validation/      # Validation schemas
├── types/               # TypeScript type definitions
└── __tests__/          # Test files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## API Integration

The frontend integrates with the following backend endpoints:

### Custodian API
- `POST /api/mock/custodian/issue` - Issue a traditional note
- `GET /api/mock/custodian/health` - Health check
- `GET /api/mock/custodian/info` - Service information

### Compliance API
- `GET /api/mock/compliance/:walletAddress` - Check wallet status
- `POST /api/mock/compliance/verify/:walletAddress` - Verify wallet
- `POST /api/mock/compliance/unverify/:walletAddress` - Unverify wallet
- `GET /api/mock/compliance/stats` - Get statistics
- `GET /api/mock/compliance/verified` - Get verified wallets
- `GET /api/mock/compliance/health` - Health check
- `GET /api/mock/compliance/info` - Service information

## Component Usage

### Note Issuance Form

```tsx
import { NoteIssuanceForm } from '@/components/forms/NoteIssuanceForm';

<NoteIssuanceForm
  onSuccess={(response) => {
    console.log('Note issued:', response.isin);
  }}
/>
```

### Wallet Status

```tsx
import { WalletStatus } from '@/components/wallet/WalletStatus';

<WalletStatus walletAddress="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6" />
```

### Compliance Stats

```tsx
import { ComplianceStats } from '@/components/compliance/ComplianceStats';

<ComplianceStats />
```

## Validation Rules

- **Wallet Address**: Must be a valid Ethereum address (0x + 40 hex characters)
- **Amount**: Must be a multiple of $10,000 (minimum $10,000)
- **Maturity Date**: Must be between 1 and 270 days from today

## Testing

Tests are located in the `__tests__` directory. Run tests with:

```bash
npm test
```

## Deployment

### Vercel (Recommended)

#### Prerequisites
- Vercel account
- Backend API deployed and accessible
- Frontend repository connected to Vercel

#### Step-by-Step Deployment

1. **Connect Repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your repository
   - Set root directory to `frontend/`

2. **Configure Environment Variables**
   In Vercel project settings, add:
   - `NEXT_PUBLIC_API_URL` - Your production backend API URL (e.g., `https://your-backend.vercel.app`)
   - `NODE_ENV=production`

3. **Deploy**
   - Automatic: Push to main branch (if auto-deploy is enabled)
   - Manual: Run `vercel --prod` from the `frontend/` directory

4. **Update Backend CORS**
   After deployment, update backend `ALLOWED_ORIGINS` environment variable to include your frontend URL:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-app.vercel.app
   ```

5. **Verify Deployment**
   - Visit your deployed frontend URL
   - Test API connectivity
   - Verify all routes work correctly

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server locally
npm start

# The output will be in the .next directory
# Deploy the .next directory to your hosting provider
```

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | `http://localhost:3001` (dev) or `https://your-backend.vercel.app` (prod) |
| `NODE_ENV` | Environment (development/production) | No | `development` or `production` |

### Setting Environment Variables

**Development:**
Create `.env.local` in the `frontend/` directory:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development
```

**Production (Vercel):**
Set in Vercel project settings → Environment Variables

## Troubleshooting

### API Connection Issues

- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Ensure backend API is running and accessible
- Check CORS configuration on backend includes your frontend URL
- Verify network connectivity (check browser console for errors)
- Test backend health endpoint: `curl https://your-backend.vercel.app/health`

### Build Errors

- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`
- Verify all environment variables are set correctly
- Check for missing dependencies in `package.json`

### Deployment Issues

- Ensure `NEXT_PUBLIC_API_URL` is set in Vercel environment variables
- Verify backend is deployed and accessible
- Check Vercel build logs for errors
- Ensure backend CORS includes frontend production URL
- Test API connectivity from production frontend

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
