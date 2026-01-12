# Settlement & Trading Engine Implementation

## Overview

This document describes the implementation of the Settlement Layer upgrade for MicroPaper, transforming it from a passive issuance registry to a functional Settlement & Trading Engine.

## Phase 1: Database Schema Expansion

### Migration File
**Location**: `python-service/alembic/versions/002_settlement_layer.py`

### Changes to `note_issuances` Table

Added 4 new columns:
1. **`interest_rate_bps`** (Integer, NOT NULL)
   - Interest rate in basis points (1 bp = 0.01%)
   - Example: 500 bps = 5.00%
   - Default: 0 (set to 500 for new notes)

2. **`currency`** (Enum: 'USD', 'USDC', NOT NULL)
   - Currency of the note
   - Default: 'USD'

3. **`min_subscription_amount`** (Integer, NOT NULL)
   - Minimum subscription amount in cents
   - Default: 10000 ($100.00)

4. **`offering_status`** (Enum: 'open', 'closed', 'settled', NOT NULL)
   - Status of the offering
   - Default: 'closed' (set to 'open' for new notes)

### New Table: `investor_holdings`

Tracks ownership of notes by investors.

**Schema**:
```sql
- id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- wallet_address (VARCHAR(42), FOREIGN KEY -> wallet_verifications, NOT NULL)
- note_id (INTEGER, FOREIGN KEY -> note_issuances, NOT NULL)
- quantity_held (INTEGER, NOT NULL) - Amount held in cents
- acquisition_price (INTEGER, NOT NULL) - Price per unit in cents
- acquired_at (TIMESTAMP WITH TIME ZONE, NOT NULL)
- created_at (TIMESTAMP WITH TIME ZONE, NOT NULL)
```

**Indexes**:
- `ix_investor_holdings_id` on `id`
- `ix_investor_holdings_wallet_address` on `wallet_address`
- `ix_investor_holdings_note_id` on `note_id`
- `ix_investor_holdings_wallet_note` on `(wallet_address, note_id)` - composite index

### New Table: `orders`

Tracks buy orders for notes.

**Schema**:
```sql
- id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- investor_wallet (VARCHAR(42), FOREIGN KEY -> wallet_verifications, NOT NULL)
- note_id (INTEGER, FOREIGN KEY -> note_issuances, NOT NULL)
- amount (INTEGER, NOT NULL) - Order amount in cents
- status (ENUM: 'pending', 'filled', 'cancelled', 'rejected', NOT NULL, DEFAULT 'pending')
- created_at (TIMESTAMP WITH TIME ZONE, NOT NULL)
- filled_at (TIMESTAMP WITH TIME ZONE, NULLABLE)
- request_id (VARCHAR(255), NULLABLE)
```

**Indexes**:
- `ix_orders_id` on `id`
- `ix_orders_investor_wallet` on `investor_wallet`
- `ix_orders_note_id` on `note_id`
- `ix_orders_status` on `status`
- `ix_orders_note_status` on `(note_id, status)` - composite index

### SQL Migration Summary

The migration creates:
- 3 ENUM types: `currency_enum`, `offering_status_enum`, `order_status_enum`
- 4 new columns in `note_issuances`
- 2 new tables: `investor_holdings`, `orders`
- 9 new indexes for performance

**To Apply Migration**:
```bash
cd python-service
alembic upgrade head
```

## Phase 2: Domain Logic & Models

### Database Models

**Updated**: `app/models/database.py`

1. **Added Enums**:
   - `CurrencyEnum`: USD, USDC
   - `OfferingStatusEnum`: open, closed, settled
   - `OrderStatusEnum`: pending, filled, cancelled, rejected

2. **Updated `NoteIssuance` Model**:
   - Added 4 new fields matching migration
   - Added relationships to `Order` and `InvestorHolding`

3. **New `InvestorHolding` Model**:
   - Represents investor ownership of notes
   - Links to `WalletVerification` and `NoteIssuance`

4. **New `Order` Model**:
   - Represents investment orders
   - Links to `WalletVerification` and `NoteIssuance`

### Yield Calculator Utility

**Location**: `app/utils/yield_calculator.py`

**Class**: `YieldCalculator`

**Methods**:

1. **`calculate_maturity_value(principal_cents, interest_rate_bps, days_to_maturity)`**
   - Calculates maturity value using simple interest
   - Formula: `Maturity Value = Principal * (1 + (Rate * Days / 360))`
   - Uses 360-day year convention (commercial paper standard)
   - Returns: Maturity value in cents (integer)

