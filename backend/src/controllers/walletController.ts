import { Router, Request, Response } from 'express';
import { SimulatedWalletService } from '@/services/SimulatedWalletService';
import { DatabaseService } from '@/services/DatabaseService';
import { logger } from '@/utils/logger';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Lazy initialization
let simulatedWalletService: SimulatedWalletService;

function getServices() {
  if (!simulatedWalletService) {
    const dbService = DatabaseService.getInstance();
    simulatedWalletService = new SimulatedWalletService(dbService.getDataSource());
  }
  return { simulatedWalletService };
}

/**
 * POST /api/wallets/create
 * Create a new simulated wallet for the authenticated user
 */
router.post('/create', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { simulatedWalletService } = getServices();
  const userId = req.user!.userId;
  const { label, blockchain, network, initialBalances } = req.body;

  const wallet = await simulatedWalletService.createSimulatedWallet(
    {
      userId,
      label,
      blockchain,
      network,
    },
    initialBalances
  );

  res.status(201).json({
    success: true,
    data: wallet,
    message: 'Simulated wallet created successfully',
  });
}));

/**
 * GET /api/wallets
 * Get all wallets for the authenticated user
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { simulatedWalletService } = getServices();
  const userId = req.user!.userId;

  const wallets = await simulatedWalletService.getUserWallets(userId);

  res.status(200).json({
    success: true,
    data: wallets,
    count: wallets.length,
  });
}));

/**
 * GET /api/wallets/:walletId/balance
 * Get balance for a specific wallet and token
 */
router.get('/:walletId/balance', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { simulatedWalletService } = getServices();
  const { walletId } = req.params;
  const { tokenSymbol = 'ETH' } = req.query;

  const balance = await simulatedWalletService.getBalance(
    walletId,
    tokenSymbol as string
  );

  if (!balance) {
    res.status(404).json({
      success: false,
      error: `No ${tokenSymbol} balance found for this wallet`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: balance,
  });
}));

/**
 * GET /api/wallets/:walletId/balances
 * Get all balances for a wallet
 */
router.get('/:walletId/balances', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { simulatedWalletService } = getServices();
  const { walletId } = req.params;

  const balances = await simulatedWalletService.getAllBalances(walletId);

  res.status(200).json({
    success: true,
    data: balances,
    count: balances.length,
  });
}));

/**
 * POST /api/wallets/:walletId/send
 * Send simulated transaction from wallet
 */
router.post('/:walletId/send', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { simulatedWalletService } = getServices();
  const { walletId } = req.params;
  const { toAddress, amount, tokenSymbol, description } = req.body;

  // Validation
  if (!toAddress || !amount) {
    res.status(400).json({
      success: false,
      error: 'toAddress and amount are required',
    });
    return;
  }

  // Check if recipient address exists in the network
  const recipientWallet = await simulatedWalletService.getWalletByAddress(toAddress);

  if (!recipientWallet) {
    res.status(404).json({
      success: false,
      error: 'Address not found on the network',
      message: 'The recipient address does not exist on this network. Please ask them to register first.',
      toAddress,
    });
    return;
  }

  const result = await simulatedWalletService.simulateTransaction({
    fromWalletId: walletId,
    toAddress,
    amount,
    tokenSymbol,
    description,
  });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Transaction completed successfully',
  });
}));

/**
 * GET /api/wallets/:walletId/transactions
 * Get transaction history for a wallet
 */
router.get('/:walletId/transactions', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { simulatedWalletService } = getServices();
  const { walletId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await simulatedWalletService.getTransactionHistory(
    walletId,
    limit,
    offset
  );

  res.status(200).json({
    success: true,
    data: result.transactions,
    total: result.total,
    limit,
    offset,
  });
}));

/**
 * POST /api/wallets/:walletId/faucet
 * Get free tokens from faucet (for practice)
 */
router.post('/:walletId/faucet', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { simulatedWalletService } = getServices();
  const { walletId } = req.params;
  const { tokenSymbol = 'ETH', amount } = req.body;

  const balance = await simulatedWalletService.faucet(
    walletId,
    tokenSymbol,
    amount
  );

  res.status(200).json({
    success: true,
    data: balance,
    message: `Faucet dispensed ${tokenSymbol} successfully`,
  });
}));

/**
 * GET /api/wallets/address/:address
 * Get wallet by address
 */
router.get('/address/:address', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { simulatedWalletService } = getServices();
  const { address } = req.params;

  const wallet = await simulatedWalletService.getWalletByAddress(address);

  if (!wallet) {
    res.status(404).json({
      success: false,
      error: 'Wallet not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: wallet,
  });
}));

/**
 * POST /api/wallets/:walletId/add-balance
 * Manually add balance to wallet (admin/testing feature)
 */
router.post('/:walletId/add-balance', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { simulatedWalletService } = getServices();
  const { walletId } = req.params;
  const { tokenSymbol, amount } = req.body;

  if (!tokenSymbol || !amount) {
    res.status(400).json({
      success: false,
      error: 'tokenSymbol and amount are required',
    });
    return;
  }

  const balance = await simulatedWalletService.addBalance(
    walletId,
    tokenSymbol,
    amount
  );

  res.status(200).json({
    success: true,
    data: balance,
    message: 'Balance added successfully',
  });
}));

export default router;
