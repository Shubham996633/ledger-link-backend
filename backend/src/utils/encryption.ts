import * as crypto from 'crypto';
import { config } from '@/config';

/**
 * Encrypt sensitive data using AES-256-CBC
 */
export function encrypt(text: string): { encrypted: string; iv: string } {
  try {
    const iv = crypto.randomBytes(config.encryption.ivLength);
    const cipher = crypto.createCipher('aes-256-cbc', config.encryption.key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
    };
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data using AES-256-CBC
 */
export function decrypt(encryptedData: { encrypted: string; iv: string }): string {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', config.encryption.key);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate secure token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// TODO: Add key rotation functionality
// TODO: Add encryption key management
// TODO: Add data masking utilities
// TODO: Add secure key derivation functions
