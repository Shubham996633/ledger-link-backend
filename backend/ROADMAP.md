# Ledger Link - Feature Roadmap

## 🎯 Vision
Transform Ledger Link into a comprehensive crypto payment and wallet management platform with both simulated (practice) and live trading capabilities.

---

## ✅ Completed Features

### Core Platform (v1.0)
- [x] User authentication (email/password + Web3 wallet)
- [x] Simulated wallet creation with practice tokens
- [x] Send/receive transactions (simulated)
- [x] Transaction history and details
- [x] Dashboard with portfolio overview
- [x] Payment request system (Google Pay-style)
- [x] Public blockchain explorer
- [x] Multi-token support (ETH, USDT, USDC, DAI)
- [x] Transaction filters (incoming/outgoing, token type)
- [x] Scrollable transaction list

---

## 📋 Phase 1: Essential UX Improvements (Quick Wins)

### 1.1 QR Code Payment Requests ⭐ HIGH PRIORITY
**Estimated Time**: 2-3 hours
**Dependencies**: `qrcode` npm package

#### Backend Tasks:
- [ ] Install `qrcode` package
- [ ] Add QR code generation endpoint: `GET /api/payment-requests/:requestId/qr`
- [ ] Return base64 QR code image

#### Frontend Tasks:
- [ ] Add QR code display on payment request details
- [ ] Add "Show QR Code" button
- [ ] Add QR code to receive page
- [ ] Make QR code downloadable
- [ ] Add copy link button

**User Story**: User creates payment request → Shows QR code → Other person scans → Opens payment page

---

### 1.2 Contact Book / Address Book ⭐ HIGH PRIORITY
**Estimated Time**: 4-5 hours

#### Database:
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  label VARCHAR(100),
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  category VARCHAR(50), -- friends, business, family, other
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Backend Tasks:
- [ ] Create Contact entity
- [ ] Create ContactRepository
- [ ] Create contact controller with CRUD endpoints
- [ ] Add validation for wallet addresses
- [ ] Add search/filter endpoints

#### Frontend Tasks:
- [ ] Create contacts page `/dashboard/contacts`
- [ ] Add/Edit/Delete contact UI
- [ ] Add contact selector in send transaction form
- [ ] Import/Export contacts (CSV)
- [ ] Favorite contacts quick access

---

### 1.3 Transaction Search & Advanced Filters
**Estimated Time**: 3-4 hours

#### Backend Tasks:
- [ ] Add search query to transaction endpoints
- [ ] Support filtering by:
  - [ ] Date range
  - [ ] Amount range
  - [ ] Status
  - [ ] Token type
  - [ ] Address (partial match)
  - [ ] Description (full-text search)
- [ ] Add sorting options

#### Frontend Tasks:
- [ ] Add search bar to transactions page
- [ ] Date range picker component
- [ ] Amount range slider
- [ ] Advanced filter panel
- [ ] Save filter presets
- [ ] Clear all filters button

---

### 1.4 Transaction Export
**Estimated Time**: 2-3 hours
**Dependencies**: `csv-writer`, `pdfkit` or `jspdf`

#### Backend Tasks:
- [ ] Add CSV export endpoint
- [ ] Add PDF export endpoint
- [ ] Include filters in export
- [ ] Add date range to export

#### Frontend Tasks:
- [ ] Add "Export" button on transactions page
- [ ] Export format selector (CSV/PDF)
- [ ] Download trigger
- [ ] Export preview

---

## 📋 Phase 2: Live Trading & Exchange Integration

### 2.1 Binance Live Exchange Rates Integration ⭐ HIGH PRIORITY
**Estimated Time**: 3-4 hours
**API**: Binance Public API

#### Backend Tasks:
- [ ] Install `binance-api-node` or use REST API
- [ ] Create PriceService to fetch live rates
- [ ] Cache prices (update every 30 seconds)
- [ ] Add endpoints:
  - [ ] `GET /api/prices/current` - Current prices for all tokens
  - [ ] `GET /api/prices/history/:symbol` - Historical price data
  - [ ] `GET /api/prices/convert` - Convert between tokens
- [ ] Store Binance API key in environment variables
- [ ] Handle rate limits and errors

#### Configuration:
```typescript
// .env
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
```

#### Frontend Tasks:
- [ ] Display live prices on dashboard
- [ ] Show price charts (candlestick/line)
- [ ] Add price change indicators (+/-%)
- [ ] Live price updates (WebSocket or polling)
- [ ] USD conversion for all balances
- [ ] 24h volume and market cap

