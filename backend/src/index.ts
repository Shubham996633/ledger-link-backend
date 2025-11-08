import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { DatabaseService } from '@/services/DatabaseService';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { rateLimiter } from '@/middleware/rateLimiter';
import { metricsMiddleware } from '@/middleware/metrics';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/config/swagger';

// Routes
import authRoutes from '@/controllers/authController';
import transactionRoutes from '@/controllers/transactionController';
import healthRoutes from '@/controllers/healthController';
import walletRoutes from '@/controllers/walletController';
import userRoutes from '@/controllers/userController';
import dashboardRoutes from '@/controllers/dashboardController';
import ledgerRoutes from '@/controllers/ledgerController';
import paymentRequestRoutes from '@/controllers/paymentRequestController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression and logging
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
app.use(rateLimiter);

// Metrics middleware
app.use(metricsMiddleware);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check (before auth middleware)
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/payment-requests', paymentRequestRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Initialize database connection and start server
async function startServer() {
  try {
    // Initialize database connection
    const dbService = DatabaseService.getInstance();
    await dbService.initialize();
    await dbService.runMigrations();

    app.listen(PORT, () => {
      logger.info(`🚀 Ledger Link Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
