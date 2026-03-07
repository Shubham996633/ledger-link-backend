# Ledger Link - Development Progress Tracker

## Project Overview
Scalable Blockchain Platform with Smart Contract Automation and Layer-2 Integration.
- **Backend:** Express + TypeScript + PostgreSQL + TypeORM
- **Frontend:** Next.js 14 + Tailwind CSS + Zustand
- **AI APIs:** Groq (primary, fast), Gemini (fallback)
- **Blockchain:** Fully simulated (no paid services needed)
- **Privacy:** Simulated Zero-Knowledge Proofs, encrypted records, audit trail

---

## Implementation Plan & Status

### Phase 1: Simulated Blockchain Engine (CORE) - COMPLETED
> Makes the platform behave like a real blockchain system

| # | Feature | Status | Files |
|---|---------|--------|-------|
| 1.1 | Block entity (DB model) | DONE | `src/entities/Block.ts` |
| 1.2 | SimulatedBlockchainService (mining, mempool, PoW, Merkle tree) | DONE | `src/services/SimulatedBlockchainService.ts` |
| 1.3 | Blockchain API routes (blocks, mempool, stats, verify) | DONE | `src/controllers/blockchainController.ts` |
| 1.4 | Integration with SimulatedWalletService (txns go to mempool) | DONE | `src/services/SimulatedWalletService.ts` |
| 1.5 | Genesis block auto-creation on startup | DONE | `src/index.ts` |
| 1.6 | Orphan transaction backfill (existing txns get blocks) | DONE | `SimulatedBlockchainService.ts` |
| 1.7 | Chain integrity verification | DONE | `SimulatedBlockchainService.ts` |
| 1.8 | Proof-of-Stake consensus simulation (validator selection) | DONE | `SimulatedBlockchainService.ts` |
| 1.9 | Dynamic gas calculation (per tx type & data size) | DONE | `SimulatedBlockchainService.ts` |

### Phase 2: AI Features (DIFFERENTIATOR) - COMPLETED
> Uses Groq/Gemini APIs for real AI capabilities

| # | Feature | Status | Files |
|---|---------|--------|-------|
| 2.1 | AI Service with Groq + Gemini fallback | DONE | `src/services/AIService.ts` |
| 2.2 | Transaction anomaly detection & risk scoring | DONE | `AIService.ts` |
| 2.3 | AI spending insights & categorization | DONE | `AIService.ts` |
| 2.4 | AI API routes (5 endpoints) | DONE | `src/controllers/aiController.ts` |
| 2.5 | Batch fraud detection | DONE | `AIService.ts` |
| 2.6 | AI portfolio insights | DONE | `AIService.ts` |
| 2.7 | Address risk profiling | DONE | `AIService.ts` |

### Phase 3: Privacy & Security (FROM PAPER II) - COMPLETED
> Zero-knowledge proofs, audit trail, and advanced security

| # | Feature | Status | Files |
|---|---------|--------|-------|
| 3.1 | Simulated ZK proof service (knowledge, range, membership, integrity) | DONE | `src/services/ZKProofService.ts` |
| 3.2 | ZK proof API routes (generate & verify 4 proof types) | DONE | `src/controllers/privacyController.ts` |
| 3.3 | Audit trail entity with hash-chained logs | DONE | `src/entities/AuditLog.ts` |
| 3.4 | Audit service (log, query, verify integrity) | DONE | `src/services/AuditService.ts` |
| 3.5 | Audit API routes (logs, verify, stats) | DONE | `src/controllers/auditController.ts` |
| 3.6 | Role-based access control (user, admin, provider, patient, auditor) | DONE | `src/middleware/auth.ts` |

### Phase 4: Healthcare & Supply Chain (FROM PAPER II) - COMPLETED
> Domain-specific blockchain applications

| # | Feature | Status | Files |
|---|---------|--------|-------|
| 4.1 | Healthcare record entity (encrypted, access-controlled) | DONE | `src/entities/HealthRecord.ts` |
| 4.2 | Health record service (AES-256 encryption, ZK proofs, access control) | DONE | `src/services/HealthRecordService.ts` |
| 4.3 | Health record API routes (CRUD, access grants, verify) | DONE | `src/controllers/healthRecordController.ts` |
| 4.4 | Supply chain item entity (chain of custody, tracking) | DONE | `src/entities/SupplyChainItem.ts` |
| 4.5 | Supply chain service (register, transfer, checkpoint, verify) | DONE | `src/services/SupplyChainService.ts` |
| 4.6 | Supply chain API routes (items, transfer, checkpoint, verify) | DONE | `src/controllers/supplyChainController.ts` |

