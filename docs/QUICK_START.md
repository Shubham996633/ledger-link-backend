# Quick Start Guide

## 5-Minute Setup

### 1. Prerequisites

```bash
node --version    # 18+
pnpm --version    # 8+
psql --version    # PostgreSQL 14+
```

### 2. Clone and Install

```bash
git clone git@github.com:Shubham996633/ledger-link-backend.git
cd ledger-link-backend
pnpm install
```

### 3. Environment Setup

```bash
cp env.example .env
```

Edit `.env` with your values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ledger_link
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=86400
JWT_REFRESH_EXPIRES_IN=604800
ENCRYPTION_KEY=your-32-character-encryption-key
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
BINANCE_API_KEY=your-binance-api-key
STRIPE_SECRET_KEY=sk_test_your-stripe-key
FRONTEND_URL=http://localhost:3001
```

### 4. Database Setup

```bash
# Create database
psql -h localhost -U postgres -c "CREATE DATABASE ledger_link;"

# Tables are auto-created by TypeORM on first run (synchronize: true in dev)
```

### 5. Start

```bash
pnpm dev
```

You should see:
```
Ledger Link Backend running on port 3000
WebSocket server ready on /ws
```

### 6. Start Frontend

```bash
cd ../ledger-link-frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3001

## Verify Setup

1. Open http://localhost:3001/register
2. Create an account
3. Create a wallet on the Wallets page
4. Use the faucet to get free tokens
5. Send a transaction

## Troubleshooting

| Issue | Fix |
|-------|-----|
| DB connection failed | `sudo systemctl start postgresql` |
| Database doesn't exist | `psql -h localhost -U postgres -c "CREATE DATABASE ledger_link;"` |
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` |
| CORS errors | Check `FRONTEND_URL` in `.env` matches frontend URL |
| AI not working | Set `GROQ_API_KEY` in `.env` |

## What's Running

- **Backend API**: http://localhost:3000/api
- **WebSocket**: ws://localhost:3000/ws
- **Frontend**: http://localhost:3001

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for a full walkthrough of every feature.
