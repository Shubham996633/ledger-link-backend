import { Router, Response } from 'express';
import { UserRepository } from '@/repositories/UserRepository';
import { DatabaseService } from '@/services/DatabaseService';
import { logger } from '@/utils/logger';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Lazy initialization
let userRepository: UserRepository;

function getServices() {
  if (!userRepository) {
    const dbService = DatabaseService.getInstance();
    userRepository = new UserRepository(dbService.getDataSource());
  }
  return { userRepository };
}

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userRepository } = getServices();
  const userId = req.user!.userId;

  const user = await userRepository.findById(userId);

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
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      profileImageUrl: user.profileImageUrl,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
  });
}));

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userRepository } = getServices();
  const userId = req.user!.userId;
  const { username, firstName, lastName, profileImageUrl } = req.body;

  const updatedUser = await userRepository.update(userId, {
    username,
    firstName,
    lastName,
    profileImageUrl,
  });

  if (!updatedUser) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  logger.info(`User profile updated: ${userId}`);

  res.json({
    success: true,
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      profileImageUrl: updatedUser.profileImageUrl,
    },
    message: 'Profile updated successfully',
  });
}));

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userRepository } = getServices();
  const userId = req.user!.userId;

  const user = await userRepository.findByIdWithRelations(userId);

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  const stats = {
    totalWallets: user.wallets?.length || 0,
    totalTransactions: user.transactions?.length || 0,
    memberSince: user.createdAt,
    lastActivity: user.lastLoginAt,
  };

  res.json({
    success: true,
    data: stats,
  });
}));

export default router;