**Tokens to Track**:
- BTC/USDT
- ETH/USDT
- BNB/USDT
- USDC/USDT
- DAI/USDT

---

### 2.2 Stripe Integration for Token Purchase ⭐ HIGH PRIORITY
**Estimated Time**: 6-8 hours
**Dependencies**: `stripe` npm package

#### Use Cases:
1. **Buy Practice Tokens**: Pay real money to get practice tokens (educational credits)
2. **Premium Features**: Unlock advanced analytics, higher limits
3. **Faucet Credits**: Buy credits to request more faucet tokens

#### Database:
```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  stripe_payment_id VARCHAR(255),
  stripe_session_id VARCHAR(255),
  amount_usd DECIMAL(10, 2) NOT NULL,
  tokens_purchased JSONB, -- {ETH: 10, USDT: 1000}
  status VARCHAR(50), -- pending, completed, failed, refunded
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### Backend Tasks:
- [ ] Install Stripe SDK
- [ ] Configure Stripe API keys
- [ ] Create purchase endpoints:
  - [ ] `POST /api/purchases/create-checkout` - Create Stripe checkout
  - [ ] `POST /api/purchases/webhook` - Handle Stripe webhooks
  - [ ] `GET /api/purchases/history` - User purchase history
- [ ] Create pricing tiers:
  - [ ] Starter Pack: $5 → 5 ETH + 5000 USDT
  - [ ] Pro Pack: $20 → 25 ETH + 25000 USDT
  - [ ] Enterprise: $50 → 100 ETH + 100000 USDT
- [ ] Handle successful payments → Credit tokens
- [ ] Handle refunds → Debit tokens
- [ ] Send email receipts

#### Frontend Tasks:
- [ ] Create purchase page `/dashboard/buy-tokens`
- [ ] Pricing cards UI
- [ ] Stripe Checkout integration
- [ ] Success/failure pages
- [ ] Purchase history page
- [ ] Receipt download

---

### 2.3 Real Blockchain Integration (Optional Future)
**Estimated Time**: 15-20 hours
**Note**: This is advanced and optional

#### Options:
- [ ] Web3.js / Ethers.js integration
- [ ] Connect to Ethereum Testnet (Sepolia/Goerli)
- [ ] Real wallet connection (MetaMask)
- [ ] Read real blockchain balances
- [ ] Submit real transactions
- [ ] Gas estimation

---

## 📋 Phase 3: Advanced Analytics & Insights

### 3.1 Advanced Dashboard Analytics
**Estimated Time**: 5-6 hours
**Dependencies**: `chart.js` or `recharts`

#### Backend Tasks:
- [ ] Create analytics endpoints:
  - [ ] `GET /api/analytics/spending-trends` - Weekly/monthly trends
  - [ ] `GET /api/analytics/top-recipients` - Most frequent recipients
  - [ ] `GET /api/analytics/category-breakdown` - Spending by category
  - [ ] `GET /api/analytics/comparison` - Month-over-month comparison

#### Frontend Tasks:
- [ ] Create analytics page `/dashboard/analytics`
- [ ] Line chart: Balance over time
- [ ] Pie chart: Token distribution
- [ ] Bar chart: Monthly income vs expenses
- [ ] Top 5 recipients/senders
- [ ] Category spending breakdown
- [ ] Time period selector (week/month/year)

---

### 3.2 Transaction Categories & Tags
**Estimated Time**: 4-5 hours

#### Database:
```sql
CREATE TABLE transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20)
);

