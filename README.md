# Ledger Link - Backend

A scalable blockchain platform with smart contract automation, AI-powered analytics, zero-knowledge proofs, and real-world domain applications in healthcare and supply chain management.

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
PostgreSQL (10 tables via TypeORM)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Framework | Express.js |
| ORM | TypeORM |
| Database | PostgreSQL |
| Real-Time | Socket.IO |
| AI | Groq API (Llama 3.3 70B), Google Gemini (fallback) |
| Payments | Stripe SDK (test mode) |
| Market Data | Binance API (live crypto prices) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Encryption | AES-256-CBC (native crypto) |
| Logging | Winston |

## Features

### Core Blockchain Engine
- **Proof-of-Stake consensus** with 5 validators (stake-weighted random selection)
- **SHA-256 block hashing** with Merkle tree transaction roots
- **Mempool management** with gas price priority sorting (max 50 tx/block)
- **Dynamic gas calculation** per transaction type (transfer: 21000, token: 65000, contract: 53000)
- **12-second block intervals** with automatic mining loop
- **Chain integrity verification** (hash chain + block number validation)
- **Genesis block** auto-creation on startup

### AI-Powered Analytics (Groq + Gemini)
- Transaction anomaly detection with 0-100 risk scoring
- AI-powered spending insights and pattern categorization
- Portfolio analysis with diversification scoring and rebalancing suggestions
- Address risk profiling with rule-based + AI scoring
- Batch fraud detection across recent transactions

### Privacy & Zero-Knowledge Proofs
- **Proof of Knowledge**: Prove you know a secret without revealing it
- **Range Proof**: Prove a value falls within a range without exposing it
- **Membership Proof**: Prove membership in a set without revealing identity
- **Integrity Proof**: Prove data hasn't been tampered with
- All proofs are simulated for educational demonstration

### Healthcare Records
- **AES-256-CBC encryption** for all medical data
- **SHA-256 data hashing** for integrity verification
- **Blockchain anchoring** (hash committed to latest block)
- **Role-based access control** (patient, provider, admin, auditor)
- **Fine-grained permissions** per record with grant/revoke
- Record types: lab results, prescriptions, diagnoses, imaging, procedures, vaccinations

### Supply Chain Tracking
- **Unique tracking IDs** (format: `LL-{timestamp}-{random}`)
- **Chain of custody** with hash-linked custody entries
- **Cold chain monitoring** (temperature + humidity at each checkpoint)
- **Anti-counterfeit verification** via blockchain data hash comparison
- Status tracking: created, in_transit, at_checkpoint, delivered, recalled
- Blockchain-anchored data integrity

### Audit Trail
- **Hash-chained audit logs** (SHA-256 linking for tamper detection)
- Captures: userId, action, entityType, entityId, ipAddress, userAgent
- Chain integrity verification endpoint (admin only)
- HIPAA-compatible audit logging

### Token Market & Purchases
- **Live prices from Binance API** (ETH, BTC, SOL, BNB, MATIC, USDT, USDC, DAI)
- **Historical price data** (klines/candlestick endpoint for charts)
- 30-second price caching to respect rate limits
- Stripe Checkout for USD-to-token purchases
- Automatic wallet crediting at market price

### Real-Time WebSocket Events
- `new-block` - Block mined with full details
- `new-transaction` - Transaction broadcast
- `mempool-update` - Mempool size changes
- `stats-update` - Network statistics

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- pnpm

### Setup
```bash
cd ledger-link-backend
cp .env.example .env   # Edit with your API keys
pnpm install
pnpm dev               # Starts on http://localhost:3000
```

### Docker
```bash
docker build -t ledgerlink-backend .
docker run -p 3000:3000 --env-file .env ledgerlink-backend
```

## Project Structure

```
src/
  config/           # Database, JWT, Swagger config
  controllers/      # Route handlers (auth, wallets, blockchain, ai, health, supply-chain, etc.)
  entities/         # TypeORM entities (User, Wallet, WalletBalance, Transaction, Block, etc.)
  middleware/       # Auth (JWT), rate limiting, error handling
  repositories/     # Database query helpers
  services/         # Business logic (SimulatedBlockchain, AI, ZKProof, Audit, Health, SupplyChain, etc.)
  utils/            # Logger, helpers
  index.ts          # Express app entry point
```

## API Endpoints (60+)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/wallet/connect` | Get message for wallet signing |
| POST | `/api/auth/wallet/authenticate` | Authenticate with wallet signature |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/auth/me` | Get current user |

### Wallets & Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wallets/create` | Create simulated wallet |
| GET | `/api/wallets` | Get user's wallets with balances |
| POST | `/api/wallets/:id/send` | Send transaction |
| POST | `/api/wallets/:id/faucet` | Get test tokens |
| GET | `/api/transactions` | User transaction history |
| GET | `/api/transactions/:id` | Transaction details |

