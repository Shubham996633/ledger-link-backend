import { Router, Request, Response } from 'express';
import { BlockchainService } from '@/services/BlockchainService';
import { TransactionRepository } from '@/repositories/TransactionRepository';
import { validationSchemas, validateAndSanitize } from '@/utils/validation';
import { transactionRateLimiter } from '@/middleware/rateLimiter';
import { asyncHandler } from '@/middleware/errorHandler';
import { recordBlockchainTransaction } from '@/middleware/metrics';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { DatabaseService } from '@/services/DatabaseService';
import { logger } from '@/utils/logger';

const router = Router();

// Lazy initialization
let transactionRepository: TransactionRepository;
let blockchainService: BlockchainService;

function getServices() {
  if (!transactionRepository) {
    const dbService = DatabaseService.getInstance();
    transactionRepository = new TransactionRepository(dbService.getDataSource());
    blockchainService = new BlockchainService(transactionRepository);
  }
  return { transactionRepository, blockchainService };
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
router.post('/', authenticateToken, transactionRateLimiter, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { blockchainService } = getServices();
  const transactionData = validateAndSanitize(validationSchemas.createTransaction, req.body);

  const userId = req.user!.userId;
  
  // TODO: Get private key from secure storage or user input
  const privateKey = process.env.DEMO_PRIVATE_KEY || ''; // TODO: Implement secure key management
  
  if (!privateKey) {
    res.status(400).json({
      success: false,
      message: 'Private key not configured for demo',
    });
    return;
  }
  
  try {
    const transactionRequest = {
      fromAddress: req.body.fromAddress, // TODO: Get from authenticated user's wallet
      toAddress: transactionData.toAddress,
      amount: transactionData.amount,
      privateKey,
      network: transactionData.network,
      tokenAddress: transactionData.tokenAddress,
      data: transactionData.data,
    };
    
    let result;
    if (transactionData.tokenAddress) {
      result = await blockchainService.sendTokenTransaction(transactionRequest);
    } else {
      result = await blockchainService.sendTransaction(transactionRequest);
    }
    
    recordBlockchainTransaction(transactionData.network || 'goerli', result.status);
    
    logger.info(`Transaction created: ${result.hash}`);
    
    res.status(201).json({
      success: true,
      data: {
        transaction: {
          hash: result.hash,
          status: result.status,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
          transactionFee: result.transactionFee,
        },
      },
    });
  } catch (error) {
    recordBlockchainTransaction(transactionData.network || 'goerli', 'failed');
    throw error;
  }
}));

/**
 * GET /api/transactions
 * Get user's transactions
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { transactionRepository } = getServices();
  const query = validateAndSanitize(validationSchemas.transactionQuery, req.query);

  const userId = req.user!.userId;

  const offset = (query.page - 1) * query.limit;

  try {
    const transactions = await transactionRepository.findByUserId(userId, query.limit, offset);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: transactions.length, // TODO: Get actual total count
        },
      },
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * GET /api/transactions/:id
 * Get transaction by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { transactionRepository } = getServices();
  const { id } = req.params;

  try {
    const transaction = await transactionRepository.findById(id);
    
    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
      return;
    }
    
    // TODO: Check if user owns this transaction
    
    res.json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * GET /api/transactions/hash/:hash
 * Get transaction by hash
 */
router.get('/hash/:hash', asyncHandler(async (req: Request, res: Response) => {
  const { transactionRepository } = getServices();
  const { hash } = req.params;

  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    res.status(400).json({
      success: false,
      message: 'Invalid transaction hash format',
    });
    return;
  }

  try {
    const transaction = await transactionRepository.findByHash(hash);
    
    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * GET /api/transactions/stats
 * Get transaction statistics
 */
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { transactionRepository } = getServices();
  const userId = req.user!.userId;

  try {
    const stats = await transactionRepository.getTransactionStats(userId);
    
    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * POST /api/transactions/:id/status
 * Update transaction status (for webhook/event handling)
 */
router.post('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { transactionRepository } = getServices();
  const { id } = req.params;
  const { status, blockNumber, gasUsed, transactionFee } = req.body;

  // TODO: Add admin authentication
  // TODO: Validate status values

  try {
    const transaction = await transactionRepository.update(id, {
      status,
      blockNumber,
      gasUsed,
      transactionFee,
    });
    
    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    throw error;
  }
}));

export default router;
