# Ledger Link Backend

A decentralized platform that integrates **Ethereum smart contracts** with a **Node.js + Express + TypeScript backend**, following industry-standard microservice practices with clean architecture, modular structure, and security-first design.

## 🏗️ Architecture Overview

```
ledger-link-backend/
├── backend/                 # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── services/        # Business logic layer
│   │   ├── repositories/    # Database access layer
│   │   ├── entities/        # Database models (TypeORM)
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration files
│   │   ├── providers/       # External service providers
│   │   ├── helpers/         # Utility helpers
│   │   └── utils/           # Common utilities
│   ├── Dockerfile
│   └── package.json
├── contracts/               # Solidity smart contracts
│   ├── contracts/           # Smart contract source code
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   └── hardhat.config.js
├── monitoring/              # Prometheus & Grafana configs
├── .github/workflows/       # CI/CD pipelines
└── docker-compose.yml       # Local development setup
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Docker** and **Docker Compose**
- **PostgreSQL** 15+
- **Git**

### 1. Clone and Install

```bash
git clone <repository-url>
cd ledger-link-backend
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
# - Add your Infura/Alchemy RPC URLs
# - Set up database credentials
# - Configure JWT secrets
# - Add API keys for block explorers
```

**📋 Required Credentials:**

- **Infura/Alchemy** RPC URL for Ethereum networks
- **Etherscan/Arbiscan** API keys for contract verification
- **Test wallet** with private key and test ETH
- **Database** credentials (auto-configured with Docker)

### 3. Start Development Environment

```bash
# Run automated setup script
./scripts/setup.sh

# Start all services (PostgreSQL, Redis, Backend, Monitoring)
pnpm docker:up

# Or start individual services
pnpm dev                    # Backend only
pnpm contracts:compile      # Compile contracts
pnpm contracts:deploy:goerli # Deploy contracts to Goerli
```

### 4. Verify Installation

```bash
# Check backend health
curl http://localhost:3000/api/health

# Check metrics
curl http://localhost:3000/api/health/metrics

# Access monitoring dashboards
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001 (admin/admin)
# - API Documentation: http://localhost:3000/api-docs
```

### 5. Test with Postman

1. Import the Postman collection: `postman/Ledger_Link_API_Collection.json`
2. Import the environment: `postman/Ledger_Link_Environment.json`
3. Update environment variables with your credentials
4. Follow the testing guide: `postman/POSTMAN_TESTING_GUIDE.md`

## 📚 API Documentation

### Authentication Endpoints

#### `POST /api/auth/wallet/connect`

Get authentication message for wallet signature.

```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

#### `POST /api/auth/wallet/authenticate`

Authenticate with wallet signature.

```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "signature": "0x...",
  "message": "Ledger Link Authentication\\nAddress: 0x...\\nTimestamp: 1234567890",
  "timestamp": 1234567890
}
```

### Transaction Endpoints

#### `POST /api/transactions`

Create a new blockchain transaction.

```json
{
  "toAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "amount": "1.0",
  "network": "goerli",
  "tokenAddress": "0x...", // Optional for ERC-20 tokens
  "description": "Payment for services"
}
```

#### `GET /api/transactions`

Get user's transaction history.

```json
{
  "page": 1,
  "limit": 10,
  "status": "confirmed",
  "network": "goerli"
}
```

#### `GET /api/transactions/:id`

Get transaction details by ID.

#### `GET /api/transactions/hash/:hash`

Get transaction details by blockchain hash.

### Health & Monitoring

#### `GET /api/health`

Basic health check.

#### `GET /api/health/metrics`

Prometheus metrics endpoint.

## 🔗 Smart Contracts

### TransactionLogger Contract

A secure smart contract for logging and tracking transactions on the blockchain.

**Key Features:**

- User registration and management
- Transaction logging with metadata
- Status tracking (pending, confirmed, failed, cancelled)
- Authorization management
- Pause/unpause functionality
- Gas-optimized operations

**Deployment:**

```bash
# Deploy to Goerli testnet
pnpm contracts:deploy:goerli

# Deploy to Arbitrum Goerli
pnpm contracts:deploy:arbitrum-goerli

# Verify contracts
pnpm contracts:verify:goerli
```

## 🛠️ Development

### Backend Development

