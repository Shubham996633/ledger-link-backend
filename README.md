# Ledger Link

A scalable blockchain platform with smart contract automation, AI-powered analytics, zero-knowledge proofs, and real-world domain applications (healthcare, supply chain).

## Architecture

```
Frontend (Next.js 14 + Tailwind CSS)
    |
    v (REST API + WebSocket)
Backend (Express + TypeScript)
    |
    +-- SimulatedBlockchainService (PoS consensus, mining, mempool, Merkle trees)
    +-- AIService (Groq Llama 3.3 70B + Gemini fallback)
    +-- ZKProofService (knowledge, range, membership, integrity proofs)
    +-- AuditService (hash-chained audit trail)
    +-- HealthRecordService (AES-256-CBC encrypted records)
    +-- SupplyChainService (chain of custody tracking)
    +-- TokenMarketService (Binance API real-time prices)
    +-- StripeService (fiat-to-token payments)
    +-- WebSocketService (real-time block/transaction feed)
    |
    v
PostgreSQL (10 tables)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, Recharts, Zustand, Socket.IO Client |
| Backend | Express, TypeScript, TypeORM, Socket.IO |
| Database | PostgreSQL |
| AI | Groq API (Llama 3.3 70B), Google Gemini (fallback) |
| Payments | Stripe (test mode), Binance API (market data) |
| Security | JWT, AES-256-CBC, SHA-256, Simulated ZK Proofs |

## Features

### Core Blockchain
- Proof-of-Stake consensus with 5 validators (stake-weighted selection)
- SHA-256 block hashing with Merkle tree transaction roots
- Transaction mempool with gas price priority sorting
- Dynamic gas calculation per transaction type
- Chain integrity verification

### AI Analytics
- Transaction anomaly detection and fraud scoring
- AI-powered spending insights and categorization
- Portfolio analysis and optimization suggestions
- Address risk profiling

### Privacy & Security
- 4 types of simulated zero-knowledge proofs
- Hash-chained audit trail (tamper-proof)
- Role-based access control (user, admin, provider, patient, auditor)
- AES-256-CBC encryption for sensitive data

### Domain Applications
- **Healthcare**: Encrypted medical records with access control and blockchain integrity
- **Supply Chain**: Product tracking with chain of custody, temperature/humidity monitoring

### Token Purchase
- Real-time crypto prices from Binance API (ETH, BTC, SOL, BNB, etc.)
- Stripe Checkout for USD payments (test mode)
- Automatic token crediting to wallet at market rate

### Real-Time Updates
- WebSocket (Socket.IO) for live block/transaction events
- Live feed dashboard with event streaming
- Network visualization with block chain links and validator nodes

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- pnpm (backend) / npm (frontend)

### Backend
```bash
cd ledger-link-backend
cp .env.example .env  # Edit with your API keys
pnpm install
pnpm dev
```

### Frontend
```bash
cd ledger-link-frontend
npm install
npm run dev
```

Backend runs on http://localhost:3000, Frontend on http://localhost:3001

## Project Structure (Backend)

```
src/
  config/          # Database, JWT, Swagger configuration
  controllers/     # API route handlers
  entities/        # TypeORM database entities
  middleware/      # Auth, rate limiting, error handling
  repositories/    # Database query helpers
  services/        # Business logic
  utils/           # Logger, helpers
  index.ts         # Entry point
