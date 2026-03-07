# Deployment Guide

## Production Checklist

### Environment Variables

Set these for production:

```env
NODE_ENV=production
PORT=3000

# Database (use production credentials)
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=ledger_link

# JWT (use strong, unique secrets)
JWT_SECRET=generate-a-64-char-random-string
JWT_EXPIRES_IN=86400
JWT_REFRESH_EXPIRES_IN=604800

# Encryption (exactly 32 characters)
ENCRYPTION_KEY=generate-a-32-char-random-string

# AI Services
GROQ_API_KEY=your-production-groq-key
GROQ_API_KEY_2=your-backup-groq-key
GEMINI_API_KEY=your-gemini-key

# Market Data
BINANCE_API_KEY=your-binance-key
BINANCE_API_SECRET=your-binance-secret

# Payments (use live Stripe key for production)
STRIPE_SECRET_KEY=sk_live_your-stripe-key

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com
```

### Database Setup

For production, disable TypeORM auto-sync and run migrations manually:

```bash
# Run SQL scripts in order
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -f database/01_initial_setup.sql
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -f database/02_add_password_auth.sql
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -f database/03_add_payment_requests.sql
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -f database/04_add_simulated_wallet.sql
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -f database/05_add_blocks.sql
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -f database/06_add_audit_logs.sql
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -f database/07_add_health_records.sql
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -f database/08_add_supply_chain_items.sql
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -f database/09_add_token_purchases.sql
```

### Build

```bash
pnpm build
pnpm start
```

### Security Considerations

- Use strong JWT secrets (64+ characters)
- Use unique encryption keys
- Set `NODE_ENV=production`
- Use HTTPS in production
- Set `FRONTEND_URL` to your actual frontend domain for CORS
- For Stripe, switch from `sk_test_` to `sk_live_` keys
- Restrict Binance API key to read-only (market data)

## Deploy Options

### VPS (Ubuntu)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl enable postgresql

# Clone and build
git clone git@github.com:Shubham996633/ledger-link-backend.git
cd ledger-link-backend
pnpm install
pnpm build

# Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name ledger-link-backend
pm2 save
pm2 startup
```

### Using Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### Frontend Deployment

```bash
cd ledger-link-frontend
echo "NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api" > .env.local
npm run build
# Deploy to Vercel, Netlify, or self-host with PM2
```
