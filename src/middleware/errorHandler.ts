import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { config } from '@/config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Custom error class
 */
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let { statusCode = 500, message } = error;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Don't leak error details in production
  if (config.server.nodeEnv === 'production' && !error.isOperational) {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.server.nodeEnv === 'development' && { stack: error.stack }),
  });
}

/**
 * Async error wrapper
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}

/**
 * Validation error handler
 */
export function validationErrorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }
  next(error);
}

// TODO: Add error reporting integration (Sentry, etc.)
// TODO: Add error metrics collection
// TODO: Add custom error types for different scenarios
// TODO: Add error recovery mechanisms