### Blockchain
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blockchain/blocks` | List blocks (paginated) |
| GET | `/api/blockchain/blocks/latest` | Latest block |
| GET | `/api/blockchain/blocks/:id` | Block by number or hash |
| GET | `/api/blockchain/mempool` | Current mempool |
| GET | `/api/blockchain/stats` | Network statistics |
| GET | `/api/blockchain/verify` | Verify chain integrity |

### AI Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/insights` | Spending insights |
| GET | `/api/ai/portfolio` | Portfolio analysis |
| GET | `/api/ai/risk-score/:address` | Address risk profiling |
| GET | `/api/ai/analyze/:txId` | Transaction anomaly detection |
| POST | `/api/ai/detect-fraud` | Batch fraud detection |

### Privacy / ZK Proofs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/privacy/zk/proof-of-knowledge` | Generate proof of knowledge |
| POST | `/api/privacy/zk/range-proof` | Generate range proof |
| POST | `/api/privacy/zk/membership-proof` | Generate membership proof |
| POST | `/api/privacy/zk/integrity-proof` | Generate integrity proof |
| GET | `/api/privacy/zk/verify/:proofId` | Verify a proof |
| GET | `/api/privacy/zk/proofs` | List all proofs |

### Healthcare Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/health-records` | Create encrypted record |
| GET | `/api/health-records/:id` | Get record (decrypted, access-controlled) |
| GET | `/api/health-records/patient/:patientId` | Patient's records |
| POST | `/api/health-records/:id/grant-access` | Grant access |
| GET | `/api/health-records/:id/verify` | Verify integrity |

### Supply Chain
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/supply-chain/items` | Register item |
| GET | `/api/supply-chain/items/:trackingId` | Get item details |
| GET | `/api/supply-chain/my-items` | User's items |
| POST | `/api/supply-chain/items/:trackingId/transfer` | Transfer ownership |
| POST | `/api/supply-chain/items/:trackingId/checkpoint` | Add checkpoint |
| GET | `/api/supply-chain/items/:trackingId/verify` | Verify integrity |

### Market / Token Purchase
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market/prices` | All live token prices (Binance) |
| GET | `/api/market/prices/:symbol` | Single token price |
| GET | `/api/market/klines/:symbol` | Historical price data (candlesticks) |
| GET | `/api/market/tokens` | Supported tokens list |
| POST | `/api/market/checkout` | Create Stripe checkout |
| POST | `/api/market/verify-payment` | Verify & fulfill payment |

### Audit Trail
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/logs` | Get audit logs (filtered) |
| GET | `/api/audit/verify` | Verify audit chain (admin) |
| GET | `/api/audit/stats` | Audit statistics |

## Database Schema (10 Tables)

| Table | Purpose |
|-------|---------|
| `users` | Accounts with roles (user, admin, provider, patient, auditor) |
| `wallets` | Simulated crypto wallets (Ethereum-format addresses) |
| `wallet_balances` | Token balances per wallet (decimal 36,18 precision) |
| `transactions` | All blockchain transactions with status tracking |
| `blocks` | Mined blocks (PoS, Merkle root, gas, rewards) |
| `payment_requests` | Payment request links with expiration |
| `audit_logs` | Hash-chained immutable audit trail |
| `health_records` | AES-256-CBC encrypted medical records |
| `supply_chain_items` | Product tracking with chain of custody |
| `token_purchases` | Stripe payment records |

## Environment Variables

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ledger_link
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=86400
ENCRYPTION_KEY=your-32-char-key
FRONTEND_URL=http://localhost:3001
GROQ_API_KEY=your-groq-key
GROQ_API_KEY_2=your-backup-groq-key
GEMINI_API_KEY=your-gemini-key
BINANCE_API_KEY=your-binance-key
BINANCE_API_SECRET=your-binance-secret
STRIPE_SECRET_KEY=sk_test_your-stripe-key
```

## Scripts

```bash
pnpm dev          # Start dev server (tsx watch)
pnpm build        # Compile TypeScript
pnpm start        # Run compiled output
pnpm test         # Run tests
pnpm type-check   # TypeScript check
```

## Related Repositories

- [Ledger Link Frontend](https://github.com/shubham996633/ledger-link-frontend) - Next.js 14 dashboard with dark theme, price charts, and 25+ pages
- [Ledger Link Documentation](https://github.com/shubham996633/ledgerlink_documentation) - Research papers and project documentation

## Research Papers

### Paper I: Scalable Blockchain Platform with Smart Contract Automation and Layer-2 Integration
Covers PoS consensus, Merkle trees, dynamic gas, mempool, Arbitrum L2 rollups, 10x throughput improvement, 90-95% gas cost reduction.

### Paper II: Privacy-Preserving Blockchain Framework for Healthcare and Supply Chain
Covers zero-knowledge proofs, RBAC, AES-256 encryption, hash-chained audit trails, encrypted healthcare records, supply chain tracking with cold chain monitoring, HIPAA/GDPR compliance.
