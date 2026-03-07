import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { logger } from '@/utils/logger';

/**
 * General rate limiter
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
});

/**
 * Strict rate limiter for auth endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100000 : 5, // 100000 in dev, 5 in production
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later',
    });
  },
});

/**
 * Transaction rate limiter
 */
export const transactionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 100000 : 10, // 100000 in dev, 10 in production
  message: {
    success: false,
    message: 'Too many transaction requests, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Transaction rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many transaction requests, please slow down',
    });
  },
});

/**
 * API key rate limiter (for external integrations)
 */
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 100000 : 100, // 100000 in dev, 100 in production
  keyGenerator: (req) => {
    // Use API key as the key for rate limiting
    return (req.headers['x-api-key'] as string) || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'API rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// TODO: Add user-specific rate limiting
// TODO: Add dynamic rate limiting based on user tier
// TODO: Add rate limiting bypass for trusted IPs
// TODO: Add rate limiting metrics and monitoring
