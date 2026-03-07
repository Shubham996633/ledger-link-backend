import { Router, Request, Response } from 'express';
import { DatabaseService } from '@/services/DatabaseService';
import { PaymentRequestRepository } from '@/repositories/PaymentRequestRepository';
import { WalletRepository } from '@/repositories/WalletRepository';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { randomBytes } from 'crypto';
import { logger } from '@/utils/logger';

const router = Router();

// Lazy initialization
let paymentRequestRepository: PaymentRequestRepository;
let walletRepository: WalletRepository;

function getServices() {
  if (!paymentRequestRepository) {
    const dbService = DatabaseService.getInstance();
    paymentRequestRepository = new PaymentRequestRepository(dbService.getDataSource());
    walletRepository = new WalletRepository(dbService.getDataSource());
  }
  return { paymentRequestRepository, walletRepository };
}

/**
 * POST /api/payment-requests
 * Create a new payment request
 */
router.post('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { paymentRequestRepository, walletRepository } = getServices();
  const userId = req.user!.userId;
  const { walletId, amount, description, tokenSymbol, expiresInHours } = req.body;

  // Validate wallet ownership
  const wallet = await walletRepository.findById(walletId);
  if (!wallet || wallet.userId !== userId) {
    res.status(404).json({
      success: false,
      message: 'Wallet not found or does not belong to you',
    });
    return;
  }

  // Generate unique request ID (10 characters)
  const requestId = randomBytes(5).toString('hex'); // 10 characters

  // Calculate expiration (default 7 days)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (expiresInHours || 168)); // 7 days default

  const paymentRequest = await paymentRequestRepository.create({
    userId,
    walletId,
    walletAddress: wallet.address,
    requestId,
    amount: amount || null,
    description,
    tokenSymbol: tokenSymbol || 'ETH',
    expiresAt,
    status: 'pending',
  });

  logger.info(`Payment request created: ${requestId} by user ${userId}`);

  res.status(201).json({
    success: true,
    data: paymentRequest,
  });
}));

/**
 * GET /api/payment-requests
 * Get user's payment requests
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { paymentRequestRepository } = getServices();
  const userId = req.user!.userId;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const requests = await paymentRequestRepository.findByUserId(userId, limit, offset);

  res.json({
    success: true,
    data: requests,
  });
}));

/**
 * GET /api/payment-requests/:requestId
 * Get payment request details (public endpoint)
 */
router.get('/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const { paymentRequestRepository } = getServices();
  const { requestId } = req.params;

  const request = await paymentRequestRepository.findByRequestId(requestId);

  if (!request) {
    res.status(404).json({
      success: false,
      message: 'Payment request not found',
    });
    return;
  }

  // Check if expired
  if (request.expiresAt && new Date() > request.expiresAt && request.status === 'pending') {
    await paymentRequestRepository.update(request.id, { status: 'expired' });
    request.status = 'expired';
  }

  res.json({
    success: true,
    data: request,
  });
}));

/**
 * PUT /api/payment-requests/:id/cancel
 * Cancel a payment request
 */
router.put('/:id/cancel', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { paymentRequestRepository } = getServices();
  const userId = req.user!.userId;
  const { id } = req.params;

  const request = await paymentRequestRepository.findById(id);

  if (!request) {
    res.status(404).json({
      success: false,
      message: 'Payment request not found',
    });
    return;
  }

  if (request.userId !== userId) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this request',
    });
    return;
  }

  if (request.status !== 'pending') {
    res.status(400).json({
      success: false,
      message: 'Can only cancel pending requests',
    });
    return;
  }

  const updated = await paymentRequestRepository.update(id, { status: 'cancelled' });

  logger.info(`Payment request cancelled: ${request.requestId} by user ${userId}`);

  res.json({
    success: true,
    data: updated,
  });
}));

/**
 * PUT /api/payment-requests/:requestId/complete
 * Mark payment request as completed (after transaction)
 */
router.put('/:requestId/complete', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { paymentRequestRepository } = getServices();
  const userId = req.user!.userId;
  const { requestId } = req.params;
  const { transactionId } = req.body;

  const request = await paymentRequestRepository.findByRequestId(requestId);

  if (!request) {
    res.status(404).json({
      success: false,
      message: 'Payment request not found',
    });
    return;
  }

  if (request.status !== 'pending') {
    res.status(400).json({
      success: false,
      message: 'Can only complete pending requests',
    });
    return;
  }

  const updated = await paymentRequestRepository.markAsCompleted(requestId, transactionId, userId);

  logger.info(`Payment request completed: ${requestId} by user ${userId}`);

  res.json({
    success: true,
    data: updated,
  });
}));

/**
 * DELETE /api/payment-requests/:id
 * Delete a payment request
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { paymentRequestRepository } = getServices();
  const userId = req.user!.userId;
  const { id } = req.params;

  const request = await paymentRequestRepository.findById(id);

  if (!request) {
    res.status(404).json({
      success: false,
      message: 'Payment request not found',
    });
    return;
  }

  if (request.userId !== userId) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to delete this request',
    });
    return;
  }

  await paymentRequestRepository.delete(id);

  logger.info(`Payment request deleted: ${request.requestId} by user ${userId}`);

  res.json({
    success: true,
    message: 'Payment request deleted successfully',
  });
}));

export default router;