### Phase 5: Frontend Enhancements - COMPLETED
> Full dashboard with all features visualized

| # | Feature | Status | Files |
|---|---------|--------|-------|
| 5.1 | Block Explorer (blocks, mempool, stats, verify) | DONE | `frontend/app/dashboard/blocks/page.tsx` |
| 5.2 | AI Insights Dashboard (insights, risk, tx analysis) | DONE | `frontend/app/dashboard/ai/page.tsx` |
| 5.3 | Privacy/ZK Proofs Dashboard (4 proof types, verify) | DONE | `frontend/app/dashboard/privacy/page.tsx` |
| 5.4 | Healthcare Records UI (create, search, access, verify) | DONE | `frontend/app/dashboard/health/page.tsx` |
| 5.5 | Supply Chain Tracking UI (register, transfer, checkpoint) | DONE | `frontend/app/dashboard/supply-chain/page.tsx` |
| 5.6 | Buy Tokens with Stripe (live Binance prices) | DONE | `frontend/app/dashboard/buy/page.tsx` |
| 5.7 | Landing page updated with all features | DONE | `frontend/app/page.tsx` |
| 5.8 | Real-time WebSocket live feed | DONE | `frontend/app/dashboard/live/page.tsx` |
| 5.9 | Network visualization (chain view, validators) | DONE | `frontend/app/dashboard/network/page.tsx` |

### Phase 6: Token Purchase System (Stripe + Binance) - COMPLETED
> Real payment integration with live market data

| # | Feature | Status | Files |
|---|---------|--------|-------|
| 6.1 | TokenPurchase entity (DB model) | DONE | `src/entities/TokenPurchase.ts` |
| 6.2 | TokenMarketService (Binance API real-time prices) | DONE | `src/services/TokenMarketService.ts` |
| 6.3 | StripeService (checkout, verify, fulfill) | DONE | `src/services/StripeService.ts` |
| 6.4 | Market API routes (prices, checkout, verify, history) | DONE | `src/controllers/tokenPurchaseController.ts` |
| 6.5 | Buy Tokens frontend page | DONE | `frontend/app/dashboard/buy/page.tsx` |

### Phase 7: WebSocket & Network Visualization - COMPLETED
> Real-time updates and blockchain visual representation

| # | Feature | Status | Files |
|---|---------|--------|-------|
| 7.1 | WebSocket service (Socket.IO server) | DONE | `src/services/WebSocketService.ts` |
| 7.2 | WebSocket events from blockchain engine | DONE | `src/services/SimulatedBlockchainService.ts` |
| 7.3 | HTTP server + WebSocket integration | DONE | `src/index.ts` |
| 7.4 | Frontend WebSocket client | DONE | `frontend/lib/websocket.ts` |
| 7.5 | Live Feed page (real-time events) | DONE | `frontend/app/dashboard/live/page.tsx` |
| 7.6 | Network Visualization page (chain view, validators) | DONE | `frontend/app/dashboard/network/page.tsx` |

---

## Architecture Overview

```
Frontend (Next.js)
    |
    v
Backend API (Express + TypeScript)
    |
    +-- AuthService (JWT + role-based access)
    +-- SimulatedWalletService (wallets, balances, transactions)
    +-- SimulatedBlockchainService (blocks, mining, mempool, PoS consensus)
    +-- AIService (Groq/Gemini for anomaly detection, insights)
    +-- ZKProofService (simulated zero-knowledge proofs)
    +-- AuditService (hash-chained audit trail)
    +-- HealthRecordService (encrypted records, access control)
    +-- SupplyChainService (chain of custody, tracking)
    +-- TokenMarketService (Binance API real-time prices)
    +-- StripeService (payment checkout, verify, fulfill)
    +-- WebSocketService (Socket.IO real-time events)
    |
    v
PostgreSQL (Users, Wallets, Transactions, Blocks, AuditLogs, HealthRecords, SupplyChainItems)
```

## How the Blockchain Engine Works

