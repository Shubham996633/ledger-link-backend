import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { logger } from '@/utils/logger';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

const blockchainTransactions = new client.Counter({
  name: 'blockchain_transactions_total',
  help: 'Total number of blockchain transactions',
  labelNames: ['network', 'status'],
});

const walletAuthentications = new client.Counter({
  name: 'wallet_authentications_total',
  help: 'Total number of wallet authentications',
  labelNames: ['status'],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(blockchainTransactions);
register.registerMetric(walletAuthentications);

/**
 * Metrics middleware
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Increment active connections
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    // Record metrics
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    // Decrement active connections
    activeConnections.dec();
  });

  next();
}

/**
 * Get metrics endpoint
 */
export async function getMetrics(req: Request, res: Response) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics',
    });
  }
}

/**
 * Record blockchain transaction metric
 */
export function recordBlockchainTransaction(network: string, status: string) {
  blockchainTransactions.labels(network, status).inc();
}

/**
 * Record wallet authentication metric
 */
export function recordWalletAuthentication(status: string) {
  walletAuthentications.labels(status).inc();
}

// Export register for custom metrics
export { register };

// TODO: Add more custom metrics
// TODO: Add business metrics (user registrations, transaction volumes, etc.)
// TODO: Add database metrics
// TODO: Add external service metrics
