# ⚡ Quick Start Guide - Ledger Link Backend

## 🎯 5-Minute Setup

### 1. Prerequisites Check

```bash
# Check if you have the required software
node --version  # Should be 18+
pnpm --version  # Should be 8+
docker --version
docker-compose --version
```

### 2. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd ledger-link-backend

# Install dependencies
pnpm install

# Run automated setup
./scripts/setup.sh
```

### 3. Environment Configuration

```bash
# Copy and edit environment files
cp env.example .env
cp contracts/env.example contracts/.env

# Edit .env with your values (see SETUP_GUIDE.md for details)
nano .env
nano contracts/.env
```

**Minimum Required Variables:**

```env
# .env
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
ENCRYPTION_KEY=your-32-character-encryption-key
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=your-etherscan-api-key

# contracts/.env
PRIVATE_KEY=your-test-wallet-private-key
ETHERSCAN_API_KEY=your-etherscan-api-key
```

### 4. Start Services

```bash
# Start all services with Docker
pnpm docker:up

# Wait for services to be ready (30 seconds)
sleep 30

# Start backend development server
pnpm dev
```

### 5. Verify Setup

```bash
# Test API health
curl http://localhost:3000/api/health

# Expected response:
# {"success":true,"data":{"status":"healthy",...}}
```

## 🧪 Test with Postman

### Import Collection

1. Open Postman
2. Import `postman/Ledger_Link_API_Collection.json`
3. Import `postman/Ledger_Link_Environment.json`
4. Set environment variables (see POSTMAN_TESTING_GUIDE.md)

### Quick Test Flow

1. **Health Check** → Should return `{"success": true}`
2. **Connect Wallet** → Sets auth message
3. **Sign message** with MetaMask
4. **Authenticate** → Sets JWT tokens
5. **Get User Info** → Returns user data
6. **Create Transaction** → Creates blockchain transaction

## 🚀 Deploy Contracts

```bash
# Compile contracts
pnpm contracts:compile

# Deploy to Goerli testnet
pnpm contracts:deploy:goerli

# Verify contracts
pnpm contracts:verify:goerli
```

## 📊 Access Services

- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/api/health
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -i :3000
kill -9 <PID>
```

#### Database Connection Failed

```bash
# Restart Docker services
pnpm docker:down
pnpm docker:up
```

#### Blockchain Connection Failed

- Check RPC URL format
- Verify API key is correct
- Ensure you have test ETH

### Get Help

- Check logs: `docker-compose logs backend`
- Read full setup guide: `SETUP_GUIDE.md`
- Check Postman testing guide: `postman/POSTMAN_TESTING_GUIDE.md`

## 🎉 You're Ready!

The Ledger Link Backend is now running with:

- ✅ Backend API with authentication
- ✅ Database with auto-migrations
- ✅ Smart contracts ready for deployment
- ✅ Monitoring and health checks
- ✅ Complete API documentation
- ✅ Postman collection for testing

**Next Steps:**

1. Test all API endpoints with Postman
2. Deploy contracts to testnet
3. Integrate with your frontend
4. Deploy to production

---

**🚀 Happy coding with Ledger Link!**
