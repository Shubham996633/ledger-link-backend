import { Router, Request, Response } from 'express';
import { DatabaseService } from '@/services/DatabaseService';
import { TransactionRepository } from '@/repositories/TransactionRepository';
import { WalletRepository } from '@/repositories/WalletRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Lazy initialization
let transactionRepository: TransactionRepository;
let walletRepository: WalletRepository;
let userRepository: UserRepository;

function getServices() {
  if (!transactionRepository) {
    const dbService = DatabaseService.getInstance();
    transactionRepository = new TransactionRepository(dbService.getDataSource());
    walletRepository = new WalletRepository(dbService.getDataSource());
    userRepository = new UserRepository(dbService.getDataSource());
  }
  return { transactionRepository, walletRepository, userRepository };
}

/**
 * GET /api/ledger/transactions
 * Get all public ledger transactions (simulated blockchain explorer)
 */
router.get('/transactions', asyncHandler(async (req: Request, res: Response) => {
  const { transactionRepository } = getServices();
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const status = req.query.status as string;

  const dataSource = DatabaseService.getInstance().getDataSource();
  const transactionRepo = dataSource.getRepository('Transaction');

  let queryBuilder = transactionRepo
    .createQueryBuilder('transaction')
    .where('transaction.isSimulated = :isSimulated', { isSimulated: true })
    .orderBy('transaction.createdAt', 'DESC')
    .take(limit)
    .skip(offset);

  if (status) {
    queryBuilder = queryBuilder.andWhere('transaction.status = :status', { status });
  }

  const [transactions, total] = await queryBuilder.getManyAndCount();

  res.json({
    success: true,
    data: {
      transactions,
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
 * GET /api/ledger/transaction/:hash
 * Get transaction details by hash (public endpoint)
 */
router.get('/transaction/:hash', asyncHandler(async (req: Request, res: Response) => {
  const { transactionRepository } = getServices();
  const { hash } = req.params;

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
    data: transaction,
  });
}));

/**
 * GET /api/ledger/address/:address
 * Get wallet details and transactions by address (public endpoint)
 */
router.get('/address/:address', asyncHandler(async (req: Request, res: Response) => {
  const { walletRepository, transactionRepository } = getServices();
  const { address } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  // Get wallet details
  const wallet = await walletRepository.findByAddress(address);

  if (!wallet) {
    res.status(404).json({
      success: false,
      message: 'Address not found on the network',
    });
    return;
  }

  // Get all transactions for this address (sent and received)
  const transactions = await transactionRepository.findByAddress(address, limit, offset);

  // Get total transaction count
  const dataSource = DatabaseService.getInstance().getDataSource();
  const totalTxCount = await dataSource
    .getRepository('Transaction')
    .createQueryBuilder('transaction')
    .where('transaction.fromAddress = :address', { address })
    .orWhere('transaction.toAddress = :address', { address })
    .getCount();

  // Count sent and received
  const sentCount = await dataSource
    .getRepository('Transaction')
    .createQueryBuilder('transaction')
    .where('transaction.fromAddress = :address', { address })
    .getCount();

  const receivedCount = await dataSource
    .getRepository('Transaction')
    .createQueryBuilder('transaction')
    .where('transaction.toAddress = :address', { address })
    .getCount();

  // Get balances
  const balances = await dataSource
    .getRepository('WalletBalance')
    .find({ where: { walletId: wallet.id } });

  res.json({
    success: true,
    data: {
      wallet: {
        address: wallet.address,
        label: wallet.label,
        isSimulated: wallet.isSimulated,
        createdAt: wallet.createdAt,
      },
      balances,
      transactions,
      stats: {
        totalTransactions: totalTxCount,
        sent: sentCount,
        received: receivedCount,
      },
      pagination: {
        total: totalTxCount,
        limit,
        offset,
        pages: Math.ceil(totalTxCount / limit),
      },
    },
  });
}));

/**
 * GET /api/ledger/stats
 * Get public ledger statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const { userRepository } = getServices();
  const dataSource = DatabaseService.getInstance().getDataSource();

  // Get total transactions
  const totalTransactions = await dataSource
    .getRepository('Transaction')
    .createQueryBuilder('transaction')
    .where('transaction.isSimulated = :isSimulated', { isSimulated: true })
    .getCount();

  // Get total wallets
  const totalWallets = await dataSource
    .getRepository('Wallet')
    .createQueryBuilder('wallet')
    .where('wallet.isSimulated = :isSimulated', { isSimulated: true })
    .getCount();

  // Get total users
  const totalUsers = await dataSource
    .getRepository('User')
    .createQueryBuilder('user')
    .where('user.isActive = :isActive', { isActive: true })
    .getCount();

  // Get transactions by status
  const confirmedTx = await dataSource
    .getRepository('Transaction')
    .createQueryBuilder('transaction')
    .where('transaction.isSimulated = :isSimulated', { isSimulated: true })
    .andWhere('transaction.status = :status', { status: 'confirmed' })
    .getCount();

  const pendingTx = await dataSource
    .getRepository('Transaction')
    .createQueryBuilder('transaction')
    .where('transaction.isSimulated = :isSimulated', { isSimulated: true })
    .andWhere('transaction.status = :status', { status: 'pending' })
    .getCount();

  // Get recent 24h transactions
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const recentTxCount = await dataSource
    .getRepository('Transaction')
    .createQueryBuilder('transaction')
    .where('transaction.isSimulated = :isSimulated', { isSimulated: true })
    .andWhere('transaction.createdAt >= :date', { date: oneDayAgo })
    .getCount();

  // Calculate total volume
  const volumeResult = await dataSource
    .getRepository('Transaction')
    .createQueryBuilder('transaction')
    .select('SUM(CAST(transaction.amount AS DECIMAL))', 'total')
    .where('transaction.isSimulated = :isSimulated', { isSimulated: true })
    .andWhere('transaction.status = :status', { status: 'confirmed' })
    .getRawOne();

  const totalVolume = volumeResult?.total || '0';

  // Get block count
  let totalBlocks = 0;
  let latestBlockNumber = 0;
  try {
    const blockRepo = dataSource.getRepository('Block');
    totalBlocks = await blockRepo.count();
    const latestBlock = await blockRepo
      .createQueryBuilder('block')
      .orderBy('block.blockNumber', 'DESC')
      .getOne();
    latestBlockNumber = (latestBlock as any)?.blockNumber || 0;
  } catch (e) {
    // Block table may not exist yet
  }

  const stats = {
    totalTransactions,
    totalWallets,
    totalUsers,
    totalVolume,
    totalBlocks,
    latestBlockNumber,
    confirmedTransactions: confirmedTx,
    pendingTransactions: pendingTx,
    last24hTransactions: recentTxCount,
    networkName: 'Ledger Link Simulated Network',
    networkType: 'simulated',
  };

  res.json({
    success: true,
    data: stats,
  });
}));

/**
 * GET /api/ledger/recent
 * Get recent activity on the network
 */
router.get('/recent', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;

  const dataSource = DatabaseService.getInstance().getDataSource();
  const recentTransactions = await dataSource
    .getRepository('Transaction')
    .createQueryBuilder('transaction')
    .where('transaction.isSimulated = :isSimulated', { isSimulated: true })
    .orderBy('transaction.createdAt', 'DESC')
    .limit(limit)
    .getMany();

  res.json({
    success: true,
    data: recentTransactions,
  });
}));

export default router;