1. **Transaction Created** -> SimulatedWalletService processes the transfer
2. **Added to Mempool** -> Transaction enters pending pool, sorted by gas price
3. **Mining Loop** -> Every ~12 seconds, validator is selected (PoS stake-weighted)
4. **Block Mined** -> Validator produces block, Merkle root computed
5. **Block Saved** -> Block stored in DB with link to transactions
6. **Confirmations** -> Older blocks get increasing confirmation counts

### Consensus Mechanisms
- **Proof-of-Stake (default)** - 5 validators with stake-weighted random selection (like ETH 2.0)
- **Proof-of-Work (available)** - SHA-256 hash puzzle with adjustable difficulty
- Dynamic gas calculation based on transaction type (transfer, token, contract, complex)

## How AI Works

1. **Groq API** (primary) - llama-3.3-70b-versatile model with JSON response
2. **Gemini API** (fallback) - gemini-2.0-flash if Groq fails
3. **Key rotation** - Auto-switches between 2 Groq API keys
4. **Rule-based fallback** - If all APIs fail, uses statistical analysis
5. **Hybrid approach** - Rule-based pre-screening + AI analysis combined

## How Privacy Features Work

1. **Zero-Knowledge Proofs** - Simulated Schnorr-like proofs for knowledge, range, membership, integrity
2. **Health Records** - AES-256-CBC encrypted at rest, hash committed to blockchain, ZK proof attached
3. **Audit Trail** - Hash-chained log entries (like a mini-blockchain for audit events)
4. **Supply Chain** - Chain of custody with hash commitments, transfer tracking, checkpoint logging
5. **Access Control** - Per-record ACL (patient, provider, auditor roles)

## API Endpoints

### Blockchain
- `GET /api/blockchain/blocks` - List blocks (paginated)
- `GET /api/blockchain/blocks/latest` - Latest block
- `GET /api/blockchain/blocks/:id` - Block by number or hash
- `GET /api/blockchain/blocks/:number/transactions` - Block transactions
- `GET /api/blockchain/mempool` - Current mempool
- `GET /api/blockchain/stats` - Network statistics (includes consensus info)
- `GET /api/blockchain/verify` - Verify chain integrity

### AI (requires auth)
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

### Existing
- `POST /api/auth/register|login|logout|refresh` - Auth
- `GET /api/auth/me` - Current user
- `POST /api/wallets/create` - Create wallet
- `POST /api/wallets/:id/send` - Send transaction
- `POST /api/wallets/:id/faucet` - Get test tokens
- `GET /api/dashboard/overview|portfolio|recent-activity` - Dashboard
- `GET /api/ledger/transactions|stats|recent` - Public explorer
- `POST /api/payment-requests` - Payment requests

---

## Database Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts (roles: user, admin, provider, patient, auditor) |
| `wallets` | Simulated wallets |
| `wallet_balances` | Token balances per wallet |
| `transactions` | All transactions |
| `blocks` | Mined blocks (blockchain) |
| `payment_requests` | Payment request links |
| `audit_logs` | Hash-chained audit trail |
| `health_records` | Encrypted healthcare records |
| `supply_chain_items` | Supply chain items with chain of custody |
| `token_purchases` | Stripe payment records for token purchases |

## Environment Variables (in backend/.env)

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

# JWT
JWT_SECRET=your-secret
JWT_EXPIRES_IN=86400
JWT_REFRESH_EXPIRES_IN=604800

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here

# AI Services
GROQ_API_KEY=your-groq-key
GROQ_API_KEY_2=your-groq-key-2
GEMINI_API_KEY=your-gemini-key

# Frontend
FRONTEND_URL=http://localhost:3001

# Binance API (read-only for market data)
BINANCE_API_KEY=your-binance-api-key
BINANCE_API_SECRET=your-binance-api-secret

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_your-stripe-test-key
```

## Quick Commands
```bash
# Backend
cd ledger-link-backend
pnpm dev              # Start dev server

# Frontend
cd ledger-link-frontend
npm run dev           # Start frontend
```

## Bugs Fixed
- JWT `expiresIn` type error (changed from string to number in config)
- `return res.status()` pattern causing "not all code paths return" TS errors
- Missing `findByIdWithRelations` method in UserRepository
- PaymentRequestController using `Request` instead of `AuthenticatedRequest`
- dotenv not loading parent .env (added Groq/Gemini keys to backend/.env)
- TypeORM `findOne` without `where` clause error
- Orphan transactions without block assignments
- TypeORM `strictPropertyInitialization` added to tsconfig for entity decorators
