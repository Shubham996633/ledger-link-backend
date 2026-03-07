import { Router, Response, Request } from 'express';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { TokenMarketService } from '@/services/TokenMarketService';
import { StripeService } from '@/services/StripeService';
import { DatabaseService } from '@/services/DatabaseService';
import { logger } from '@/utils/logger';

const router = Router();

function getMarketService(): TokenMarketService {
  return new TokenMarketService();
}

function getStripeService(): StripeService {
  const db = DatabaseService.getInstance();
  return new StripeService(db.getDataSource());
}

// ============================================
// MARKET DATA (Public)
// ============================================

/**
 * GET /api/market/prices - Get all token prices from Binance
 */
router.get('/prices', async (req: Request, res: Response) => {
  try {
    const marketService = getMarketService();
    const prices = await marketService.getAllPrices();
    res.json({ success: true, data: { prices } });
  } catch (error: any) {
    logger.error('Failed to fetch prices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prices' });
  }
});

/**
 * GET /api/market/prices/:symbol - Get single token price
 */
router.get('/prices/:symbol', async (req: Request, res: Response) => {
  try {
    const marketService = getMarketService();
    const price = await marketService.getPrice(req.params.symbol);
    res.json({ success: true, data: price });
  } catch (error: any) {
    logger.error('Failed to fetch price:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/market/tokens - Get supported tokens
 */
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const marketService = getMarketService();
    const tokens = await marketService.getSupportedTokens();
    res.json({ success: true, data: { tokens } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch tokens' });
  }
});

// ============================================
// STRIPE CHECKOUT (Auth required)
// ============================================

/**
 * POST /api/market/checkout - Create Stripe checkout session
 */
router.post('/checkout', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { walletId, tokenSymbol, usdAmount } = req.body;

    if (!walletId || !tokenSymbol || !usdAmount) {
      res.status(400).json({
        success: false,
        message: 'walletId, tokenSymbol, and usdAmount are required',
      });
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const stripeService = getStripeService();
    const result = await stripeService.createCheckoutSession({
      userId: req.user!.userId,
      walletId,
      tokenSymbol: tokenSymbol.toUpperCase(),
      usdAmount: parseFloat(usdAmount),
      successUrl: `${frontendUrl}/dashboard/buy?success=true`,
      cancelUrl: `${frontendUrl}/dashboard/buy?canceled=true`,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Checkout creation failed:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/market/verify-payment - Verify and fulfill a payment after success redirect
 */
router.post('/verify-payment', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }

    const stripeService = getStripeService();
    const purchase = await stripeService.verifyAndFulfill(sessionId);

    res.json({
      success: true,
      data: {
        purchase,
        message: `Successfully purchased ${purchase.tokenAmount} ${purchase.tokenSymbol}`,
      },
    });
  } catch (error: any) {
    logger.error('Payment verification failed:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/market/webhook - Stripe webhook handler
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const stripeService = getStripeService();
    await stripeService.handleWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ============================================
// PURCHASE HISTORY (Auth required)
// ============================================

/**
 * GET /api/market/purchases - Get user's purchase history
 */
router.get('/purchases', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const stripeService = getStripeService();
    const result = await stripeService.getUserPurchases(req.user!.userId, limit, offset);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Failed to fetch purchases:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
});

/**
 * GET /api/market/purchases/stats - Get purchase stats
 */
router.get('/purchases/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stripeService = getStripeService();
    const stats = await stripeService.getPurchaseStats(req.user!.userId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

export default router;
