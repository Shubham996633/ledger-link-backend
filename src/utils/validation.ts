import Joi from 'joi';
import { ethers } from 'ethers';

/**
 * Validation schemas for API endpoints
 */
export const validationSchemas = {
  // Auth schemas
  walletConnect: Joi.object({
    address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  }),

  walletAuth: Joi.object({
    address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
    signature: Joi.string().required(),
    message: Joi.string().required(),
    timestamp: Joi.number().integer().positive().required(),
  }),

  // Transaction schemas
  createTransaction: Joi.object({
    toAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
    amount: Joi.string().pattern(/^\d+(\.\d+)?$/).required(),
    network: Joi.string().valid('goerli', 'arbitrum-goerli', 'mainnet', 'arbitrum').optional(),
    tokenAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
    data: Joi.string().pattern(/^0x[a-fA-F0-9]*$/).optional(),
    description: Joi.string().max(500).optional(),
  }),

  // User schemas
  updateUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    profileImageUrl: Joi.string().uri().optional(),
  }),

  // Wallet schemas
  createWallet: Joi.object({
    address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
    blockchain: Joi.string().valid('ethereum', 'arbitrum').default('ethereum'),
    network: Joi.string().valid('mainnet', 'goerli', 'arbitrum', 'arbitrum-goerli').default('goerli'),
    label: Joi.string().max(100).optional(),
  }),

  // Query schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  // Transaction query
  transactionQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('pending', 'confirmed', 'failed', 'cancelled').optional(),
    network: Joi.string().valid('goerli', 'arbitrum-goerli', 'mainnet', 'arbitrum').optional(),
    fromDate: Joi.date().iso().optional(),
    toDate: Joi.date().iso().optional(),
  }),
};

/**
 * Validate Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validate transaction hash
 */
export function isValidTransactionHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate private key
 */
export function isValidPrivateKey(privateKey: string): boolean {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitize(schema: Joi.ObjectSchema, data: any): any {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
  }
  
  // Sanitize string fields
  if (typeof value === 'object' && value !== null) {
    for (const key in value) {
      if (typeof value[key] === 'string') {
        value[key] = sanitizeInput(value[key]);
      }
    }
  }
  
  return value;
}

// TODO: Add more validation schemas
// TODO: Add custom validation rules
// TODO: Add validation middleware
// TODO: Add input sanitization for different data types
