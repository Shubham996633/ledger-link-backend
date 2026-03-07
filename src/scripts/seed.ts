import 'reflect-metadata';
import dotenv from 'dotenv';
import { DatabaseService } from '@/services/DatabaseService';
import { runAllSeeds, clearSeedData } from '@/utils/seedData';
import { logger } from '@/utils/logger';

// Load environment variables
dotenv.config();

/**
 * Seed Script
 * Run this script to populate the database with demo users and simulated wallets
 *
 * Usage:
 *   npm run seed          - Run seeds
 *   npm run seed:clear    - Clear seed data
 */

async function main() {
  try {
    const command = process.argv[2];

    // Initialize database connection
    const dbService = DatabaseService.getInstance();
    await dbService.initialize();

    const dataSource = dbService.getDataSource();

    if (command === 'clear') {
      logger.info('Clearing seed data...');
      await clearSeedData(dataSource);
      logger.info('Seed data cleared successfully!');
    } else {
      logger.info('Running seeds...');
      await runAllSeeds(dataSource);
      logger.info('Seeds completed successfully!');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Seed script failed:', error);
    process.exit(1);
  }
}

main();