2. **`calculate_apy(principal_cents, maturity_value_cents, days_to_maturity)`**
   - Calculates Annual Percentage Yield
   - Formula: `APY = ((Maturity Value / Principal) - 1) * (365 / Days)`
   - Uses 365-day year for APY calculation
   - Returns: APY as float percentage

3. **`calculate_yield_from_rate(principal_cents, interest_rate_bps, issued_date, maturity_date)`**
   - Convenience method that calculates both maturity value and APY
   - Returns: Tuple of (maturity_value_cents, apy_percentage)

4. **`format_cents_to_dollars(cents)`**
   - Utility to format cents to dollar string
   - Example: 10000 → "$100.00"

5. **`format_bps_to_percentage(bps)`**
   - Utility to format basis points to percentage string
   - Example: 500 → "5.00%"

**Key Features**:
- ✅ Uses integer math (cents) to avoid floating point errors
- ✅ Uses `Decimal` for precise calculations
- ✅ Rounds down to nearest cent for maturity value
- ✅ Handles edge cases (zero amounts, negative values)

### Pydantic Schemas

**Updated**: `app/models/schemas.py`

**New Schemas**:

1. **`OfferingResponse`**: Response model for note offerings
   - Includes yield calculations (maturity_value_cents, apy)
   - All financial fields in cents

2. **`OfferingsResponse`**: Paginated list of offerings

3. **`OrderCreate`**: Request model for creating investment orders
   - `note_id`: ID of note to invest in
   - `amount`: Investment amount in cents

4. **`OrderResponse`**: Response model for orders

5. **`HoldingResponse`**: Response model for investor holdings
   - Includes yield calculations
   - Links to note details (isin, maturity_date)

6. **`SettleResponse`**: Response model for settlement operations

**Updated Schema**:

- **`NoteIssuanceRequest`**: Added optional fields for settlement layer
  - `interest_rate_bps` (default: 500)
  - `currency` (default: "USD")
  - `min_subscription_amount` (default: 10000)

## Phase 3: Market API Endpoints

### Router: `app/routes/market.py`

**Base Path**: `/api/market`

### Endpoints

#### 1. `GET /api/market/offerings`

**Purpose**: Get list of open note offerings available for investment

**Query Parameters**:
- `page` (int, default: 1): Page number
- `limit` (int, default: 100, max: 1000): Items per page
- `currency` (str, optional): Filter by currency (USD, USDC)
- `minRateBps` (int, optional): Minimum interest rate in basis points
- `maxRateBps` (int, optional): Maximum interest rate in basis points

**Response**: `OfferingsResponse`
- List of offerings with yield calculations
- Only returns notes where `offering_status = 'open'`

**Features**:
- ✅ Filters only open offerings
- ✅ Calculates maturity value and APY for each offering
- ✅ Supports filtering and pagination

#### 2. `POST /api/market/invest`

**Purpose**: Create an investment order for a note

**Headers**:
- `X-Investor-Wallet` (required): Investor's wallet address

**Request Body**: `OrderCreate`
```json
{
  "noteId": 1,
  "amount": 10000
}
```

**Validations**:
1. ✅ Investor wallet must be KYC'd (verified in `wallet_verifications`)
2. ✅ Note must exist and have `offering_status = 'open'`
3. ✅ Amount must be >= `min_subscription_amount`
4. ✅ Amount must be a multiple of `min_subscription_amount`

**Response**: `OrderResponse`
- Order details with status 'pending'

**Features**:
- ✅ Creates order with status 'pending'
- ✅ Validates KYC status
- ✅ Validates offering availability
- ✅ Validates amount requirements

#### 3. `POST /api/market/settle/{note_id}`

**Purpose**: Settle a note offering (Admin only)

**Path Parameters**:
- `note_id` (int): ID of note to settle

**Process**:
1. Validates note exists and is not already settled
2. Aggregates all pending orders for the note
3. Validates total subscribed >= note amount (fully subscribed)
4. Creates `investor_holdings` records for all orders
5. Updates order statuses to 'filled'
6. Updates note `offering_status` to 'settled'

**Response**: `SettleResponse`
- Settlement summary with counts and totals

**Features**:
- ✅ Atomic transaction (all or nothing)
- ✅ Creates holdings with acquisition price
- ✅ Updates order statuses
- ✅ Updates note status