```bash
# Start development server with hot reload
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Format code
pnpm format

# Type checking
pnpm type-check
```

### Smart Contract Development

```bash
# Compile contracts
pnpm contracts:compile

# Run contract tests
pnpm contracts:test

# Run contract coverage
pnpm contracts:coverage

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

### Database Management

```bash
# Generate migration
npx typeorm migration:generate -n MigrationName

# Run migrations
npx typeorm migration:run

# Revert migration
npx typeorm migration:revert
```

## 🔒 Security Features

- **JWT Authentication** with wallet signature verification
- **AES-256-GCM Encryption** for sensitive data
- **Rate Limiting** on all endpoints
- **Input Validation** and sanitization
- **CORS Protection** with configurable origins
- **Helmet.js** security headers
- **SQL Injection Protection** via TypeORM
- **XSS Protection** with input sanitization

## 📊 Monitoring & Observability

### Metrics (Prometheus)

- HTTP request duration and count
- Active connections
- Blockchain transaction metrics
- Wallet authentication metrics
- Custom business metrics

### Logging (Winston)

- Structured JSON logging
- Log rotation and retention
- Different log levels
- Request/response logging
- Error tracking with stack traces

### Health Checks

- Basic health endpoint
- Detailed service health
- Kubernetes readiness/liveness probes
- Database connectivity checks
- Blockchain connectivity checks

## 🚀 Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# Build specific service
docker-compose build backend

# View logs
docker-compose logs -f backend
```

### AWS ECS Deployment

```bash
# Deploy using deployment script
./deployment/aws/deploy.sh force
```

### Environment-Specific Configurations

- **Development**: Local Docker setup
- **Staging**: AWS ECS with staging database
- **Production**: AWS ECS with production database and monitoring

## 🧪 Testing

### Backend Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

### Smart Contract Tests

```bash
# Unit tests
pnpm contracts:test

# Gas optimization tests
pnpm contracts:gas-report

# Coverage report
pnpm contracts:coverage
```

## 📋 TODO & Roadmap

### Immediate Tasks

- [ ] Complete authentication middleware integration
- [ ] Implement database connection and migrations
- [ ] Add comprehensive error handling
- [ ] Set up proper logging configuration
- [ ] Add API documentation (Swagger/OpenAPI)

### Short Term

- [ ] Implement user management APIs
- [ ] Add wallet management features
- [ ] Set up event listening for blockchain events
- [ ] Add transaction monitoring and alerts
- [ ] Implement caching with Redis

### Medium Term

- [ ] Add multi-signature wallet support
- [ ] Implement zero-knowledge proof integration
- [ ] Add batch transaction processing
- [ ] Set up automated testing in CI/CD
- [ ] Add performance monitoring and optimization

### Long Term

- [ ] Multi-chain support (Polygon, BSC, etc.)
- [ ] Advanced analytics and reporting
- [ ] Mobile API optimization
- [ ] Enterprise features and compliance
- [ ] Decentralized identity integration

## 📖 Additional Documentation

### Setup Guides

- **[Complete Setup Guide](SETUP_GUIDE.md)** - Detailed step-by-step setup instructions
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Postman Testing Guide](postman/POSTMAN_TESTING_GUIDE.md)** - API testing with Postman

### API Testing

- **Postman Collection**: `postman/Ledger_Link_API_Collection.json`
- **Postman Environment**: `postman/Ledger_Link_Environment.json`
- **Interactive API Docs**: http://localhost:3000/api-docs

### Database Setup

The application automatically creates the following tables:

- `users` - User accounts and profiles
- `wallets` - Connected wallet addresses
- `transactions` - Blockchain transaction records

### Required Credentials

1. **Infura/Alchemy** RPC URL for Ethereum networks
2. **Etherscan/Arbiscan** API keys for contract verification
3. **Test wallet** with private key and test ETH
4. **Database** credentials (auto-configured with Docker)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Use conventional commit messages
- Update documentation for new features
- Ensure all CI checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🔗 Links

- **Frontend Repository**: [Link to frontend repo]
- **Documentation**: [Link to docs]
- **API Documentation**: [Link to API docs]
- **Smart Contract Addresses**: [Link to deployed contracts]

---

**Built with ❤️ by the Ledger Link Team**
