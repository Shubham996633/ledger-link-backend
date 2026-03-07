import { DataSource } from 'typeorm';
import { User } from '@/entities/User';
import { SimulatedWalletService } from '@/services/SimulatedWalletService';
import { logger } from '@/utils/logger';

/**
 * Seed Data Utility
 * Creates initial test users and simulated wallets with fake currency
 */

export interface SeedUserData {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  walletLabel?: string;
}

/**
 * Seed a user with a simulated wallet
 */
export async function seedUserWithWallet(
  dataSource: DataSource,
  userData: SeedUserData
): Promise<{ user: User; wallet: any }> {
  try {
    const userRepository = dataSource.getRepository(User);
    const simulatedWalletService = new SimulatedWalletService(dataSource);

    // Check if user already exists
    let user = await userRepository.findOne({ where: { email: userData.email } });

    if (!user) {
      // Create user
      user = userRepository.create({
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName || userData.username,
        lastName: userData.lastName || 'User',
        isEmailVerified: true,
        role: 'user',
        isActive: true,
      });

      user = await userRepository.save(user);
      logger.info(`Created user: ${user.email}`);
    } else {
      logger.info(`User already exists: ${user.email}`);
    }

    // Create simulated wallet with initial balances
    const wallet = await simulatedWalletService.createSimulatedWallet({
      userId: user.id,
      label: userData.walletLabel || 'Practice Wallet',
      blockchain: 'ethereum',
      network: 'simulated',
    });

    logger.info(`Created simulated wallet for user ${user.email}: ${wallet.address}`);

    return { user, wallet };
  } catch (error) {
    logger.error('Error seeding user with wallet:', error);
    throw error;
  }
}

/**
 * Seed multiple demo users
 */
export async function seedDemoUsers(dataSource: DataSource): Promise<void> {
  try {
    logger.info('Starting to seed demo users...');

    const demoUsers: SeedUserData[] = [
      {
        email: 'alice@example.com',
        username: 'alice',
        firstName: 'Alice',
        lastName: 'Johnson',
        walletLabel: 'Alice Primary Wallet',
      },
      {
        email: 'bob@example.com',
        username: 'bob',
        firstName: 'Bob',
        lastName: 'Smith',
        walletLabel: 'Bob Practice Wallet',
      },
      {
        email: 'charlie@example.com',
        username: 'charlie',
        firstName: 'Charlie',
        lastName: 'Brown',
        walletLabel: 'Charlie Trading Wallet',
      },
    ];

    for (const userData of demoUsers) {
      await seedUserWithWallet(dataSource, userData);
    }

    logger.info('Demo users seeded successfully!');
  } catch (error) {
    logger.error('Error seeding demo users:', error);
    throw error;
  }
}

/**
 * Seed custom token balances for a wallet
 */
export async function seedCustomTokens(
  dataSource: DataSource,
  walletId: string,
  tokens: { symbol: string; amount: string; name: string }[]
): Promise<void> {
  try {
    const simulatedWalletService = new SimulatedWalletService(dataSource);

    for (const token of tokens) {
      await simulatedWalletService.addBalance(walletId, token.symbol, token.amount);
      logger.info(`Added ${token.amount} ${token.symbol} to wallet ${walletId}`);
    }
  } catch (error) {
    logger.error('Error seeding custom tokens:', error);
    throw error;
  }
}

/**
 * Create test transactions between demo wallets
 */
export async function seedTestTransactions(dataSource: DataSource): Promise<void> {
  try {
    logger.info('Creating test transactions...');

    const simulatedWalletService = new SimulatedWalletService(dataSource);
    const userRepository = dataSource.getRepository(User);

    // Get demo users
    const alice = await userRepository.findOne({ where: { email: 'alice@example.com' } });
    const bob = await userRepository.findOne({ where: { email: 'bob@example.com' } });

    if (!alice || !bob) {
      logger.warn('Demo users not found, skipping test transactions');
      return;
    }

    // Get their wallets
    const aliceWallets = await simulatedWalletService.getUserWallets(alice.id);
    const bobWallets = await simulatedWalletService.getUserWallets(bob.id);

    if (aliceWallets.length === 0 || bobWallets.length === 0) {
      logger.warn('Demo wallets not found, skipping test transactions');
      return;
    }

    const aliceWallet = aliceWallets[0];
    const bobWallet = bobWallets[0];

    // Create some transactions
    const transactions = [
      {
        fromWalletId: aliceWallet.id,
        toAddress: bobWallet.address,
        amount: '0.5',
        tokenSymbol: 'ETH',
        description: 'Test transfer - Alice to Bob',
      },
      {
        fromWalletId: bobWallet.id,
        toAddress: aliceWallet.address,
        amount: '100',
        tokenSymbol: 'USDT',
        description: 'Test transfer - Bob to Alice',
      },
      {
        fromWalletId: aliceWallet.id,
        toAddress: bobWallet.address,
        amount: '250',
        tokenSymbol: 'USDC',
        description: 'Payment for services',
      },
    ];

    for (const tx of transactions) {
      const result = await simulatedWalletService.simulateTransaction(tx);
      logger.info(`Created transaction: ${result.hash}`);
    }

    logger.info('Test transactions created successfully!');
  } catch (error) {
    logger.error('Error creating test transactions:', error);
    throw error;
  }
}

/**
 * Run all seed operations
 */
export async function runAllSeeds(dataSource: DataSource): Promise<void> {
  try {
    logger.info('===== Starting Database Seeding =====');

    // Seed demo users with wallets
    await seedDemoUsers(dataSource);

    // Create test transactions
    await seedTestTransactions(dataSource);

    logger.info('===== Database Seeding Complete =====');
  } catch (error) {
    logger.error('Error running seeds:', error);
    throw error;
  }
}

/**
 * Clear all seed data (for testing purposes)
 */
export async function clearSeedData(dataSource: DataSource): Promise<void> {
  try {
    logger.info('Clearing seed data...');

    const userRepository = dataSource.getRepository(User);

    const demoEmails = ['alice@example.com', 'bob@example.com', 'charlie@example.com'];

    for (const email of demoEmails) {
      const user = await userRepository.findOne({ where: { email } });
      if (user) {
        await userRepository.remove(user);
        logger.info(`Removed user: ${email}`);
      }
    }

    logger.info('Seed data cleared successfully!');
  } catch (error) {
    logger.error('Error clearing seed data:', error);
    throw error;
  }
}
