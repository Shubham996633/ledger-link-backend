import { Router, Request, Response } from 'express';
import { AIService } from '@/services/AIService';
import { DatabaseService } from '@/services/DatabaseService';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';

const router = Router();

let aiService: AIService;

function getService() {
  if (!aiService) {
    const dbService = DatabaseService.getInstance();
    aiService = new AIService(dbService.getDataSource());
  }
  return aiService;
}

/**
 * GET /api/ai/analyze/:transactionId
 * Analyze a transaction for anomalies and fraud
 */
router.get('/analyze/:transactionId', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const service = getService();
  const { transactionId } = req.params;

  const result = await service.analyzeTransaction(transactionId);

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * GET /api/ai/insights
 * Get AI-powered spending insights for the authenticated user
 */
router.get('/insights', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const service = getService();
  const userId = req.user!.userId;

  const insights = await service.getSpendingInsights(userId);

  res.json({
    success: true,
    data: insights,
  });
}));

/**
 * GET /api/ai/risk-score/:address
 * Get risk profile for a blockchain address
 */
router.get('/risk-score/:address', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const service = getService();
  const { address } = req.params;

  const profile = await service.getAddressRiskProfile(address);

  res.json({
    success: true,
    data: profile,
  });
}));

/**
 * POST /api/ai/detect-fraud
 * Run batch fraud detection on recent transactions
 */
router.post('/detect-fraud', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const service = getService();
  const limit = parseInt(req.query.limit as string) || 50;

  const result = await service.detectFraud(limit);

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * GET /api/ai/portfolio
 * Get AI-powered portfolio insights
 */
router.get('/portfolio', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const service = getService();
  const userId = req.user!.userId;

  const insights = await service.getPortfolioInsights(userId);

  res.json({
    success: true,
    data: insights,
  });
}));

export default router;
