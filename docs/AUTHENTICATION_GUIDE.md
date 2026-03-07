# Authentication Guide

## Authentication Method

Ledger Link uses **email/password authentication** with JWT tokens.

## Endpoints

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "johndoe"
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
      "role": "user"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

## Role-Based Access Control

| Role | Access |
|------|--------|
| user | Wallets, transactions, AI insights, ZK proofs |
| admin | All user access + audit logs, chain verification |
| provider | Health records (create, view granted records) |
| patient | Health records (own records, grant/revoke access) |
| auditor | Audit logs, health record verification |

## Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- **JWT access tokens**: Configurable expiry (default 24h)
- **JWT refresh tokens**: Configurable expiry (default 7 days)
- All authenticated endpoints require `Authorization: Bearer <token>` header

## Frontend Integration

The frontend stores tokens in localStorage and sends them via axios interceptors:

```typescript
// lib/api.ts handles this automatically
const response = await api.loginUser(email, password);
// Tokens stored, all subsequent requests include Authorization header
```