database/          # SQL migration scripts
docs/              # Documentation guides
```

## Dashboard Pages (17 pages)

| Page | Route | Description |
|------|-------|-------------|
| Overview | /dashboard | Portfolio overview, recent transactions |
| Wallets | /dashboard/wallets | Create/manage wallets, faucet |
| Portfolio | /dashboard/portfolio | Token distribution, balances |
| Buy Tokens | /dashboard/buy | Stripe + Binance token purchase |
| Send | /dashboard/send | Send transactions |
| Receive | /dashboard/receive | Payment requests, QR codes |
| Transactions | /dashboard/transactions | Transaction history |
| Explorer | /dashboard/explorer | Public ledger explorer |
| Block Explorer | /dashboard/blocks | Blocks, mempool, network stats |
| Live Feed | /dashboard/live | Real-time WebSocket event stream |
| Network | /dashboard/network | Chain visualization, validators |
| AI Insights | /dashboard/ai | AI analysis, risk scoring, fraud detection |
| Privacy | /dashboard/privacy | ZK proof generation and verification |
| Health Records | /dashboard/health | Encrypted medical records |
| Supply Chain | /dashboard/supply-chain | Item tracking, chain of custody |
| Settings | /dashboard/settings | User profile |

## API Endpoints (60+)

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user

### Wallets & Transactions
- `POST /api/wallets/create` - Create wallet
- `POST /api/wallets/:id/send` - Send transaction
- `POST /api/wallets/:id/faucet` - Get test tokens
- `GET /api/ledger/transactions` - Public explorer

### Blockchain
- `GET /api/blockchain/blocks` - List blocks (paginated)
- `GET /api/blockchain/blocks/latest` - Latest block
- `GET /api/blockchain/blocks/:id` - Block by number or hash
- `GET /api/blockchain/blocks/:number/transactions` - Block transactions
- `GET /api/blockchain/mempool` - Current mempool
- `GET /api/blockchain/stats` - Network statistics
- `GET /api/blockchain/verify` - Verify chain integrity

### AI Analytics (requires auth)
- `GET /api/ai/analyze/:txId` - Analyze transaction for anomalies
- `GET /api/ai/insights` - User spending insights
- `GET /api/ai/risk-score/:address` - Address risk profiling
- `POST /api/ai/detect-fraud` - Batch fraud detection
- `GET /api/ai/portfolio` - AI portfolio insights

### Privacy & ZK Proofs (requires auth)
- `POST /api/privacy/zk/proof-of-knowledge` - Generate proof of knowledge
- `POST /api/privacy/zk/range-proof` - Generate range proof
- `POST /api/privacy/zk/membership-proof` - Generate membership proof
- `POST /api/privacy/zk/integrity-proof` - Generate data integrity proof
- `GET /api/privacy/zk/verify/:proofId` - Verify a proof
- `GET /api/privacy/zk/proofs` - List all proofs

### Audit Trail (requires auth)
- `GET /api/audit/logs` - Get audit logs (filtered, paginated)
- `GET /api/audit/verify` - Verify audit chain integrity (admin)
- `GET /api/audit/stats` - Audit statistics

### Healthcare Records (requires auth)
- `POST /api/health-records` - Create encrypted health record
- `GET /api/health-records/:id` - Get record (decrypted, access-controlled)
- `GET /api/health-records/patient/:patientId` - Get patient's records
- `POST /api/health-records/:id/grant-access` - Grant access to record
- `POST /api/health-records/:id/revoke-access` - Revoke access
- `GET /api/health-records/:id/verify` - Verify record integrity
- `GET /api/health-records/stats/overview` - Record statistics

### Supply Chain (requires auth)
- `POST /api/supply-chain/items` - Register new item
- `GET /api/supply-chain/items/:trackingId` - Get item details
- `GET /api/supply-chain/my-items` - Get user's items
- `POST /api/supply-chain/items/:trackingId/transfer` - Transfer item
- `POST /api/supply-chain/items/:trackingId/checkpoint` - Update checkpoint
- `GET /api/supply-chain/items/:trackingId/verify` - Verify chain integrity
- `GET /api/supply-chain/stats` - Supply chain statistics

### Market / Token Purchase (auth for checkout)
- `GET /api/market/prices` - All live token prices (Binance)
- `GET /api/market/prices/:symbol` - Single token price
- `GET /api/market/tokens` - Supported tokens list
- `POST /api/market/checkout` - Create Stripe checkout session
- `POST /api/market/verify-payment` - Verify & fulfill payment
- `POST /api/market/webhook` - Stripe webhook handler
- `GET /api/market/purchases` - User purchase history
- `GET /api/market/purchases/stats` - Purchase statistics

## Database Tables

| Table | Records |
|-------|---------|
| users | User accounts with roles |
| wallets | Simulated crypto wallets |
| wallet_balances | Token balances per wallet |
| transactions | All blockchain transactions |
| blocks | Mined blocks (blockchain) |
| payment_requests | Payment request links |
| audit_logs | Hash-chained audit trail |
| health_records | Encrypted healthcare records |
| supply_chain_items | Supply chain items |
| token_purchases | Stripe payment records |

## Environment Variables

### Backend (.env)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ledger_link
JWT_SECRET=your-secret
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
BINANCE_API_KEY=your-binance-key
STRIPE_SECRET_KEY=sk_test_your-stripe-key
FRONTEND_URL=http://localhost:3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Scripts

```bash
pnpm dev          # Start dev server (tsx watch)
pnpm build        # Compile TypeScript
pnpm start        # Run compiled output
pnpm test         # Run tests
pnpm type-check   # TypeScript check
pnpm lint         # ESLint
pnpm format       # Prettier
```

## Documentation

- [Development Progress](docs/DEVELOPMENT_PROGRESS.md) - Full feature tracker with all phases
- [Testing Guide](docs/TESTING_GUIDE.md) - Step-by-step guide to test every feature via the UI
- [Quick Start](docs/QUICK_START.md) - Quick start guide
- [Setup Guide](docs/SETUP_GUIDE.md) - Detailed setup instructions
- [Authentication Guide](docs/AUTHENTICATION_GUIDE.md) - Auth system details
- [Postman Testing](docs/POSTMAN_TESTING_GUIDE.md) - API testing with Postman
- [Deployment](docs/DEPLOYMENT.md) - Deployment guide
- [Research Paper I](../Project_II_Research_Paper_I.pdf) - Blockchain scalability & Layer-2 integration
- [Research Paper II](../Project_II_Research_Paper_II.pdf) - Privacy-preserving framework for healthcare & supply chain

## Research Papers

### Paper I: Scalable Blockchain Platform with Smart Contract Automation and Layer-2 Integration
Covers the core blockchain architecture, Ethereum-based smart contracts, Arbitrum Layer-2 rollups, PoS consensus, Merkle tree transaction roots, dynamic gas calculation, transaction mempool, and 10x throughput improvements with 90-95% gas cost reduction.

### Paper II: Privacy-Preserving Blockchain Framework for Healthcare and Supply Chain
Covers zero-knowledge proofs (knowledge, range, membership, integrity), role-based access control, AES-256-CBC encryption, hash-chained audit trails, encrypted healthcare records with patient-controlled access, supply chain tracking with chain of custody, temperature/humidity monitoring, and HIPAA/GDPR compliance.

