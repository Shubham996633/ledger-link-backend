# Simulated Wallet System Guide

## Overview

The **Simulated Wallet System** allows users to practice cryptocurrency transactions without spending real Ethereum or paying gas fees. Everything is stored in PostgreSQL, providing a risk-free environment to learn blockchain interactions.

## Features

✅ **Fake Currency**: Practice with simulated ETH, USDT, USDC, and DAI
✅ **No Gas Costs**: All transactions are instant and free
✅ **Complete Transaction History**: View all your simulated transactions
✅ **Multi-Token Support**: Manage different token balances
✅ **Faucet System**: Get free test tokens anytime
✅ **Realistic Experience**: Wallet addresses and transaction hashes look real

## Architecture

### Database Schema

#### 1. **wallets** Table
```sql
- id (UUID)
- address (Ethereum-style address, unique)
- userId (Foreign Key to users)
- blockchain (default: 'ethereum')
- network (default: 'simulated')
- isSimulated (boolean, default: true)
- isPrimary (boolean)
- label (user-defined name)
- metadata (JSON)
```

#### 2. **wallet_balances** Table
```sql
- id (UUID)
- walletId (Foreign Key to wallets)
- tokenSymbol ('ETH', 'USDT', 'USDC', 'DAI', etc.)
- tokenAddress (nullable for native tokens)
- balance (decimal, 36 digits, 18 decimals)
- decimals (default: 18)
- tokenName (full name)
- isActive (boolean)
```

#### 3. **transactions** Table (Extended)
```sql
- id (UUID)
- hash (unique transaction hash)
- userId (Foreign Key)
- fromAddress, toAddress
- amount (decimal)
- tokenAddress (nullable)
- status ('pending' | 'confirmed' | 'failed' | 'cancelled')
- isSimulated (boolean, default: true)  ← NEW
- blockNumber (nullable for simulated)  ← UPDATED
- ... (other fields)
```

## API Endpoints

### Wallet Management

#### 1. Create Simulated Wallet
```http
POST /api/wallets/create
Authorization: Bearer <token>

{
  "label": "My Practice Wallet",
  "blockchain": "ethereum",
  "network": "simulated",
  "initialBalances": [
    { "tokenSymbol": "ETH", "amount": "10.0", "tokenName": "Ethereum" },
    { "tokenSymbol": "USDT", "amount": "10000.0", "tokenName": "Tether USD" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "userId": "user-uuid",
    "isSimulated": true,
    "balances": [
      { "tokenSymbol": "ETH", "balance": "10.0" },
      { "tokenSymbol": "USDT", "balance": "10000.0" }
    ]
  }
}
```

#### 2. Get User Wallets
```http
GET /api/wallets
Authorization: Bearer <token>
```

#### 3. Get Wallet Balances
```http
GET /api/wallets/:walletId/balances
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tokenSymbol": "ETH",
      "balance": "9.5",
      "tokenName": "Ethereum",
      "decimals": 18
    },
    {
      "id": "uuid",
      "tokenSymbol": "USDT",
      "balance": "9500.0",
      "tokenName": "Tether USD",
      "decimals": 18
    }
  ]
}
```

### Transactions

#### 4. Send Simulated Transaction
```http
POST /api/wallets/:walletId/send
Authorization: Bearer <token>

{
  "toAddress": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
  "amount": "0.5",
  "tokenSymbol": "ETH",
  "description": "Test payment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid",
      "hash": "0xabcd1234...",
      "fromAddress": "0x742d35Cc...",
      "toAddress": "0x8626f694...",
      "amount": "0.5",
      "status": "confirmed",
      "isSimulated": true
    },
    "hash": "0xabcd1234...",
    "status": "confirmed",
    "fromBalance": "9.5"
  }
}
```

#### 5. Get Transaction History
```http
GET /api/wallets/:walletId/transactions?limit=50&offset=0
Authorization: Bearer <token>
```

### Faucet (Free Tokens)

#### 6. Request Free Tokens
```http
POST /api/wallets/:walletId/faucet
Authorization: Bearer <token>

{
  "tokenSymbol": "ETH",
  "amount": "1.0"  // optional, uses defaults
}
```

**Default Faucet Amounts:**
- ETH: 1.0
- USDT: 1000.0
- USDC: 1000.0
- DAI: 1000.0

## Usage Examples

### Example 1: Create a Wallet and Make Transactions

```javascript
// 1. Create simulated wallet
const createResponse = await fetch('/api/wallets/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    label: 'My First Wallet'
  })
});

const { data: wallet } = await createResponse.json();
console.log('Wallet address:', wallet.address);

// 2. Check balances
const balancesResponse = await fetch(`/api/wallets/${wallet.id}/balances`, {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const { data: balances } = await balancesResponse.json();
console.log('ETH Balance:', balances.find(b => b.tokenSymbol === 'ETH').balance);

// 3. Send transaction
const txResponse = await fetch(`/api/wallets/${wallet.id}/send`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    toAddress: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    amount: '0.1',
    tokenSymbol: 'ETH'
  })
});

const { data: transaction } = await txResponse.json();
console.log('Transaction hash:', transaction.hash);

// 4. Get transaction history
const historyResponse = await fetch(`/api/wallets/${wallet.id}/transactions`, {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const { data: transactions } = await historyResponse.json();
console.log('Transaction count:', transactions.length);
```

