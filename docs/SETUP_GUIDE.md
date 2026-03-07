# 🚀 Ledger Link Backend - Complete Setup Guide

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))

### Required Accounts & API Keys
- **Infura/Alchemy** account for Ethereum RPC ([Sign up](https://infura.io/))
- **Etherscan** API key ([Get here](https://etherscan.io/apis))
- **Arbiscan** API key ([Get here](https://arbiscan.io/apis))

## 🔧 Step-by-Step Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd ledger-link-backend

# Install dependencies
pnpm install
```

### Step 2: Environment Configuration

#### Backend Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your values
nano .env
```

**Required Environment Variables:**
```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_NAME=ledger_link

# JWT Configuration (Generate secure keys)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Encryption Configuration (32 characters exactly)
ENCRYPTION_KEY=your-32-character-encryption-key

# Blockchain Configuration
DEFAULT_NETWORK=goerli
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID
ARBITRUM_GOERLI_RPC_URL=https://goerli-rollup.arbitrum.io/rpc

# API Keys
ETHERSCAN_API_KEY=your-etherscan-api-key
ARBISCAN_API_KEY=your-arbiscan-api-key

# Demo Private Key (for testing only - NEVER use in production)
DEMO_PRIVATE_KEY=your-test-wallet-private-key

# External Services
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

#### Smart Contracts Environment Setup
```bash
# Copy contracts environment template
cp contracts/env.example contracts/.env

# Edit contracts/.env file
nano contracts/.env
```

**Required Contract Environment Variables:**
```env
# Network RPC URLs
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID
ARBITRUM_GOERLI_RPC_URL=https://goerli-rollup.arbitrum.io/rpc

# Private key for deployment (keep secure!)
PRIVATE_KEY=your-deployment-wallet-private-key

# API Keys for contract verification
ETHERSCAN_API_KEY=your-etherscan-api-key
ARBISCAN_API_KEY=your-arbiscan-api-key
```

### Step 3: Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL and Redis
pnpm docker:up

# Wait for services to be ready (about 30 seconds)
docker-compose logs postgres
```

#### Option B: Local PostgreSQL Installation
```bash
# Install PostgreSQL locally
# Ubuntu/Debian:
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS with Homebrew:
brew install postgresql
brew services start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE ledger_link;
CREATE USER ledger_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ledger_link TO ledger_user;
\q
```

### Step 4: Build and Start Services

```bash
# Build backend
pnpm build

# Compile smart contracts
pnpm contracts:compile

# Start development server
pnpm dev
```

### Step 5: Verify Setup

```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Expected response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "development"
  }
}
```

## 🗄️ Database Migrations

### Automatic Migration (Development)
The application will automatically run migrations on startup in development mode.

### Manual Migration (Production)
```bash
# Generate migration
npx typeorm migration:generate -n MigrationName

# Run migrations
npx typeorm migration:run

# Revert last migration
npx typeorm migration:revert
```

### Database Schema Overview
The following tables will be created automatically:

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  is_email_verified BOOLEAN DEFAULT false,
  role VARCHAR DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Wallets Table
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address VARCHAR UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  blockchain VARCHAR DEFAULT 'ethereum',
  network VARCHAR DEFAULT 'goerli',
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  label VARCHAR,
  metadata JSONB,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash VARCHAR UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  from_address VARCHAR NOT NULL,
  to_address VARCHAR NOT NULL,
  amount DECIMAL(36,18) NOT NULL,
  token_address VARCHAR,
  status VARCHAR DEFAULT 'pending',
  block_number INTEGER NOT NULL,
  confirmations INTEGER,
  gas_used DECIMAL(36,18) NOT NULL,
  gas_price DECIMAL(36,18) NOT NULL,
  transaction_fee DECIMAL(36,18) NOT NULL,
  data TEXT,
  metadata JSONB,
  description VARCHAR,
  blockchain VARCHAR DEFAULT 'ethereum',
  network VARCHAR DEFAULT 'goerli',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔑 Getting Required Credentials

### 1. Infura/Alchemy RPC URLs

#### Infura Setup:
1. Go to [infura.io](https://infura.io/)
2. Sign up for a free account
3. Create a new project
4. Copy the Project ID
5. Use: `https://goerli.infura.io/v3/YOUR_PROJECT_ID`

#### Alchemy Setup:
1. Go to [alchemy.com](https://alchemy.com/)
2. Sign up for a free account
3. Create a new app
4. Copy the API key
5. Use: `https://eth-goerli.g.alchemy.com/v2/YOUR_API_KEY`

### 2. Block Explorer API Keys

#### Etherscan API Key:
1. Go to [etherscan.io/apis](https://etherscan.io/apis)
2. Sign up for a free account
3. Go to API-KEYs section
4. Create a new API key
5. Copy the key

#### Arbiscan API Key:
1. Go to [arbiscan.io/apis](https://arbiscan.io/apis)
2. Sign up for a free account
3. Go to API-KEYs section
4. Create a new API key
5. Copy the key

### 3. Test Wallet Setup

#### Create Test Wallet:
```bash
# Install ethers CLI (optional)
npm install -g ethers

# Generate a new wallet
ethers wallet create

# Or use MetaMask to create a test wallet
# 1. Install MetaMask browser extension
# 2. Create a new wallet
# 3. Switch to Goerli testnet
# 4. Get test ETH from faucet: https://goerlifaucet.com/
# 5. Export private key (Account Details > Export Private Key)
```

#### Get Test ETH:
- **Goerli Faucet**: [goerlifaucet.com](https://goerlifaucet.com/)
- **Arbitrum Goerli Faucet**: [bridge.arbitrum.io](https://bridge.arbitrum.io/)

## 🚨 Common Issues & Solutions

### Issue 1: Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart services
pnpm docker:down
pnpm docker:up
```

### Issue 2: Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Issue 3: Blockchain Connection Failed
```bash
# Check RPC URL format
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  YOUR_RPC_URL

# Should return a block number
```

### Issue 4: Contract Deployment Failed
```bash
# Check if you have enough test ETH
# Check private key format (should start with 0x)
# Verify network configuration in hardhat.config.js
```

## 📊 Monitoring & Health Checks

### Local Monitoring URLs:
- **API Health**: http://localhost:3000/api/health
- **API Documentation**: http://localhost:3000/api-docs
- **Prometheus Metrics**: http://localhost:9090
- **Grafana Dashboard**: http://localhost:3001 (admin/admin)

### Health Check Commands:
```bash
# Backend health
curl http://localhost:3000/api/health

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping
```

## 🎯 Next Steps After Setup

1. **Test API Endpoints** using the Postman collection
2. **Deploy Smart Contracts** to testnet
3. **Set up Frontend** integration
4. **Configure Production** environment
5. **Set up Monitoring** and alerts

## 📞 Support

If you encounter any issues:
1. Check the logs: `docker-compose logs backend`
2. Verify environment variables
3. Check network connectivity
4. Review the troubleshooting section above

---

**🎉 You're all set! The Ledger Link Backend should now be running smoothly.**
