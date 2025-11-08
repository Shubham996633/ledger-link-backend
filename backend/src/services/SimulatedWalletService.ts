import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Wallet } from '@/entities/Wallet';
import { WalletBalance } from '@/entities/WalletBalance';
import { Transaction } from '@/entities/Transaction';
import { User } from '@/entities/User';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

export interface CreateSimulatedWalletRequest {
  userId: string;
  label?: string;
  blockchain?: string;
  network?: string;
}

export interface SimulatedTransactionRequest {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  tokenSymbol?: string;
  description?: string;
}

export interface SimulatedTransactionResult {
  transaction: Transaction;
  hash: string;
  status: 'confirmed' | 'failed';
  fromBalance: string;
  toBalance?: string;
}

/**
 * SimulatedWalletService
 * Handles all fake/practice wallet operations without requiring real blockchain connections
 * All balances and transactions are stored in PostgreSQL
 */
export class SimulatedWalletService {
  private walletRepository: Repository<Wallet>;
  private balanceRepository: Repository<WalletBalance>;
  private transactionRepository: Repository<Transaction>;
  private userRepository: Repository<User>;

  constructor(private dataSource: DataSource) {
    this.walletRepository = dataSource.getRepository(Wallet);
    this.balanceRepository = dataSource.getRepository(WalletBalance);
    this.transactionRepository = dataSource.getRepository(Transaction);
    this.userRepository = dataSource.getRepository(User);
  }

  /**
   * Generate a simulated wallet address (looks like Ethereum but is fake)
   */
  private generateSimulatedAddress(): string {
    const randomBytes = crypto.randomBytes(20);
    return '0x' + randomBytes.toString('hex');
  }

  /**
   * Generate a simulated transaction hash
   */
  private generateSimulatedTxHash(): string {
    const randomBytes = crypto.randomBytes(32);
    return '0x' + randomBytes.toString('hex');
  }

