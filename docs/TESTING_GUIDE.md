# Ledger Link - Frontend Testing Guide

This guide walks through testing every feature of Ledger Link via the frontend UI.

---

## Prerequisites

### 1. Start the Backend
```bash
cd ledger-link-backend
pnpm dev
```
Wait for: `Ledger Link Backend running on port 3000` and `WebSocket server ready on /ws`

### 2. Start the Frontend
```bash
cd ledger-link-frontend
npm run dev
```
Opens at: http://localhost:3001

---

## Step 1: Register & Login

1. Go to http://localhost:3001/register
2. Fill in: username, email, password (min 6 chars)
3. Click **Create Account**
4. You'll be redirected to the dashboard

**Verify:** You see the Dashboard overview with your username in the sidebar.

---

## Step 2: Create a Wallet

1. Click **Wallets** in the sidebar
2. Click **Create Wallet** (top right)
3. Enter a label (e.g., "My Test Wallet")
4. Click **Create Wallet**

**Verify:** A new wallet card appears with a `0x...` address and $0.00 balance.

---

## Step 3: Get Free Tokens (Faucet)

1. On the Wallets page, find your wallet
2. Under ETH balance, click **Get 100 more**
3. Repeat for USDT, USDC, or DAI if you want

**Verify:** Wallet balance updates to show 100 ETH (or whichever token).

---

## Step 4: Send a Transaction

1. Click **Send** in the sidebar
2. Select your wallet from the dropdown
3. Enter a recipient address (any `0x...` string, e.g., `0x1234567890abcdef1234567890abcdef12345678`)
4. Enter an amount (e.g., `5`)
5. Select token (ETH)
6. Click **Send Transaction**

**Verify:** Transaction appears as "confirmed" in the transaction list. Balance decreases.

---

## Step 5: View Transactions

1. Click **Transactions** in the sidebar
2. You should see your sent transaction
3. Click on any transaction to see details (hash, block number, gas, etc.)

**Verify:** Transaction details page shows all fields including block assignment.

---

## Step 6: Block Explorer

1. Click **Block Explorer** in the sidebar
2. You'll see network stats (total blocks, transactions, difficulty, validators)
3. The **Latest Blocks** list shows mined blocks
4. Click any block to expand and see: hash, previous hash, merkle root, nonce, gas, reward
5. Click **Verify Chain** to validate all hash links

**Verify:** Chain verification shows "Chain integrity verified" (green banner).

---

## Step 7: Live Feed (WebSocket)

1. Click **Live Feed** in the sidebar
2. Status indicator should show **Connected** (green)
3. Wait ~12 seconds for the next block to be mined
4. You'll see real-time events appear:
   - **Blue**: New blocks mined
   - **Green**: Transactions confirmed
   - **Amber**: Mempool updates

**Verify:** Events stream in automatically. Session counters increment. "Last Block" timer counts up between blocks.

---

## Step 8: Network Visualization

1. Click **Network** in the sidebar
2. See the blockchain visualized as connected blocks
3. **Green dots** = valid hash links between blocks
4. Click any block to see full details (hash, merkle root, nonce, etc.)
5. Browse pages with the arrow buttons
6. See **Validator Nodes** with their stake percentages

**Verify:** Blocks are connected with green links. Clicking "Verify Chain" confirms integrity.

---

## Step 9: Buy Tokens (Stripe)

1. Click **Buy Tokens** in the sidebar
2. **Live Market Prices** section shows real-time Binance prices
3. Select a token (e.g., ETH at ~$1,985)
4. Select your wallet as destination
5. Enter a USD amount (e.g., $50)
6. See the estimated tokens you'll receive
7. Click **Pay with Stripe**
8. You'll be redirected to Stripe Checkout (test mode)
9. Use test card: `4242 4242 4242 4242`, any future date, any CVC
10. After payment, you're redirected back and tokens are credited

**Verify:** Tokens appear in your wallet balance. Purchase shows in history as "completed".

> **Stripe Test Cards:**
> - Success: `4242 4242 4242 4242`
> - Decline: `4000 0000 0000 0002`
> - Requires Auth: `4000 0025 0000 3155`

---

## Step 10: AI Insights

1. Click **AI Insights** in the sidebar
2. **Overview tab**: Shows AI-generated insights and portfolio analysis (requires some transactions first)
3. **Risk Analysis tab**: Enter a wallet address -> click Analyze -> see risk score (0-100)
4. **Analyze Transaction tab**: Enter a transaction ID -> click Analyze -> see AI analysis

**Verify:** AI returns insights/risk scores. If Groq API is configured, you'll get detailed LLM-powered analysis.

---

## Step 11: Privacy / ZK Proofs