### Example 2: Using the Faucet

```javascript
// Request free ETH
const faucetResponse = await fetch(`/api/wallets/${walletId}/faucet`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tokenSymbol: 'ETH'
  })
});

const { data: balance } = await faucetResponse.json();
console.log('New balance:', balance.balance);
```

## Setup & Configuration

### 1. Database Migration

The system automatically creates tables when you start the backend in development mode (`synchronize: true`).

For production, create a migration:

```bash
cd backend
npm run migration:generate -- -n AddSimulatedWallet
npm run migration:run
```

### 2. Seed Demo Data

Run the seed script to create demo users with simulated wallets:

```bash
cd backend
npm run seed
```

This creates:
- 3 demo users (alice, bob, charlie)
- Simulated wallets for each user
- Initial balances (10 ETH, 10,000 USDT/USDC/DAI per wallet)
- Sample transactions between users

To clear seed data:
```bash
npm run seed:clear
```

### 3. Environment Variables

No additional environment variables needed! The simulated wallet system works out of the box.

## How It Works

### Transaction Flow

1. **User initiates transaction**
   ```
   POST /api/wallets/:walletId/send
   ```

2. **Service validates**
   - Checks wallet exists
   - Verifies wallet is simulated
   - Checks sufficient balance
   - Validates recipient address format

3. **Service processes (in a database transaction)**
   - Deducts from sender's balance
   - Adds to recipient's balance (if simulated wallet)
   - Generates simulated transaction hash
   - Creates transaction record with `isSimulated: true`
   - Commits database transaction

4. **Instant confirmation**
   - No blockchain wait time
   - Status immediately set to 'confirmed'
   - Balance updated in real-time

### Balance Management

- All balances stored as high-precision decimals (36 digits, 18 decimal places)
- Supports same precision as real Ethereum (up to wei level)
- Balance updates are atomic (database transactions ensure consistency)
- No risk of double-spending due to PostgreSQL transaction isolation

## Key Differences from Real Blockchain

| Feature | Real Blockchain | Simulated Wallet |
|---------|----------------|------------------|
| Gas Fees | Required (real ETH) | **Free** |
| Confirmation Time | 12-15 seconds | **Instant** |
| Network Dependency | Requires RPC connection | **Works offline** |
| Cost to Practice | Real money needed | **Completely free** |
| Transaction Reversal | Impossible | Can be managed in DB |
| Block Numbers | Real blocks | **NULL or simulated** |
| Address Format | Real Ethereum addresses | **Looks real, DB-generated** |

## Security Considerations

### Isolation

- Simulated wallets are clearly marked with `isSimulated: true`
- Cannot mix simulated and real transactions
- Service layer validates wallet type before processing

### Data Integrity

- All balance updates use database transactions
- Rollback on any error
- Unique constraints prevent duplicate transactions

### User Safety

- No real private keys stored or used
- No connection to real blockchain networks
- Users can practice without financial risk

## Testing

### Unit Tests Example

```typescript
describe('SimulatedWalletService', () => {
  it('should create wallet with initial balances', async () => {
    const wallet = await service.createSimulatedWallet({
      userId: 'test-user',
      label: 'Test Wallet'
    });

    expect(wallet.isSimulated).toBe(true);
    expect(wallet.balances.length).toBeGreaterThan(0);
  });

  it('should simulate transaction successfully', async () => {
    const result = await service.simulateTransaction({
      fromWalletId: wallet1.id,
      toAddress: wallet2.address,
      amount: '1.0',
      tokenSymbol: 'ETH'
    });

    expect(result.status).toBe('confirmed');
    expect(result.transaction.isSimulated).toBe(true);
  });

  it('should reject insufficient balance', async () => {
    await expect(
      service.simulateTransaction({
        fromWalletId: wallet.id,
        toAddress: recipient,
        amount: '1000.0',
        tokenSymbol: 'ETH'
      })
    ).rejects.toThrow('Insufficient balance');
  });
});
```

## Troubleshooting

### Issue: "Wallet not found"
**Solution:** Ensure you're using the correct wallet ID from the authenticated user's wallets.

### Issue: "Insufficient balance"
**Solution:** Use the faucet endpoint to add more tokens:
```http
POST /api/wallets/:walletId/faucet
{ "tokenSymbol": "ETH" }
```

### Issue: "Only simulated wallets can use simulated transactions"
**Solution:** The wallet you're trying to use is marked as real (`isSimulated: false`). Create a new simulated wallet.

## Future Enhancements

- [ ] Custom token creation
- [ ] Smart contract simulation
- [ ] Transaction batching
- [ ] Scheduled transactions
- [ ] Transaction templates
- [ ] Wallet import/export
- [ ] Multi-signature simulated wallets
- [ ] Gas fee simulation (optional educational feature)

## Support

For issues or questions:
1. Check this guide
2. Review the API documentation at `/api-docs`
3. Check the backend logs
4. Open an issue on GitHub

---

**Happy practicing! 🚀**