CREATE TABLE transaction_tags (
  transaction_id UUID REFERENCES transactions(id),
  category_id UUID REFERENCES transaction_categories(id),
  custom_tag VARCHAR(100),
  PRIMARY KEY (transaction_id, category_id)
);
```

#### Default Categories:
- Food & Dining
- Transportation
- Shopping
- Bills & Utilities
- Entertainment
- Healthcare
- Education
- Business
- Salary/Income
- Other

#### Tasks:
- [ ] Create category management endpoints
- [ ] Add category to transactions
- [ ] Filter by category
- [ ] Category-based budgets
- [ ] Spending alerts per category

---

### 3.3 Budget Tracking & Alerts
**Estimated Time**: 4-5 hours

#### Database:
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  category_id UUID REFERENCES transaction_categories(id),
  amount DECIMAL(20, 8) NOT NULL,
  token_symbol VARCHAR(20),
  period VARCHAR(20), -- daily, weekly, monthly
  alert_threshold DECIMAL(5, 2), -- Alert at 80%
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tasks:
- [ ] Create budget endpoints
- [ ] Track spending vs budget
- [ ] Send alerts when threshold reached
- [ ] Budget overview dashboard
- [ ] Rollover unused budget option

---

## 📋 Phase 4: Social & Collaboration Features

### 4.1 Split Payments
**Estimated Time**: 6-7 hours

#### Database:
```sql
CREATE TABLE split_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  total_amount DECIMAL(20, 8),
  token_symbol VARCHAR(20),
  status VARCHAR(50), -- pending, partially_paid, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE split_payment_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_payment_id UUID REFERENCES split_payments(id),
  participant_name VARCHAR(255),
  participant_email VARCHAR(255),
  share_amount DECIMAL(20, 8),
  payment_request_id UUID REFERENCES payment_requests(id),
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP
);
```

#### Features:
- [ ] Create split payment
- [ ] Add participants
- [ ] Equal or custom split
- [ ] Send payment links to all participants
- [ ] Track who has paid
- [ ] Auto-complete when all paid
- [ ] Reminder emails

---

### 4.2 Request Money from Multiple People
**Estimated Time**: 3-4 hours

#### Tasks:
- [ ] Bulk payment request creation
- [ ] Send to multiple emails
- [ ] Track individual responses
- [ ] Aggregate collection dashboard
- [ ] Auto-expire unclaimed requests

---

## 📋 Phase 5: Security & Compliance

### 5.1 Two-Factor Authentication (2FA)
**Estimated Time**: 4-5 hours
**Dependencies**: `speakeasy`, `qrcode`

#### Tasks:
- [ ] Generate 2FA secret
- [ ] QR code for authenticator apps
- [ ] Verify TOTP codes
- [ ] Backup codes generation
- [ ] 2FA enforcement for large transactions
- [ ] Security settings page

---

### 5.2 Transaction Limits & Controls
**Estimated Time**: 3-4 hours

#### Database:
```sql
CREATE TABLE transaction_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  limit_type VARCHAR(50), -- daily, weekly, monthly
  max_amount DECIMAL(20, 8),
  token_symbol VARCHAR(20),
  requires_2fa_above DECIMAL(20, 8)
);
```

#### Features:
- [ ] Set spending limits
- [ ] Require 2FA for amounts above threshold
- [ ] Address whitelist/blacklist
- [ ] Transaction velocity checks
- [ ] Suspicious activity detection

---

### 5.3 Activity & Security Log
**Estimated Time**: 3-4 hours

#### Database:
```sql
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  activity_type VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  location VARCHAR(255),
  status VARCHAR(50), -- success, failed, blocked
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Track:
- Login attempts
- Password changes
- 2FA changes
- Large transactions
- Failed authentications
- API key usage

---

## 📋 Phase 6: Business & Enterprise Features

### 6.1 Invoice Generation
**Estimated Time**: 5-6 hours
**Dependencies**: `pdfkit` or `react-pdf`

#### Database:
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  invoice_number VARCHAR(50) UNIQUE,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_address TEXT,
  items JSONB,
  subtotal DECIMAL(20, 8),
  tax_amount DECIMAL(20, 8),
  total_amount DECIMAL(20, 8),
  token_symbol VARCHAR(20),
  payment_request_id UUID REFERENCES payment_requests(id),
  status VARCHAR(50), -- draft, sent, paid, overdue, cancelled
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Features:
- [ ] Create professional invoices
- [ ] Line items with quantities
- [ ] Tax calculations
- [ ] PDF generation
- [ ] Email invoices
- [ ] Payment link in invoice
- [ ] Auto-mark as paid when payment received
- [ ] Overdue reminders

---

### 6.2 Recurring Payments / Subscriptions
**Estimated Time**: 6-7 hours