1. Click **Privacy** in the sidebar
2. Select **Proof of Knowledge** (left panel)
3. Enter a secret value (e.g., "mysecretpassword")
4. Click **Generate Proof**
5. Proof appears in the list on the right
6. Click **Verify** on the proof

**Other proof types to test:**
- **Range Proof**: Value=50, Min=0, Max=100 -> proves 50 is in [0,100] without revealing 50
- **Membership Proof**: Element="alice", Set="alice, bob, charlie" -> proves membership
- **Integrity Proof**: Enter any text -> creates tamper-proof hash commitment

**Verify:** Proofs are generated and verified successfully. Stats show total/verified counts.

---

## Step 12: Health Records

1. Click **Health Records** in the sidebar
2. Click **New Record** (top right)
3. Enter your user ID as Patient ID (copy from Settings page or use any UUID)
4. Select record type: "Lab Result"
5. Enter data: `{"test": "blood glucose", "value": "95 mg/dL", "normal": true}`
6. Click **Create Record**
7. Record appears in the list
8. Click **Verify** to check integrity (hash validation)
9. Click **View** to see decrypted data
10. Click **Access** to grant another user access

**Verify:** Record is created with encrypted data. Verify shows "Valid". View shows decrypted JSON.

---

## Step 13: Supply Chain

1. Click **Supply Chain** in the sidebar
2. Click **Register Item** (top right)
3. Enter: Name="Organic Coffee Beans", Origin="Colombia, South America"
4. Click **Register Item**
5. Item appears in "My Items" list with a tracking ID
6. Click **Checkpoint** -> Enter location="Panama Port", Status="In Transit", Temp=22
7. Click **Transfer** -> Enter a user ID and location
8. Click **Verify** to check chain integrity
9. Use the **Track** search bar with the tracking ID to see full chain of custody

**Verify:** Item shows status changes. Chain of custody timeline displays. Verification passes.

---

## Step 14: Explorer (Public Ledger)

1. Click **Explorer** in the sidebar
2. See all public transactions on the ledger
3. Search by transaction hash or address
4. Click any transaction to view details

---

## Step 15: Portfolio

1. Click **Portfolio** in the sidebar
2. See your total portfolio value across all wallets
3. Token distribution and balance breakdown

---

## Step 16: Settings

1. Click **Settings** in the sidebar
2. View/update your profile information

---

## Quick Demo Flow (5 minutes)

For a quick demo of the entire system:

1. **Register** -> Create account
2. **Create Wallet** -> Get a `0x...` address
3. **Faucet** -> Get 100 free ETH
4. **Buy Tokens** -> Buy $10 of SOL via Stripe (card: 4242...)
5. **Send** -> Send 5 ETH to a random address
6. **Live Feed** -> Watch the transaction get mined in real-time
7. **Block Explorer** -> See the block containing your transaction
8. **Network** -> Visualize the blockchain with hash links
9. **AI Insights** -> Analyze the transaction with AI
10. **ZK Proof** -> Generate a proof of knowledge
11. **Health Record** -> Create an encrypted medical record
12. **Supply Chain** -> Register and track an item
13. **Verify Chain** -> Confirm blockchain integrity

---

## API Endpoints Reference

All endpoints are at `http://localhost:3000/api/`

| Category | Endpoint | Auth |
|----------|----------|------|
| Auth | POST /auth/register, /auth/login | No |
| Wallets | POST /wallets/create, GET /wallets | Yes |
| Faucet | POST /wallets/:id/faucet | Yes |
| Send | POST /wallets/:id/send | Yes |
| Transactions | GET /transactions | Yes |
| Blockchain | GET /blockchain/blocks, /blockchain/stats | No |
| Market | GET /market/prices, /market/tokens | No |
| Checkout | POST /market/checkout | Yes |
| AI | GET /ai/insights, /ai/risk-score/:address | Yes |
| ZK Proofs | POST /privacy/zk/proof-of-knowledge | Yes |
| Health | POST /health-records, GET /health-records/:id | Yes |
| Supply Chain | POST /supply-chain/items | Yes |
| Audit | GET /audit/logs, /audit/stats | Yes |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend won't start | Check PostgreSQL is running: `sudo systemctl start postgresql` |
| Database errors | Ensure `ledger_link` database exists: `createdb ledger_link` |
| CORS errors | Check FRONTEND_URL in backend .env matches your frontend URL |
| Stripe redirect fails | Ensure FRONTEND_URL is set correctly in backend .env |
| WebSocket disconnects | Check backend is running and CORS allows your frontend origin |
| AI returns no insights | Ensure GROQ_API_KEY is set in backend .env |
| Binance prices fail | Fallback prices are used automatically; check BINANCE_API_KEY |
