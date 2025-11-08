import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    name: process.env.DB_NAME || 'ledger_link',
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Encryption configuration
  encryption: {
    algorithm: 'aes-256-gcm',
    key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here',
    ivLength: 16,
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: process.env.NODE_ENV === 'development'
      ? 100000
      : parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100000 in dev, 100 in production
  },
  
  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  // Blockchain configuration
  blockchain: {
    defaultNetwork: process.env.DEFAULT_NETWORK || 'goerli',
    // TODO: Add more blockchain-specific config
  },
  
  // External services
  external: {
    // TODO: Add external service configurations (APIs, etc.)
  },
};

// Validation function
export function validateConfig() {
  const requiredEnvVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    // TODO: Add more required environment variables
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// TODO: Add configuration validation for production
// TODO: Add configuration hot-reloading
// TODO: Add configuration encryption for sensitive values
