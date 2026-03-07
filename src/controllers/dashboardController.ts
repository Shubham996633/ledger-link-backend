import { Router, Response } from 'express';
import { DatabaseService } from '@/services/DatabaseService';
import { SimulatedWalletService } from '@/services/SimulatedWalletService';
import { TransactionRepository } from '@/repositories/TransactionRepository';
import { WalletRepository } from '@/repositories/WalletRepository';
import { logger } from '@/utils/logger';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Lazy initialization
let simulatedWalletService: SimulatedWalletService;
let transactionRepository: TransactionRepository;
let walletRepository: WalletRepository;

function getServices() {
  if (!simulatedWalletService) {
    const dbService = DatabaseService.getInstance();
    simulatedWalletService = new SimulatedWalletService(dbService.getDataSource());
    transactionRepository = new TransactionRepository(dbService.getDataSource());
    walletRepository = new WalletRepository(dbService.getDataSource());
  }
  return { simulatedWalletService, transactionRepository, walletRepository };
}

/**
 * GET /api/dashboard/overview
 * Get dashboard overview with all stats
 */
router.get('/overview', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { simulatedWalletService, transactionRepository } = getServices();
  const userId = req.user!.userId;

  // Get user wallets
  const wallets = await simulatedWalletService.getUserWallets(userId);

  // Calculate total balance across all wallets (in mock USD)
  const mockPrices: Record<string, number> = {
    ETH: 2000,
    USDT: 1,
    USDC: 1,
    DAI: 1,
  };

  let totalBalanceUSD = 0;
  let totalETH = 0;
  let totalUSDT = 0;

  for (const wallet of wallets) {
    if (wallet.balances) {
      for (const balance of wallet.balances) {
        const price = mockPrices[balance.tokenSymbol] || 0;
        const balanceNum = parseFloat(balance.balance);
        totalBalanceUSD += balanceNum * price;

        if (balance.tokenSymbol === 'ETH') {
          totalETH += balanceNum;
        } else if (balance.tokenSymbol === 'USDT') {
          totalUSDT += balanceNum;
        }
      }
    }
  }

  // Get transaction stats
  const transactionStats = await transactionRepository.getTransactionStats(userId);

  // Get recent transactions
  const recentTransactions = await transactionRepository.findByUserId(userId, 5, 0);

  const overview = {
    walletsCount: wallets.length,
    totalBalanceUSD: totalBalanceUSD.toFixed(2),
    totalETH: totalETH.toFixed(4),
    totalUSDT: totalUSDT.toFixed(2),
    totalSent: transactionStats.totalSent,
    totalReceived: transactionStats.totalReceived,
    totalTransactions: transactionStats.total,
    transactionStats,
    recentTransactions,
    walletSummary: wallets.map(w => ({
      id: w.id,
      address: w.address,
      label: w.label,
      isSimulated: w.isSimulated,
      balanceCount: w.balances?.length || 0,
    })),
  };

  res.json({
    success: true,
    data: overview,
  });
}));

/**
 * GET /api/dashboard/recent-activity
 * Get recent user activity
 */
router.get('/recent-activity', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { transactionRepository } = getServices();
  const userId = req.user!.userId;
  const limit = parseInt(req.query.limit as string) || 10;

  const transactions = await transactionRepository.findByUserId(userId, limit, 0);

  const activities = transactions.map(tx => ({
    id: tx.id,
    type: 'transaction',
    hash: tx.hash,
    fromAddress: tx.fromAddress,
    toAddress: tx.toAddress,
    amount: tx.amount,
    status: tx.status,
    isSimulated: tx.isSimulated,
    createdAt: tx.createdAt,
    description: tx.description,
  }));

  res.json({
    success: true,
    data: activities,
  });
}));

/**
 * GET /api/dashboard/portfolio
 * Get user's portfolio breakdown
 */
router.get('/portfolio', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { simulatedWalletService } = getServices();
  const userId = req.user!.userId;

  const wallets = await simulatedWalletService.getUserWallets(userId);

  const mockPrices: Record<string, number> = {
    ETH: 2000,
    USDT: 1,
    USDC: 1,
    DAI: 1,
  };

  // Aggregate balances across all wallets
  const tokenBalances: Record<string, { balance: number; value: number; percentage: number }> = {};
  let totalValue = 0;

  for (const wallet of wallets) {
    if (wallet.balances) {
      for (const balance of wallet.balances) {
        const balanceNum = parseFloat(balance.balance);
        const price = mockPrices[balance.tokenSymbol] || 0;
        const value = balanceNum * price;

        if (!tokenBalances[balance.tokenSymbol]) {
          tokenBalances[balance.tokenSymbol] = {
            balance: 0,
            value: 0,
            percentage: 0,
          };
        }

        tokenBalances[balance.tokenSymbol].balance += balanceNum;
        tokenBalances[balance.tokenSymbol].value += value;
        totalValue += value;
      }
    }
  }

  // Calculate percentages
  Object.keys(tokenBalances).forEach(token => {
    tokenBalances[token].percentage = totalValue > 0
      ? (tokenBalances[token].value / totalValue) * 100
      : 0;
  });

  const portfolio = Object.entries(tokenBalances).map(([symbol, data]) => ({
    symbol,
    balance: data.balance.toFixed(4),
    value: data.value.toFixed(2),
    percentage: data.percentage.toFixed(2),
    price: mockPrices[symbol] || 0,
  }));

  res.json({
    success: true,
    data: {
      portfolio,
      totalValue: totalValue.toFixed(2),
    },
  });
}));

export default router;
