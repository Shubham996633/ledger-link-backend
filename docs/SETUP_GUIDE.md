# Setup Guide

## Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))

### Required API Keys
- **Groq API Key** - For AI analytics ([Get here](https://console.groq.com/))
- **Google Gemini API Key** - AI fallback ([Get here](https://aistudio.google.com/apikey))
- **Binance API Key** - Read-only for market prices ([Get here](https://www.binance.com/en/my/settings/api-management))
- **Stripe Test Key** - For token purchases ([Get here](https://dashboard.stripe.com/test/apikeys))

## Step 1: Clone and Install

```bash
git clone git@github.com:Shubham996633/ledger-link-backend.git
cd ledger-link-backend
pnpm install
```

## Step 2: PostgreSQL Setup

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database
```bash
psql -h localhost -U postgres -c "CREATE DATABASE ledger_link;"
```

TypeORM auto-creates all 10 tables on first startup (`synchronize: true` in development).

### Database Tables (auto-created)

| Table | Description |
|-------|-------------|
| users | User accounts (roles: user, admin, provider, patient, auditor) |
| wallets | Simulated crypto wallets |
| wallet_balances | Token balances per wallet (ETH, USDT, USDC, DAI, etc.) |
| transactions | All blockchain transactions |
| blocks | Mined blocks with PoS consensus |
| payment_requests | Payment request links |
| audit_logs | Hash-chained audit trail |
| health_records | AES-256-CBC encrypted healthcare records |
| supply_chain_items | Supply chain items with chain of custody |
| token_purchases | Stripe payment records |

For manual setup, run SQL scripts in `database/` folder in order (01-09).

## Step 3: Environment Configuration

```bash
cp env.example .env
```

### Required Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ledger_link

# JWT (generate secure keys for production)
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=86400
JWT_REFRESH_EXPIRES_IN=604800

# Encryption (exactly 32 characters for AES-256)
ENCRYPTION_KEY=your-32-character-encryption-key

# AI Services
GROQ_API_KEY=gsk_your_groq_key
GROQ_API_KEY_2=gsk_your_backup_groq_key
GEMINI_API_KEY=your_gemini_key

# Market Data (Binance read-only)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_secret

# Payments (Stripe test mode)
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# Frontend URL (for CORS and Stripe redirect)
FRONTEND_URL=http://localhost:3001
```

## Step 4: Start Development Server

```bash
pnpm dev
```

Expected output:
```
Database connected successfully
Genesis block created
Ledger Link Backend running on port 3000
WebSocket server ready on /ws
Mining loop started (12s interval)
```

## Step 5: Frontend Setup

```bash
cd ../ledger-link-frontend
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local

npm run dev
```

Frontend runs on http://localhost:3001

## Getting API Keys

### Groq (AI - Primary)
1. Go to [console.groq.com](https://console.groq.com/)
2. Sign up and create an API key
3. Uses Llama 3.3 70B model for transaction analysis

### Google Gemini (AI - Fallback)
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create an API key
3. Used as fallback when Groq is unavailable

### Binance (Market Data)
1. Go to [Binance API Management](https://www.binance.com/en/my/settings/api-management)
2. Create a read-only API key (no trading permissions needed)
3. Used for real-time crypto price fetching

### Stripe (Payments)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy the test secret key (`sk_test_...`)
3. Test card: `4242 4242 4242 4242`

## Architecture

```
src/
  config/          # Database, JWT configuration
  controllers/     # API route handlers (auth, wallet, blockchain, ai, etc.)
  entities/        # TypeORM entities (10 tables)
  middleware/      # Auth (JWT + RBAC), rate limiting, error handling
  repositories/    # Database query helpers
  services/        # Business logic
    SimulatedBlockchainService.ts  # PoS consensus, mining, mempool
    SimulatedWalletService.ts      # Wallets, balances, transactions
    AIService.ts                   # Groq/Gemini AI analytics
    ZKProofService.ts              # Zero-knowledge proofs
    AuditService.ts                # Hash-chained audit trail
    HealthRecordService.ts         # Encrypted health records
    SupplyChainService.ts          # Chain of custody tracking
    TokenMarketService.ts          # Binance API prices
    StripeService.ts               # Payment checkout
    WebSocketService.ts            # Socket.IO real-time events
  utils/           # Logger, helpers
  index.ts         # Entry point
```

## Scripts

```bash
pnpm dev          # Start dev server (tsx watch)
pnpm build        # Compile TypeScript
pnpm start        # Run compiled output
pnpm type-check   # TypeScript check
pnpm lint         # ESLint
pnpm format       # Prettier
```

## Common Issues

### PostgreSQL peer authentication failed
```bash
# Use TCP connection instead of Unix socket
psql -h localhost -U postgres
```

### TypeORM entity errors
Ensure `strictPropertyInitialization` is set in `tsconfig.json` for entity decorators.

### Groq rate limits
The system auto-rotates between `GROQ_API_KEY` and `GROQ_API_KEY_2`, and falls back to Gemini if both fail.