  /**
   * Create a new simulated wallet with initial balance
   */
  async createSimulatedWallet(
    request: CreateSimulatedWalletRequest,
    initialBalances?: { tokenSymbol: string; amount: string; tokenName?: string }[]
  ): Promise<Wallet> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { id: request.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate simulated address
      const address = this.generateSimulatedAddress();

      // Create wallet
      const wallet = this.walletRepository.create({
        address,
        userId: request.userId,
        blockchain: request.blockchain || 'ethereum',
        network: request.network || 'simulated',
        isSimulated: true,
        isActive: true,
        isPrimary: false,
        label: request.label || 'Practice Wallet',
      });

      await queryRunner.manager.save(wallet);

      // Create initial balances
      const balancesToCreate = initialBalances || [
        { tokenSymbol: 'ETH', amount: '10.0', tokenName: 'Ethereum' },
        { tokenSymbol: 'USDT', amount: '10000.0', tokenName: 'Tether USD' },
        { tokenSymbol: 'USDC', amount: '10000.0', tokenName: 'USD Coin' },
        { tokenSymbol: 'DAI', amount: '10000.0', tokenName: 'Dai Stablecoin' },
      ];

      for (const balanceData of balancesToCreate) {
        const balance = this.balanceRepository.create({
          walletId: wallet.id,
          tokenSymbol: balanceData.tokenSymbol,
          balance: balanceData.amount,
          decimals: 18,
          tokenName: balanceData.tokenName,
          isActive: true,
        });

        await queryRunner.manager.save(balance);
      }

      await queryRunner.commitTransaction();

      // Load wallet with balances
      const walletWithBalances = await this.walletRepository.findOne({
        where: { id: wallet.id },
        relations: ['balances'],
      });

      logger.info(`Created simulated wallet ${wallet.address} for user ${request.userId}`);

      return walletWithBalances!;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Failed to create simulated wallet:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get wallet balance for a specific token
   */
  async getBalance(walletId: string, tokenSymbol: string = 'ETH'): Promise<WalletBalance | null> {
    try {
      const balance = await this.balanceRepository.findOne({
        where: {
          walletId,
          tokenSymbol,
          isActive: true,
        },
      });

      return balance;
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get all balances for a wallet
   */
  async getAllBalances(walletId: string): Promise<WalletBalance[]> {
    try {
      const balances = await this.balanceRepository.find({
        where: {
          walletId,
          isActive: true,
        },
      });

      return balances;
    } catch (error) {
      logger.error('Failed to get balances:', error);
      throw error;
    }
  }

  /**
   * Add balance to a wallet (for testing/faucet functionality)
   */
  async addBalance(
    walletId: string,
    tokenSymbol: string,
    amount: string
  ): Promise<WalletBalance> {
    try {
      let balance = await this.balanceRepository.findOne({
        where: { walletId, tokenSymbol },
      });

      if (!balance) {
        // Create new balance entry
        balance = this.balanceRepository.create({
          walletId,
          tokenSymbol,
          balance: amount,
          decimals: 18,
          isActive: true,
        });
      } else {
        // Add to existing balance
        const currentBalance = parseFloat(balance.balance);
        const addAmount = parseFloat(amount);
        balance.balance = (currentBalance + addAmount).toString();
      }

      await this.balanceRepository.save(balance);

      logger.info(`Added ${amount} ${tokenSymbol} to wallet ${walletId}`);

      return balance;
    } catch (error) {
      logger.error('Failed to add balance:', error);
      throw error;
    }
  }

  /**
   * Simulate a transaction between wallets
   */
  async simulateTransaction(
    request: SimulatedTransactionRequest
  ): Promise<SimulatedTransactionResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tokenSymbol = request.tokenSymbol || 'ETH';

      // Get sender wallet
      const fromWallet = await this.walletRepository.findOne({
        where: { id: request.fromWalletId },
        relations: ['balances'],
      });

      if (!fromWallet) {
        throw new Error('Sender wallet not found');
      }

      if (!fromWallet.isSimulated) {
        throw new Error('Only simulated wallets can use simulated transactions');
      }

      // Get sender balance
      const fromBalance = await queryRunner.manager.findOne(WalletBalance, {
        where: {
          walletId: request.fromWalletId,
          tokenSymbol,
        },
      });

      if (!fromBalance) {
        throw new Error(`Sender has no ${tokenSymbol} balance`);
      }

      // Check sufficient balance
      const currentBalance = parseFloat(fromBalance.balance);
      const transferAmount = parseFloat(request.amount);

      if (currentBalance < transferAmount) {
        throw new Error(
          `Insufficient balance. Available: ${currentBalance} ${tokenSymbol}, Required: ${transferAmount} ${tokenSymbol}`
        );
      }

      // Deduct from sender
      fromBalance.balance = (currentBalance - transferAmount).toString();
      await queryRunner.manager.save(fromBalance);

      // Check if recipient is also a simulated wallet
      const toWallet = await this.walletRepository.findOne({
        where: { address: request.toAddress },
      });

      let toBalance: WalletBalance | undefined;

      if (toWallet && toWallet.isSimulated) {
        // Add to recipient's balance
        toBalance = await queryRunner.manager.findOne(WalletBalance, {
          where: {
            walletId: toWallet.id,
            tokenSymbol,
          },
        });

        if (!toBalance) {
          // Create balance for recipient
          toBalance = this.balanceRepository.create({
            walletId: toWallet.id,
            tokenSymbol,
            balance: request.amount,
            decimals: 18,
            isActive: true,
          });
        } else {
          const recipientBalance = parseFloat(toBalance.balance);
          toBalance.balance = (recipientBalance + transferAmount).toString();
        }

        await queryRunner.manager.save(toBalance);
      }

      // Generate simulated transaction hash
      const txHash = this.generateSimulatedTxHash();

      // Simulate minimal gas fee (for realism)
      const gasUsed = '21000';
      const gasPrice = '20000000000'; // 20 gwei
      const transactionFee = ((21000 * 20000000000) / 1e18).toString();

      // Create transaction record
      const transaction = this.transactionRepository.create({
        hash: txHash,
        userId: fromWallet.userId,
        fromAddress: fromWallet.address,
        toAddress: request.toAddress,
        amount: request.amount,
        tokenAddress: null, // We're not using real token addresses for simulated tokens
        tokenSymbol, // Store the token symbol directly
        status: 'confirmed', // Simulated transactions confirm instantly
        isSimulated: true,
        blockNumber: null, // No real block number for simulated transactions
        confirmations: 1,
        gasUsed,
        gasPrice,
        transactionFee,
        description: request.description,
        blockchain: fromWallet.blockchain,
        network: fromWallet.network,
        metadata: {
          tokenSymbol,
          simulatedAt: new Date().toISOString(),
        },
      });

      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      logger.info(
        `Simulated transaction: ${transferAmount} ${tokenSymbol} from ${fromWallet.address} to ${request.toAddress}`
      );

      return {
        transaction,
        hash: txHash,
        status: 'confirmed',
        fromBalance: fromBalance.balance,
        toBalance: toBalance?.balance,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Simulated transaction failed:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(
    walletId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ transactions: Transaction[]; total: number }> {
    try {
      const wallet = await this.walletRepository.findOne({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const [transactions, total] = await this.transactionRepository.findAndCount({
        where: [
          { fromAddress: wallet.address, isSimulated: true },
          { toAddress: wallet.address, isSimulated: true },
        ],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      return { transactions, total };
    } catch (error) {
      logger.error('Failed to get transaction history:', error);
      throw error;
    }
  }

  /**
   * Get wallet by address
   */
  async getWalletByAddress(address: string): Promise<Wallet | null> {
    try {
      const wallet = await this.walletRepository.findOne({
        where: { address },
        relations: ['balances'],
      });

      return wallet;
    } catch (error) {
      logger.error('Failed to get wallet by address:', error);
      throw error;
    }
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      const wallets = await this.walletRepository.find({
        where: { userId },
        relations: ['balances'],
        order: { createdAt: 'DESC' },
      });

      return wallets;
    } catch (error) {
      logger.error('Failed to get user wallets:', error);
      throw error;
    }
  }

  /**
   * Faucet - Give free tokens to a wallet (for practice)
   */
  async faucet(
    walletId: string,
    tokenSymbol: string = 'ETH',
    amount?: string
  ): Promise<WalletBalance> {
    try {
      // Default faucet amounts
      const faucetAmounts: Record<string, string> = {
        ETH: '1.0',
        USDT: '1000.0',
        USDC: '1000.0',
        DAI: '1000.0',
      };

      const faucetAmount = amount || faucetAmounts[tokenSymbol] || '100.0';

      const balance = await this.addBalance(walletId, tokenSymbol, faucetAmount);

      logger.info(`Faucet dispensed ${faucetAmount} ${tokenSymbol} to wallet ${walletId}`);

      return balance;
    } catch (error) {
      logger.error('Faucet failed:', error);
      throw error;
    }
  }
}
