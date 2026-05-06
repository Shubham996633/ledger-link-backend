import { DataSource } from 'typeorm';
import { getDataSourceOptions } from '@/config/database';
import { logger } from '@/utils/logger';

export class DatabaseService {
  private static instance: DatabaseService;
  private dataSource: DataSource | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      this.dataSource = new DataSource(getDataSourceOptions());
      await this.dataSource.initialize();
      logger.info('Database connection established successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  public getDataSource(): DataSource {
    if (!this.dataSource) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.dataSource;
  }

  public async close(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      logger.info('Database connection closed');
    }
  }

  public async runMigrations(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }

    try {
      await this.dataSource.runMigrations();
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Failed to run migrations:', error);
      throw error;
    }

    // Idempotent column adds for ad-hoc schema changes (synchronize:false)
    await this.ensureUserAuthColumns();
  }

  private async ensureUserAuthColumns(): Promise<void> {
    if (!this.dataSource) return;
    const stmts = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token varchar`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires timestamp`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token varchar`,
    ];
    for (const sql of stmts) {
      try {
        await this.dataSource.query(sql);
      } catch (err: any) {
        logger.warn(`ensureUserAuthColumns: ${err.message}`);
      }
    }
  }

  public async checkConnection(): Promise<boolean> {
    try {
      if (!this.dataSource || !this.dataSource.isInitialized) {
        return false;
      }
      
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database connection check failed:', error);
      return false;
    }
  }
}
