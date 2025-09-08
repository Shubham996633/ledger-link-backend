# 🧪 Postman Testing Guide - Ledger Link API

## 📥 Import Instructions

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Select both files:
   - `Ledger_Link_API_Collection.json`
   - `Ledger_Link_Environment.json`
4. Click **Import**

### 2. Set Environment

1. Click the environment dropdown (top right)
2. Select **"Ledger Link Environment"**
3. Click the eye icon to view/edit variables

## 🔧 Environment Variables Setup

### Required Variables to Update:

#### 1. **baseUrl**

- **Development**: `http://localhost:3000`
- **Staging**: `https://staging-api.ledgerlink.com`
- **Production**: `https://api.ledgerlink.com`

#### 2. **walletAddress**

- Replace with your test wallet address
- Example: `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`

#### 3. **walletPrivateKey** (Secret)

- Your test wallet's private key
- **⚠️ NEVER commit this to version control!**
- Example: `0x1234567890abcdef...`

#### 4. **network**

- Change based on your target network:
  - `goerli` (Ethereum Goerli testnet)
  - `arbitrum-goerli` (Arbitrum Goerli testnet)
  - `mainnet` (Ethereum mainnet)
  - `arbitrum` (Arbitrum mainnet)

## 🚀 Testing Workflow

### Step 1: Health Check

1. Run **"Basic Health Check"** to verify API is running
2. Expected response: `{"success": true, "data": {...}}`

### Step 2: Wallet Authentication Flow

#### 2.1 Connect Wallet

1. Run **"Connect Wallet"**
2. This will set `authMessage` and `timestamp` variables
3. Copy the `authMessage` from response

#### 2.2 Sign Message (Manual Step)

1. Use MetaMask or your wallet to sign the `authMessage`
2. Copy the signature
3. Update `walletSignature` variable in environment

#### 2.3 Authenticate

1. Run **"Authenticate Wallet"**
2. This will set `authToken`, `refreshToken`, and `userId`
3. You're now authenticated! 🎉

### Step 3: Test Authenticated Endpoints

#### 3.1 Get User Info

1. Run **"Get Current User"**
2. Should return your user information

#### 3.2 Create Transaction

1. Run **"Create Transaction (ETH)"** or **"Create Transaction (ERC-20)"**
2. This will set `transactionId` and `transactionHash`
3. Check the response for transaction details

#### 3.3 Get Transactions

1. Run **"Get User Transactions"**
2. Should return your transaction history

#### 3.4 Get Transaction Stats

1. Run **"Get Transaction Statistics"**
2. Should return transaction counts and statistics

## 🔄 Automated Testing

### Collection Runner

1. Click **"..."** next to collection name
2. Select **"Run collection"**
3. Configure:
   - **Environment**: Ledger Link Environment
   - **Iterations**: 1
   - **Delay**: 1000ms
4. Click **"Run Ledger Link API Collection"**

### Newman CLI Testing

```bash
# Install Newman
npm install -g newman

# Run collection
newman run postman/Ledger_Link_API_Collection.json \
  -e postman/Ledger_Link_Environment.json \
  --reporters cli,html \
  --reporter-html-export test-results.html
```

## 🧪 Test Scenarios

### Happy Path Testing

1. **Health Check** → **Connect Wallet** → **Authenticate** → **Get User** → **Create Transaction** → **Get Transactions**

### Error Testing

1. **Invalid Authentication** - Test with invalid token
2. **Missing Authentication** - Test without token
3. **Invalid Data** - Test with malformed requests
4. **Rate Limiting** - Test rate limit by running same request multiple times

### Edge Cases

1. **Empty Responses** - Test with no data
2. **Large Data** - Test with large transaction amounts
3. **Special Characters** - Test with special characters in descriptions

## 📊 Response Validation

### Success Response Format

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Validation error details"]
}
```

## 🔍 Debugging Tips

### 1. Check Environment Variables

- Click the eye icon next to environment name
- Verify all required variables are set
- Check that `authToken` is set after authentication

### 2. Check Console Logs

- Open Postman Console (View → Show Postman Console)
- Look for auto-generated logs from test scripts

### 3. Check Response Headers

- Look for rate limiting headers
- Check CORS headers
- Verify content-type

### 4. Common Issues

#### Authentication Fails

- Verify wallet signature is correct
- Check timestamp is recent (within 5 minutes)
- Ensure wallet address matches

#### Transaction Fails

- Check if you have enough test ETH
- Verify network configuration
- Check private key is set correctly

#### Rate Limiting

- Wait 15 minutes between auth attempts
- Use different IP or clear rate limit cache

## 📈 Performance Testing

### Load Testing with Postman

1. Create a collection with multiple requests
2. Use Collection Runner with multiple iterations
3. Monitor response times and success rates

### Example Load Test

```bash
# Run 100 iterations with 10 concurrent users
newman run collection.json \
  -e environment.json \
  --iteration-count 100 \
  --concurrent-request-limit 10
```

## 🔐 Security Testing

### Test Security Headers

1. Check for CORS headers
2. Verify rate limiting
3. Test with invalid tokens
4. Check for information disclosure

### Test Input Validation

1. SQL injection attempts
2. XSS payloads
3. Large payloads
4. Special characters

## 📝 Test Data Management

### Test Wallets

- Use dedicated test wallets
- Never use mainnet wallets for testing
- Keep test ETH/tokens available

### Test Data Cleanup

- Clear environment variables after testing
- Reset database if needed
- Clean up test transactions

## 🚨 Troubleshooting

### Common Errors

#### 401 Unauthorized

- Check if `authToken` is set
- Verify token is not expired
- Re-authenticate if needed

#### 400 Bad Request

- Check request body format
- Verify required fields are present
- Check data validation rules

#### 429 Too Many Requests

- Wait for rate limit to reset
- Reduce request frequency
- Check rate limit configuration

#### 500 Internal Server Error

- Check server logs
- Verify database connection
- Check environment configuration

### Getting Help

1. Check server logs: `docker-compose logs backend`
2. Verify environment variables
3. Test with curl commands
4. Check API documentation at `/api-docs`

---

**🎉 Happy Testing! The Ledger Link API should now be fully testable with Postman.**
