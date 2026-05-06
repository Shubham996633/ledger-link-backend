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
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { EmailService } from '@/services/EmailService';

const router = Router();

// Lazy initialization - services are created when first accessed
let authService: AuthService;
let userRepository: UserRepository;
let walletRepository: WalletRepository;
let emailService: EmailService;

function getServices() {
  if (!authService) {
    const dbService = DatabaseService.getInstance();
    userRepository = new UserRepository(dbService.getDataSource());
    walletRepository = new WalletRepository(dbService.getDataSource());
    authService = new AuthService(userRepository, walletRepository);
    emailService = new EmailService();
  }
  return { authService, userRepository, walletRepository, emailService };
}

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
  const { address } = validateAndSanitize(validationSchemas.walletConnect, req.body);

  const { authService } = getServices();
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
    const { authService } = getServices();
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
    res.status(400).json({
      success: false,
      message: 'Refresh token is required',
    });
    return;
  }
  
  try {
    const { authService } = getServices();
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
 * POST /api/auth/register
 * Register with email and password
 */
router.post('/register', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { userRepository } = getServices();
  const { email, password, username, firstName, lastName } = req.body;

  // Validation
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters',
    });
    return;
  }

  // Check if user exists
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await userRepository.create({
    email,
    username: username || email.split('@')[0],
    firstName,
    lastName,
    passwordHash,
    isEmailVerified: false,
    role: 'user',
    isActive: true,
  });

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400') }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800') }
  );

  logger.info(`User registered: ${user.email}`);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
}));

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { userRepository } = getServices();
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
    return;
  }

  // Find user
  const user = await userRepository.findByEmail(email);
  if (!user || !user.passwordHash) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
    return;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
    return;
  }

  // Check if user is active
  if (!user.isActive) {
    res.status(403).json({
      success: false,
      message: 'Account is disabled',
    });
    return;
  }

  // Update last login
  await userRepository.update(user.id, {
    lastLoginAt: new Date(),
  });

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400') }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800') }
  );

  logger.info(`User logged in: ${user.email}`);

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
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
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
    const { userRepository } = getServices();
    const user = await userRepository.findById(req.user!.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
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

/**
 * POST /api/auth/forgot-password
 * Send password reset email if account exists.
 * Always returns 200 to avoid leaking which emails exist.
 */
router.post('/forgot-password', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  const { userRepository, emailService } = getServices();
  const user = await userRepository.findByEmail(email);

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await userRepository.update(user.id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });

    try {
      await emailService.sendPasswordReset(user.email, token, user.firstName || user.username);
    } catch (err: any) {
      logger.error(`Failed to send reset email to ${user.email}: ${err.message}`);
    }
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, a reset link has been sent.',
  });
}));

/**
 * POST /api/auth/reset-password
 * Set a new password using a reset token.
 */
router.post('/reset-password', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400).json({ success: false, message: 'Token and password are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    return;
  }

  const { userRepository } = getServices();
  const user = await userRepository.findByPasswordResetToken(token);

  if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await userRepository.update(user.id, {
    passwordHash,
    passwordResetToken: null as any,
    passwordResetExpires: null as any,
  });

  logger.info(`Password reset for user: ${user.email}`);
  res.json({ success: true, message: 'Password has been reset. You can now sign in.' });
}));

/**
 * POST /api/auth/send-verification-email
 * Authenticated. Generate a token and email a verification link to the user.
 */
router.post('/send-verification-email', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userRepository, emailService } = getServices();
  const user = await userRepository.findById(req.user!.userId);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  if (user.isEmailVerified) {
    res.json({ success: true, message: 'Email already verified' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  await userRepository.update(user.id, { emailVerificationToken: token });

  try {
    await emailService.sendEmailVerification(user.email, token, user.firstName || user.username);
  } catch (err: any) {
    logger.error(`Failed to send verification email to ${user.email}: ${err.message}`);
    res.status(500).json({ success: false, message: 'Failed to send verification email' });
    return;
  }

  res.json({ success: true, message: 'Verification email sent. Check your inbox.' });
}));

/**
 * GET /api/auth/verify-email?token=...
 * Mark the user's email as verified. Idempotent — repeat calls with
 * the same token are still ok as long as the user is already verified.
 */
router.get('/verify-email', asyncHandler(async (req: Request, res: Response) => {
  const token = (req.query.token as string) || '';
  if (!token) {
    res.status(400).json({ success: false, message: 'Token is required' });
    return;
  }

  const { userRepository } = getServices();
  const user = await userRepository.findByEmailVerificationToken(token);

  if (!user) {
    // Token may have already been consumed — return success so repeat clicks
    // (e.g. React StrictMode double-fire) don't show a misleading error.
    res.json({ success: true, message: 'Email already verified' });
    return;
  }

  if (user.isEmailVerified) {
    res.json({ success: true, message: 'Email already verified' });
    return;
  }

  await userRepository.update(user.id, {
    isEmailVerified: true,
    emailVerificationToken: null as any,
  });

  logger.info(`Email verified for user: ${user.email}`);
  res.json({ success: true, message: 'Email verified successfully' });
}));

export default router;
