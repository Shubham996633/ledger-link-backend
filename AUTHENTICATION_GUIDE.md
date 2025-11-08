# Authentication Guide - Dual Auth System

Your Ledger Link platform now supports **TWO** authentication methods:

## 🔐 Authentication Methods

### 1. **Email/Password Authentication** (Traditional) ✅ NEW!

**Register:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "user",
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here"
    }
  }
}
```

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

---

### 2. **Web3 Wallet Authentication** (Blockchain)

**Step 1: Get Message to Sign**
```http
POST /api/auth/wallet/connect
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

**Step 2: Sign Message & Authenticate**
```http
POST /api/auth/wallet/authenticate
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "signature": "0x...",
  "message": "Login to Ledger Link..."
}
```

---

## 🗄️ Database Migration

### If you already have a database:
```bash
psql -U postgres -d ledger_link -f ADD_PASSWORD_AUTH.sql
```

### For a fresh setup:
```bash
psql -U postgres -d ledger_link -f DATABASE_COMPLETE_SETUP.sql
```

---

## 🚀 Testing the New Endpoints

### Using cURL:

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "username": "testuser"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

**Access Protected Route:**
```bash
# Get the access token from login/register response
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📊 Database Schema

The `users` table now has:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255),           -- NEW! For email/password auth
    is_email_verified BOOLEAN,
    role VARCHAR(50),
    is_active BOOLEAN,
    last_login_at TIMESTAMP,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 🔑 Password Requirements

- Minimum 8 characters
- Stored as bcrypt hash (salt rounds: 10)
- Never stored in plain text

---

## 🎯 Use Cases

| Method | Best For |
|--------|----------|
| **Email/Password** | Traditional users, mobile apps, quick testing |
| **Web3 Wallet** | Crypto users, MetaMask integration, no password needed |

---

## 🔒 Security Features

✅ **Password Hashing**: bcrypt with 10 salt rounds
✅ **JWT Tokens**: Signed with secret key
✅ **Refresh Tokens**: 7-day expiry
✅ **Access Tokens**: 24-hour expiry
✅ **Rate Limiting**: Prevents brute force attacks
✅ **Input Validation**: Email & password validation
✅ **Account Status**: Can disable accounts

---

## 📝 Frontend Integration Example

```typescript
// Register
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
    username: 'johndoe'
  })
});

const { data } = await response.json();
localStorage.setItem('accessToken', data.tokens.accessToken);
localStorage.setItem('refreshToken', data.tokens.refreshToken);

// Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123'
  })
});

// Use token for authenticated requests
const meResponse = await fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

---

## 🎉 Summary

Your platform now supports:

1. ✅ **Email/Password Registration** (`POST /api/auth/register`)
2. ✅ **Email/Password Login** (`POST /api/auth/login`)
3. ✅ **Web3 Wallet Authentication** (`POST /api/auth/wallet/authenticate`)
4. ✅ **Token Refresh** (`POST /api/auth/refresh`)
5. ✅ **Logout** (`POST /api/auth/logout`)
6. ✅ **Get Current User** (`GET /api/auth/me`)

Users can choose their preferred authentication method!
