import { Router, Request, Response } from 'express';
import { AuthService } from '@/services/AuthService';
import { UserRepository } from '@/repositories/UserRepository';
import { WalletRepository } from '@/repositories/WalletRepository';
import { validationSchemas, validateAndSanitize } from '@/utils/validation';
import { authRateLimiter } from '@/middleware/rateLimiter';
import { asyncHandler } from '@/middleware/errorHandler';
import { recordWalletAuthentication } from '@/middleware/metrics';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { DatabaseService } from '@/services/DatabaseService';
import { logger } from '@/utils/logger';

const router = Router();

// Initialize services with proper dependency injection
const dbService = DatabaseService.getInstance();
const userRepository = new UserRepository(dbService.getDataSource());
const walletRepository = new WalletRepository(dbService.getDataSource());
const authService = new AuthService(userRepository, walletRepository);

/**
 * @swagger
 * /api/auth/wallet/connect:
 *   post:
 *     summary: Get authentication message for wallet connection
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: Ethereum wallet address
 *                 example: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
 *     responses:
 *       200:
 *         description: Authentication message generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       description: Message to be signed by wallet
 *                     timestamp:
 *                       type: number
 *                       description: Timestamp for message validation
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/wallet/connect', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { address } = validateAndSanitize(validationSchemas.walletAuth.pick({ address: true }), req.body);
  
  const message = authService.generateAuthMessage(address);
  
  res.json({
    success: true,
    data: {
      message,
      timestamp: Date.now(),
    },
  });
}));

/**
 * POST /api/auth/wallet/authenticate
 * Authenticate with wallet signature
 */
router.post('/wallet/authenticate', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const payload = validateAndSanitize(validationSchemas.walletAuth, req.body);
  
  try {
    const result = await authService.authenticateWithWallet(payload);
    recordWalletAuthentication('success');
    
    logger.info(`User authenticated successfully: ${result.user.email}`);
    
    res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          role: result.user.role,
          isEmailVerified: result.user.isEmailVerified,
        },
        tokens: result.tokens,
      },
    });
  } catch (error) {
    recordWalletAuthentication('failed');
    throw error;
  }
}));

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required',
    });
  }
  
  try {
    const tokens = await authService.refreshToken(refreshToken);
    
    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
}));

/**
 * POST /api/auth/logout
 * Logout user (client-side token invalidation)
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement token blacklisting
  // TODO: Add session invalidation
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userRepository.findById(req.user!.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          profileImageUrl: user.profileImageUrl,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    throw error;
  }
}));

export default router;
