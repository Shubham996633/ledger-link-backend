import { Router, Request, Response } from 'express';
import { SimulatedBlockchainService } from '@/services/SimulatedBlockchainService';
import { DatabaseService } from '@/services/DatabaseService';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

let blockchainService: SimulatedBlockchainService;

function getService() {
  if (!blockchainService) {
    const dbService = DatabaseService.getInstance();
    blockchainService = new SimulatedBlockchainService(dbService.getDataSource());
  }
  return blockchainService;
}

/**
 * GET /api/blockchain/blocks
 * Get blocks with pagination
 */
router.get('/blocks', asyncHandler(async (req: Request, res: Response) => {
  const service = getService();
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const { blocks, total } = await service.getBlocks(limit, offset);

  res.json({
    success: true,
    data: {
      blocks,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    },
  });
}));

/**
 * GET /api/blockchain/blocks/latest
 * Get the latest block
 */
router.get('/blocks/latest', asyncHandler(async (req: Request, res: Response) => {
  const service = getService();
  const block = await service.getLatestBlock();

  if (!block) {
    res.status(404).json({ success: false, message: 'No blocks found' });
    return;
  }

  res.json({ success: true, data: block });
}));

/**
 * GET /api/blockchain/blocks/:identifier
 * Get block by number or hash
 */
router.get('/blocks/:identifier', asyncHandler(async (req: Request, res: Response) => {
  const service = getService();
  const { identifier } = req.params;

  let block;
  if (/^\d+$/.test(identifier)) {
    block = await service.getBlockByNumber(parseInt(identifier));
  } else {
    block = await service.getBlockByHash(identifier);
  }

  if (!block) {
    res.status(404).json({ success: false, message: 'Block not found' });
    return;
  }

  res.json({ success: true, data: block });
}));

/**
 * GET /api/blockchain/blocks/:blockNumber/transactions
 * Get transactions in a specific block
 */
router.get('/blocks/:blockNumber/transactions', asyncHandler(async (req: Request, res: Response) => {
  const service = getService();
  const blockNumber = parseInt(req.params.blockNumber);

  if (isNaN(blockNumber)) {
    res.status(400).json({ success: false, message: 'Invalid block number' });
    return;
  }

  const transactions = await service.getBlockTransactions(blockNumber);

  res.json({
    success: true,
    data: {
      blockNumber,
      transactions,
      count: transactions.length,
    },
  });
}));

/**
 * GET /api/blockchain/mempool
 * Get current mempool status
 */
router.get('/mempool', asyncHandler(async (req: Request, res: Response) => {
  const service = getService();
  const mempool = service.getMempool();

  res.json({
    success: true,
    data: mempool,
  });
}));

/**
 * GET /api/blockchain/stats
 * Get blockchain network statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const service = getService();
  const stats = await service.getBlockchainStats();

  res.json({
    success: true,
    data: stats,
  });
}));

/**
 * GET /api/blockchain/verify
 * Verify blockchain integrity
 */
router.get('/verify', asyncHandler(async (req: Request, res: Response) => {
  const service = getService();
  const result = await service.verifyChainIntegrity();

  res.json({
    success: true,
    data: result,
  });
}));

export default router;