#### Database:
```sql
CREATE TABLE recurring_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  recipient_address VARCHAR(255),
  amount DECIMAL(20, 8),
  token_symbol VARCHAR(20),
  frequency VARCHAR(50), -- daily, weekly, monthly, yearly
  next_payment_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Features:
- [ ] Set up auto-payments
- [ ] Pause/resume subscriptions
- [ ] Payment history
- [ ] Failure handling
- [ ] Balance checks before payment
- [ ] Email notifications

---

## 📋 Phase 7: Notifications & Communication

### 7.1 Email Notifications
**Estimated Time**: 4-5 hours
**Dependencies**: `nodemailer`, `mjml` (email templates)

#### Email Types:
- [ ] Welcome email
- [ ] Transaction received notification
- [ ] Payment request received
- [ ] Payment request completed
- [ ] Payment request expiring soon
- [ ] Weekly summary
- [ ] Security alerts
- [ ] Invoice sent/paid
- [ ] Subscription payment success/failure

#### Tasks:
- [ ] Set up email service (SendGrid/AWS SES)
- [ ] Create email templates
- [ ] Email preference settings
- [ ] Unsubscribe handling

---

### 7.2 In-App Notifications
**Estimated Time**: 5-6 hours

#### Database:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(100),
  title VARCHAR(255),
  message TEXT,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Features:
- [ ] Notification center in header
- [ ] Real-time notifications (WebSocket)
- [ ] Mark as read/unread
- [ ] Clear all
- [ ] Notification preferences
- [ ] Badge count

---

### 7.3 Push Notifications (PWA)
**Estimated Time**: 6-8 hours

#### Tasks:
- [ ] Service worker setup
- [ ] Push notification permissions
- [ ] Subscription management
- [ ] Web Push API integration
- [ ] Notification click handling

---

## 📋 Phase 8: Mobile & PWA

### 8.1 Progressive Web App (PWA)
**Estimated Time**: 4-5 hours

#### Tasks:
- [ ] Create manifest.json
- [ ] Add service worker
- [ ] Offline support
- [ ] Install prompt
- [ ] App icons
- [ ] Splash screens
- [ ] Cache strategies

---

### 8.2 Dark Mode
**Estimated Time**: 3-4 hours

#### Tasks:
- [ ] Create dark theme
- [ ] Theme toggle
- [ ] Save preference
- [ ] System preference detection
- [ ] Update all components

---

### 8.3 QR Code Scanner (Camera Access)
**Estimated Time**: 3-4 hours
**Dependencies**: `react-qr-scanner` or `html5-qrcode`

#### Features:
- [ ] Camera permission
- [ ] Scan QR codes
- [ ] Parse payment requests
- [ ] Pre-fill send form
- [ ] Gallery upload for QR

---

## 📋 Phase 9: API & Developer Tools

### 9.1 Public REST API
**Estimated Time**: 8-10 hours

#### Features:
- [ ] API key generation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Rate limiting
- [ ] API usage analytics
- [ ] Webhooks for events
- [ ] SDK for popular languages

---

### 9.2 Webhooks System
**Estimated Time**: 4-5 hours

#### Database:
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  url VARCHAR(500) NOT NULL,
  events VARCHAR(255)[], -- transaction.created, payment_request.paid
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Events:
- `transaction.created`
- `transaction.confirmed`
- `payment_request.created`
- `payment_request.paid`
- `payment_request.expired`

---

## 🎯 Priority Order for Implementation

### Immediate (1-2 weeks):
1. **QR Code Payment Requests** - Quick win, high impact
2. **Binance Live Rates Integration** - Core feature
3. **Contact Book** - Major UX improvement

### Short Term (2-4 weeks):
4. **Stripe Integration** - Monetization
5. **Transaction Search & Export** - Essential for users
6. **Advanced Analytics** - Value-add feature

### Medium Term (1-2 months):
7. **Invoice System** - Business users
8. **Categories & Tags** - Organization
9. **Email Notifications** - Engagement

### Long Term (2-3 months):
10. **Split Payments** - Social feature
11. **2FA & Security** - Trust & safety
12. **PWA & Mobile** - Accessibility

---

## 📊 Success Metrics

### User Engagement:
- Daily active users
- Transactions per user
- Payment requests created
- Contact book usage

### Revenue (if applicable):
- Token purchases via Stripe
- Premium feature adoption
- API usage

### Performance:
- API response times
- Transaction processing speed
- Uptime percentage

---

## 🔧 Technical Debt & Improvements

### Code Quality:
- [ ] Add comprehensive unit tests
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Improve error handling
- [ ] Add logging and monitoring
- [ ] Code documentation
- [ ] TypeScript strict mode

### Infrastructure:
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Database backups
- [ ] Monitoring (Datadog/New Relic)
- [ ] Error tracking (Sentry)

### Performance:
- [ ] Database query optimization
- [ ] Add Redis caching
- [ ] CDN for static assets
- [ ] Image optimization
- [ ] Bundle size reduction

---

## 📝 Notes

- Each feature should be developed in a separate branch
- Write tests before merging to main
- Update this roadmap as priorities change
- Get user feedback after each phase
- Consider security implications for each feature

---

**Last Updated**: November 8, 2024
**Version**: 1.0
**Next Review**: December 2024