**Note**: In production, this should be protected by admin authentication.

#### 4. `GET /api/market/holdings`

**Purpose**: Get investor holdings with yield calculations

**Query Parameters**:
- `walletAddress` (str, optional): Filter by wallet address
- `noteId` (int, optional): Filter by note ID

**Response**: `List[HoldingResponse]`
- Holdings with calculated maturity values and APY

**Features**:
- ✅ Calculates yield for each holding
- ✅ Includes note details (isin, maturity_date)
- ✅ Supports filtering

### Integration

**Updated**: `main.py`
- Registered market router at `/api/market`
- Added market endpoints to root endpoint documentation

**Updated**: `app/routes/custodian.py`
- Updated `POST /issue` to set new fields:
  - `interest_rate_bps`: 500 (5.00%)
  - `currency`: USD
  - `min_subscription_amount`: 10000 ($100)
  - `offering_status`: OPEN

## Integer Math Implementation

All financial calculations use **integer math (cents)** to avoid floating point errors:

- ✅ All amounts stored in cents (10000 = $100.00)
- ✅ Interest rates in basis points (500 = 5.00%)
- ✅ Yield calculations use `Decimal` for precision
- ✅ Results rounded down to nearest cent
- ✅ No floating point arithmetic in financial calculations

## Usage Examples

### 1. Issue a Note (with Settlement Fields)

```bash
POST /api/mock/custodian/issue
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "amount": 1000000,  # $10,000 in cents
  "maturityDate": "2025-06-15T00:00:00.000Z",
  "interestRateBps": 500,  # 5.00%
  "currency": "USD",
  "minSubscriptionAmount": 10000  # $100 minimum
}
```

### 2. Get Open Offerings

```bash
GET /api/market/offerings?currency=USD&minRateBps=400&page=1&limit=10
```

### 3. Create Investment Order

```bash
POST /api/market/invest
Headers:
  X-Investor-Wallet: 0x1234567890123456789012345678901234567890
Body:
{
  "noteId": 1,
  "amount": 10000  # $100 in cents
}
```

### 4. Settle Note

```bash
POST /api/market/settle/1
```

### 5. Get Holdings

```bash
GET /api/market/holdings?walletAddress=0x1234567890123456789012345678901234567890
```

## Testing

### Run Migration

```bash
cd python-service
alembic upgrade head
```

### Test Yield Calculator

```python
from app.utils.yield_calculator import YieldCalculator

# Calculate maturity value
maturity = YieldCalculator.calculate_maturity_value(
    principal_cents=100000,  # $1,000
    interest_rate_bps=500,   # 5.00%
    days_to_maturity=90
)
# Returns: 101250 (cents) = $1,012.50

# Calculate APY
apy = YieldCalculator.calculate_apy(
    principal_cents=100000,
    maturity_value_cents=101250,
    days_to_maturity=90
)
# Returns: 5.07%
```

## Next Steps

1. **Add Admin Authentication**: Protect `/settle` endpoint
2. **Add Order Cancellation**: Allow investors to cancel pending orders
3. **Add Partial Fills**: Handle over-subscription with proportional allocation
4. **Add Secondary Market**: Support order matching and trading
5. **Add Payment Integration**: Connect to payment processors for actual settlement
6. **Add Event Logging**: Log all settlement events for audit
7. **Add Notifications**: Notify investors when orders are filled

## Files Modified/Created

### Created
- `python-service/alembic/versions/002_settlement_layer.py`
- `python-service/app/utils/yield_calculator.py`
- `python-service/app/utils/__init__.py`
- `python-service/app/routes/market.py`
- `SETTLEMENT_LAYER_IMPLEMENTATION.md`

### Modified
- `python-service/app/models/database.py`
- `python-service/app/models/schemas.py`
- `python-service/app/routes/custodian.py`
- `python-service/main.py`

## Summary

✅ **Phase 1 Complete**: Database schema expanded with 2 new tables and 4 new columns
✅ **Phase 2 Complete**: Domain logic implemented with YieldCalculator and Pydantic models
✅ **Phase 3 Complete**: Market API with 4 endpoints for trading and settlement

The MicroPaper application now supports:
- Note offerings with interest rates and currency
- Investment orders with KYC validation
- Settlement operations that create holdings
- Yield calculations for investors
- All using integer math for precision
